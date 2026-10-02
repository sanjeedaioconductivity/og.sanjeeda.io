'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ModuleStepper from './ModuleStepper';
// import SectionStepper, { type SectionStep } from './SectionStepper';
import IntroCard from './IntroCard';
import BottomNav from './BottomNav';
import LanguageSwitcher from './LanguageSwitcher';
import QuickCompareButton from './QuickCompareButton';
import {
  getScreen,
  WIZARD_SCREENS,
  type WizardScreen,
} from '../_constants/screens';
import {
  COMPARE_MODE_COPY,
  nextScreenInMode,
  previousScreenInMode,
  progressLabelForMode,
  QUICK_COMPARE_RESULT_SCREEN,
} from '../_constants/compareMode';
import { useWizardProgress } from '../_state/useWizardProgress';
import { useCompareMode } from '../_state/useCompareMode';

/**
 * The shared wizard chrome for SCR-001 through SCR-005.
 *
 * Built ONCE and reused, per Sprint 6 handoff §2 — not re-implemented per screen.
 * Composes: module stepper (desktop only) → optional sticky slot (CompensationBar
 * on SCR-004) → section mini-stepper → intro card → the screen's fields →
 * bottom nav with the progress label.
 *
 * SCR-000 deliberately does not use this. It sits outside the 10-step flow and has
 * no stepper, no progress label and no Back/Next.
 *
 * Layout follows the handoff's table: two columns on the data-entry screens
 * (SCR-001, 003, 004, 005), a single centred max-width column on SCR-002, which
 * is intentionally a focused onboarding-style screen rather than a data grid.
 * Mobile is always a single full-width column in the same field order.
 *
 * ===================== COMPARE MODE (CR-02 / CR-05) =====================
 *
 * The shell is where Quick Compare lives, because CR-02 wants it on every step
 * and the shell is the one thing every step already renders. Three things change
 * when the mode is `quick`, and NOTHING changes when it is `full` — the default
 * path is byte-for-byte the behaviour it had before:
 *
 *   1. Next skips the four optional screens. The shell passes the quick path's
 *      next screen into the page's own `onNext(target)` — the same parameter a
 *      forward click on the step bar uses — so the page still validates and
 *      saves exactly as it would, and only the destination differs.
 *   2. Back mirrors it, handled here rather than through the page's `onBack`:
 *      that callback is a fixed closure over one screen, so on the quick path it
 *      would walk into a screen the candidate never saw.
 *   3. The progress label counts the quick path ("step 3 of 6").
 *
 * The step bar still lists all ten and still navigates to any of them. Skipping
 * is what the mode does by default, not a wall — CR-03 says any section must be
 * reachable directly, and that holds in both modes.
 */
export default function WizardShell({
  screen,
  introTitle,
  introPurpose,
  introRequirementNote,
  introVariant = 'card',
  // sections,
  // activeSectionIndex = 0,
  // sectionHeading,
  layout = 'two-column',
  stickySlot,
  onBack,
  onNext,
  nextDisabled,
  nextLabel,
  isSubmitting,
  children,
}: {
  screen: WizardScreen;
  introTitle?: string;
  introPurpose: string;
  introRequirementNote?: string;
  /** 'plain' is SCR-002 only — no card border, centred on desktop. */
  introVariant?: 'card' | 'plain';
  /** Omit (or pass fewer than 2) on screens without a mini-stepper. */
  // sections?: SectionStep[];
  activeSectionIndex?: number;
  sectionHeading?: string;
  layout?: 'two-column' | 'single-centered';
  /**
   * Rendered between the module stepper and the section stepper, sticky at every
   * breakpoint. SCR-004's CompensationBar is the only user this sprint.
   */
  stickySlot?: React.ReactNode;
  onBack: () => void;
  /**
   * Save this screen and move on. The Next button calls it with no target
   * (go to the following step); a forward click on the module stepper passes
   * the step the candidate chose, so the same validate → persist sequence runs
   * and only the destination differs.
   */
  onNext: (target?: WizardScreen) => void;
  nextDisabled?: boolean;
  nextLabel?: string;
  isSubmitting?: boolean;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { completed, interestCount, hasScorableOffer } = useWizardProgress();
  const { resolvedMode, isQuick } = useCompareMode();

  /**
   * Preserves `?session=&offer=` across a hop the shell makes on its own — the
   * quick-path Back button and the Quick Compare shortcut. Deliberately reads the
   * URL rather than calling `useWizardContext`: that hook re-resolves the ids
   * against the API on mount, and a third instance of it (the page has one, and
   * useWizardProgress another) would mean a third round of lookups on every step.
   */
  const hrefWithContext = React.useCallback(
    (href: string) => {
      const params = new URLSearchParams();
      for (const key of ['session', 'offer'] as const) {
        const value = searchParams.get(key);
        if (value) params.set(key, value);
      }
      const qs = params.toString();
      return qs ? `${href}?${qs}` : href;
    },
    [searchParams],
  );

  const quickNext = isQuick ? nextScreenInMode(screen.id, resolvedMode) : null;
  const quickBack = isQuick ? previousScreenInMode(screen.id, resolvedMode) : null;
  const modeLabels = progressLabelForMode(screen, resolvedMode);

  // Warm the neighbouring steps' route payloads and page chunks while the
  // candidate is still filling this one in. Every hop is a `router.push` (no
  // <Link>, so nothing prefetches on its own), and on production the RSC fetch
  // was one more serial round trip on top of the API calls behind each
  // "Saving… / Loading…" transition (QA report A3). The bare href is enough:
  // auto prefetches are keyed without search params.
  React.useEffect(() => {
    for (const neighbour of [screen.step, screen.step - 2]) {
      const target = WIZARD_SCREENS[neighbour];
      if (target?.built) router.prefetch(target.href);
    }
  }, [router, screen.step]);

  // On the quick path the neighbours above are often the screens being skipped,
  // so warm the ones the candidate will actually land on instead.
  React.useEffect(() => {
    for (const target of [quickNext, quickBack]) {
      if (target?.built) router.prefetch(target.href);
    }
  }, [router, quickNext, quickBack]);

  /**
   * CR-02 — generate the result now. Routed through the page's own `onNext` with
   * Compare as the target, so the step on screen is validated and saved first
   * exactly as any other forward move; the candidate does not lose what they had
   * half-entered when they reached for the shortcut.
   */
  const runQuickCompare = React.useCallback(() => {
    onNext(getScreen(QUICK_COMPARE_RESULT_SCREEN));
  }, [onNext]);

  /**
   * Hidden on the two result screens. CR-02 asks for the shortcut on every step,
   * and these are where it leads — a "generate my result" button on the result
   * is at best redundant. It would also misfire: SCR-009 and SCR-010 take an
   * `onNext` that ignores its argument, so the click would read as Next on
   * Compare and as FINISH on Results, ending the evaluation. Not a target the
   * word "Quick Compare" prepares anyone for.
   */
  const showQuickCompare =
    screen.id !== 'SCR-009' && screen.id !== 'SCR-010';

  const isTwoColumn = layout === 'two-column';
  // Narrower than before ("too wide, make inputs come closer") — max-w-5xl
  // instead of max-w-6xl for the two-column screens.
  const contentWidth = isTwoColumn ? 'max-w-5xl' : 'max-w-2xl';

  const intro = (
    <IntroCard
      screen={screen}
      title={introTitle}
      purpose={introPurpose}
      requirementNote={introRequirementNote}
      variant={introVariant}
    />
  );

  return (
    // No `min-h-screen`: the wizard is nested inside the portal's nav and footer,
    // so claiming a full viewport just pads the page out. The bottom nav is sticky
    // and sits correctly at the natural content height.
    <div className="flex flex-col">
      {/* Mobile only — desktop gets the switcher inside the stepper's own row
          via `trailingSlot` below, so it isn't a whole extra row above it. */}
      <div className="flex justify-end px-4 pt-3 sm:px-6 md:hidden">
        <LanguageSwitcher />
      </div>

      <ModuleStepper
        currentScreenId={screen.id}
        completed={completed}
        onJump={onNext}
        jumpDisabled={isSubmitting}
        leadingSlot={
          showQuickCompare ? (
            <QuickCompareButton
              interestCount={interestCount}
              hasScorableOffer={hasScorableOffer}
              onRun={runQuickCompare}
              disabled={isSubmitting}
            />
          ) : undefined
        }
        trailingSlot={<LanguageSwitcher />}
      />

      {/* Says which steps are being skipped, so a shorter flow reads as a choice
          the candidate made rather than a wizard that lost four screens. */}
      {isQuick && (
        <p className="border-b border-border bg-primary/5 px-4 py-2 text-[11px] leading-relaxed text-muted-foreground sm:px-6">
          {COMPARE_MODE_COPY.quickNote}
        </p>
      )}

      {stickySlot && (
        <div className="sticky top-0 z-30">{stickySlot}</div>
      )}

      {/* {sections && sections.length > 1 && (
        <SectionStepper
          sections={sections}
          activeIndex={activeSectionIndex}
          heading={sectionHeading}
        />
      )} */}

      <main className="flex-1 px-4 py-4 sm:px-6 sm:py-5">
        <div className={`mx-auto w-full ${contentWidth}`}>
          {isTwoColumn ? (
            // Desktop: intro moves into a right-hand sidebar so the field
            // sections start at the top of the column instead of being pushed
            // down below a full-width intro block. `flex-row-reverse` keeps
            // intro FIRST in DOM — so mobile (`flex-col`, no reverse) still
            // stacks it above the fields — while rendering it on the right once
            // the row direction flips at `lg`.
            <div className="flex flex-col gap-4 lg:flex-row-reverse lg:items-start lg:gap-5">
              <aside className="lg:sticky lg:top-4 lg:w-60 lg:shrink-0">
                {intro}
              </aside>
              <div className="min-w-0 flex-1">{children}</div>
            </div>
          ) : (
            <>
              {intro}
              <div className="mt-4">{children}</div>
            </>
          )}
        </div>
      </main>

      <BottomNav
        screen={screen}
        // On the quick path Back belongs to the shell: the page's own callback
        // targets the screen that precedes it in the full ten, which on this
        // path is one of the four being skipped.
        onBack={quickBack ? () => router.push(hrefWithContext(quickBack.href)) : onBack}
        onNext={() => onNext(quickNext ?? undefined)}
        nextDisabled={nextDisabled}
        nextLabel={nextLabel}
        isSubmitting={isSubmitting}
        progressLabels={modeLabels}
      />
    </div>
  );
}
