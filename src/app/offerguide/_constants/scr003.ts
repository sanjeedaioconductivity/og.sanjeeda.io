/**
 * SCR-003 Offer Details — 11 fields, 2 required, 1 conditional.
 *
 * Seven fields (company name, job title, department/function, employment type,
 * work arrangement, offer country, offer city) carry over their data shape from
 * SCR-001, just flipped from "current" to "offered". Only what changed per the
 * SCR-003 Product Dictionary is repeated here — allowed values for the carried
 * fields are the SAME lists as SCR-001, imported from there rather than
 * retyped, so the two screens can never drift apart.
 *
 * Every enum value below matches the `OgQuestions` seed exactly — verified
 * directly against seed-offerguide.js — so a PATCH to /offers/* never 400s on a
 * value this file sends.
 */

import {
  CURRENT_WORK_ARRANGEMENTS,
  EMPLOYMENT_TYPES,
} from './scr001';

/** offer_work_arrangement reuses SCR-001's current_work_arrangement list. */
export const OFFER_WORK_ARRANGEMENTS = CURRENT_WORK_ARRANGEMENTS;

/** offer_employment_type reuses SCR-001's employment_type list, values unchanged. */
export const OFFER_EMPLOYMENT_TYPES = EMPLOYMENT_TYPES;

export const CONTRACT_DURATIONS = [
  'Not applicable',
  '3 months',
  '6 months',
  '1 year',
  '2+ years',
  'Other',
] as const;

export const PROBATION_PERIODS = [
  'No probation',
  '1 month',
  '3 months',
  '6 months',
  'Not clear',
  'Other',
] as const;

export const REPORTING_LEVELS = [
  'Team Lead',
  'Manager',
  'Senior Manager',
  'Director',
  'VP',
  'C-Suite',
  'Founder',
  'Other',
] as const;

export const SCR003_DEFAULTS = {
  offerEmploymentType: 'Full-time',
  offerWorkArrangement: 'On-site',
  offerContractDuration: 'Not applicable',
  offerProbation: 'Not clear',
} as const;

export const SCR003_LIMITS = {
  companyNameMax: 100,
  jobTitleMax: 100,
  functionalDomainMax: 100,
  contractDurationOtherMax: 50,
  probationOtherMax: 50,
  reportingLevelOtherMax: 100,
} as const;

/**
 * Employment types that activate contract duration. Field stays rendered and
 * dimmed outside this set — never unmounted (SCR-003 FRS §5 + §8, restated in the
 * Sprint 6 DoD: "Contract duration renders dimmed rather than unmounted").
 */
export const CONTRACT_DURATION_TRIGGER: readonly string[] = [
  'Contract',
  'Temporary',
];

export const SCR003_COPY = {
  purpose: 'Tell us about the offer',
  requirementNote:
    'Enter the basic details from your offer letter. Employment type and work arrangement are required. All other fields are optional.',

  sections: {
    identity: 'Offer identity',
    logistics: 'Location & logistics',
  },

  labels: {
    companyName: 'Company name',
    jobTitle: 'Job title',
    functionalDomain: 'Department / function',
    receivedDate: 'Offer received date',
    employmentType: 'Employment type',
    country: 'Offer country',
    city: 'Offer city',
    workArrangement: 'Work arrangement',
    contractDuration: 'Contract duration',
    probation: 'Probation period',
    reportingLevel: 'Reporting level',
  },

  helpText: {
    companyName: 'Enter the name of the company making this offer.',
    jobTitle: 'Enter the title of the role being offered.',
    functionalDomain: 'Enter the department or function stated in the offer letter.',
    receivedDate:
      'Enter the date you received this offer. This helps OfferGuide provide context in your report and track your evaluation timeline.',
    employmentType: 'Select the employment type offered in this role.',
    country: 'Select the country where this role is based.',
    city: 'Select the city where this role is based.',
    workArrangement: 'Select the work arrangement being offered for this role.',
    contractDuration: 'Select the duration of the contract as stated in your offer letter.',
    probation:
      'Select the probation period as stated in your offer letter. If you are unsure or it was not mentioned, select Not clear.',
    reportingLevel:
      'Select the level of the person you will report to in this role. This helps OfferGuide assess how close you will be to leadership and decision-making.',
  },
} as const;
