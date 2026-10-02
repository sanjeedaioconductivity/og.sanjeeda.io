'use client';

import { TOTAL_STEPS, type WizardScreen } from '../_constants/screens';
import { screensForMode } from '../_constants/compareMode';
import { useCompareMode } from '../_state/useCompareMode';
import { useT } from '../_i18n/LocaleProvider';

/**
 * Intro card — step badge, screen title, one-line purpose.
 *
 * Present on SCR-001 onward (never on SCR-000, which sits outside the flow).
 * Each FRS §9 says the same thing: "Step badge (Step N of 10), screen title,
 * one-line purpose", and SCR-004/005 add "States which fields are required."
 *
 * `requirementNote` carries that last part and must state the requirement
 * honestly — "All fields are optional" on SCR-005, the named required fields
 * elsewhere. It is the candidate's only up-front signal about what blocks Next.
 *
 * The badge counts the path actually being walked: "Step 2 of 10" in full mode,
 * "Step 2 of 6" on Quick Compare (CR-02/CR-05). The bottom nav says the same
 * thing at the same time — two step counters disagreeing on the same screen is
 * the kind of detail that makes a candidate distrust the rest of the numbers.
 * A screen the quick path skips, reached from the step bar, keeps the honest
 * 10-step count rather than claiming a position on a path it is not on.
 */
export default function IntroCard({
  screen,
  title,
  purpose,
  requirementNote,
  variant = 'card',
}: {
  screen: WizardScreen;
  /** Defaults to the screen's FRS title. */
  title?: string;
  purpose: string;
  requirementNote?: string;
  /**
   * SCR-002 is the odd one out. Its FRS §9 asks for a centred intro block with
   * "No card border — this screen intentionally differs from the data-entry
   * screens", separated from the fields by a single hairline divider. Every other
   * screen uses the bordered card.
   */
  variant?: 'card' | 'plain';
}) {
  const t = useT();
  const { resolvedMode } = useCompareMode();

  // Position within the mode's own path, falling back to the ten-step position
  // for a screen that path skips.
  const path = screensForMode(resolvedMode);
  const indexInPath = path.findIndex((s) => s.id === screen.id);
  const stepNumber = indexInPath === -1 ? screen.step : indexInPath + 1;
  const stepTotal = indexInPath === -1 ? TOTAL_STEPS : path.length;

  if (variant === 'plain') {
    return (
      <section className="border-b border-border pb-4 text-left sm:text-center">
        <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-foreground">
          Step {stepNumber} of {stepTotal} — {title ?? screen.title}
        </span>
        <h1 dir="auto" className="mt-2 text-lg font-semibold tracking-tight dark:text-white">
          {t(purpose)}
        </h1>
        {requirementNote && (
          <p
            dir="auto"
            className="mx-auto mt-1.5 max-w-xl text-xs leading-relaxed text-muted-foreground dark:text-white"
          >
            {t(requirementNote)}
          </p>
        )}
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-primary/25 bg-primary/5 p-3.5">
      <span className="inline-flex w-auto font-sans
       items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold text-foreground">
        Step {stepNumber} of {stepTotal}
        <span className="hidden sm:inline">  —  {title ?? screen.title}</span>
      </span>
      {/* dir="auto" so an untranslated English sentence keeps its punctuation
          in place inside the RTL wrapper. */}
      <h1
        dir="auto"
        className="mt-1.5 text-base font-sans font-bold tracking-tight dark:text-white"
      >
        {t(purpose)}
      </h1>
      {requirementNote && (
        <p
          dir="auto"
          className="mt-1 text-sm font-sans leading-snug text-muted-foreground dark:text-white"
        >
          {t(requirementNote)}
        </p>
      )}
    </section>
  );
}
