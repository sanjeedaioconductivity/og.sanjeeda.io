/**
 * ISO 4217 currency list — every active circulating currency.
 *
 * TEMPORARY HOME. Every other reference list in this module comes from `/config/*`
 * (geography, functional domains, consent toggles), but no currency endpoint or
 * seed collection exists yet — so this ships as a frontend constant and is logged
 * as a backlog item to move behind `/config/currencies` alongside the others.
 * Adding a currency should not be a code change.
 *
 * NAMES ARE NOT HARDCODED.
 * Only the codes are listed. Display names come from `Intl.DisplayNames`, which
 * ships with the browser and knows every ISO 4217 code in every locale — so the
 * currency dropdown translates itself for free in any language added later, with
 * no translation file to maintain. `FALLBACK_NAMES` covers only the handful of
 * runtimes that lack currency display names, and the code itself is the last
 * resort, so an unknown currency degrades to "XAF" rather than blank.
 *
 * PKR leads because the FRS examples and the seeded market benchmarks are
 * Pakistan-based; the rest follow in alphabetical order by code.
 *
 * Related backlog item, already recorded in both the SCR-001 and SCR-004 FRS:
 * auto-suggesting the currency from the selected country. Deferred, so the
 * candidate picks it themselves and there is no default.
 */

export type Currency = { code: string; name: string };

/** Shown first — the module's primary market. */
const PRIORITY_CODES = ['PKR', 'USD', 'AED', 'SAR', 'GBP', 'EUR'] as const;

/** Every other active ISO 4217 code, alphabetical. */
const OTHER_CODES = [
  'AFN', 'ALL', 'AMD', 'ANG', 'AOA', 'ARS', 'AUD', 'AWG', 'AZN', 'BAM',
  'BBD', 'BDT', 'BGN', 'BHD', 'BIF', 'BMD', 'BND', 'BOB', 'BRL', 'BSD',
  'BTN', 'BWP', 'BYN', 'BZD', 'CAD', 'CDF', 'CHF', 'CLP', 'CNY', 'COP',
  'CRC', 'CUP', 'CVE', 'CZK', 'DJF', 'DKK', 'DOP', 'DZD', 'EGP', 'ERN',
  'ETB', 'FJD', 'FKP', 'GEL', 'GHS', 'GIP', 'GMD', 'GNF', 'GTQ', 'GYD',
  'HKD', 'HNL', 'HTG', 'HUF', 'IDR', 'ILS', 'INR', 'IQD', 'IRR', 'ISK',
  'JMD', 'JOD', 'JPY', 'KES', 'KGS', 'KHR', 'KMF', 'KPW', 'KRW', 'KWD',
  'KYD', 'KZT', 'LAK', 'LBP', 'LKR', 'LRD', 'LSL', 'LYD', 'MAD', 'MDL',
  'MGA', 'MKD', 'MMK', 'MNT', 'MOP', 'MRU', 'MUR', 'MVR', 'MWK', 'MXN',
  'MYR', 'MZN', 'NAD', 'NGN', 'NIO', 'NOK', 'NPR', 'NZD', 'OMR', 'PAB',
  'PEN', 'PGK', 'PHP', 'PLN', 'PYG', 'QAR', 'RON', 'RSD', 'RUB', 'RWF',
  'SBD', 'SCR', 'SDG', 'SEK', 'SGD', 'SHP', 'SLE', 'SOS', 'SRD', 'SSP',
  'STN', 'SVC', 'SYP', 'SZL', 'THB', 'TJS', 'TMT', 'TND', 'TOP', 'TRY',
  'TTD', 'TWD', 'TZS', 'UAH', 'UGX', 'UYU', 'UZS', 'VES', 'VND', 'VUV',
  'WST', 'XAF', 'XCD', 'XOF', 'XPF', 'YER', 'ZAR', 'ZMW', 'ZWG',
] as const;

export const CURRENCY_CODES: readonly string[] = [
  ...PRIORITY_CODES,
  ...OTHER_CODES.filter((c) => !PRIORITY_CODES.includes(c as never)),
];

/**
 * Used only where `Intl.DisplayNames` has no currency data. Covers the codes a
 * candidate in this module's markets is most likely to pick, so the common path
 * never degrades to a bare code.
 */
const FALLBACK_NAMES: Record<string, string> = {
  PKR: 'Pakistani Rupee',
  USD: 'US Dollar',
  AED: 'UAE Dirham',
  SAR: 'Saudi Riyal',
  GBP: 'British Pound',
  EUR: 'Euro',
  QAR: 'Qatari Riyal',
  KWD: 'Kuwaiti Dinar',
  BHD: 'Bahraini Dinar',
  OMR: 'Omani Rial',
  INR: 'Indian Rupee',
  BDT: 'Bangladeshi Taka',
  LKR: 'Sri Lankan Rupee',
  CAD: 'Canadian Dollar',
  AUD: 'Australian Dollar',
  SGD: 'Singapore Dollar',
  MYR: 'Malaysian Ringgit',
  TRY: 'Turkish Lira',
  CNY: 'Chinese Yuan',
  JPY: 'Japanese Yen',
};

/**
 * Localised currency name for a code.
 *
 * `locale` is passed in rather than read from a global so this stays a pure
 * function — the language switcher re-renders the dropdown by changing the
 * argument, and nothing here needs to know how language state is stored.
 */
export function currencyName(code: string, locale = 'en'): string {
  try {
    const name = new Intl.DisplayNames([locale], { type: 'currency' }).of(code);
    // Intl returns the input unchanged when it has no entry for the code.
    if (name && name !== code) return name;
  } catch {
    /* fall through */
  }
  return FALLBACK_NAMES[code] ?? code;
}

/** Combobox-ready — "PKR — Pakistani Rupee", matching the SCR-004 mockup. */
export function currencyOptions(locale = 'en') {
  return CURRENCY_CODES.map((code) => ({
    value: code,
    label: `${code} — ${currencyName(code, locale)}`,
  }));
}

/**
 * English snapshot, kept so existing synchronous imports and any server-side
 * formatting keep working unchanged.
 */
export const CURRENCIES: readonly Currency[] = CURRENCY_CODES.map((code) => ({
  code,
  name: currencyName(code),
}));

export const CURRENCY_OPTIONS = currencyOptions();
