// OfferGuide — scoring engine constants
// Sprint 5, Epic 5.1.

// Flat fallback used when a numeric field has no usable base salary to
// annualize — the formula in salaryScore.ts is skipped entirely for this
// case, per the handoff's "no-base-salary fallback" acceptance criterion.
export const SALARY_SCORE_NO_BASE_SALARY = 45;

// Bumped only when a scoreType's scoring formula/algorithm itself changes
// (enum/rating/numeric handling, the salary percentile formula) — distinct
// from OgScoringConfig.version, which tracks admin-tunable weights and can
// change far more often, with zero code deploy.
export const FIELD_SCORING_RULES_VERSION = 1;

// Recommendation thresholds and labels, both verbatim from SCR-010 FRS §6.1's
// threshold table. Sprint 5 shipped provisional label wording because that FRS
// wasn't in the repo yet; Sprint 8 confirmed it against the document and
// corrected the four strings (thresholds were already right).
export const RECOMMENDATION_THRESHOLDS = {
  strong: 85,
  good: 72,
  caution: 58,
} as const;

export const RECOMMENDATION_LABELS = {
  strong: "Excellent fit — strong offer",
  good: "Good fit — negotiate a few points",
  caution: "Moderate fit — clarify concerns",
  weak: "Weak fit — proceed carefully",
} as const;
