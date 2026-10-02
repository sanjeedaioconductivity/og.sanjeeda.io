'use client';

import { Check, ListChecks, Zap } from 'lucide-react';
import HelpIcon from '@/components/shared/HelpIcon';
import {
  COMPARE_MODE_COPY,
  COMPARE_MODES,
  type CompareMode,
} from '../_constants/compareMode';

/**
 * CR-05 — "Present Full Compare and Quick Compare as selectable options at the
 * start of the flow." Rendered at the top of SCR-001, above the first section.
 *
 * Purpose-built rather than a `RadioCards` with two options: each card carries a
 * title, a one-line description and an icon, and the generic field components
 * take plain strings. Two cards is also the whole of it — there is no third mode
 * coming, and nothing else in the wizard needs this shape.
 *
 * NOT A FORM FIELD, and that is the point. It is not part of `ProfileForm`, it is
 * not in the Next payload, and it never reaches `PATCH /candidate-profile`. The
 * mode chooses which screens the wizard walks; it is not an answer about the
 * candidate. It is written to sessionStorage the moment it is clicked (see
 * useCompareMode.ts), so it takes effect immediately and does not wait on Next —
 * which is what lets the step bar's Quick Compare button and the bottom nav agree
 * with it on the very next render.
 *
 * Radios, not a toggle: two named choices with descriptions, one of which is
 * always active. A switch would leave "off" meaning Full Compare, which is the
 * more accurate path and should not read as the absence of something.
 */

const ICONS: Record<CompareMode, typeof Zap> = {
  full: ListChecks,
  quick: Zap,
};

export default function CompareModePicker({
  mode,
  onChange,
}: {
  /** Null while sessionStorage is still being read — renders nothing selected. */
  mode: CompareMode | null;
  onChange: (mode: CompareMode) => void;
}) {
  const C = COMPARE_MODE_COPY.picker;

  return (
    <fieldset className="mb-5 rounded-lg border border-border bg-card p-3.5">
      <legend className="flex items-center px-1 text-xs font-medium">
        {C.label}
        <HelpIcon text={C.help} label={C.label} />
      </legend>

      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {COMPARE_MODES.map((value) => {
          const option = C.options[value];
          const Icon = ICONS[value];
          const selected = mode === value;
          return (
            <label
              key={value}
              className={[
                'flex cursor-pointer items-start gap-2.5 rounded-lg border p-3 transition-colors',
                'focus-within:ring-2 focus-within:ring-ring',
                selected
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:bg-muted',
              ].join(' ')}
            >
              <input
                type="radio"
                name="compareMode"
                value={value}
                checked={selected}
                onChange={() => onChange(value)}
                // The visible title sits in a sibling span, so without this the
                // accessibility tree names the radio after its value — "quick",
                // not "Quick Compare". Verified in the rendered tree, not assumed.
                aria-label={option.title}
                // Visually replaced by the tick below, but kept in the DOM as the
                // real control so the label, keyboard and screen readers all work.
                className="sr-only"
              />
              <span
                className={[
                  'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border',
                  selected
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border',
                ].join(' ')}
                aria-hidden="true"
              >
                {selected && <Check className="h-2.5 w-2.5" />}
              </span>
              <span className="min-w-0">
                <span className="flex items-center gap-1.5 text-xs font-semibold">
                  <Icon
                    className={selected ? 'h-3.5 w-3.5 text-primary' : 'h-3.5 w-3.5 text-muted-foreground'}
                    aria-hidden="true"
                  />
                  {option.title}
                </span>
                <span className="mt-0.5 block text-[11px] leading-relaxed text-muted-foreground">
                  {option.description}
                </span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
