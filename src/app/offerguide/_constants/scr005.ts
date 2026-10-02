/**
 * SCR-005 Benefits & Security — 13 fields, 0 required, 1 conditional, 2 sections.
 *
 * The source PDF for this screen is image-only (no text layer) — every value,
 * default and help string below was transcribed by rendering its 32 pages to
 * images and reading them directly, then cross-checked byte-for-byte against
 * the `OgQuestions` seed (seed-offerguide.js), which is the actual source of
 * truth the server validates against. Where the two agree exactly (all 13
 * fields do), the seed is quoted here.
 */

export const HEALTH_COVERAGE = [
  'Self + family',
  'Self',
  'Not clear',
  'Other',
  'None',
] as const;

export const LIFE_INSURANCE = ['Provided', 'Not provided', 'Not clear', 'Other'] as const;

export const RETIREMENT_BENEFITS = [
  'Provided',
  'Partial',
  'Not provided',
  'Not clear',
  'Other',
] as const;

export const SICK_LEAVE = [
  'As needed',
  '15+ days per year',
  '10 days per year',
  '5 days per year',
  'Not clear',
  'Other',
] as const;

export const PARENTAL_LEAVE = [
  'Enhanced',
  'Statutory only',
  'Not applicable',
  'Not clear',
  'Other',
  'None',
] as const;

export const EDUCATION_REIMBURSEMENT = ['Yes', 'Limited', 'No', 'Not clear'] as const;

export const DEVICE_SUPPORT = ['Yes', 'No', 'Not clear', 'Other'] as const;

export const MEAL_SUPPORT = ['Yes', 'Partial', 'No', 'Not clear', 'Other'] as const;

export const WELLNESS_BENEFITS = [
  'Yes',
  'Partial',
  'No',
  'Not clear',
  'Other',
] as const;

export const VISA_SUPPORT = [
  'Provided',
  'Partial',
  'Not applicable',
  'Not clear',
  'Other',
  'Not provided',
] as const;

export const JOB_SECURITY = ['Very secure', 'Somewhat secure', 'Not sure', 'Risky'] as const;

export const RESTRICTIVE_CLAUSE = ['No', 'Not clear', 'Yes'] as const;

/** Amber warning treatment — negative signals, without reading as alarmist. */
export const JOB_SECURITY_WARNING_VALUES: readonly string[] = ['Risky'];
export const RESTRICTIVE_CLAUSE_WARNING_VALUES: readonly string[] = ['Yes'];

export const SCR005_DEFAULTS = {
  offerHealthCoverage: 'Not clear',
  offerLifeInsurance: 'Not clear',
  offerRetirementBenefits: 'Not clear',
  offerSickLeave: 'Not clear',
  offerParentalLeave: 'Not clear',
  offerEducationReimbursement: 'Not clear',
  offerDeviceSupport: 'Not clear',
  offerMealSupport: 'Not clear',
  offerWellnessBenefits: 'Not clear',
  offerVisaSupport: 'Not applicable',
  offerJobSecurity: 'Not sure',
  offerRestrictiveClause: 'Not clear',
} as const;

export const SCR005_LIMITS = {
  annualLeaveDaysMin: 1,
  annualLeaveDaysMax: 365,
  otherTextMax: 100,
} as const;

export const SCR005_COPY = {
  purpose: 'What protections and perks come with this offer?',
  requirementNote:
    'All fields are optional. The more you fill in, the more accurate your benefits score will be. Answer based on what is stated in your offer letter or discussed during interviews.',

  sections: {
    benefits: 'Benefits',
    security: 'Security',
  },

  labels: {
    healthCoverage: 'Health insurance',
    lifeInsurance: 'Life insurance',
    retirementBenefits: 'Provident fund / retirement',
    annualLeaveDays: 'Paid annual leave',
    sickLeave: 'Sick leave',
    parentalLeave: 'Parental leave',
    educationReimbursement: 'Education reimbursement',
    deviceSupport: 'Device support',
    mealSupport: 'Meal support',
    wellnessBenefits: 'Wellness benefits',
    visaSupport: 'Visa sponsorship',
    jobSecurity: 'Job security feeling',
    restrictiveClause: 'Restrictive clause / bond',
  },

  /** Abbreviated visa labels for mobile, per the FRS: "Full values on desktop, abbreviated on mobile." */
  visaSupportShort: {
    Provided: 'Provided',
    Partial: 'Partial',
    'Not applicable': 'N/A',
    'Not clear': 'Not clear',
    Other: 'Other',
    'Not provided': 'Not provided',
  } as Record<string, string>,

  helpText: {
    healthCoverage:
      'Select the health insurance coverage included in your offer. Self means coverage for you only. Self + family means your dependents are also covered.',
    lifeInsurance: 'Select whether life insurance is provided as part of your offer.',
    retirementBenefits:
      'Select whether the offer includes provident fund, gratuity, or retirement plan support. Partial means the employer contributes but not at the full statutory or enhanced level.',
    annualLeaveDays:
      'Enter the number of paid annual leave days stated in your offer letter. If you are not sure, toggle Not clear.',
    sickLeave:
      'Select the sick leave policy as stated in your offer letter or discussed during interviews.',
    parentalLeave:
      'Select the parental leave policy as stated in your offer letter. Statutory only means the company provides only the legally required minimum. Enhanced means the company goes beyond the statutory minimum. Not applicable if this is not relevant to you.',
    educationReimbursement:
      'Select whether the offer includes financial support for education, courses, or certifications. Limited means partial reimbursement or a capped budget.',
    deviceSupport: 'Select whether the company will provide a laptop or work device for this role.',
    mealSupport:
      'Select whether the company provides meal support such as a subsidised canteen, meal vouchers, or free meals. Do not include cash meal allowances here — those belong in the compensation screen.',
    wellnessBenefits:
      'Select whether the offer includes wellness or mental health support — such as gym memberships, therapy sessions, or an employee assistance programme.',
    visaSupport:
      'Select whether the company will sponsor your work visa or permit for this role. This is only relevant if you need a visa to work in the country where this role is based.',
    jobSecurity:
      "Based on your overall impression — how secure does this role feel to you? Consider the company's stability, the role's criticality, and what you picked up during the interview process.",
    restrictiveClause:
      'Does your offer letter include a bond, non-compete clause, or any other restrictive agreement? Yes may limit your ability to change jobs or work for competitors in future. If unsure, check your offer letter or consult a legal advisor.',
  },
} as const;
