'use client';

/**
 * Free text companion revealed when an enum is set to "Other".
 *
 * Dashed border, matching the dashed `Other` card/chip that opened it — the visual
 * link is the point.
 *
 * The character counter is not decoration. On the offer screens the server rejects
 * the whole write when "Other" is selected with empty or over-long text
 * (`validateEnumField`), so the candidate needs to see the limit before they hit
 * Next. `maxLength` comes from each field's own FRS card — 50 or 100, never a
 * single global value.
 */
export default function OtherTextInput({
  value,
  onChange,
  maxLength,
  placeholder = 'Please specify',
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
  placeholder?: string;
  disabled?: boolean;
}) {
  const remaining = maxLength - value.length;

  return (
    <div className="mt-2">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, maxLength))}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={disabled}
        className="w-full rounded-lg border border-dashed border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
      />
      <p className="mt-1 text-xs text-muted-foreground">
        {value.trim().length === 0 ? (
          <span className="text-destructive">Required when Other is selected</span>
        ) : (
          `${remaining} character${remaining === 1 ? '' : 's'} left`
        )}
      </p>
    </div>
  );
}
