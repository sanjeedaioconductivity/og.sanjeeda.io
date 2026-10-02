'use client';

import * as React from 'react';
import { useT } from '../../_i18n/LocaleProvider';

const CONTROL_CLASS =
  'w-full rounded-md border border-border bg-background px-2.5 py-1 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 dark:text-white';

export function TextInput({
  id,
  value,
  onChange,
  onBlur,
  placeholder,
  maxLength,
  disabled = false,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  maxLength?: number;
  disabled?: boolean;
}) {
  const t = useT();

  return (
    <input
      id={id}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      // The typed VALUE is never translated — only the placeholder hint is.
      // dir="auto" so a candidate typing Urdu into an English-labelled field
      // still gets correct text direction.
      dir="auto"
      placeholder={placeholder ? t(placeholder) : undefined}
      maxLength={maxLength}
      disabled={disabled}
      className={CONTROL_CLASS}
    />
  );
}

/**
 * Multi-line free text. Built for SCR-008's `offer_notes`, which is explicitly
 * NOT scored and never leaves the candidate's own record — the calling screen
 * is responsible for labelling that, since a textarea alone doesn't
 * communicate it.
 */
export function TextArea({
  id,
  value,
  onChange,
  onBlur,
  placeholder,
  maxLength,
  rows = 4,
  disabled = false,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  maxLength?: number;
  rows?: number;
  disabled?: boolean;
}) {
  const t = useT();

  return (
    <textarea
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      dir="auto"
      placeholder={placeholder ? t(placeholder) : undefined}
      maxLength={maxLength}
      rows={rows}
      disabled={disabled}
      className={`${CONTROL_CLASS} resize-y`}
    />
  );
}

/**
 * Numeric input with an inline unit label — Product Discovery §3.2's control for a
 * "measurable quantity". The unit sits inside the field ("hrs / week", "min / day",
 * "days") rather than in the label, so the expected unit stays visible while typing.
 *
 * Empty string maps to `null`, never `0`. That distinction is load-bearing across
 * this module: the scoring engine reads null as "unknown" via `nullScore` and 0 as
 * a real zero. Conflating them would score an unanswered leave question as "no
 * leave at all".
 */
export function NumericInput({
  id,
  value,
  onChange,
  onBlur,
  unit,
  min,
  max,
  placeholder,
  disabled = false,
  allowDecimal = false,
}: {
  id?: string;
  value: number | null;
  onChange: (value: number | null) => void;
  onBlur?: () => void;
  unit?: string;
  min?: number;
  max?: number;
  placeholder?: string;
  disabled?: boolean;
  allowDecimal?: boolean;
}) {
  const t = useT();

  return (
    <div className="relative">
      <input
        id={id}
        type="number"
        inputMode={allowDecimal ? 'decimal' : 'numeric'}
        value={value ?? ''}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === '') return onChange(null);
          const parsed = allowDecimal ? parseFloat(raw) : parseInt(raw, 10);
          onChange(Number.isNaN(parsed) ? null : parsed);
        }}
        onBlur={onBlur}
        min={min}
        max={max}
        step={allowDecimal ? 'any' : 1}
        placeholder={placeholder ? t(placeholder) : undefined}
        disabled={disabled}
        className={`${CONTROL_CLASS} ${unit ? 'pr-20' : ''}`}
      />
      {/* The unit stays pinned right even in RTL — it reads as part of the
          number ("40 hrs / week"), not as prose that should mirror. */}
      {unit && (
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
          {t(unit)}
        </span>
      )}
    </div>
  );
}

/**
 * Date input. Native `<input type="date">` on purpose — it gives the platform's own
 * picker, which is markedly better on mobile than any JS calendar, and needs no
 * extra dependency.
 *
 * `max` is set by the caller to today for `offer_received_date`: the FRS says
 * future dates are not permitted, and the browser should refuse them rather than
 * letting a bad value reach the server.
 */
export function DateInput({
  id,
  value,
  onChange,
  onBlur,
  max,
  disabled = false,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  max?: string;
  disabled?: boolean;
}) {
  return (
    <input
      id={id}
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      max={max}
      disabled={disabled}
      className={CONTROL_CLASS}
    />
  );
}

/**
 * Styled native `<select>` — Product Discovery §3.2's control for 5+ values that
 * don't need searching.
 *
 * Native rather than a custom listbox: it is keyboard- and screen-reader-correct
 * for free, and on mobile it opens the OS wheel picker. `Combobox` handles the
 * genuinely long, searchable lists (countries, cities, currencies).
 *
 * The OPEN dropdown's options list is an OS-drawn popup, not something CSS can
 * theme the way `CONTROL_CLASS` themes the closed control — Chromium and Firefox
 * are the two engines that honour `background-color`/`color` set directly on
 * `<option>`, so `OPTION_CLASS` below is what makes the popup dark in dark mode
 * instead of the browser's default white-on-black regardless of the page theme.
 */
const OPTION_CLASS = 'bg-popover text-popover-foreground';

export function Select({
  id,
  value,
  onChange,
  onBlur,
  options,
  placeholder,
  disabled = false,
}: {
  id?: string;
  value: string | null | undefined;
  onChange: (value: string) => void;
  onBlur?: () => void;
  options: readonly string[];
  placeholder?: string;
  disabled?: boolean;
}) {
  const t = useT();

  return (
    <select
      id={id}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      disabled={disabled}
      dir="auto"
      className={CONTROL_CLASS}
    >
      {placeholder && (
        <option value="" disabled className={OPTION_CLASS}>
          {t(placeholder)}
        </option>
      )}
      {/* `value` stays the English original — that is what `onChange` reports
          and what the server validates. Only the visible label translates. */}
      {options.map((option) => (
        <option key={option} value={option} className={OPTION_CLASS}>
          {t(option)}
        </option>
      ))}
    </select>
  );
}

/**
 * Number input paired with a "Not clear" toggle.
 *
 * Built for `offer_annual_leave_days` (SCR-005), whose FRS card and the Sprint 6
 * DoD both single it out: toggling Not clear disables the input and the field must
 * submit a genuine null — never 0. The Sprint 5 engine separates the two through
 * `numericBands` versus `nullScore`, so a zero here would score as "no leave"
 * rather than "unknown".
 *
 * The toggle owns the value: turning it on clears the number outright rather than
 * hiding a stale one, so what the candidate sees is what gets written.
 */
export function NotClearNumberInput({
  id,
  value,
  onChange,
  onBlur,
  notClear,
  onNotClearChange,
  unit,
  min,
  max,
  placeholder,
  disabled = false,
}: {
  id?: string;
  value: number | null;
  onChange: (value: number | null) => void;
  onBlur?: () => void;
  notClear: boolean;
  onNotClearChange: (notClear: boolean) => void;
  unit?: string;
  min?: number;
  max?: number;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-start gap-2">
      <div className="flex-1">
        <NumericInput
          id={id}
          value={notClear ? null : value}
          onChange={onChange}
          onBlur={onBlur}
          unit={unit}
          min={min}
          max={max}
          placeholder={notClear ? '—' : placeholder}
          disabled={disabled || notClear}
        />
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={notClear}
        disabled={disabled}
        onClick={() => {
          const next = !notClear;
          onNotClearChange(next);
          // Toggling on stores null, not zero — see the note above.
          if (next) onChange(null);
        }}
        className={[
          'shrink-0 rounded-lg border px-3.5 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          notClear
            ? 'border-primary bg-primary font-semibold text-primary-foreground'
            : 'border-border hover:bg-muted',
          disabled ? 'cursor-not-allowed opacity-50' : '',
        ].join(' ')}
      >
        Not clear
      </button>
    </div>
  );
}

/**
 * Two controls sharing one row — the FRS's "paired row".
 *
 * Used for base salary + pay period, and for every amount + type/frequency pair on
 * SCR-004 (annual bonus, commission, equity, transport, other allowance). The pair
 * reads as one question, so it stays on one line even on mobile, with the
 * secondary control kept narrow.
 */
export function PairedRow({
  primary,
  secondary,
  secondaryWidth = 'w-36',
}: {
  primary: React.ReactNode;
  secondary: React.ReactNode;
  secondaryWidth?: string;
}) {
  return (
    <div className="flex items-start gap-1">
      <div className="flex-1">{primary}</div>
      <div className={`shrink-0 ${secondaryWidth}`}>{secondary}</div>
    </div>
  );
}
