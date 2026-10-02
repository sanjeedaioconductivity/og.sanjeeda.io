// OfferGuide — SCR-010 guidance derivation (strengths, watch-outs, next steps)
//
// Sprint 7, Epic 7.3. This lives SERVER-SIDE by explicit architectural rule:
// Sprint 7 handoff §5 states that every strength, watch-out and next step on
// SCR-010 must be "read from the scoring engine response", and that a threshold
// comparison in the frontend producing a displayed value "is a defect". The
// thresholds below are documented in SCR-010 §6.3–6.5 so the backend can
// implement them — not so the client can.
//
// Runs over the already-computed category scores plus the offer's raw answer
// rows. Every input it needs is loaded by computeAndPersistOfferScore()
// already, so this adds no queries.

/** The 7 scoring categories, in the fixed display order used by SCR-010's chart. */
const CATEGORY_ORDER = [
  'Salary',
  'Benefits',
  'Stability',
  'Work-Life',
  'Growth',
  'Culture',
  'Purpose',
] as const;

export type CategoryScores = {
  salaryScore: number;
  benefitsScore: number;
  stabilityScore: number;
  worklifeScore: number;
  growthScore: number;
  cultureScore: number;
  purposeScore: number;
};

/** Only the answer fields the SCR-010 triggers actually read. */
export type GuidanceAnswers = {
  offerAnnualBonusType?: string | null;
  offerAnnualBonus?: number | null;
  offerNegotiationRoom?: string | null;
  offerOvertimeCompensation?: string | null;
  offerRestrictiveClause?: string | null;
  offerRedFlags?: unknown;
};

export type Strength = { category: string; score: number };

export type Guidance = {
  strengths: Strength[];
  watchOuts: string[];
  nextSteps: string[];
};

const STRENGTH_MIN_SCORE = 75;
const MAX_STRENGTHS = 4;
const MAX_WATCH_OUTS = 5;
const MAX_NEXT_STEPS = 4;

/** SCR-010 §6.5 default fallback, shown only when nothing else triggers. */
export const DEFAULT_NEXT_STEP = 'Request written confirmation of key terms';

function toCategoryList(scores: CategoryScores): { category: string; score: number }[] {
  return [
    { category: 'Salary', score: scores.salaryScore },
    { category: 'Benefits', score: scores.benefitsScore },
    { category: 'Stability', score: scores.stabilityScore },
    { category: 'Work-Life', score: scores.worklifeScore },
    { category: 'Growth', score: scores.growthScore },
    { category: 'Culture', score: scores.cultureScore },
    { category: 'Purpose', score: scores.purposeScore },
  ];
}

/**
 * SCR-010 §6.3 — categories at or above 75, sorted descending, capped at 4.
 * Ties break on the fixed category display order so the same inputs always
 * produce the same list rather than depending on sort stability.
 */
function deriveStrengths(scores: CategoryScores): Strength[] {
  return toCategoryList(scores)
    .filter((c) => c.score >= STRENGTH_MIN_SCORE)
    .sort(
      (a, b) =>
        b.score - a.score ||
        CATEGORY_ORDER.indexOf(a.category as (typeof CATEGORY_ORDER)[number]) -
          CATEGORY_ORDER.indexOf(b.category as (typeof CATEGORY_ORDER)[number]),
    )
    .slice(0, MAX_STRENGTHS);
}

/**
 * SCR-010 §6.4 — score-based watch-outs first, then field-signal ones, capped
 * at 5. The ordering is load-bearing: with more than 5 triggered, the score
 * ones are the ones that survive.
 */
function deriveWatchOuts(
  scores: CategoryScores,
  answers: GuidanceAnswers,
): string[] {
  const scoreBased: string[] = [];
  if (scores.salaryScore < 60)
    scoreBased.push('Salary appears below similar market signals');
  if (scores.worklifeScore < 60)
    scoreBased.push('Work-life balance may create stress');
  if (scores.cultureScore < 60)
    scoreBased.push('Culture or manager signals need careful review');

  const fieldBased: string[] = [];

  // Both halves must hold: a "% of base" type with no amount entered isn't a
  // variable-bonus risk, it's just an unanswered question.
  if (
    answers.offerAnnualBonusType === '% of base' &&
    answers.offerAnnualBonus != null &&
    Number(answers.offerAnnualBonus) > 0
  ) {
    fieldBased.push('Bonus is variable — confirm payout rules');
  }

  if (answers.offerOvertimeCompensation === 'Not clear') {
    fieldBased.push('Overtime expectations are not clear');
  }

  if (answers.offerRestrictiveClause === 'Yes') {
    fieldBased.push('Restrictive clause should be reviewed before accepting');
  }

  // One watch-out per selected red flag. Stored as a JSON column, so it can
  // legitimately arrive as an array, a JSON string, or null.
  for (const flag of normaliseRedFlags(answers.offerRedFlags)) {
    fieldBased.push(`Interview red flag: ${flag}`);
  }

  return [...scoreBased, ...fieldBased].slice(0, MAX_WATCH_OUTS);
}

/**
 * SCR-010 §6.5 — sorted by the triggering category's score ascending (lowest
 * scoring categories generate steps first), capped at 4, with a default
 * fallback when nothing triggers.
 */
function deriveNextSteps(
  scores: CategoryScores,
  answers: GuidanceAnswers,
): string[] {
  const candidates: { step: string; score: number }[] = [];

  // Note the `or` — a candidate with room to negotiate gets this step even on a
  // strong salary score, which is why it isn't a plain `< 75` check.
  if (scores.salaryScore < 75 || answers.offerNegotiationRoom !== 'Low') {
    candidates.push({
      step: 'Negotiate salary or guaranteed cash value',
      score: scores.salaryScore,
    });
  }
  if (scores.growthScore < 75) {
    candidates.push({
      step: 'Clarify promotion path and learning support',
      score: scores.growthScore,
    });
  }
  if (scores.worklifeScore < 75) {
    candidates.push({
      step: 'Confirm work hours, hybrid policy, and overtime',
      score: scores.worklifeScore,
    });
  }
  if (scores.cultureScore < 75) {
    candidates.push({
      step: 'Ask more about manager expectations and team culture',
      score: scores.cultureScore,
    });
  }

  if (candidates.length === 0) return [DEFAULT_NEXT_STEP];

  return candidates
    .sort((a, b) => a.score - b.score)
    .slice(0, MAX_NEXT_STEPS)
    .map((c) => c.step);
}

/** `offer_red_flags` is a JSON column — normalise whatever shape comes back. */
function normaliseRedFlags(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.filter((f): f is string => typeof f === 'string');
  if (typeof raw === 'string' && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter((f): f is string => typeof f === 'string');
      }
    } catch {
      /* not JSON — treat as a single flag */
      return [raw];
    }
  }
  return [];
}

export function deriveGuidance(
  scores: CategoryScores,
  answers: GuidanceAnswers,
): Guidance {
  return {
    strengths: deriveStrengths(scores),
    watchOuts: deriveWatchOuts(scores, answers),
    nextSteps: deriveNextSteps(scores, answers),
  };
}
