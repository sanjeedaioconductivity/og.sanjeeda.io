/**
 * SCR-010 Results — zero input fields, fully generated.
 *
 * Everything numeric or evaluative on this screen is READ from the scoring
 * engine response. The strengths / watch-outs / next-steps rules live in
 * `lib/offerguide/scoring/deriveGuidance.ts` (server-side) — this file holds
 * only static copy and labels.
 *
 * Sprint 7 handoff §5 is explicit: "If the frontend contains a threshold
 * comparison that produces a displayed value, that is a defect." Nothing in
 * this file or the SCR-010 page compares a score to a threshold.
 */

export const SCR010_COPY = {
  purpose: 'Your offer decision summary',
  requirementNote:
    'Based on everything you have told us, here is how well this offer fits your needs, priorities, and career goals.',

  sections: {
    fitScore: 'Offer fit score',
    categories: 'How this offer scores across categories',
    currentJob: 'Compared with your current job',
    strengthsWatchOuts: 'Strengths & watch-outs',
    nextSteps: 'Suggested next steps',
    community: 'Community insight',
  },

  sectionHelp: {
    fitScore:
      'Your overall fit score out of 100, weighted by the priorities you selected during evaluation setup.',
    categories:
      'How this offer scored in each of the seven categories. Taller bars are stronger.',
    currentJob:
      'The same figures side by side: what you earn and work now, against what this offer gives you. Facts you entered, not scores.',
    strengthsWatchOuts:
      'What is strong about this offer, and the specific risks worth checking before you accept.',
    nextSteps:
      'Suggested actions based on where this offer scored weakest.',
    community:
      'Anonymised patterns from candidates who evaluated similar offers.',
  },

  /** Static copy — never derived from a score. */
  scoreHint: 'Based on alignment with what matters most to you.',
  recommendationEyebrow: 'RECOMMENDATION',
  categoriesInfoNote:
    'Scores are based on your answers and your selected priorities from the evaluation setup.',

  /**
   * CR-01 — the report's half of the current-job comparison. Same component and
   * same row labels as SCR-009 so the report cannot disagree with the screen the
   * candidate just came from; only the section chrome differs.
   */
  currentJob: {
    baselineColumn: 'Current job',
    rows: {
      baseSalary: 'Base salary (annual)',
      totalPackage: 'Total package (annual)',
      workArrangement: 'Work arrangement',
      workingHours: 'Working hours',
      commute: 'Daily commute',
    },
    help: {
      baseSalary:
        'Your current base salary and this offer’s, both annualised, so a monthly figure and an annual one can be compared directly.',
      totalPackage:
        'This offer’s full annual value including bonus, commission, equity and allowances. Your current job is shown at its base salary, which is the only figure OfferGuide asks you for.',
    },
    currencyNote:
      'This offer is in a different currency from your current salary, so no percentage change is shown — OfferGuide does not convert currencies. Compare the two figures yourself using a rate you trust.',
    /** Replaces the table for a candidate with no current job on file. */
    noBaseline:
      'No current job on file to compare against. Add your current salary and working conditions on the profile step to see this comparison.',
  },

  strengthsTitle: 'Top strengths',
  strengthsEmpty: 'No categories scored above 75.',
  watchOutsTitle: 'Watch-outs',
  watchOutsEmpty: 'No major watch-outs identified.',

  /**
   * Community insight — single-offer only. Static in MVP and deliberately
   * carries NO figures: the same honesty constraint as SCR-009's market cards.
   * Nothing here may look like a community statistic when no community data
   * exists yet.
   */
  communityTitle: 'What similar candidates found helpful',
  communityBody:
    'Community insight will appear here as more candidates complete evaluations. It is built from anonymised patterns only — never from personal identities — and there is not enough data yet to show reliable patterns.',
  communityMeta: 'single offer only',

  actions: {
    download: 'Download summary',
    addOffer: '+ Add another offer',
    revisit: 'Revisit answers',
    startNew: 'Start a new evaluation',
  },

  disclaimerPrimary: 'This is decision guidance, not a final decision.',
  disclaimerSecondary:
    'You choose what fits your life and career. OfferGuide helps you think clearly — the decision is always yours.',

  finishLabel: 'Finish',
} as const;

/** Category display order for the chart — fixed, matches SCR-009's table. */
export const RESULT_CATEGORIES = [
  { label: 'Salary', key: 'salaryScore' },
  { label: 'Benefits', key: 'benefitsScore' },
  { label: 'Stability', key: 'stabilityScore' },
  { label: 'Work-Life', key: 'worklifeScore' },
  { label: 'Growth', key: 'growthScore' },
  { label: 'Culture', key: 'cultureScore' },
  { label: 'Purpose', key: 'purposeScore' },
] as const;

/**
 * Builds the plain-text summary.
 *
 * No longer the primary download — that is now the PDF in
 * `lib/offerguide/buildSummaryPdf.ts`. This is kept as the fallback for when the
 * jsPDF chunk fails to load, and as the readable representation the unit tests
 * assert against. The two render the same fields from the same payload, so a
 * change to one belongs in the other.
 *
 * Every value written here comes from the score response — this formats, it
 * does not compute.
 */
export function buildSummaryText(input: {
  offerLabel: string;
  companyName: string | null;
  roleTitle: string | null;
  overallScore: number;
  recommendationLabel: string;
  categories: { label: string; score: number }[];
  strengths: { category: string; score: number }[];
  watchOuts: string[];
  nextSteps: string[];
}): string {
  const lines: string[] = [];
  const rule = '='.repeat(52);

  lines.push('OfferGuide — Offer decision summary', rule, '');
  lines.push(`Offer:        ${input.offerLabel}`);
  if (input.companyName) lines.push(`Company:      ${input.companyName}`);
  if (input.roleTitle) lines.push(`Role:         ${input.roleTitle}`);
  lines.push('');
  lines.push(`Overall fit:  ${input.overallScore} / 100`);
  lines.push(`Recommendation: ${input.recommendationLabel}`);
  lines.push('');

  lines.push('CATEGORY SCORES', '-'.repeat(52));
  for (const c of input.categories) {
    lines.push(`${c.label.padEnd(14)} ${String(c.score).padStart(3)} / 100`);
  }
  lines.push('');

  lines.push('TOP STRENGTHS', '-'.repeat(52));
  if (input.strengths.length === 0) {
    lines.push(SCR010_COPY.strengthsEmpty);
  } else {
    for (const s of input.strengths) {
      lines.push(`- ${s.category}: ${s.score} / 100`);
    }
  }
  lines.push('');

  lines.push('WATCH-OUTS', '-'.repeat(52));
  if (input.watchOuts.length === 0) {
    lines.push(SCR010_COPY.watchOutsEmpty);
  } else {
    for (const w of input.watchOuts) lines.push(`- ${w}`);
  }
  lines.push('');

  lines.push('SUGGESTED NEXT STEPS', '-'.repeat(52));
  for (const n of input.nextSteps) lines.push(`- ${n}`);
  lines.push('');

  lines.push(rule);
  lines.push(SCR010_COPY.disclaimerPrimary);
  lines.push(SCR010_COPY.disclaimerSecondary);

  return lines.join('\n');
}
