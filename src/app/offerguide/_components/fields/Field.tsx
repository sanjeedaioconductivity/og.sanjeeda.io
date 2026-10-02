'use client';

import * as React from 'react';
import HelpIcon from '@/components/shared/HelpIcon';
import { useT } from '../../_i18n/LocaleProvider';

/**
 * Conditional pill — the amber tag that explains WHY a field is inactive.
 *
 * Product Discovery §3.4: the default treatment for a conditional field is dimmed
 * and inactive with a pill naming its trigger, NOT hidden. That avoids layout shift
 * and tells the candidate what to change to unlock it. Only the handful of fields
 * listed in the Sprint 6 handoff §2 (plus SCR-004's three, per that FRS §5) are
 * fully removed instead.
 *
 * Pill text is FRS copy — "if not Remote", "if Contract / Temporary",
 * "if offer country ≠ current country" — so it is passed in, never generated here.
 */
export function ConditionalPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="ml-2 inline-flex items-center rounded-full border border-warning/40 bg-warning-subtle px-2 py-0.5 text-xs font-medium text-warning">
      {children}
    </span>
  );
}

/**
 * Standard field wrapper: label + ⓘ HelpIcon, optional conditional pill, then
 * the control itself.
 *
 * `helpText` renders ONLY inside the HelpIcon tooltip, never as visible text —
 * that was the original SCR-001→007 pattern (a permanent paragraph under every
 * field), replaced product-wide so every screen matches SCR-008/SCR-009's
 * icon-on-demand standard. Content is still the FRS's Help Text verbatim, just
 * relocated from an always-open paragraph to a click-to-open tooltip.
 *
 * When `conditional` is supplied and inactive, the whole block dims and stops
 * accepting pointer events. The control is still in the DOM and still in the tab
 * order's natural position — child inputs get `disabled` from their own props, so
 * pass that through at the call site too.
 */
export default function Field({
  label,
  htmlFor,
  required = false,
  helpText,
  conditional,
  fullWidth = false,
  children,
}: {
  label: string;
  htmlFor?: string;
  required?: boolean;
  /** Tooltip content only — never rendered as visible text. */
  helpText?: string;
  /** Omit entirely for unconditional fields. */
  conditional?: { pill: string; active: boolean };
  /** Span both columns of the two-column desktop grid. */
  fullWidth?: boolean;
  children: React.ReactNode;
}) {
  const t = useT();
  const isDimmed = conditional !== undefined && !conditional.active;

  return (
    <div
      className={[
        fullWidth ? 'sm:col-span-2' : '',
        isDimmed ? 'pointer-events-none opacity-45' : '',
      ].join(' ')}
      aria-disabled={isDimmed || undefined}
    >
      {/* dir="auto" lets the browser pick direction from the text itself. It
          matters for the untranslated fallback: an English string inside an RTL
          container has its trailing punctuation displaced to the front
          ("…evaluate." renders as ".…evaluate"). */}
      <label
        htmlFor={htmlFor}
        dir="auto"
        className="mt-2 mb-3 flex flex-wrap items-center text-xs text-foreground"
      >
        {t(label)}
        {/* The tooltip text translates; the `label` prop stays English because
            it builds the accessible name, not visible copy. */}
        {helpText && <HelpIcon text={t(helpText)} label={label} />}
        
        {required && (
          <span className="ml-1.5 text-xs font-semibold text-destructive">
            {t('required')}
          </span>
        )}
        
        {conditional && <ConditionalPill>{t(conditional.pill)}</ConditionalPill>}
      </label>

      {children}
    </div>
  );
}

/**
 * A titled group of fields — one section of a screen. The two-column desktop grid
 * lives here; mobile collapses to a single column in the same source order, which
 * is what keeps "same field order as desktop" true by construction rather than by
 * discipline.
 *
 * Renders as its own bordered card (not just a heading over a hairline) so a
 * screen with several sections — SCR-001's two, SCR-004's four — reads as a
 * stack of clearly separate boxes instead of one continuous list of fields
 * under thin dividers. `FieldSubSection` below nests the same idea one level
 * in, for the screens (SCR-001 so far) that group fields inside a section.
 */
export function FieldSection({
  index,
  title,
  meta,
  columns = 2,
  children,
}: {
  /** 1-based, matches the section mini-stepper. */
  index: number;
  title: string;
  /** Right-aligned note, e.g. "5 fields" or "optional". */
  meta?: string;
  columns?: 1 | 2;
  children: React.ReactNode;
}) {
  const t = useT();

  return (
    <section className="mt-2 rounded-lg border border-border bg-card p-4 first:mt-0">
      <div className="flex items-center justify-between border-b border-border pb-2">
        <h2 className="ml-0 flex items-center text-base font-bold text-blue-800 dark:text-white">
          {t(title)}
        </h2>

        {meta && (
          <span className="shrink-0 text-sm font-mono text-foreground dark:text-white">
            {meta}
          </span>
        )}
      </div>
      <div
        className={[
          'grid grid-cols-1 gap-x-3 gap-y-1',
          columns === 2 ? 'sm:grid-cols-2' : '',
        ].join(' ')}
      >
        {children}
      </div>
    </section>
  );
}

/**
 * A titled, boxed group of fields WITHIN a section — e.g. "Professional
 * information" and "Location information" inside SCR-001's "Personal career
 * profile". Nests one visual step inside `FieldSection`'s card: same idea
 * (heading + its own bordered box), one size down, so the sub-heading and the
 * handful of fields it covers read as their own recognizable unit rather than
 * a label sitting loose among ungrouped fields.
 *
 * Spans both columns of the parent grid and lays its own children out in the
 * same two-column pattern, so nesting one of these changes nothing about field
 * order or the desktop/mobile column collapse — only that the fields between
 * this sub-heading and the next now sit inside a shared box.
 */
export function FieldSubSection({
  title,
  children,
  columns = 2,
}: {
  title: string;
  children: React.ReactNode;
  /** SCR-001's three career-satisfaction ratings sit in one row of 3. */
  columns?: 1 | 2 | 3;
}) {
  const t = useT();
  return (
    <div className="bg-muted/50 p-3 sm:col-span-2">
      <p
        dir="auto"
        className=" text-sm font-bold font-sans uppercase text-Red dark:text-white"
      >
        {t(title)}:
      </p>
      <div
        className={[
          'grid grid-cols-1 gap-x-3 gap-y-1',
          columns === 3
            ? 'sm:grid-cols-3'
            : columns === 2
              ? 'sm:grid-cols-2'
              : '',
        ].join(' ')}
      >
        {children}
      </div>
    </div>
  );
}
