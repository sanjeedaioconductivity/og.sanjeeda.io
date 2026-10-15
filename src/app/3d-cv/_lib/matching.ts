import { DIMENSIONS, type DimensionId } from './dimensions';
import { monthsBetween, SPECS, type AttributeName, type Attributes, type EntriesByDimension, type Entry, type ListDimensionId } from './entries';
import { mentions, type JobAnalysis, type JobTerm, type TermKind } from './jobs';
import type { BasicProfile } from './store';

/**
 * Matches a job's terms against the candidate's profile. Every match carries
 * the entries it came from, which is what makes a CV bullet traceable (concept
 * §9) and what the readiness report quotes.
 */

export interface ProfileSnapshot {
  basic: Omit<BasicProfile, 'confirmed'>;
  entries: EntriesByDimension;
  attributes: Attributes;
}

export type CvMode = 'standard' | 'verified';

export interface MatchSource {
  dimension: DimensionId;
  /** Entry id, or the attribute name for Attribute Fitness. */
  entryId: string;
  label: string;
  evidence: boolean;
}

export interface TermMatch {
  term: JobTerm;
  sources: MatchSource[];
  /** At least one source has evidence. */
  proven: boolean;
}

export interface MatchResult {
  matched: TermMatch[];
  gaps: JobTerm[];
  education: { asked: string | null; met: boolean; best: string | null };
  experience: { years: number | null; months: number; met: boolean };
  /** 0–100, or null when the job text gave us nothing to score against. */
  readiness: number | null;
  /** Entry ids that matched at least one job term. */
  relevant: Set<string>;
}

const LIST_DIMS = Object.keys(SPECS) as ListDimensionId[];

/** The label a source shows in the CV and report, e.g. "IT Support Intern". */
export function entryLabel(dimension: ListDimensionId, e: Entry): string {
  const v = e.values;
  return v.title || v.name || v.area || v.degree || '';
}

function entryText(e: Entry): string {
  return Object.entries(e.values)
    .filter(([k]) => k !== 'current')
    .map(([, v]) => v)
    .join(' \n ')
    .toLowerCase();
}

/** Entries the CV is allowed to use in this mode. */
export function usableEntries(entries: EntriesByDimension, mode: CvMode): EntriesByDimension {
  if (mode === 'standard') return entries;
  return Object.fromEntries(LIST_DIMS.map((d) => [d, entries[d].filter((e) => e.evidence)])) as EntriesByDimension;
}

/** Terms from the candidate's own profile, so analyzeJob can spot them too. */
export function profileTerms(entries: EntriesByDimension): { term: string; kind: TermKind }[] {
  const out: { term: string; kind: TermKind }[] = [];
  for (const e of entries.skills) {
    if (e.values.name) out.push({ term: e.values.name, kind: e.values.category === 'Tools / Software' ? 'tool' : 'skill' });
  }
  for (const e of entries.knowledge) if (e.values.area) out.push({ term: e.values.area, kind: 'knowledge' });
  for (const d of ['projects', 'experience'] as const) {
    for (const e of entries[d]) {
      for (const t of (e.values.tools ?? '').split(',')) if (t.trim()) out.push({ term: t.trim(), kind: 'tool' });
    }
  }
  return out;
}

export function totalExperienceMonths(entries: Entry[]): number {
  const now = new Date().toISOString().slice(0, 7);
  return entries.reduce((sum, e) => {
    const start = e.values.start;
    const end = e.values.current === 'true' ? now : e.values.end;
    return start && end ? sum + Math.max(0, monthsBetween(start, end)) : sum;
  }, 0);
}

const DEGREE_RANK: [RegExp, number][] = [
  [/\b(phd|doctorate)\b/i, 4],
  [/\b(master'?s?|ms|msc|mba|mphil)\b/i, 3],
  [/\b(bachelor'?s?|bs|bsc|be|bcs|bba|b\.?\s?tech|degree)\b/i, 2],
  [/\b(diploma|intermediate|a[- ]levels?|hssc)\b/i, 1],
];
function degreeRank(text: string): number {
  return DEGREE_RANK.find(([re]) => re.test(text))?.[1] ?? 0;
}

export function matchJob(analysis: JobAnalysis, profile: ProfileSnapshot, mode: CvMode): MatchResult {
  const entries = usableEntries(profile.entries, mode);
  const indexed = LIST_DIMS.flatMap((d) => entries[d].map((e) => ({ d, e, text: entryText(e) })));

  const matched: TermMatch[] = [];
  const gaps: JobTerm[] = [];
  const relevant = new Set<string>();

  for (const term of analysis.terms) {
    const sources: MatchSource[] = [];
    for (const { d, e, text } of indexed) {
      if (term.aliases.some((a) => mentions(text, a)) || mentions(text, term.term.toLowerCase())) {
        sources.push({ dimension: d, entryId: e.id, label: entryLabel(d, e), evidence: !!e.evidence });
      }
    }
    if (term.kind === 'attribute') {
      const a = profile.attributes[term.term as AttributeName];
      const backed = !!a?.source && a.source !== 'Self-reflection';
      if (a && (a.rating === 'High' || a.rating === 'Medium') && (mode === 'standard' || backed)) {
        sources.push({ dimension: 'attributes', entryId: term.term, label: `${term.term} (${a.rating})`, evidence: backed });
      }
    }
    if (sources.length) {
      sources.forEach((s) => relevant.add(s.entryId));
      matched.push({ term, sources, proven: sources.some((s) => s.evidence) });
    } else {
      gaps.push(term);
    }
  }

  // Education: met when the candidate's best degree is at least the level asked for.
  const best = [...entries.education].sort((x, y) => degreeRank(y.values.degree ?? '') - degreeRank(x.values.degree ?? ''))[0];
  const askedRank = analysis.education ? degreeRank(analysis.education) : 0;
  const education = {
    asked: analysis.education,
    best: best ? best.values.degree : null,
    met: !analysis.education || (!!best && degreeRank(best.values.degree ?? '') >= askedRank),
  };

  const months = totalExperienceMonths(entries.experience);
  const experience = {
    years: analysis.experienceYears,
    months,
    met: analysis.experienceYears === null || months >= analysis.experienceYears * 12,
  };

  // Weighted readiness: required terms 3, preferred 1, education 2, experience 2.
  // A match backed by evidence earns full credit; a candidate-stated one 75%.
  let earned = 0;
  let possible = 0;
  for (const t of analysis.terms) {
    const w = t.required ? 3 : 1;
    possible += w;
    const m = matched.find((x) => x.term.term === t.term);
    if (m) earned += w * (m.proven ? 1 : 0.75);
  }
  if (analysis.education) {
    possible += 2;
    if (education.met) earned += 2;
  }
  if (analysis.experienceYears !== null && analysis.experienceYears > 0) {
    possible += 2;
    earned += 2 * Math.min(1, months / (analysis.experienceYears * 12));
  }
  const readiness = possible ? Math.round((earned / possible) * 100) : null;

  return { matched, gaps, education, experience, readiness, relevant };
}

export function dimensionLabel(d: DimensionId): string {
  return DIMENSIONS[d].label;
}
