'use client';

import * as React from 'react';
import OtherTextInput from './OtherTextInput';
import { useT } from '../../_i18n/LocaleProvider';

/**
 * Radio Cards — the workhorse control.
 *
 * Product Discovery §3.2 maps controls to option counts: 2 values → Binary Radio
 * Cards, 3-4 values → Radio Cards, 5+ → Dropdown. This component covers the first
 * two; `Select` / `Combobox` cover the third.
 *
 * `warningValues` renders specific options in amber. SCR-005 needs it on "Risky"
 * (job security) and "Yes" (restrictive clause) — negative signals the candidate
 * should notice. The FRS is explicit that this must read as a signal "without being
 * alarmist", so amber is a border and text treatment, with a subtle tint on
 * selection rather than a solid fill.
 *
 * `Other` gets a dashed border to signal it behaves differently, and reveals a free
 * text input. That pairing is a product standard (Discovery §3.2), not per-field
 * styling. On the offer screens the server *requires* that text whenever the value
 * is "Other" — `validateEnumField` rejects the write without it.
 */

export type RadioCardsProps = {
  name: string;
  options: readonly string[];
  value: string | null | undefined;
  onChange: (value: string) => void;
  disabled?: boolean;
  /** Option values rendered in amber. */
  warningValues?: readonly string[];
  /**
   * Option values rendered in green — the positive counterpart to
   * `warningValues`. SCR-006's energy fit is the first field to need both poles
   * coded at once (Energizing green, Tiring amber), with the middle values
   * staying neutral.
   */
  positiveValues?: readonly string[];
  /** Force one option per row across the full width. */
  fullWidthOptions?: boolean;
  /**
   * Render an explicit radio dot inside each card and lay them out in a grid.
   * SCR-002's `evaluation_type` asks for exactly this — "2×2 grid of Radio Cards
   * with radio dot indicator per option" — because four longer, mutually exclusive
   * labels read better as rows than as inline pills.
   */
  withDot?: boolean;
  gridCols?: 1 | 2;
  /** Free text shown when `Other` is selected. */
  otherText?: string;
  onOtherTextChange?: (text: string) => void;
  otherMaxLength?: number;
  otherPlaceholder?: string;
};

export default function RadioCards({
  name,
  options,
  value,
  onChange,
  disabled = false,
  warningValues = [],
  positiveValues = [],
  fullWidthOptions = false,
  withDot = false,
  gridCols = 2,
  otherText = '',
  onOtherTextChange,
  otherMaxLength = 100,
  otherPlaceholder = 'Please specify',
}: RadioCardsProps) {
  const t = useT();

  return (
    <div>
      <div
        role="radiogroup"
        aria-label={name}
        className={
          withDot
            ? `grid gap-2 ${gridCols === 2 ? 'sm:grid-cols-2' : 'grid-cols-1'}`
            : fullWidthOptions
              ? 'grid grid-cols-1 gap-2'
              : 'flex flex-wrap gap-2'
        }
      >
        {options.map((option) => {
          const isSelected = value === option;
          const isWarning = warningValues.includes(option);
          const isPositive = positiveValues.includes(option);
          const isOther = option === 'Other';

          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={disabled}
              onClick={() => onChange(option)}
              className={[
                'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                withDot
                  ? 'flex items-center gap-2 rounded-md px-3 py-2 text-left text-xs'
                  : 'rounded-md px-2.5 py-1 text-xs',
                isOther ? 'border border-dashed' : 'border',
                isSelected && isWarning
                  ? 'border-warning bg-warning-subtle font-semibold text-warning'
                  : isSelected && isPositive
                    ? 'border-success bg-success-subtle font-semibold text-success'
                    : isSelected
                      ? withDot
                        ? 'border-primary bg-primary/10 font-semibold text-primary'
                        : 'border-primary bg-primary font-semibold text-primary-foreground'
                      : isWarning
                        ? 'border-warning/50 text-warning hover:bg-warning-subtle'
                        : isPositive
                          ? 'border-success/50 text-success hover:bg-success-subtle'
                          : 'border-border text-foreground hover:bg-muted dark:text-white',
                disabled ? 'cursor-not-allowed' : '',
              ].join(' ')}
            >
              {withDot && (
                <span
                  className={[
                    'flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border',
                    isSelected ? 'border-primary' : 'border-border',
                  ].join(' ')}
                  aria-hidden="true"
                >
                  {isSelected && (
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  )}
                </span>
              )}
              {/* Translated for display; `onChange(option)` above still sends the
                  English value the server validates against. */}
              {isOther ? `${t('Other')}…` : t(option)}
            </button>
          );
        })}
      </div>

      {value === 'Other' && onOtherTextChange && (
        <OtherTextInput
          value={otherText}
          onChange={onOtherTextChange}
          maxLength={otherMaxLength}
          placeholder={otherPlaceholder}
          disabled={disabled}
        />
      )}
    </div>
  );
}

/**
 * Binary Radio Cards — exactly two options, equal width, side by side.
 *
 * SCR-002's `evaluation_offer_count` specifies this shape directly: "two
 * equal-width cards displayed side by side" with accent fill on selection.
 */
export function BinaryRadioCards({
  name,
  options,
  value,
  onChange,
  disabled = false,
  descriptions,
}: {
  name: string;
  options: readonly [string, string];
  value: string | null | undefined;
  onChange: (value: string) => void;
  disabled?: boolean;
  /** Optional one-liner under each label. */
  descriptions?: Record<string, string>;
}) {
  const t = useT();

  return (
    <div role="radiogroup" aria-label={name} className="grid grid-cols-2 gap-1.5">
      {options.map((option) => {
        const isSelected = value === option;
        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={isSelected}
            disabled={disabled}
            onClick={() => onChange(option)}
            className={[
              'rounded-md border px-2.5 py-1.5 text-center text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              isSelected
                ? 'border-primary bg-primary font-semibold text-primary-foreground'
                : 'border-border text-foreground hover:bg-muted dark:text-white',
              disabled ? 'cursor-not-allowed opacity-50' : '',
            ].join(' ')}
          >
            <span className="block">{t(option)}</span>
            {descriptions?.[option] && (
              <span
                className={[
                  'mt-0.5 block text-[11px]',
                  isSelected
                    ? 'text-primary-foreground/80'
                    : 'text-muted-foreground',
                ].join(' ')}
              >
                {t(descriptions[option])}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/**
 * 5-point numeric rating — 1 to 5 with anchor labels.
 *
 * NO star metaphor. Product Discovery §3.2 calls for "Numeric Radio Cards (1–5)
 * with anchor labels — no star metaphor", and SCR-001's three career-satisfaction
 * fields spell out the anchors: "1 = Very dissatisfied, 5 = Very satisfied".
 * Stars imply a review of someone else's product; this is the candidate rating
 * their own situation.
 */
export function RatingCards({
  name,
  value,
  onChange,
  disabled = false,
  lowAnchor,
  highAnchor,
  showAnchors = true,
}: {
  name: string;
  value: number | null | undefined;
  onChange: (value: number) => void;
  disabled?: boolean;
  lowAnchor: string;
  highAnchor: string;
  /**
   * Set false to omit the "1 = X, 5 = Y" legend on repeat instances of the
   * SAME scale — SCR-001's three career-satisfaction ratings all share one
   * "Very dissatisfied → Very satisfied" scale, so only the first needs to
   * spell it out; showing it three times in a row was noise, not help.
   * Culture/Growth's rating fields each have their OWN anchors, so they
   * leave this at the default and keep a legend on every one.
   */
  showAnchors?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div role="radiogroup" aria-label={name} className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map((point) => {
          const isSelected = value === point;
          return (
            <button
              key={point}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={`${point}`}
              disabled={disabled}
              onClick={() => onChange(point)}
              className={[
                'h-7 w-7 rounded-md border text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                isSelected
                  ? 'border-primary bg-primary font-semibold text-primary-foreground'
                  : 'border-border text-foreground hover:bg-muted dark:text-white',
                disabled ? 'cursor-not-allowed opacity-50' : '',
              ].join(' ')}
            >
              {point}
            </button>
          );
        })}
      </div>
      {showAnchors && (
        <p className="text-[11px] text-muted-foreground">
          1 = {lowAnchor}, 5 = {highAnchor}
        </p>
      )}
    </div>
  );
}
