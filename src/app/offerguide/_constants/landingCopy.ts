/**
 * SCR-000 Landing — content inventory.
 *
 * Every string below is transcribed VERBATIM from OG_SCR000_Landing_FRS_v1_0 §6.
 * The handoff is explicit: "All copy is specified in FRS §6 — use it verbatim."
 * Do not reword, re-punctuate, or "improve" these — the em dashes, the curly
 * apostrophes and the candidate-side framing are all deliberate. SCR-000 has
 * zero input fields; this file is the whole screen.
 */

export const LANDING_PRODUCT_NAME = 'OfferGuide';

export const LANDING_HERO = {
  headline: 'Understand how well an offer fits your needs before you say yes.',
  subHeadline:
    "— Scores a job offer across seven things that shape your life — salary, benefits, stability, work-life, growth, culture, purpose — and shows you where it's strong and where to push back.",
  /** First visit. */
  ctaFirstVisit: 'Start your evaluation',
  /** An evaluation is already in progress (saved WizardDraft). */
  ctaResume: 'Continue where you left off',
  /** Secondary line under the resume CTA — a fresh session for a new offer. */
  ctaStartNewLead: 'Evaluating a different offer?',
  ctaStartNew: 'Start a new evaluation',
  timeHint: 'Takes 5–10 minutes per offer. No account needed.',
} as const;

export const LANDING_HOW_IT_WORKS = [
  {
    step: 1,
    title: 'Tell us about you',
    description:
      "Your career stage, what you do now, and what you're looking for — filled once, reused for every offer you evaluate.",
  },
  {
    step: 2,
    title: 'Add the offer details',
    description:
      'The facts from your offer letter — salary, benefits, hours, growth, and the things you picked up in interviews.',
  },
  {
    step: 3,
    title: 'Set your priorities',
    description:
      'Choose what matters most to you. Your priorities change how the offer is scored, so the result reflects your life, not an average.',
  },
  {
    step: 4,
    title: 'Get decision guidance',
    description:
      'A fit score across seven categories, the watch-outs worth checking, and specific questions to ask before you accept.',
  },
] as const;

export const LANDING_WHO_ITS_FOR = {
  /** Core differentiator and trust signal — FRS §5 requires this on screen, not in a footer. */
  positioningStatement:
    "Built for candidates. No employer sees your answers, and there's no HR dashboard — this is your side of the table.",
  useCases: [
    "Built for candidates.",
    'No employer sees your answers',
    'No HR dashboard',"Weighing a single offer and unsure whether it's actually good",
    'Comparing two or more offers against each other',
    'Deciding on a promotion, an internal transfer, or a counteroffer',
  ],
} as const;

export const LANDING_WHAT_YOU_GET = [
  {
    title: 'An overall fit score',
    description:
      'Every offer scored out of 100 across seven categories, weighted by what you said matters most.',
  },
  {
    title: 'Watch-outs before you sign',
    description:
      'Specific risks flagged from your answers — unclear overtime, restrictive clauses, variable bonuses, and interview red flags.',
  },
  {
    title: 'Questions worth asking',
    description:
      'Suggested next steps and negotiation points, based on where the offer scored weakest.',
  },
] as const;

export const LANDING_PRIVACY_STRIP =
  'Your answers are private. Community insights are built from anonymised patterns only — never from personal identities — and improve as more offers are added.';

export const LANDING_FOOTER_DISCLAIMER =
  'This is decision guidance, not a final decision. You choose what fits your life and career.';

/** Section headings. Not field copy, so these are ours — the FRS names the sections in §4. */
export const LANDING_SECTION_HEADINGS = {
  howItWorks: 'How it works',
  whoItsFor: "Who it's for",
  whatYouGet: 'What you get',
} as const;
