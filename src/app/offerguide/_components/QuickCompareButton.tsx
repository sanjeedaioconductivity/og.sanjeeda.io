'use client';

import { Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { COMPARE_MODE_COPY, MIN_QUICK_COMPARE_INTERESTS } from '../_constants/compareMode';

/**
 * CR-02's shortcut: "Introduce a Quick Compare option, accessible from every
 * step. Result is generated only once the candidate has selected a minimum of
 * three interests."
 *
 * WizardShell renders it in the step bar's row, so it is present on all ten
 * screens without each page opting in.
 *
 * IT EXPLAINS ITSELF RATHER THAN GOING GREY. A disabled button with no reason
 * is the thing candidates report as "broken" — so when the gate is not met the
 * button stays clickable and says what is missing, and only then does nothing
 * else. `aria-disabled` carries the state to assistive tech without taking the
 * control out of the tab order, which is what `disabled` would do.
 *
 * Two separate gates, two separate messages:
 *
 *   fewer than 3 interests   CR-02's rule. The interests weight the categories;
 *                            see compareMode.ts for why three.
 *   no scorable offer        there is nothing to score yet. Not part of CR-02,
 *                            but a "result" with no offer is a 404 on SCR-009,
 *                            and telling the candidate which step to visit is
 *                            better than sending them to an error.
 */
export default function QuickCompareButton({
  interestCount,
  hasScorableOffer,
  onRun,
  disabled = false,
}: {
  interestCount: number;
  hasScorableOffer: boolean;
  /** Save the current step, then go to the result. Called only when ready. */
  onRun: () => void;
  /** True while the screen is saving — a second run mid-save would double-submit. */
  disabled?: boolean;
}) {
  const C = COMPARE_MODE_COPY.action;
  const needsInterests = interestCount < MIN_QUICK_COMPARE_INTERESTS;
  const ready = !needsInterests && hasScorableOffer;

  function handleClick() {
    if (needsInterests) {
      toast.error(C.blockedToast);
      return;
    }
    if (!hasScorableOffer) {
      toast.error(C.noOfferToast);
      return;
    }
    onRun();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      aria-disabled={!ready}
      title={ready ? C.title : C.blockedTitle}
      className={[
        'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'disabled:cursor-not-allowed disabled:opacity-50',
        ready
          ? 'border-primary/40 bg-primary/10 text-primary hover:bg-primary/20'
          : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground',
      ].join(' ')}
    >
      <Zap className="h-3 w-3" aria-hidden="true" />
      {C.label}
      {needsInterests && (
        <span className="font-normal tabular-nums opacity-80">
          {interestCount}/{MIN_QUICK_COMPARE_INTERESTS}
        </span>
      )}
    </button>
  );
}
