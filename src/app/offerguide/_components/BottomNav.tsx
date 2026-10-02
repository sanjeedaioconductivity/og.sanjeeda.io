'use client';

import { ArrowLeft, ArrowRight } from 'lucide-react';
import {
  progressLabelDesktop,
  progressLabelMobile,
  type WizardScreen,
} from '../_constants/screens';

/**
 * Bottom navigation — Back and Next ONLY.
 *
 * There is no Skip button on any screen. Skip was removed product-wide (Sprint 6
 * handoff §2), and each FRS §9 gives the same reasoning: SCR-001 has only 2
 * required fields, SCR-002 has all 3 required so skipping is meaningless, and
 * SCR-005 is entirely optional so nobody needs to skip it. Do not add one back.
 *
 * Carries the progress label too, which is why it takes the screen: desktop reads
 * "Screen 4 of 10 · Compensation", mobile reads "4 of 10".
 */
export default function BottomNav({
  screen,
  onBack,
  onNext,
  nextDisabled = false,
  nextLabel = 'Next',
  isSubmitting = false,
  progressLabels,
}: {
  screen: WizardScreen;
  onBack: () => void;
  onNext: () => void;
  /** True while required fields are unsatisfied. SCR-002 and SCR-004 use this. */
  nextDisabled?: boolean;
  nextLabel?: string;
  isSubmitting?: boolean;
  /**
   * Overrides the "Screen 4 of 10" label. Quick Compare passes its own position
   * ("step 3 of 6") — counting to ten on a six-step path would be wrong, and the
   * count is the only thing mobile has to go by.
   */
  progressLabels?: { desktop: string; mobile: string } | null;
}) {
  const desktopLabel = progressLabels?.desktop ?? progressLabelDesktop(screen);
  const mobileLabel = progressLabels?.mobile ?? progressLabelMobile(screen);
  return (
    <div className="sticky bottom-0 z-20 border-t border-border bg-card/95 px-5 py-3 backdrop-blur sm:px-6">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
        <p className="text-xs text-muted-foreground">
          <span className="hidden sm:inline">{desktopLabel}</span>
          <span className="sm:hidden">{mobileLabel}</span>
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={nextDisabled || isSubmitting}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {isSubmitting ? 'Saving…' : nextLabel}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
