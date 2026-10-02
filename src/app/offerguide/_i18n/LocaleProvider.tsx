'use client';

import * as React from 'react';
import {
  DEFAULT_LOCALE,
  getLocaleMeta,
  LOCALE_STORAGE_KEY,
  type LocaleCode,
  type LocaleMeta,
} from './locales';
import { ur } from './ur';

/**
 * OfferGuide translation context.
 *
 * `t()` LOOKS UP BY ENGLISH STRING and returns English when there is no entry.
 * A missing translation is therefore a readable screen with one untranslated
 * phrase, never a blank or a raw key — which matters because the dictionaries
 * are filled in progressively by native speakers rather than all at once.
 *
 * DISPLAY ONLY — never wrap a value that is about to be sent to the API.
 * Dropdown answers are validated server-side against the seeded English
 * strings, so `t()` belongs on the render path and nowhere else. The pattern is
 * `<option value={v}>{t(v)}</option>`: translated label, original value.
 */

const DICTIONARIES: Record<LocaleCode, Record<string, string>> = {
  en: {},   // English is the source copy; an empty dictionary means "unchanged".
  ur,
};

type LocaleContextValue = {
  locale: LocaleCode;
  meta: LocaleMeta;
  setLocale: (code: LocaleCode) => void;
  t: (text: string) => string;
  /** True for any non-default locale — handy for conditional styling. */
  isTranslated: boolean;
};

const LocaleContext = React.createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  // Always starts at the default so the server-rendered HTML and the first
  // client render agree; the stored choice is applied in the effect below.
  // Reading localStorage during render would hydration-mismatch every string.
  const [locale, setLocaleState] = React.useState<LocaleCode>(DEFAULT_LOCALE);

  React.useEffect(() => {
    try {
      const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
      if (stored && stored in DICTIONARIES) {
        setLocaleState(stored as LocaleCode);
      }
    } catch {
      // Private mode / blocked site data — English is a fine outcome.
    }
  }, []);

  const setLocale = React.useCallback((code: LocaleCode) => {
    setLocaleState(code);
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, code);
    } catch {
      // Preference just won't survive a reload; the switch still works now.
    }
  }, []);

  const meta = getLocaleMeta(locale);

  const t = React.useCallback(
    (text: string) => {
      if (!text) return text;
      return DICTIONARIES[locale]?.[text] ?? text;
    },
    [locale],
  );

  const value = React.useMemo(
    () => ({ locale, meta, setLocale, t, isTranslated: locale !== DEFAULT_LOCALE }),
    [locale, meta, setLocale, t],
  );

  return (
    <LocaleContext.Provider value={value}>
      {/*
        `dir` drives Tailwind's rtl:/ltr: variants and the browser's own
        bidirectional layout, so setting it here flips the whole module without
        per-component work. The Nastaliq face is applied at the same level
        because Latin defaults render Urdu cramped and hard to read.
      */}
      <div dir={meta.dir} className={meta.fontClass || undefined}>
        {children}
      </div>
    </LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const ctx = React.useContext(LocaleContext);
  if (!ctx) {
    // Falling back rather than throwing keeps any component usable outside the
    // provider (tests, Storybook, a screen not yet wrapped) in plain English.
    return {
      locale: DEFAULT_LOCALE,
      meta: getLocaleMeta(DEFAULT_LOCALE),
      setLocale: () => {},
      t: (text: string) => text,
      isTranslated: false,
    };
  }
  return ctx;
}

/** Shorthand for the common case of only needing the translate function. */
export function useT(): (text: string) => string {
  return useLocale().t;
}
