'use client';

import * as React from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

/**
 * HelpIcon (ⓘ) — the portal-wide help affordance introduced in Sprint 7.
 *
 * Lives in `components/shared/` (not the OfferGuide module folder) because the
 * Sprint 7 handoff §2.1 scopes it as reusable by future modules, the same
 * placement rule already applied to CompensationBar in Sprint 6.
 *
 * Content is ALWAYS the field's own Help Text from its FRS Product Dictionary
 * entry — never newly written copy. That is an explicit acceptance criterion for
 * both SCR-008 and the Epic 7.4 retrofit, and it's why this component takes the
 * text as a prop rather than owning any copy of its own.
 *
 * Desktop hover and mobile tap both work without a media query:
 *   - Radix opens the tooltip on pointer hover/focus for mouse and keyboard.
 *   - The trigger is a real <button>, so a touch tap fires focus, which Radix
 *     also treats as an open trigger. `onClick` toggling is wired explicitly as
 *     well, because iOS Safari can deliver a tap without a lasting focus.
 *
 * Line height: the trigger is `inline-flex` inside an `align-middle` wrapper with
 * a fixed 14px box and `leading-none`. It sits on the label's existing baseline
 * box rather than adding to it, so adding one to an existing label cannot shift
 * that label's line height — the "no layout shift" criterion in Epic 7.4.
 */
export default function HelpIcon({
  text,
  label,
  className = '',
}: {
  /** The field's FRS Help Text. Rendered verbatim. */
  text: string;
  /** Accessible name, e.g. the field label this explains. */
  label?: string;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);

  if (!text) return null;

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip open={open} onOpenChange={setOpen}>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={label ? `Help: ${label}` : 'Help'}
            // Touch devices: a tap should toggle rather than rely on hover.
            onClick={(e) => {
              e.preventDefault();
              setOpen((v) => !v);
            }}
            className={[
              'ml-1.5 inline-flex h-3.5 w-3.5 shrink-0 select-none items-center justify-center rounded-full bg-primary align-middle text-[9px] font-bold leading-none text-primary-foreground',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              className,
            ].join(' ')}
          >
            i
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          align="start"
          // Long help strings (several FRS entries run 200+ chars) need a real
          // wrap width; the shadcn default is sized for short labels.
          //
          // Overrides the shared shadcn default (`bg-primary`/`text-primary-foreground`,
          // no border) rather than editing tooltip.tsx: every other tooltip in the
          // portal still gets that default, this help bubble alone gets a fixed
          // dark chip regardless of page theme or palette — `brand-ink` is a
          // portal-wide, always-dark token (deep navy in Modern, deep plum in
          // Playful), which also matters because Radix renders this in a portal
          // outside `.og-surface`, so OfferGuide's own light/dark shadcn tokens
          // (`bg-popover` etc.) wouldn't resolve to the right values here anyway.
          className="max-w-[260px] whitespace-normal leading-snug border border-brand-accent/50 bg-brand-ink text-white"
        >
          {text}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
