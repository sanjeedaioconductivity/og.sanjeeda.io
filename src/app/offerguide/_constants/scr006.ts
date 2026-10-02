/**
 * SCR-006 Work & Life — 12 fields, 0 required, 2 conditional, 2 sections.
 *
 * Every value cross-checked against the `OgQuestions` seed, which is what
 * `validateEnumField` rejects writes against — the FRS prose and the seed agree
 * on all 12 fields here.
 *
 * Two fields are HIDDEN (not dimmed) when offer_work_arrangement = Remote:
 * offer_commute_minutes and offer_wfh_support. The FRS is internally split on
 * this — §5 says "dimmed with conditional pill", §9 says "Dimmed... Hidden when
 * Remote" — but handoff §3 says hidden outright, and that matches the SCR-004
 * precedent the PO already ruled on in Sprint 6. Hidden it is.
 */

export const WEEKEND_WORK = [
  'Never',
  'Rarely',
  'Sometimes',
  'Often',
  'Alternate',
  'Not clear',
] as const;

export const TRAVEL_REQUIREMENT = [
  'None',
  'Occasional',
  'Frequent',
  'Not clear',
] as const;

export const HYBRID_DAYS = [
  'Not applicable',
  '1 day',
  '2-3 days',
  '4+ days',
  'Flexible',
  'Not clear',
] as const;

export const TIME_FLEXIBILITY = ['Low', 'Medium', 'High', 'Not clear'] as const;

export const WFH_SUPPORT = [
  'Not offered',
  'Sometimes',
  'Fully supported',
  'Not clear',
] as const;

export const OVERTIME_COMPENSATION = ['Yes', 'No', 'Not clear'] as const;

export const AFTER_HOURS_AVAILABILITY = [
  'Rarely',
  'Sometimes',
  'Often',
  'Always',
  'Not clear',
] as const;

export const LEAVE_FLEXIBILITY = ['Low', 'Medium', 'High', 'Not clear'] as const;

export const PERSONAL_ENERGY = [
  'Energizing',
  'Manageable',
  'Tiring',
  'Not sure',
] as const;

export const WORKLIFE_IMPORTANCE = ['Low', 'Medium', 'High'] as const;

/**
 * Energy fit colour coding (FRS §5 + §9): Energizing green, Tiring amber.
 * `Manageable` and `Not sure` stay neutral — only the two poles are coded.
 */
export const ENERGY_POSITIVE_VALUES: readonly string[] = ['Energizing'];
export const ENERGY_WARNING_VALUES: readonly string[] = ['Tiring'];

export const SCR006_DEFAULTS = {
  offerWeekendWork: 'Not clear',
  offerTravelRequirement: 'Not clear',
  offerHybridDays: 'Not applicable',
  offerTimeFlexibility: 'Not clear',
  offerWfhSupport: 'Not clear',
  offerOvertimeCompensation: 'Not clear',
  offerAfterHoursAvailability: 'Not clear',
  offerLeaveFlexibility: 'Not clear',
  offerPersonalEnergy: 'Not sure',
  offerWorklifeImportance: 'Medium',
} as const;

export const SCR006_LIMITS = {
  workingHoursMin: 1,
  workingHoursMax: 168,
  commuteMinutesMin: 0,
  commuteMinutesMax: 300,
} as const;

export const SCR006_COPY = {
  purpose: 'How will this role affect your daily life?',
  requirementNote:
    'All fields are optional. Answer based on what was discussed during interviews or stated in the offer. These inputs directly affect your Work-Life fit score.',

  sections: {
    dailyReality: 'Daily reality',
    flexibility: 'Flexibility & fit',
  },

  labels: {
    workingHours: 'Working hours per week',
    weekendWork: 'Weekend work frequency',
    travelRequirement: 'Travel requirement',
    hybridDays: 'Hybrid days per week',
    commuteMinutes: 'Commute time',
    timeFlexibility: 'Time flexibility',
    wfhSupport: 'WFH support',
    overtimeCompensation: 'Overtime compensation',
    afterHoursAvailability: 'After hours availability',
    leaveFlexibility: 'Leave approval flexibility',
    personalEnergy: 'Personal energy fit',
    worklifeImportance: 'Work-life balance importance',
  },

  helpText: {
    workingHours:
      'Enter the average number of hours you are expected to work each week in this role.',
    weekendWork:
      'Select how often you would be expected to work on weekends in this role.',
    travelRequirement:
      'Select how much travel is expected in this role. Occasional means a few times per year. Frequent means regular travel that significantly affects your schedule.',
    hybridDays:
      'Select how many days per week you are expected to work from the office. Select Not applicable if the role is fully on-site or fully remote.',
    commuteMinutes:
      'Enter your estimated daily commute time in minutes (total round trip). Leave blank if you are not sure yet.',
    timeFlexibility:
      'Select how flexible the working hours are in this role. High means you can choose when to start and end your day. Low means fixed hours with no flexibility.',
    wfhSupport:
      'Select the level of work-from-home support for this role. Sometimes means occasional WFH is permitted but not the norm. Fully supported means you can work from home as needed without restriction.',
    overtimeCompensation:
      'Select whether overtime is compensated in this role. Yes means any overtime is paid or offset with time off. No means overtime is expected but not compensated.',
    afterHoursAvailability:
      'Based on what you observed during interviews, how often would you be expected to be available after working hours?',
    leaveFlexibility:
      'Select how flexible the leave approval process appears to be in this role. High means leave is easy to get approved. Low means leave requires significant advance notice or is frequently denied.',
    personalEnergy:
      'Based on everything you know about this role so far — how do you think it will affect your energy levels? Trust your gut feeling here.',
    worklifeImportance:
      'How important is work-life balance to you in this decision? Your answer adjusts how much weight the work-life score carries in your overall fit score.',
  },
} as const;
