'use client';

import * as React from 'react';
import { Languages } from 'lucide-react';
import { LOCALES } from '../_i18n/locales';
import { useLocale } from '../_i18n/LocaleProvider';

/**
 * Language switcher for the OfferGuide module.
 *
 * Every registered locale renders automatically, so adding Sindhi, Punjabi or
 * Balochi means adding a dictionary and a registry entry — this component never
 * needs editing.
 *
 * Each option is labelled in its OWN script, with the English name underneath.
 * Someone who cannot read Latin needs to recognise اردو, and someone who cannot
 * read Nastaliq needs to find their way back to English — showing only one of
 * the two strands anyone out of the language they can read.
 *
 * `dir="ltr"` is pinned on the row so the buttons keep a stable order when the
 * surrounding module flips to RTL; a control that moves when you use it is
 * disorienting, and this one is how you undo the change.
 */
export default function LanguageSwitcher({
  className = '',
}: {
  className?: string;
}) {
  const { locale, setLocale } = useLocale();

  if (LOCALES.length < 2) return null;

  return (
    <div
      dir="ltr"
      className={['flex items-center gap-1.5', className].join(' ')}
    >
      <Languages
        className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
        aria-hidden="true"
      />
      <div
        role="radiogroup"
        aria-label="Language"
        className="flex items-center gap-1"
      >
        {LOCALES.map((l) => {
          const active = l.code === locale;
          return (
            <button
              key={l.code}
              type="button"
              role="radio"
              aria-checked={active}
              lang={l.code}
              onClick={() => setLocale(l.code)}
              title={l.label}
              className={[
                'rounded-full border px-2.5 py-1 text-[11px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                active
                  ? 'border-success bg-success-subtle font-semibold text-success'
                  : 'border-border text-muted-foreground hover:bg-muted',
                // The native label needs the language's own face, not the
                // module's — otherwise اردو renders in a Latin fallback.
                l.fontClass,
              ].join(' ')}
            >
              {l.nativeLabel}
            </button>
          );
        })}
      </div>
    </div>
  );
}
