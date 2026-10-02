/**
 * Full Compare vs Quick Compare — CR-02 and CR-05.
 *
 * CR-05: "Present Full Compare and Quick Compare as selectable options at the
 *         start of the flow." (Step 1, Candidate Profile.)
 * CR-02: "Introduce a Quick Compare option, accessible from every step. Result
 *         is generated only once the candidate has selected a minimum of three
 *         interests."
 *
 * ============================ WHAT EACH MODE IS ============================
 *
 *   full    all ten screens, in order. Unchanged — this is what the wizard has
 *           always done and it stays the default.
 *   quick   the express lane: Profile → Setup → Offer details → Compensation →
 *           Compare → Report. Four data-entry screens instead of eight.
 *
 * QUICK IS A SHORTER PATH, NOT A DIFFERENT ENGINE. The skipped screens
 * (Benefits, Work & Life, Growth, Culture) are optional everywhere else in the
 * product too, and the scoring engine already scores a partially-answered offer:
 * an unanswered enum lands on ENUM_FALLBACK_SCORE, the neutral 45 anchor used
 * for every "Not sure" answer (see scoring/fieldScore.ts). So a quick result is
 * a real score over real answers, with the unasked categories sitting neutral —
 * not an estimate, and not a second scoring path to keep in step with the first.
 *
 * The four screens that stay are the ones with required fields or the figures the
 * comparison is built from: the profile (career stage, work preference, and the
 * current-job baseline CR-01 compares against), the setup (the interests that
 * weight the score), the offer itself, and its compensation.
 *
 * ===================== WHY THREE INTERESTS GATE THE RESULT =====================
 *
 * The interests picked on SCR-002 ("What matters most to you?") are what
 * `computeCategoryWeights` uses to weight the seven categories. With one
 * interest selected, a quick result is very nearly that one category's score
 * wearing an overall-score label; the fewer answers there are behind it, the
 * more that lopsidedness shows. Three is also the maximum SCR-002 allows, so
 * CR-02's "minimum of three" means all three — the candidate has said everything
 * the screen can ask about what matters to them.
 *
 * A FULL walk-through is NOT gated on three. SCR-002 still accepts one, exactly
 * as before (SCR002_LIMITS.minPriorities); CR-02 puts the requirement on the
 * shortcut, and the shortcut is what this file governs.
 *
 * ============================== WHERE IT LIVES ==============================
 *
 * In `sessionStorage`, not the database and not the URL — see useCompareMode.ts.
 * The mode changes which screens the wizard walks through; it is not an answer
 * about the offer, nothing is scored from it, and no report prints it. Adding a
 * column for it would put a UI preference in the evaluation record, and a query
 * param for it would have to be threaded through every navigate call in the
 * wizard to survive.
 */

import { WIZARD_SCREENS, type WizardScreen, type WizardScreenId } from './screens';

export const COMPARE_MODES = ['full', 'quick'] as const;
export type CompareMode = (typeof COMPARE_MODES)[number];

export const DEFAULT_COMPARE_MODE: CompareMode = 'full';

/** CR-02's gate. Also SCR002_LIMITS.maxPriorities — the whole allowance. */
export const MIN_QUICK_COMPARE_INTERESTS = 3;

/**
 * The quick path, in order. Compare (009) is included and Report (010) is the
 * end, so a quick run still finishes on the same two screens a full run does —
 * the result is the same screen, reached sooner.
 */
export const QUICK_COMPARE_PATH: readonly WizardScreenId[] = [
  'SCR-001',
  'SCR-002',
  'SCR-003',
  'SCR-004',
  'SCR-009',
  'SCR-010',
];

/** Where "generate my result now" lands, from anywhere in the wizard. */
export const QUICK_COMPARE_RESULT_SCREEN: WizardScreenId = 'SCR-009';

export function isCompareMode(value: unknown): value is CompareMode {
  return typeof value === 'string' && (COMPARE_MODES as readonly string[]).includes(value);
}

/** Screens the given mode walks through, in order. */
export function screensForMode(mode: CompareMode): WizardScreen[] {
  if (mode === 'full') return WIZARD_SCREENS;
  return QUICK_COMPARE_PATH.map(
    (id) => WIZARD_SCREENS.find((screen) => screen.id === id)!,
  );
}

/**
 * The next screen in the mode's path, or null at the end of it.
 *
 * Falls back to the plain next step when the current screen is not on the quick
 * path at all — a candidate who switched to quick while standing on Culture, or
 * who reached a skipped screen by URL, must still be able to move forward.
 */
export function nextScreenInMode(
  currentId: WizardScreenId,
  mode: CompareMode,
): WizardScreen | null {
  const path = screensForMode(mode);
  const index = path.findIndex((screen) => screen.id === currentId);
  if (index === -1) {
    // Off-path: hand back the first path screen that sits after this one.
    const currentStep = WIZARD_SCREENS.find((s) => s.id === currentId)?.step ?? 0;
    return path.find((screen) => screen.step > currentStep) ?? null;
  }
  return path[index + 1] ?? null;
}

/** The previous screen in the mode's path, or null at the start of it. */
export function previousScreenInMode(
  currentId: WizardScreenId,
  mode: CompareMode,
): WizardScreen | null {
  const path = screensForMode(mode);
  const index = path.findIndex((screen) => screen.id === currentId);
  if (index === -1) {
    const currentStep = WIZARD_SCREENS.find((s) => s.id === currentId)?.step ?? 0;
    return [...path].reverse().find((screen) => screen.step < currentStep) ?? null;
  }
  return index > 0 ? path[index - 1] : null;
}

/** Progress label for a quick run — "Step 3 of 6", not "Screen 3 of 10". */
export function progressLabelForMode(
  screen: WizardScreen,
  mode: CompareMode,
): { desktop: string; mobile: string } | null {
  if (mode === 'full') return null;
  const path = screensForMode(mode);
  const index = path.findIndex((s) => s.id === screen.id);
  // Off-path screens keep the standard 10-step label; a "step 0 of 6" would be
  // worse than the honest full-flow position.
  if (index === -1) return null;
  const position = index + 1;
  return {
    desktop: `Quick Compare · step ${position} of ${path.length} · ${screen.title}`,
    mobile: `${position} of ${path.length}`,
  };
}

export const COMPARE_MODE_COPY = {
  /** CR-05 — the picker at the top of SCR-001. */
  picker: {
    label: 'How do you want to evaluate?',
    help: 'Full Compare walks through all ten steps for the most accurate fit score. Quick Compare asks only for your profile, what matters to you, the offer and its pay, then generates a result. You can switch at any time, and nothing you have already entered is lost.',
    options: {
      full: {
        title: 'Full Compare',
        description: 'All 10 steps. The most accurate fit score.',
      },
      quick: {
        title: 'Quick Compare',
        description: 'Four steps to a result. Add the rest later.',
      },
    },
  },

  /** CR-02 — the shortcut in the wizard chrome, on every step. */
  action: {
    label: 'Quick Compare',
    /** Ready — the gate is satisfied. */
    title: 'Generate your result now from what you have entered so far',
    /** Blocked — fewer than three interests on the session. */
    blockedTitle:
      'Select all 3 of your interests on the evaluation setup step to generate a result',
    blockedToast:
      'Quick Compare needs 3 interests selected. Pick what matters most to you on the setup step, then try again.',
    /** Blocked — no offer to score yet. */
    noOfferToast:
      'Add the offer and its compensation first — Quick Compare needs an offer to score.',
  },

  /** Shown on the quick path so a candidate knows steps were skipped, not lost. */
  quickNote:
    'Quick Compare is on, so the Benefits, Work & Life, Growth and Culture steps are skipped. Those categories score as neutral until you answer them — switch to Full Compare on the profile step, or use the step bar to visit any of them.',
} as const;
