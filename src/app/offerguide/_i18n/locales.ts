/**
 * OfferGuide — language registry.
 *
 * ADDING A LANGUAGE IS A DATA CHANGE, NOT A CODE CHANGE.
 * Register it here, drop a dictionary file beside this one, and it appears in
 * the switcher. Nothing else in the module needs touching — that is the whole
 * point of the design, because the realistic path to Sindhi / Punjabi / Balochi
 * is a native speaker filling in a file, not an engineer editing screens.
 *
 * TRANSLATIONS ARE DISPLAY-ONLY. Read this before adding a dictionary.
 * Every dropdown answer is validated server-side against the English strings
 * seeded in OgQuestions, byte-for-byte (`validateEnumField`). A translated value
 * that reaches the API is rejected with a 400. So the rule throughout is:
 *   - translate what the candidate READS
 *   - send and store the original English
 * `t()` is therefore only ever called on the rendering path. Nothing that feeds
 * a request body passes through it.
 *
 * COUNTRY AND CURRENCY NAMES ARE NOT IN THESE FILES.
 * They resolve from ISO codes through `Intl.DisplayNames`, which already knows
 * every locale — roughly 350 strings that never need hand-translating. See
 * _constants/currencies.ts and lib/offerguide/geoData.js.
 */

export type LocaleCode = 'en' | 'ur';

export type LocaleMeta = {
  code: LocaleCode;
  /** Shown in the switcher in English, for someone who cannot read the script. */
  label: string;
  /** Shown in the switcher in the language's own script. */
  nativeLabel: string;
  dir: 'ltr' | 'rtl';
  /**
   * Tailwind class applied to translated text. Urdu needs the Nastaliq face and
   * a looser line height — Latin defaults render it cramped and hard to read.
   * Empty for languages that use the app's normal typography.
   */
  fontClass: string;
};

export const LOCALES: readonly LocaleMeta[] = [
  {
    code: 'en',
    label: 'English',
    nativeLabel: 'English',
    dir: 'ltr',
    fontClass: '',
  },
  {
    code: 'ur',
    label: 'Urdu',
    nativeLabel: 'اردو',
    dir: 'rtl',
    fontClass: 'font-urdu leading-[1.9]',
  },
];

export const DEFAULT_LOCALE: LocaleCode = 'en';

export function getLocaleMeta(code: LocaleCode): LocaleMeta {
  return LOCALES.find((l) => l.code === code) ?? LOCALES[0];
}

/** Persisted so the choice survives a reload and the rest of the wizard. */
export const LOCALE_STORAGE_KEY = 'offerguide.locale';
