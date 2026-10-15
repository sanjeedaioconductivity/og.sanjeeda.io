import { careerStageLabel, STAGE_ORDER, type CareerStage, type DimensionId } from './dimensions';
import { ATTRIBUTES, formatMonth, splitLines, splitList, type Entry, type ListDimensionId } from './entries';
import type { JobDescription, JobTerm } from './jobs';
import {
  matchJob,
  totalExperienceMonths,
  usableEntries,
  type CvMode,
  type MatchResult,
  type ProfileSnapshot,
  type TermMatch,
} from './matching';

/**
 * Builds the job-specific CV, cover letter and readiness report from a saved
 * version. Everything is derived from the candidate's own entries: wording is
 * tidied, sections are reordered and filtered, but nothing is added that isn't
 * in the profile (concept §9). Each CV line keeps a pointer to its source entry.
 */

export const FREE_VERSION_LIMIT = 3;
export const FREE_EXPIRY_DAYS = 21;

export interface CvVersion {
  id: string;
  name: string;
  createdAt: string;
  /** Free plan: versions expire after 3 weeks. Null on a paid plan. */
  expiresAt: string | null;
  job: JobDescription;
  mode: CvMode;
  stage: CareerStage;
  /** The profile as it was when this CV was generated. */
  profile: ProfileSnapshot;
  /** Entry ids the candidate removed from this CV. */
  hidden: string[];
  summaryOverride: string | null;
  coverLetterOverride: string | null;
  /** Concept §15 screen 19: a human must approve before final download. */
  approved: boolean;
  mentorRequested: boolean;
}

/** A new, unsaved version. The strategy screen previews one before it is kept. */
export function makeVersion(args: {
  id: string;
  job: JobDescription;
  mode: CvMode;
  stage: CareerStage;
  profile: ProfileSnapshot;
  now?: Date;
}): CvVersion {
  const now = args.now ?? new Date();
  return {
    id: args.id,
    name: `${args.job.analysis.title || 'CV'} – ${now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`,
    createdAt: now.toISOString(),
    // Prototype accounts are all on the free plan.
    expiresAt: new Date(now.getTime() + FREE_EXPIRY_DAYS * 86_400_000).toISOString(),
    job: args.job,
    mode: args.mode,
    stage: args.stage,
    profile: args.profile,
    hidden: [],
    summaryOverride: null,
    coverLetterOverride: null,
    approved: false,
    mentorRequested: false,
  };
}

export function isExpired(v: CvVersion, now = new Date()): boolean {
  return !!v.expiresAt && new Date(v.expiresAt) <= now;
}

/* ---------------------------------------------------------------------------
   Wording
   --------------------------------------------------------------------------- */

/** Weak openers → standard CV verbs. Rephrasing only: the claim stays the same. */
const OPENERS: [RegExp, string][] = [
  [/^helped (with|in)\s+/i, 'Supported '],
  [/^helped\s+/i, 'Supported '],
  [/^worked on\s+/i, 'Contributed to '],
  [/^was responsible for\s+/i, 'Responsible for '],
  [/^i\s+/i, ''],
  [/^did\s+/i, 'Completed '],
];

export function polish(line: string): string {
  let s = line.replace(/^[-•*]\s*/, '').replace(/\s+/g, ' ').trim();
  if (!s) return s;
  for (const [re, to] of OPENERS) s = s.replace(re, to);
  s = s.charAt(0).toUpperCase() + s.slice(1);
  if (!/[.!?]$/.test(s)) s += '.';
  return s;
}

function listJoin(items: string[]): string {
  if (items.length <= 1) return items[0] ?? '';
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

function duration(months: number): string {
  if (months < 12) return `${months} ${months === 1 ? 'month' : 'months'}`;
  const y = Math.floor(months / 12);
  const m = months % 12;
  return m ? `${y} ${y === 1 ? 'year' : 'years'} ${m} ${m === 1 ? 'month' : 'months'}` : `${y} ${y === 1 ? 'year' : 'years'}`;
}

function dateRange(start?: string, end?: string, current?: boolean): string {
  if (!start) return '';
  return `${formatMonth(start)} – ${current ? 'Present' : end ? formatMonth(end) : ''}`.trim();
}

/* ---------------------------------------------------------------------------
   CV document
   --------------------------------------------------------------------------- */

export interface CvItem {
  id: string;
  heading: string;
  sub: string;
  bullets: string[];
  dimension: DimensionId;
  evidence: boolean;
  /** Matched one of the job's terms. */
  matched: boolean;
}

export interface CvSection {
  dimension: DimensionId;
  heading: string;
  items: CvItem[];
}

export interface CvDocument {
  name: string;
  title: string;
  contact: string[];
  summary: string;
  sections: CvSection[];
}

const SECTION_HEADING: Record<DimensionId, string> = {
  knowledge: 'Knowledge Areas',
  skills: 'Skills',
  projects: 'Projects',
  education: 'Education',
  certifications: 'Certifications',
  trainings: 'Training',
  attributes: 'Professional Attributes',
  experience: 'Experience',
  exposure: 'Exposure',
};

/** Shown whatever the job: a CV without them reads as hiding something. */
const ALWAYS_SHOWN: DimensionId[] = ['education', 'experience'];
const MAX_ITEMS: Partial<Record<DimensionId, number>> = { skills: 10, knowledge: 8, projects: 4 };

function itemFor(d: ListDimensionId, e: Entry, matched: boolean): CvItem {
  const v = e.values;
  const base = { id: e.id, dimension: d, evidence: !!e.evidence, matched };
  const thisMonth = new Date().toISOString().slice(0, 7);
  switch (d) {
    case 'knowledge':
      return { ...base, heading: v.area, sub: v.level ?? '', bullets: [] };
    case 'skills':
      return { ...base, heading: v.name, sub: [v.category, v.level].filter(Boolean).join(' · '), bullets: [] };
    case 'projects':
      return {
        ...base,
        heading: v.title,
        sub: [v.role, v.type, dateRange(v.start, v.end)].filter(Boolean).join(' · '),
        bullets: [
          polish(v.summary ?? ''),
          ...(v.outcome ? [polish(v.outcome)] : []),
          ...(v.tools ? [`Tools: ${splitList(v.tools).join(', ')}.`] : []),
        ].filter(Boolean),
      };
    case 'education':
      return {
        ...base,
        heading: v.degree,
        sub: [v.institution, v.startYear && v.endYear ? `${v.startYear} – ${v.endYear}` : '', v.grade].filter(Boolean).join(' · '),
        bullets: [
          ...(v.majors ? [`Major subjects: ${splitList(v.majors).join(', ')}.`] : []),
          ...(v.fyp ? [`Final year project: ${v.fyp}.`] : []),
        ],
      };
    case 'certifications': {
      const expired = v.expires && v.expires < thisMonth;
      return {
        ...base,
        heading: v.name,
        sub: [v.issuer, v.issued ? `Issued ${formatMonth(v.issued)}` : '', expired ? `Expired ${formatMonth(v.expires)}` : v.expires ? `Valid until ${formatMonth(v.expires)}` : '']
          .filter(Boolean)
          .join(' · '),
        bullets: v.credentialId ? [`Credential ID: ${v.credentialId}.`] : [],
      };
    }
    case 'trainings':
      return {
        ...base,
        heading: v.title,
        sub: [v.provider, v.hours ? `${v.hours} hours` : '', v.completed ? formatMonth(v.completed) : ''].filter(Boolean).join(' · '),
        bullets: v.skills ? [`Skills gained: ${splitList(v.skills).join(', ')}.`] : [],
      };
    case 'experience':
      return {
        ...base,
        heading: v.title,
        sub: [v.organization, v.location, dateRange(v.start, v.end, v.current === 'true')].filter(Boolean).join(' · '),
        bullets: [...splitLines(v.responsibilities), ...splitLines(v.achievements)].map(polish),
      };
    case 'exposure':
      return {
        ...base,
        heading: v.title,
        sub: [v.type, v.duration].filter(Boolean).join(' · '),
        bullets: [polish(v.context ?? ''), ...(v.learned ? [polish(v.learned)] : [])].filter(Boolean),
      };
  }
}

export interface CvPlan {
  version: CvVersion;
  match: MatchResult;
  doc: CvDocument;
  /** Dimensions left out of the CV and why. */
  hiddenSections: { dimension: DimensionId; reason: string }[];
}

export function planCv(version: CvVersion): CvPlan {
  const { profile, job, mode, stage } = version;
  const match = matchJob(job.analysis, profile, mode);
  const entries = usableEntries(profile.entries, mode);
  const hidden = new Set(version.hidden);

  const sections: CvSection[] = [];
  const hiddenSections: CvPlan['hiddenSections'] = [];

  for (const d of STAGE_ORDER[stage]) {
    let items: CvItem[] = [];
    if (d === 'attributes') {
      // Attribute claims only when backed by something other than self-reflection
      // AND asked for by the job (concept §15 screen 14).
      for (const m of match.matched.filter((x) => x.term.kind === 'attribute')) {
        const a = profile.attributes[m.term.term as (typeof ATTRIBUTES)[number]];
        if (a?.rating && a.source && a.source !== 'Self-reflection' && !hidden.has(m.term.term)) {
          items.push({
            id: m.term.term, dimension: 'attributes', heading: m.term.term, sub: `Based on ${a.source.toLowerCase()}`,
            bullets: [], evidence: true, matched: true,
          });
        }
      }
    } else {
      const all = entries[d].filter((e) => !hidden.has(e.id));
      const relevant = all.filter((e) => match.relevant.has(e.id));
      const chosen = ALWAYS_SHOWN.includes(d) ? [...relevant, ...all.filter((e) => !match.relevant.has(e.id))] : relevant;
      items = chosen.slice(0, MAX_ITEMS[d] ?? 99).map((e) => itemFor(d, e, match.relevant.has(e.id)));
    }

    if (items.length) {
      sections.push({ dimension: d, heading: SECTION_HEADING[d], items });
    } else {
      const total = d === 'attributes' ? 0 : profile.entries[d].length;
      hiddenSections.push({
        dimension: d,
        reason:
          total === 0
            ? 'Nothing added yet'
            : mode === 'verified' && d !== 'attributes' && entries[d].length === 0
              ? 'No evidence-backed entries (Verified mode)'
              : d === 'attributes'
                ? 'No job-relevant attribute backed by evidence'
                : 'Not relevant to this job',
      });
    }
  }

  const doc: CvDocument = {
    name: profile.basic.fullName,
    title: profile.basic.title || careerStageLabel(stage),
    contact: [profile.basic.email, profile.basic.mobile, profile.basic.city, profile.basic.linkedin, profile.basic.portfolio].filter(Boolean),
    summary: version.summaryOverride ?? buildSummary(version, match),
    sections,
  };
  return { version, match, doc, hiddenSections };
}

function bestEducation(entries: Entry[]): Entry | undefined {
  return [...entries].sort((a, b) => Number(b.values.endYear ?? 0) - Number(a.values.endYear ?? 0))[0];
}

/** Facts-only professional summary. Every phrase maps to a profile field. */
export function buildSummary(version: CvVersion, match: MatchResult): string {
  const { profile, job, mode, stage } = version;
  const entries = usableEntries(profile.entries, mode);
  const title = profile.basic.title || careerStageLabel(stage);
  const edu = bestEducation(entries.education);
  const months = totalExperienceMonths(entries.experience);
  const latest = [...entries.experience].sort((a, b) => (b.values.start ?? '').localeCompare(a.values.start ?? ''))[0];

  const strengths = [...match.matched]
    .filter((m) => m.term.kind !== 'attribute')
    .sort((a, b) => Number(b.proven) - Number(a.proven) || Number(b.term.required) - Number(a.term.required))
    .slice(0, 3)
    .map((m) => m.term.term);
  const certs = entries.certifications.filter((c) => match.relevant.has(c.id)).length;

  const parts: string[] = [];
  let first = title;
  if (edu) first += ` with a ${edu.values.degree} from ${edu.values.institution}`;
  if (months > 0 && latest) first += `${edu ? ' and' : ' with'} ${duration(months)} of experience, most recently as ${latest.values.title}`;
  parts.push(`${first}.`);
  if (strengths.length) parts.push(`Skilled in ${listJoin(strengths)}.`);
  if (certs) parts.push(`Holds ${certs} relevant ${certs === 1 ? 'certification' : 'certifications'}.`);
  if (job.analysis.title) parts.push(`Seeking the ${job.analysis.title} role${job.analysis.company ? ` at ${job.analysis.company}` : ''}.`);
  return parts.join(' ');
}

/* ---------------------------------------------------------------------------
   Cover letter
   --------------------------------------------------------------------------- */

const SOURCE_NOUN: Partial<Record<DimensionId, string>> = {
  experience: 'role',
  projects: 'project',
  trainings: 'training',
  certifications: 'certification',
  exposure: 'experience',
};

/** "Website for College Event project", but not "Lab Support Project project". */
function withNoun(label: string, dimension: DimensionId): string {
  const noun = SOURCE_NOUN[dimension];
  if (!noun) return label;
  const l = label.toLowerCase();
  return l.includes(noun) || (noun === 'certification' && l.includes('certificate')) ? label : `${label} ${noun}`;
}

export function buildCoverLetter(plan: CvPlan): string {
  const { version, match, doc } = plan;
  const { job, profile } = version;
  const role = job.analysis.title || 'advertised';
  const company = job.analysis.company;
  const edu = bestEducation(usableEntries(profile.entries, version.mode).education);

  const evidenced = match.matched
    .filter((m) => m.term.kind !== 'attribute')
    .map((m) => ({ m, src: m.sources.find((s) => SOURCE_NOUN[s.dimension]) }))
    .filter((x): x is { m: TermMatch; src: NonNullable<typeof x.src> } => !!x.src)
    .slice(0, 3);

  const lines: string[] = ['Dear Hiring Manager,', ''];
  lines.push(
    `I am writing to apply for the ${role} position${company ? ` at ${company}` : ''}. I am a ${doc.title}${edu ? ` with a ${edu.values.degree} from ${edu.values.institution}` : ''}.`,
  );
  lines.push('');
  if (evidenced.length) {
    // One sentence per source: "In my X project, I applied A and B."
    const bySource = new Map<string, { where: string; terms: string[] }>();
    for (const { m, src } of evidenced) {
      const key = `${src.dimension}:${src.entryId}`;
      const group = bySource.get(key) ?? { where: withNoun(src.label, src.dimension), terms: [] };
      group.terms.push(m.term.term);
      bySource.set(key, group);
    }
    lines.push(
      `My background matches several of the role's requirements. ${[...bySource.values()]
        .map((g) => `In my ${g.where}, I applied ${listJoin(g.terms)}.`)
        .join(' ')}`,
    );
    lines.push('');
  }
  const attrs = match.matched.filter((m) => m.term.kind === 'attribute').slice(0, 2).map((m) => m.term.term.toLowerCase());
  if (attrs.length) {
    lines.push(`I would also bring ${listJoin(attrs)} to your team.`);
    lines.push('');
  }
  const growth = match.gaps.filter((g) => g.required && g.kind !== 'attribute').slice(0, 2).map((g) => g.term);
  if (growth.length) {
    lines.push(`I am actively strengthening my ${listJoin(growth)} skills and would welcome the chance to keep growing in this role.`);
    lines.push('');
  }
  lines.push('Thank you for considering my application. I would welcome the opportunity to discuss how I can contribute.');
  lines.push('', 'Sincerely,', doc.name, [profile.basic.email, profile.basic.mobile].filter(Boolean).join(' · '));
  return lines.join('\n');
}

/* ---------------------------------------------------------------------------
   Readiness report (concept §15 screen 20) — developmental, never harsh.
   --------------------------------------------------------------------------- */

export interface ReadinessReport {
  readiness: number | null;
  strengths: TermMatch[];
  knowledgeToDevelop: JobTerm[];
  skillGaps: JobTerm[];
  evidenceMissing: TermMatch[];
  developmentNotes: string[];
  interviewPoints: string[];
  trainingTopics: string[];
  mentorRecommended: boolean;
}

export function buildReadiness(plan: CvPlan): ReadinessReport {
  const { match } = plan;
  const strengths = [...match.matched].sort((a, b) => Number(b.proven) - Number(a.proven) || Number(b.term.required) - Number(a.term.required));
  const knowledgeToDevelop = match.gaps.filter((g) => g.kind === 'knowledge');
  const skillGaps = match.gaps.filter((g) => g.kind === 'skill' || g.kind === 'tool');
  const attributeGaps = match.gaps.filter((g) => g.kind === 'attribute');
  const evidenceMissing = match.matched.filter((m) => !m.proven);

  const developmentNotes = [
    ...[...knowledgeToDevelop, ...skillGaps]
      .sort((a, b) => Number(b.required) - Number(a.required))
      .slice(0, 4)
      .map(
        (g) =>
          `${g.term} appears to be ${g.required ? 'an important' : 'a useful'} development area for this role. Strengthening it will improve your readiness.`,
      ),
    ...attributeGaps.slice(0, 2).map((g) => `The role values ${g.term.toLowerCase()}. Rate it in Attribute Fitness and add an example that shows it.`),
  ];

  const { experience, education } = match;
  if (!education.met && education.asked) {
    developmentNotes.push(`The role asks for: ${education.asked}. Highlight related coursework and certifications to show equivalent preparation.`);
  }

  // Point at something the candidate actually did (a role, project, training…),
  // not at the skill entry that merely names the same thing.
  const STORY_DIMS: DimensionId[] = ['experience', 'projects', 'trainings', 'certifications', 'exposure'];
  const stories = strengths
    .map((m) => ({ m, src: m.sources.find((s) => STORY_DIMS.includes(s.dimension)) }))
    .filter((x) => x.src)
    .slice(0, 4);
  const interviewPoints = [
    ...stories.map(({ m, src }) => {
      return `Be ready to give an example of ${m.term.term} from your ${withNoun(src!.label, src!.dimension)}: what you did and what changed.`;
    }),
    ...match.gaps
      .filter((g) => g.required && g.kind !== 'attribute')
      .slice(0, 2)
      .map((g) => `Expect questions on ${g.term}. Prepare an honest answer about how you are building it.`),
  ];
  if (experience.years && !experience.met) {
    interviewPoints.push(
      `The role asks for ${experience.years}+ years of experience and your profile shows ${duration(experience.months) || 'none yet'}. Prepare to show how your projects and training cover the difference.`,
    );
  }

  const trainingTopics = [...knowledgeToDevelop, ...skillGaps]
    .sort((a, b) => Number(b.required) - Number(a.required))
    .slice(0, 5)
    .map((g) => g.term);

  const requiredGaps = match.gaps.filter((g) => g.required).length;
  return {
    readiness: match.readiness,
    strengths,
    knowledgeToDevelop,
    skillGaps,
    evidenceMissing,
    developmentNotes,
    interviewPoints,
    trainingTopics,
    mentorRecommended: (match.readiness ?? 0) < 70 || requiredGaps >= 2,
  };
}

export function safeFileName(...parts: string[]): string {
  return parts
    .filter(Boolean)
    .join('-')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

