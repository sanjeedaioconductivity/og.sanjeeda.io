/**
 * SCR-008 Culture & Manager — 14 fields, all optional, 2 sections.
 *
 * FIELD COUNT: the FRS §2 says 12; this builds 14. Not drift — Sprint 3 split
 * two questions that were each feeding two scoring categories at once:
 *   offer_company_reputation   → Stability-facing (market reputation)
 *   offer_employer_treatment_signal → Culture-facing counterpart (how the
 *                                     company treats people day-to-day)
 *   offer_leadership_stability → Stability-facing (actual turnover/reorgs)
 *   offer_leadership_style     → Culture-facing counterpart (approachability)
 * All four are seeded and scored in OgQuestions, and the live culture route
 * accepts all 14. Building 12 would leave two scored questions permanently
 * unanswerable. Flagged for FRS correction at PR review.
 *
 * This screen introduces the HelpIcon standard — every field label carries one,
 * populated from that field's own FRS Help Text.
 */

export const MANAGER_IMPRESSION = [
  'Strong',
  'Positive',
  'Neutral',
  'Concerning',
  'Not clear',
] as const;

export const RED_FLAGS = [
  'Unclear role',
  'Poor communication',
  'Unrealistic expectations',
  'Toxic manager vibe',
  'Delay in process',
  'Low transparency',
  'Other',
] as const;

export const INCLUSION_CONFIDENCE = ['High', 'Medium', 'Low', 'Not clear'] as const;

export const WORK_PRESSURE = ['Healthy', 'High', 'Very high', 'Not clear'] as const;

export const COMPANY_REPUTATION = [
  'Strong',
  'Mixed',
  'Weak',
  'Not clear',
  'Other',
] as const;

export const LEADERSHIP_STABILITY = ['Stable', 'Changing', 'Not clear'] as const;

export const EMPLOYER_TREATMENT_SIGNAL = [
  'Positive',
  'Mixed',
  'Negative',
  'Not clear',
] as const;

export const LEADERSHIP_STYLE = [
  'Approachable',
  'Mixed',
  'Distant',
  'Not clear',
] as const;

export const PSYCH_SAFETY = ['High', 'Medium', 'Low', 'Not clear'] as const;

/**
 * Amber warning values, scoped PER FIELD — `Low` is a warning for psych safety
 * and inclusion but must not be styled globally by string, and `Mixed` is
 * neutral rather than negative.
 */
export const SCR008_WARNING_VALUES = {
  managerImpression: ['Concerning'] as readonly string[],
  workPressure: ['Very high'] as readonly string[],
  companyReputation: ['Weak'] as readonly string[],
  leadershipStability: ['Changing'] as readonly string[],
  psychSafety: ['Low'] as readonly string[],
  inclusionConfidence: ['Low'] as readonly string[],
  employerTreatmentSignal: ['Negative'] as readonly string[],
  leadershipStyle: ['Distant'] as readonly string[],
} as const;

export const CULTURE_ANCHORS = {
  teamCultureFit: { low: 'Poor fit', high: 'Great fit' },
  valuesAlignment: { low: 'Not aligned', high: 'Strongly aligned' },
  purposeSense: { low: 'No sense of purpose', high: 'Strong sense of purpose' },
  cultureImportance: { low: 'Not important', high: 'Very important' },
} as const;

export const SCR008_DEFAULTS = {
  offerManagerImpression: 'Not clear',
  offerTeamCultureFit: 3,
  offerValuesAlignment: 3,
  offerInclusionConfidence: 'Not clear',
  offerWorkPressure: 'Not clear',
  offerCompanyReputation: 'Not clear',
  offerLeadershipStability: 'Not clear',
  offerEmployerTreatmentSignal: 'Not clear',
  offerLeadershipStyle: 'Not clear',
  offerPsychSafety: 'Not clear',
  offerPurposeSense: 3,
  offerCultureImportance: 3,
} as const;

export const SCR008_LIMITS = {
  otherTextMax: 100,
  notesMax: 2000,
} as const;

export const SCR008_COPY = {
  purpose: 'What did you learn about the people and the culture?',
  requirementNote:
    'All fields are optional. Answer based on what you observed during interviews. Hover the ⓘ on any field for guidance.',

  sections: {
    manager: 'Manager & team',
    culture: 'Company culture',
  },

  labels: {
    managerImpression: 'Manager impression',
    teamCultureFit: 'Team culture fit',
    redFlags: 'Red flags from interviews',
    notes: 'Your private notes',
    valuesAlignment: 'Values alignment',
    inclusionConfidence: 'Inclusion confidence',
    workPressure: 'Work pressure',
    companyReputation: 'Company reputation',
    leadershipStability: 'Leadership stability',
    employerTreatmentSignal: 'How the company treats employees',
    leadershipStyle: 'Leadership style',
    psychSafety: 'Psychological safety',
    purposeSense: 'Sense of purpose',
    cultureImportance: 'Culture importance',
  },

  /** The `not scored` marker shown on offer_notes. */
  notesNotScoredLabel: 'Not scored — for your reference only',

  /** Hint under the red-flag chips, confirming scoring impact per the FRS. */
  redFlagsHint: 'Each flag you select reduces your culture score.',

  helpText: {
    managerImpression:
      'Based on your interviews, what was your overall impression of the manager you would report to?',
    teamCultureFit:
      'Rate how well you think you would fit with this team. 1 = poor fit, 5 = great fit.',
    redFlags:
      'Select any warning signals you observed during the interview process. You can select more than one. Each flag you select reduces your culture score.',
    notes:
      'Anything else you want to remember about this offer. These notes are private, are not scored, and are never shared with the community.',
    valuesAlignment:
      "Rate how well this company's values align with your own. 1 = not aligned, 5 = strongly aligned.",
    inclusionConfidence:
      'How confident are you that this workplace is inclusive and treats people fairly?',
    workPressure:
      'Based on what you observed, how much day-to-day work pressure would you expect in this role?',
    companyReputation:
      "Based on your research, how would you rate this company's overall market reputation and organisational stability?",
    leadershipStability:
      'Has the leadership team been stable, or has there been recent turnover or reorganisation?',
    employerTreatmentSignal:
      'Based on what you heard and read, how does this company treat its employees day-to-day?',
    leadershipStyle:
      'Based on your interviews, how approachable does the leadership seem day-to-day?',
    psychSafety:
      'How comfortable do you think people are speaking up, disagreeing, or admitting mistakes in this team?',
    purposeSense:
      'Rate how meaningful this work feels to you. 1 = no sense of purpose, 5 = strong sense of purpose.',
    cultureImportance:
      'How important is culture to you in this decision? Your answer adjusts how much weight the culture score carries in your overall fit score.',
  },
} as const;
