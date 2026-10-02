/**
 * The 10-step OfferGuide wizard.
 *
 * SCR-000 is deliberately absent: it sits outside the flow, so SCR-001 is still
 * "Step 1 of 10" (SCR-000 FRS §5, Sprint 6 handoff §3).
 *
 * Steps 6-10 are declared here but not built until Sprint 7 — the module stepper
 * has to render all ten from SCR-001 onward, so it needs their labels now.
 * `built: false` is what keeps navigation from routing into a page that
 * doesn't exist yet.
 */

export type WizardScreenId =
  | 'SCR-001'
  | 'SCR-002'
  | 'SCR-003'
  | 'SCR-004'
  | 'SCR-005'
  | 'SCR-006'
  | 'SCR-007'
  | 'SCR-008'
  | 'SCR-009'
  | 'SCR-010';

export type WizardScreen = {
  id: WizardScreenId;
  /** 1-based position in the 10-step flow. */
  step: number;
  /** Short label for the desktop module stepper. */
  stepperLabel: string;
  /** Full name used in the desktop progress label, verbatim from each FRS §9. */
  title: string;
  href: string;
  built: boolean;
};

export const TOTAL_STEPS = 10;

export const WIZARD_SCREENS: WizardScreen[] = [
  { id: 'SCR-001', step: 1, stepperLabel: 'Profile', title: 'Candidate Profile', href: '/offerguide/wizard/profile', built: true },
  { id: 'SCR-002', step: 2, stepperLabel: 'Setup', title: 'Evaluation setup', href: '/offerguide/wizard/setup', built: true },
  { id: 'SCR-003', step: 3, stepperLabel: 'Offer', title: 'Offer details', href: '/offerguide/wizard/offer', built: true },
  { id: 'SCR-004', step: 4, stepperLabel: 'Comp', title: 'Compensation', href: '/offerguide/wizard/compensation', built: true },
  { id: 'SCR-005', step: 5, stepperLabel: 'Benefits', title: 'Benefits & Security', href: '/offerguide/wizard/benefits', built: true },
  { id: 'SCR-006', step: 6, stepperLabel: 'Work', title: 'Work & Life', href: '/offerguide/wizard/work-life', built: true },
  { id: 'SCR-007', step: 7, stepperLabel: 'Growth', title: 'Growth', href: '/offerguide/wizard/growth', built: true },
  { id: 'SCR-008', step: 8, stepperLabel: 'Culture', title: 'Culture & Manager', href: '/offerguide/wizard/culture', built: true },
  { id: 'SCR-009', step: 9, stepperLabel: 'Compare', title: 'Compare', href: '/offerguide/wizard/compare', built: true },
  { id: 'SCR-010', step: 10, stepperLabel: 'Report', title: 'Results', href: '/offerguide/wizard/results', built: true },
];

export const FIRST_SCREEN = WIZARD_SCREENS[0];

export function getScreen(id: WizardScreenId): WizardScreen {
  const screen = WIZARD_SCREENS.find((s) => s.id === id);
  if (!screen) throw new Error(`Unknown wizard screen: ${id}`);
  return screen;
}

/**
 * Where a saved draft should resume. Falls back to SCR-001 for anything we can't
 * route to — an unknown id, or a Sprint 7 screen a draft may point at once those
 * ship. The SCR-000 CTA must never dead-end, so this never returns null.
 */
export function resumeHrefFor(currentScreen: string | null | undefined): string {
  const screen = WIZARD_SCREENS.find((s) => s.id === currentScreen);
  return screen?.built ? screen.href : FIRST_SCREEN.href;
}

/** Desktop progress label — "Screen 4 of 10 · Compensation". */
export function progressLabelDesktop(screen: WizardScreen): string {
  return `Screen ${screen.step} of ${TOTAL_STEPS} · ${screen.title}`;
}

/** Mobile progress label — "4 of 10". */
export function progressLabelMobile(screen: WizardScreen): string {
  return `${screen.step} of ${TOTAL_STEPS}`;
}
