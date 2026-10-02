/**
 * SCR-007 Growth — 12 fields, all optional, 0 conditional, 2 sections.
 *
 * Values cross-checked against the `OgQuestions` seed. Note the seed stores
 * options in scoring order (best first), not display order — the arrays here are
 * in FRS *display* order, which is what the candidate reads. Both contain the
 * same set, so `validateEnumField` accepts either ordering.
 *
 * Four fields are 1-5 numeric ratings (goal match, brand value, skill potential,
 * growth importance) — Radio Cards with anchor labels, never stars.
 */

export const LEARNING_BUDGET = ['Yes', 'No', 'Not clear', 'Other'] as const;

export const TRAINING_SUPPORT = [
  'Strong',
  'Moderate',
  'Limited',
  'None',
  'Not clear',
] as const;

export const PROMOTION_PATH = ['Yes', 'Somewhat', 'No', 'Not clear'] as const;

export const MENTORSHIP = ['Yes', 'Somewhat', 'No', 'Not clear'] as const;

export const STRONG_LEADERS = ['Yes', 'Somewhat', 'No', 'Not clear'] as const;

export const INTERNAL_MOBILITY = ['Yes', 'Somewhat', 'No', 'Not clear'] as const;

export const ROLE_SCOPE = [
  'Narrow',
  'Balanced',
  'High ownership',
  'Not clear',
] as const;

export const PROMOTION_TIMELINE = [
  '3-6 months',
  '6-12 months',
  '12-18 months',
  '18+ months',
  'Not clear',
  'Other',
] as const;

/** Anchor labels for the four 1-5 rating scales on this screen. */
export const GROWTH_ANCHORS = {
  goalMatch: { low: 'Not aligned', high: 'Perfectly aligned' },
  brandValue: { low: 'Little value', high: 'Major value' },
  skillPotential: { low: 'Little growth', high: 'Significant growth' },
  growthImportance: { low: 'Not important', high: 'Very important' },
} as const;

export const SCR007_DEFAULTS = {
  offerLearningBudget: 'Not clear',
  offerTrainingSupport: 'Not clear',
  offerBrandValue: 3,
  offerSkillPotential: 3,
  offerGoalMatch: 3,
  offerPromotionPath: 'Not clear',
  offerMentorship: 'Not clear',
  offerStrongLeaders: 'Not clear',
  offerInternalMobility: 'Not clear',
  offerRoleScope: 'Not clear',
  offerPromotionTimeline: 'Not clear',
  offerGrowthImportance: 3,
} as const;

export const SCR007_LIMITS = {
  otherTextMax: 100,
} as const;

export const SCR007_COPY = {
  purpose: 'What will this role do for your career?',
  requirementNote:
    'All fields are optional. Answer based on the offer letter, the job description, and what came up during interviews. These inputs shape your Growth score.',

  sections: {
    learning: 'Learning & development',
    progression: 'Career progression',
  },

  labels: {
    learningBudget: 'Learning budget',
    trainingSupport: 'Training support',
    brandValue: 'Company brand value',
    skillPotential: 'Skill growth potential',
    goalMatch: 'Career goal match',
    promotionPath: 'Clear promotion path',
    mentorship: 'Mentorship available',
    strongLeaders: 'Strong leaders to learn from',
    internalMobility: 'Internal mobility',
    roleScope: 'Role scope',
    promotionTimeline: 'Expected promotion timeline',
    growthImportance: 'Career growth importance',
  },

  helpText: {
    learningBudget:
      'Select whether the offer includes a budget for courses, certifications, or conferences.',
    trainingSupport:
      'Select the level of structured training and development support offered in this role.',
    brandValue:
      "Rate how much this company's name on your CV would help your future career. 1 = little value, 5 = major value.",
    skillPotential:
      'Rate how much you expect to grow your skills in this role. 1 = little growth, 5 = significant growth.',
    goalMatch:
      'Rate how well this role aligns with your long-term career goals. 1 = not aligned, 5 = perfectly aligned.',
    promotionPath:
      'Select whether a clear path to promotion was described for this role.',
    mentorship:
      'Select whether mentorship or coaching is available in this role.',
    strongLeaders:
      'Select whether you would have strong, experienced leaders to learn from in this role.',
    internalMobility:
      'Select whether the company supports moving between teams or functions internally.',
    roleScope:
      'Select how much ownership this role carries. High ownership means you drive decisions end to end. Narrow means a tightly defined scope.',
    promotionTimeline:
      'Select the timeline for promotion or role progression as discussed during interviews.',
    growthImportance:
      'How important is career growth to you in this decision? Your answer adjusts how much weight the growth score carries in your overall fit score.',
  },
} as const;
