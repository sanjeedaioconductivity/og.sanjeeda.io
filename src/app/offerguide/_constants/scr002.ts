/**
 * SCR-002 Evaluation Setup — 3 fields, all required.
 *
 * Session-level configuration: captured once per evaluation session and applied to
 * every offer in it. Not repeated when a second or third offer is added.
 *
 * Values transcribed from the OG_SCR002 Product Dictionary. Note the priority list
 * includes **Commute** and does not include "Security" — the comment on
 * `evaluation_priorities` in schema.prisma has drifted and lists the wrong set. The
 * FRS is authoritative; the column is JSON so nothing needs migrating.
 */

export const EVALUATION_OFFER_COUNTS = ['One offer', 'Multiple offers'] as const;

export const EVALUATION_TYPES = [
  'New job offer',
  'Promotion offer',
  'Internal transfer',
  'Counteroffer',
] as const;

export const EVALUATION_PRIORITIES = [
  'Salary',
  'Growth',
  'Stability',
  'Flexibility',
  'Benefits',
  'Culture',
  'Commute',
  'Purpose',
  'Other',
] as const;

export const SCR002_DEFAULTS = {
  evaluationOfferCount: 'One offer',
  evaluationType: 'New job offer',
} as const;

export const SCR002_LIMITS = {
  minPriorities: 1,
  maxPriorities: 3,
  priorityOtherTextMax: 50,
} as const;

export const SCR002_COPY = {
  purpose: 'Tell us about this evaluation',
  requirementNote:
    'These three quick questions personalise your fit score and recommendations. Your answers apply to all offers in this session.',

  labels: {
    evaluationOfferCount: 'Number of offers',
    evaluationType: 'What are you evaluating?',
    evaluationPriorities: 'What matters most to you?',
  },

  helpText: {
    evaluationOfferCount:
      'Select "One offer" if you have received a single offer you want to evaluate. Select "Multiple offers" if you are comparing two or more offers side by side.',
    evaluationType:
      'Select the option that best describes what you are evaluating today. This helps OfferGuide provide guidance that is relevant to your specific situation.',
    evaluationPriorities:
      'Select up to 3 things that matter most to you in this decision. Your selections directly influence how your offer fit score is calculated. If none of the options match, select Other and describe what matters most to you.',
  },

  /**
   * Shown when a session already exists. Priority editing mid-session is deferred
   * (FRS §8 backlog), and the handoff says to build no edit path back into this
   * screen once the session has started — so the fields lock rather than silently
   * creating a second session.
   */
  lockedNote:
    'Your evaluation is already set up. These answers apply to every offer in this session and cannot be changed here.',
} as const;
