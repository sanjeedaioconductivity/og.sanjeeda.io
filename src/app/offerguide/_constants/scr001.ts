/**
 * SCR-001 Candidate Profile — allowed values, defaults and copy.
 *
 * Every list, default and help string below is transcribed from the
 * OG_SCR001 Product Dictionary. 24 fields: 2 required (career_stage,
 * preferred_work_arrangement), 18 optional, 4 conditional.
 *
 * Unlike the offer screens, these fields are NOT in the OgQuestions collection —
 * the seed only covers scored offer_* fields on SCR-003 onward — so nothing
 * server-side validates these strings. That makes this file the only guard against
 * drift, which is exactly why the values live here as data rather than inline in
 * JSX.
 *
 * Terminology (Product Discovery §3.1) is reproduced literally, never paraphrased:
 * "Not clear" = the fact exists and the candidate doesn't know it. "Not sure" =
 * subjective and genuinely uncertain. "Not applicable" = structurally irrelevant.
 */

export const CAREER_STAGES = [
  'Student',
  'Entry Level',
  'Mid-Level',
  'Senior',
  'Leadership',
  'Executive',
  'Other',
] as const;

export const YES_NO = ['Yes', 'No'] as const;

export const PREFERRED_WORK_ARRANGEMENTS = [
  'On-site',
  'Hybrid',
  'Remote',
  'No preference',
] as const;

export const PREFERRED_WORK_LOCATIONS = [
  'Current city',
  'Specific city',
  'Specific country',
  'Open to any location',
] as const;

export const WILLING_TO_RELOCATE = ['Yes', 'No', 'Not sure'] as const;

export const EMPLOYMENT_STATUSES = [
  'Employed',
  'Self-Employed',
  'Between jobs',
  'Student',
  'Not currently working',
] as const;

/**
 * The gate for the entire Current Employment group. Anything outside these two
 * hides the group and all five of its sub-sections — hidden, not dimmed
 * (SCR-001 FRS §5 and the Sprint 6 DoD both say so explicitly).
 */
export const EMPLOYED_STATUSES: readonly string[] = ['Employed', 'Self-Employed'];

export const EMPLOYMENT_TYPES = [
  'Full-time',
  'Part-time',
  'Contract',
  'Freelance',
  'Temporary',
  'Other',
] as const;

export const PAY_FREQUENCIES = ['Monthly', 'Annually'] as const;

export const CURRENT_WORK_ARRANGEMENTS = [
  'On-site',
  'Hybrid',
  'Remote',
  'Other',
] as const;

export const CURRENT_BENEFITS = [
  'Health insurance',
  'Life insurance',
  'Provident fund',
  'Annual leave',
  'Sick leave',
  'Parental leave',
  'Learning budget',
  'Device support',
  'Meal support',
  'Wellness benefits',
  'Other',
] as const;

/** Shared anchor labels for all three 5-point satisfaction ratings. */
export const SATISFACTION_ANCHORS = {
  low: 'Very dissatisfied',
  high: 'Very satisfied',
} as const;

/** FRS defaults. Absent keys have no default — the field starts empty. */
export const SCR001_DEFAULTS = {
  careerSwitcher: 'No',
  willingToRelocate: 'Not sure',
  employmentStatus: 'Employed',
  employmentType: 'Full-time',
  payFrequency: 'Monthly',
  currentWorkArrangement: 'On-site',
  workingHoursPerWeek: 40,
  averageDailyCommuteMinutes: 0,
} as const;

/** Validation bounds, straight from each field's Validation Rules row. */
export const SCR001_LIMITS = {
  careerStageOtherTextMax: 50,
  preferredLocationTextMax: 100,
  currentJobTitleMax: 100,
  workingHoursMin: 1,
  workingHoursMax: 168,
  commuteMinutesMin: 0,
  commuteMinutesMax: 300,
} as const;

export const SCR001_COPY = {
  purpose:
    'Tell us about you — this is reused for every offer you evaluate.',
  requirementNote:
    'Only career stage and preferred work arrangement are required. Everything else is optional, and you can come back to it.',

  sections: {
    personal: 'Personal Career Profile',
    employment: 'Current employment',
  },

  subSections: {
    professional: 'Professional information',
    location: 'Location information',
    preferences: 'Location & work preferences',
    employmentInfo: 'Employment information',
    compensation: 'Compensation',
    benefits: 'Benefits',
    workingConditions: 'Working conditions',
    satisfaction: 'Career satisfaction',
  },

  labels: {
    careerStage: 'Career stage',
    careerSwitcher: 'Career switcher',
    targetFunctionalDomain: 'Target functional domain',
    currentCountry: 'Current country',
    currentCity: 'Current city',
    preferredWorkArrangement: 'Preferred work arrangement',
    preferredWorkLocation: 'Preferred work location',
    preferredCountry: 'Preferred country',
    preferredLocationText: 'Specify preferred work location',
    willingToRelocate: 'Willing to relocate',
    employmentStatus: 'Employment status',
    currentJobTitle: 'Current job title',
    employmentType: 'Employment type',
    currentBaseSalary: 'Current base salary',
    currentCurrency: 'Currency',
    payFrequency: 'Pay frequency',
    currentBenefits: 'Current benefits',
    currentWorkArrangement: 'Current work arrangement',
    workingHoursPerWeek: 'Working hours per week',
    averageDailyCommuteMinutes: 'Average daily commute',
    overallJobSatisfaction: 'Overall job satisfaction',
    careerGrowthSatisfaction: 'Career growth satisfaction',
    workLifeBalanceSatisfaction: 'Work-life balance satisfaction',
  },

  helpText: {
    careerStage:
      'Select the option that best describes your current career stage.',
    careerSwitcher:
      'Are you planning a career switch — moving to a different functional domain or industry?',
    targetFunctionalDomain:
      'Select the functional domain you want to move into.',
    currentCountry: 'Select the country where you currently live and work.',
    currentCity: 'Enter or select the city where you currently live and work.',
    preferredWorkArrangement:
      'Select the work arrangement you prefer for your next role.',
    preferredWorkLocation:
      'Select your preferred work location for your next role.',
    preferredCountry: 'Select the country you would prefer to work in.',
    preferredLocationText: 'Enter the city name you prefer to work in.',
    willingToRelocate:
      'Are you willing to relocate for the right opportunity?',
    employmentStatus: 'Select your current employment status.',
    currentJobTitle:
      'Enter your current job title as it appears in your employment contract.',
    employmentType:
      'Select the employment type that best describes your current role.',
    currentBaseSalary:
      'Enter your current base salary. Do not include bonuses or allowances. Use the pay frequency field to specify whether this is a monthly or annual figure.',
    currentCurrency: 'Select the currency in which your current salary is paid.',
    payFrequency:
      'Select whether the salary you entered is a monthly or annual figure.',
    currentBenefits: 'Select all benefits you currently receive in your job.',
    currentWorkArrangement:
      'Select the work arrangement that best describes your current job.',
    workingHoursPerWeek:
      'Enter the average number of hours you work in a typical week.',
    averageDailyCommuteMinutes:
      'Enter the average total time you spend commuting each workday — to and from work combined.',
    overallJobSatisfaction:
      'Rate your overall satisfaction with your current job.',
    careerGrowthSatisfaction:
      'Rate your satisfaction with your current career growth opportunities.',
    workLifeBalanceSatisfaction:
      'Rate your satisfaction with your current work-life balance.',
  },
} as const;
