'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Check } from 'lucide-react';
import {
  WIZARD_SCREENS,
  type WizardScreen,
  type WizardScreenId,
} from '../_constants/screens';

/**
 * The 10-step module stepper.
 *
 * SHOWN AT EVERY BREAKPOINT. It was desktop-only through Sprint 6-10 (handoff §2,
 * repeated in each FRS §9), with mobile getting only the "4 of 10" count in the
 * bottom nav. CR-03 (prototype change request log, 27 Aug 2026) makes the step
 * indicators clickable tabs that reach any section directly "without pressing
 * Back" — a requirement a hidden nav cannot meet on the device most candidates
 * use. Mobile therefore renders the same row, scrolled horizontally, with the
 * numbered circles only; `stepperLabel` appears from `md` up where there is room
 * for ten of them. Same controls, same rules, less text.
 *
 * Every built step except the current one is a navigation control, so a
 * candidate who wants Compensation clicks "Comp" instead of pressing Next (or
 * Back) five times. The two directions differ in what they do first:
 *
 *   - BACK is a plain link, exactly like the Back button: nothing is validated
 *     or saved, because going back is often "I can't finish this step yet".
 *   - FORWARD goes through `onJump`, which the shell wires to the screen's own
 *     Next handler with the clicked step as the destination. That keeps the
 *     validate → persist → navigate sequence a forward move has always had;
 *     the only thing that changes is where the candidate lands afterwards.
 *
 * Jumping past a step whose data does not exist yet is safe: every screen
 * redirects to the step that creates its missing session/offer, so a fresh
 * candidate clicking "Report" from Profile ends up on Setup, not on a 404.
 *
 * Direction and completion are separate things. Which side of the current
 * step a step sits on decides link-or-button; whether it gets a green tick is
 * `completed`, read from what has actually been saved (useWizardProgress).
 * A step the candidate jumped over stays a plain number even though it is
 * behind them, and a step they finished earlier keeps its tick even when they
 * have gone back in front of it.
 *
 * The back links carry the current `?session=&offer=` so the target step edits
 * the same offer rather than re-resolving it; a bare href would still work (the
 * context hook infers the latest session/offer) but this keeps a reload of the
 * target step exact. Prefetching is off — nine links at once is a burst the
 * wizard's cold API doesn't need, and WizardShell already warms the next step.
 *
 * `trailingSlot` rides at the right end of this same row — WizardShell puts the
 * language switcher there on desktop so it shares the stepper's row instead of
 * sitting in a row of its own above it. It stays hidden below `md`, where
 * WizardShell renders its own switcher row and the row here needs every pixel
 * for the ten steps.
 */
export default function ModuleStepper({
  currentScreenId,
  completed,
  onJump,
  jumpDisabled = false,
  leadingSlot,
  trailingSlot,
}: {
  currentScreenId: WizardScreenId;
  /** Steps that have been saved; null while that is still being read. */
  completed: ReadonlySet<WizardScreenId> | null;
  /** Forward navigation. Omit to make the later steps display only. */
  onJump?: (target: WizardScreen) => void;
  /** True while the screen is saving — a second jump mid-save would double-submit. */
  jumpDisabled?: boolean;
  /**
   * Rendered before the steps at every breakpoint — WizardShell puts the Quick
   * Compare button here. Unlike `trailingSlot` it stays visible on mobile: CR-02
   * asks for the shortcut on every step, which has to include phones.
   */
  leadingSlot?: ReactNode;
  /** Rendered at the right end of the row, e.g. the language switcher. */
  trailingSlot?: ReactNode;
}) {
  const searchParams = useSearchParams();
  const currentStep =
    WIZARD_SCREENS.find((s) => s.id === currentScreenId)?.step ?? 1;

  const context = new URLSearchParams();
  for (const key of ['session', 'offer'] as const) {
    const value = searchParams.get(key);
    if (value) context.set(key, value);
  }
  const qs = context.toString();
  const hrefWithContext = (href: string) => (qs ? `${href}?${qs}` : href);

  return (
    <nav
      aria-label="Wizard progress"
      className="border-b border-border bg-card/50 px-4 py-2.5 sm:px-6 md:py-3"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 md:gap-3">
        {leadingSlot}
        {/* `-mx-1 px-1` keeps the first and last pill's focus ring from being
            clipped by the scroll container on mobile. */}
        <ol className="-mx-1 flex items-center gap-1 overflow-x-auto px-1 text-xs font-sans font-bold [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {WIZARD_SCREENS.map((screen, index) => {
            const isCurrent = screen.step === currentStep;
            const isBehind = screen.step < currentStep;
            const isAhead = screen.step > currentStep;
            const isDone = !isCurrent && (completed?.has(screen.id) ?? false);

            const stepClass = [
              'flex items-center gap-1.5 rounded-full px-1.5 py-1 text-xs md:px-2',
              isCurrent
                ? 'font-semibold text-primary dark:text-white'
                : isDone
                  ? 'text-success'
                  : 'text-muted-foreground',
            ].join(' ');

            const hoverClass = isDone
              ? 'hover:bg-success/10'
              : 'hover:bg-muted hover:text-foreground';

            const focusClass =
              'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

            const stepContent = (
              <>
                <span
                  className={[
                    'flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold',
                    isCurrent
                      ? 'bg-primary text-primary-foreground'
                      : isDone
                        ? 'bg-success text-success-foreground'
                        : 'border border-border text-muted-foreground',
                  ].join(' ')}
                >
                  {isDone ? (
                    <Check className="h-3 w-3" aria-hidden="true" />
                  ) : (
                    screen.step
                  )}
                </span>
                {/* Labels would not fit ten abreast on a phone; the numbered
                    circle carries the step there and the title is still in the
                    button's `title` attribute. */}
                <span className="hidden md:inline">{screen.stepperLabel}</span>
              </>
            );

            let step: ReactNode;
            if (isBehind && screen.built) {
              step = (
                <Link
                  href={hrefWithContext(screen.href)}
                  prefetch={false}
                  className={`${stepClass} ${focusClass} ${hoverClass}`}
                  title={`Go back to ${screen.title}`}
                >
                  {stepContent}
                </Link>
              );
            } else if (isAhead && screen.built && onJump) {
              step = (
                <button
                  type="button"
                  onClick={() => onJump(screen)}
                  disabled={jumpDisabled}
                  className={`${stepClass} ${focusClass} ${hoverClass} disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent`}
                  title={`Go to ${screen.title}`}
                >
                  {stepContent}
                </button>
              );
            } else {
              step = (
                <span
                  className={stepClass}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  {stepContent}
                </span>
              );
            }

            return (
              <li key={screen.id} className="flex shrink-0 items-center gap-1">
                {step}
                {index < WIZARD_SCREENS.length - 1 && (
                  <span
                    className="hidden text-muted-foreground/50 md:inline"
                    aria-hidden="true"
                  >
                    ›
                  </span>
                )}
              </li>
            );
          })}
        </ol>
        {trailingSlot && (
          <div className="hidden shrink-0 md:block">{trailingSlot}</div>
        )}
      </div>
    </nav>
  );
}
