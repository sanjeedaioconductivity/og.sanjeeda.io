/**
 * OfferGuide — the candidate's current job as a comparison baseline.
 *
 * CR-01 (prototype change request log, 27 Aug 2026): "Results table must compare
 * each offer against the candidate's current job, and support multiple offers
 * side by side."
 *
 * Side-by-side offers already existed (SCR-009 renders Offer A/B/C… and picks a
 * winner). What did not is the baseline: every number on the compare screen was
 * offer-vs-offer, so a candidate with one offer had nothing to measure it
 * against, and a candidate with three could see which offer won without knowing
 * whether any of them beat the job they already have.
 *
 * THE BASELINE IS NOT SCORED, AND THAT IS DELIBERATE. The scoring engine reads
 * offer answers; the current job has no offer row, no benefits table and no
 * culture answers, so putting it through `scoreOffer` would invent a number out
 * of mostly-absent input. Every field compared here is one the candidate
 * actually entered on SCR-001 about their current job, compared like-for-like
 * with the same field on the offer. No score, no fit percentage — facts only.
 *
 * ================== CURRENCY IS THE TRAP IN THIS FILE ==================
 *
 * `currentCurrency` (SCR-001) and `offerCurrency` (SCR-004) are independent ISO
 * codes and frequently differ — relocation offers are a core use case. There is
 * no FX rate anywhere in OfferGuide and no source to get one from, so a money
 * delta is computed ONLY when both sides carry the same currency code. When they
 * differ, `comparable` is false and the caller shows both figures side by side
 * with no arrow and no percentage. A "+180%" that is really just PKR against USD
 * would be the single most misleading number the product could print.
 *
 * =======================================================================
 */

/** Pay frequencies SCR-001 stores in `payFrequency`. */
export type PayFrequency = 'Monthly' | 'Annually' | string;

export type CurrentJobProfile = {
  currentJobTitle?: string | null;
  employmentStatus?: string | null;
  /** Decimal column — serialized as a string over the API. */
  currentBaseSalary?: string | number | null;
  currentCurrency?: string | null;
  payFrequency?: PayFrequency | null;
  currentWorkArrangement?: string | null;
  workingHoursPerWeek?: number | null;
  averageDailyCommuteMinutes?: number | null;
};

export type CurrentJobBaseline = {
  jobTitle: string | null;
  /** Always annual, whatever frequency the candidate entered. */
  annualBaseSalary: number | null;
  currency: string | null;
  workArrangement: string | null;
  workingHoursPerWeek: number | null;
  commuteMinutes: number | null;
  /**
   * False when there is nothing worth comparing against. The baseline column is
   * hidden entirely in that case rather than printing a column of defaults.
   *
   * ============ THIS HANGS ON THE SALARY, AND IT HAS TO ============
   *
   * Four of the current-job fields are PRE-FILLED by SCR-001 and saved for every
   * candidate whether or not they ever opened that section (SCR001_DEFAULTS):
   * employmentStatus 'Employed', currentWorkArrangement 'On-site',
   * workingHoursPerWeek 40, averageDailyCommuteMinutes 0. A candidate who
   * skipped the section entirely still has all four in the database, so "any
   * field is present" turns the baseline on for everyone — and then prints
   * "On-site · 40 / week · 0 min" as though they had said so. Verified in the
   * running app, which is how this was found.
   *
   * `currentBaseSalary` is the one field with no default: it is there only if the
   * candidate typed it. It is also the anchor of the comparison — the money rows
   * are why the table exists. So the rule is simply: a salary means there is a
   * current job to compare against, and no salary means there is not.
   */
  hasData: boolean;
};

/**
 * Statuses that mean "there is a current job to compare against". Mirrors
 * EMPLOYED_STATUSES in the SCR-001 constants; duplicated rather than imported
 * because this module is server-safe and must not pull in a screen's UI copy.
 */
const EMPLOYED_STATUSES = ['Employed', 'Self-Employed'];

export function annualiseSalary(
  amount: string | number | null | undefined,
  frequency: PayFrequency | null | undefined,
): number | null {
  const value = typeof amount === 'string' ? Number(amount) : amount;
  if (value == null || !Number.isFinite(value) || value <= 0) return null;
  // Anything that is not explicitly Monthly is treated as already annual —
  // 'Annually' is the only other value SCR-001 offers, and defaulting an
  // unrecognised string to ×12 would inflate the baseline twelvefold.
  return frequency === 'Monthly' ? value * 12 : value;
}

export function buildCurrentJobBaseline(
  profile: CurrentJobProfile | null | undefined,
): CurrentJobBaseline {
  const empty: CurrentJobBaseline = {
    jobTitle: null,
    annualBaseSalary: null,
    currency: null,
    workArrangement: null,
    workingHoursPerWeek: null,
    commuteMinutes: null,
    hasData: false,
  };
  if (!profile) return empty;

  // An unemployed candidate may still have stale values in these columns from an
  // earlier pass through SCR-001 — the screen hides the section rather than
  // clearing it. Employment status is what decides whether they mean anything.
  if (
    profile.employmentStatus != null &&
    !EMPLOYED_STATUSES.includes(profile.employmentStatus)
  ) {
    return empty;
  }

  const annualBaseSalary = annualiseSalary(
    profile.currentBaseSalary,
    profile.payFrequency,
  );
  const workingHoursPerWeek =
    profile.workingHoursPerWeek != null && profile.workingHoursPerWeek > 0
      ? profile.workingHoursPerWeek
      : null;
  const commuteMinutes =
    profile.averageDailyCommuteMinutes != null &&
    profile.averageDailyCommuteMinutes >= 0
      ? profile.averageDailyCommuteMinutes
      : null;

  return {
    jobTitle: profile.currentJobTitle?.trim() || null,
    annualBaseSalary,
    currency: profile.currentCurrency?.trim() || null,
    workArrangement: profile.currentWorkArrangement?.trim() || null,
    workingHoursPerWeek,
    commuteMinutes,
    // See the note on `hasData` above: the salary is the only one of these the
    // candidate has to type, so it is the only one that can stand for
    // "there is a current job here".
    hasData: annualBaseSalary !== null,
  };
}

export type NumericDelta = {
  /** offer − baseline, in the field's own unit. Null when not comparable. */
  delta: number | null;
  /** Rounded whole-percent change against the baseline. Null when not comparable. */
  percent: number | null;
  /**
   * 'up' / 'down' describe the NUMBER, never whether it is good news — 30 more
   * commute minutes is 'up'. `betterWhenLower` on the row decides the colour.
   */
  direction: 'up' | 'down' | 'same' | null;
  /** False when either side is missing, or when two currencies cannot be compared. */
  comparable: boolean;
};

const NOT_COMPARABLE: NumericDelta = {
  delta: null,
  percent: null,
  direction: null,
  comparable: false,
};

export function compareNumbers(
  offerValue: number | null | undefined,
  baselineValue: number | null | undefined,
): NumericDelta {
  if (offerValue == null || baselineValue == null) return NOT_COMPARABLE;
  const delta = offerValue - baselineValue;
  // A zero baseline has no meaningful percentage — the delta still does.
  const percent =
    baselineValue === 0 ? null : Math.round((delta / baselineValue) * 100);
  return {
    delta,
    percent,
    direction: delta === 0 ? 'same' : delta > 0 ? 'up' : 'down',
    comparable: true,
  };
}

/**
 * Money comparison. Identical to `compareNumbers` except that mismatched (or
 * missing) currency codes make the pair incomparable — see the header note.
 * Codes are matched case-insensitively; everything else stores them upper-case,
 * but a hand-seeded row should not silently disable the delta.
 */
export function compareMoney(
  offerValue: number | null | undefined,
  offerCurrency: string | null | undefined,
  baselineValue: number | null | undefined,
  baselineCurrency: string | null | undefined,
): NumericDelta {
  if (!offerCurrency || !baselineCurrency) return NOT_COMPARABLE;
  if (offerCurrency.trim().toUpperCase() !== baselineCurrency.trim().toUpperCase()) {
    return NOT_COMPARABLE;
  }
  return compareNumbers(offerValue, baselineValue);
}

/**
 * Whether a delta is good news for the candidate, given which way the field
 * runs. Salary up is good; commute up is not. Returns null when there is
 * nothing to judge, which renders as a neutral value with no arrow.
 */
export function deltaSentiment(
  delta: NumericDelta,
  betterWhenLower = false,
): 'better' | 'worse' | 'same' | null {
  if (!delta.comparable || delta.direction === null) return null;
  if (delta.direction === 'same') return 'same';
  const isUp = delta.direction === 'up';
  return isUp === betterWhenLower ? 'worse' : 'better';
}
