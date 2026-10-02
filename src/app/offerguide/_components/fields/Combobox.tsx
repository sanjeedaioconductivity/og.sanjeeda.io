'use client';

import * as React from 'react';
import { Check, ChevronDown, Plus, X } from 'lucide-react';
import { useT } from '../../_i18n/LocaleProvider';

export type ComboboxOption = { value: string; label: string };

/**
 * Searchable dropdown for the genuinely long reference lists — countries, cities,
 * currencies, functional domains.
 *
 * Deliberately hand-rolled rather than pulled from `react-select` (which is already
 * a dependency): this needs to theme purely from the shared tokens so it matches in
 * light, dark and system, and a type-to-filter listbox is a small amount of code
 * next to overriding an opinionated component's styling in three themes.
 *
 * Options always come from `/config/*` or a constants file — never hardcoded at the
 * call site. Geography and functional domains are config-driven by DoD requirement,
 * so a country added in the admin collection appears here without a code change.
 */
export default function Combobox({
  id,
  options,
  value,
  onChange,
  onBlur,
  placeholder = 'Select…',
  disabled = false,
  loading = false,
  emptyMessage = 'No matches',
  clearable = true,
  allowCustom = false,
}: {
  id?: string;
  options: readonly ComboboxOption[];
  value: string | null | undefined;
  onChange: (value: string | null) => void;
  onBlur?: () => void;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  emptyMessage?: string;
  clearable?: boolean;
  /**
   * Offer "use what I typed" when the query matches no option.
   *
   * For city, where the stored column is free text and the dropdown only ever
   * supplied SUGGESTIONS (see the OgGeography model note). No curated list can
   * cover every town, so without this a candidate from a smaller city simply
   * cannot answer. Not for country or currency — those are closed ISO sets, and
   * an invented value there would break scoring and market matching.
   */
  allowCustom?: boolean;
}) {
  const t = useT();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');

  // Country and currency labels arrive already localised (Intl.DisplayNames
  // resolves them from the ISO code), so only the free-text fallback — a city
  // the candidate typed — needs t(), and that returns it unchanged.
  const selectedLabel =
    options.find((o) => o.value === value)?.label ?? value ?? '';

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  const trimmedQuery = query.trim();

  // Only offer the custom row when it would add something — hidden once the
  // query exactly names an option, so there is never a "Karachi" suggestion
  // sitting directly beneath the real Karachi.
  const showCustomOption =
    allowCustom &&
    trimmedQuery.length > 0 &&
    !options.some((o) => o.label.toLowerCase() === trimmedQuery.toLowerCase());

  function select(option: ComboboxOption) {
    onChange(option.value);
    setOpen(false);
    setQuery('');
    onBlur?.();
  }

  function selectCustom() {
    onChange(trimmedQuery);
    setOpen(false);
    setQuery('');
    onBlur?.();
  }

  /**
   * Fires on every path that takes focus off the input: Tab, Shift+Tab, a
   * mouse click anywhere else on the page, or a screen reader moving focus —
   * losing focus moves it to `document.body` at minimum, so this alone is
   * enough to close the list without a separate outside-click listener.
   *
   * Without it, typing a search query and then tabbing straight to Next
   * leaves the dropdown open with unsaved query text on screen while the
   * underlying value stays whatever it was before — silently different from
   * what the input displays.
   *
   * Delayed one tick so a click on an option (which fires blur first, then
   * click) still gets to run `select()` before this closes the list out from
   * under it — the classic combobox blur-vs-click race.
   */
  function handleNativeBlur() {
    window.setTimeout(() => {
      setOpen(false);
      setQuery('');
      onBlur?.();
    }, 120);
  }

  return (
    <div className="relative">
      <div className="relative">
        <input
          id={id}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          dir="auto"
          value={open ? query : selectedLabel}
          placeholder={loading ? t('Loading…') : t(placeholder)}
          disabled={disabled || loading}
          onFocus={() => setOpen(true)}
          onBlur={handleNativeBlur}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!open) setOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setOpen(false);
              setQuery('');
            }
            if (e.key === 'Enter' && open) {
              // A real match always wins over the typed string, so Enter can
              // never store free text when the candidate meant the suggestion.
              if (filtered.length > 0) {
                e.preventDefault();
                select(filtered[0]);
              } else if (showCustomOption) {
                e.preventDefault();
                selectCustom();
              }
            }
          }}
          className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 pr-14 text-xs text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 dark:text-white"
        />

        <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
          {clearable && value && !disabled && (
            <button
              type="button"
              aria-label="Clear selection"
              onClick={() => {
                onChange(null);
                setQuery('');
              }}
              className="rounded p-0.5 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <ChevronDown
            className="h-4 w-4 text-muted-foreground"
            aria-hidden="true"
          />
        </div>
      </div>

      {open && !disabled && (
        <ul
          role="listbox"
          className="absolute z-40 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-border bg-popover py-1 text-popover-foreground shadow-lg"
        >
          {filtered.length === 0 && !showCustomOption ? (
            <li dir="auto" className="px-3 py-2 text-sm text-muted-foreground">
              {t(emptyMessage)}
            </li>
          ) : (
            <>
              {filtered.map((option) => {
                const isSelected = option.value === value;
                return (
                  <li key={option.value}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => select(option)}
                      className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs hover:bg-muted"
                    >
                      {option.label}
                      {isSelected && (
                        <Check
                          className="h-3.5 w-3.5 text-xs"
                          aria-hidden="true"
                        />
                      )}
                    </button>
                  </li>
                );
              })}

              {showCustomOption && (
                <li
                  className={
                    filtered.length > 0 ? 'mt-1 border-t border-border pt-1' : ''
                  }
                >
                  <button
                    type="button"
                    role="option"
                    aria-selected={false}
                    onClick={selectCustom}
                    className="flex w-full items-center gap-1.5 px-3 py-2 text-left text-xs text-primary hover:bg-muted"
                  >
                    <Plus className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span dir="auto" className="truncate">
                      {t('Use')} &ldquo;{trimmedQuery}&rdquo;
                    </span>
                  </button>
                </li>
              )}
            </>
          )}
        </ul>
      )}
    </div>
  );
}
