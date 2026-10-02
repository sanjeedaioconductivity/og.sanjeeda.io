'use client';

import OtherTextInput from './OtherTextInput';

/**
 * Multi-select chips — Product Discovery §3.2's control for multi-select of any size.
 *
 * Two users this sprint, with quite different rules:
 *   - SCR-001 `current_benefits` — unlimited, no counter
 *   - SCR-002 `evaluation_priorities` — min 1, max 3, live counter, and `Other`
 *     counts as one of the three
 *
 * `maxSelections` drives both the counter and the lockout. At the limit, unselected
 * chips are disabled rather than hidden, so the candidate can see what they'd have
 * to give up to pick something else — the FRS calls the counter a UX enhancement to
 * stop them "silently exceeding" the limit, and silently removing options would
 * miss that point just as badly.
 */
export default function Chips({
  name,
  options,
  value,
  onChange,
  maxSelections,
  showCounter = false,
  disabled = false,
  tone = 'primary',
  otherText = '',
  onOtherTextChange,
  otherMaxLength = 50,
}: {
  name: string;
  options: readonly string[];
  value: readonly string[];
  onChange: (value: string[]) => void;
  maxSelections?: number;
  showCounter?: boolean;
  disabled?: boolean;
  /**
   * Selected-state colour. SCR-008's red flags select in amber rather than the
   * default accent — every one of those values is a negative signal, so the
   * usual "selected = good" accent would read wrong.
   */
  tone?: 'primary' | 'warning';
  otherText?: string;
  onOtherTextChange?: (text: string) => void;
  otherMaxLength?: number;
}) {
  const atLimit =
    maxSelections !== undefined && value.length >= maxSelections;

  function toggle(option: string) {
    if (value.includes(option)) {
      onChange(value.filter((v) => v !== option));
      return;
    }
    if (atLimit) return;
    onChange([...value, option]);
  }

  return (
    <div>
      <div role="group" aria-label={name} className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = value.includes(option);
          const isOther = option === 'Other';
          const isLocked = !isSelected && atLimit;

          return (
            <button
              key={option}
              type="button"
              aria-pressed={isSelected}
              disabled={disabled || isLocked}
              onClick={() => toggle(option)}
              className={[
                'rounded-full px-3 py-1 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                isOther ? 'border border-dashed' : 'border',
                isSelected
                  ? tone === 'warning'
                    ? 'border-warning bg-warning-subtle font-semibold text-warning'
                    : 'border-primary bg-primary font-semibold text-primary-foreground'
                  : 'border-border hover:bg-muted',
                isLocked || disabled ? 'cursor-not-allowed opacity-40' : '',
              ].join(' ')}
            >
              {isOther ? '+ Other' : option}
            </button>
          );
        })}
      </div>

      {showCounter && maxSelections !== undefined && (
        <p
          className={[
            'mt-2 text-xs',
            atLimit ? 'font-medium text-primary' : 'text-muted-foreground',
          ].join(' ')}
        >
          {atLimit
            ? `${value.length} of ${maxSelections} selected — maximum reached`
            : `${value.length} of ${maxSelections} selected`}
        </p>
      )}

      {value.includes('Other') && onOtherTextChange && (
        <OtherTextInput
          value={otherText}
          onChange={onOtherTextChange}
          maxLength={otherMaxLength}
          placeholder="Describe what matters most to you"
          disabled={disabled}
        />
      )}
    </div>
  );
}
