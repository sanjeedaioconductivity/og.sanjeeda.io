import { describe, it, expect } from "vitest";
import {
  annualiseSalary,
  buildCurrentJobBaseline,
  compareMoney,
  compareNumbers,
  deltaSentiment,
} from "./currentJobBaseline";

describe("annualiseSalary", () => {
  it("multiplies a monthly figure by twelve", () => {
    expect(annualiseSalary(250_000, "Monthly")).toBe(3_000_000);
  });

  it("leaves an annual figure alone", () => {
    expect(annualiseSalary(3_000_000, "Annually")).toBe(3_000_000);
  });

  it("parses the Decimal column's string form", () => {
    expect(annualiseSalary("250000.00", "Monthly")).toBe(3_000_000);
  });

  it("treats an unrecognised frequency as already annual rather than multiplying", () => {
    // Guards the inflate-by-twelve failure: only 'Monthly' may scale.
    expect(annualiseSalary(3_000_000, "Fortnightly")).toBe(3_000_000);
    expect(annualiseSalary(3_000_000, null)).toBe(3_000_000);
  });

  it("returns null for missing, zero and unparseable amounts", () => {
    expect(annualiseSalary(null, "Monthly")).toBeNull();
    expect(annualiseSalary(0, "Monthly")).toBeNull();
    expect(annualiseSalary("not a number", "Monthly")).toBeNull();
  });
});

describe("buildCurrentJobBaseline", () => {
  const employed = {
    employmentStatus: "Employed",
    currentJobTitle: " Senior Analyst ",
    currentBaseSalary: "200000",
    currentCurrency: "pkr",
    payFrequency: "Monthly",
    currentWorkArrangement: "On-site",
    workingHoursPerWeek: 45,
    averageDailyCommuteMinutes: 60,
  };

  it("annualises pay and trims the text fields", () => {
    const baseline = buildCurrentJobBaseline(employed);
    expect(baseline.hasData).toBe(true);
    expect(baseline.annualBaseSalary).toBe(2_400_000);
    expect(baseline.jobTitle).toBe("Senior Analyst");
    expect(baseline.currency).toBe("pkr");
    expect(baseline.workingHoursPerWeek).toBe(45);
    expect(baseline.commuteMinutes).toBe(60);
  });

  it("has no data for a null profile", () => {
    expect(buildCurrentJobBaseline(null).hasData).toBe(false);
  });

  it("ignores stale values left behind by a candidate who is no longer employed", () => {
    // SCR-001 hides the section on a status change, it does not clear the
    // columns — so status, not presence of a number, decides.
    const baseline = buildCurrentJobBaseline({
      ...employed,
      employmentStatus: "Student",
    });
    expect(baseline.hasData).toBe(false);
    expect(baseline.annualBaseSalary).toBeNull();
  });

  it("has no data when an employed candidate never entered a current salary", () => {
    const baseline = buildCurrentJobBaseline({
      employmentStatus: "Employed",
      currentJobTitle: "Analyst",
      currentBaseSalary: null,
      currentWorkArrangement: "Remote",
      workingHoursPerWeek: 38,
      averageDailyCommuteMinutes: 15,
    });
    expect(baseline.hasData).toBe(false);
  });

  it("is NOT fooled by the SCR-001 defaults a skipped section leaves behind", () => {
    // The exact row a candidate who never opened the employment section has:
    // every field below is SCR001_DEFAULTS, none of it typed by them. Showing
    // it as a baseline prints "On-site · 40 / week · 0 min" as though they had
    // said so. Only the salary — which has no default — can turn this on.
    const untouched = buildCurrentJobBaseline({
      employmentStatus: "Employed",
      currentWorkArrangement: "On-site",
      workingHoursPerWeek: 40,
      averageDailyCommuteMinutes: 0,
      payFrequency: "Monthly",
      currentBaseSalary: null,
      currentCurrency: null,
    });
    expect(untouched.hasData).toBe(false);
  });

  it("still carries a zero-minute commute once a salary makes the baseline real", () => {
    const baseline = buildCurrentJobBaseline({
      employmentStatus: "Employed",
      currentBaseSalary: "500000",
      payFrequency: "Annually",
      averageDailyCommuteMinutes: 0,
    });
    expect(baseline.commuteMinutes).toBe(0);
    expect(baseline.hasData).toBe(true);
  });
});

describe("compareNumbers", () => {
  it("reports the delta, percentage and direction", () => {
    expect(compareNumbers(45, 40)).toEqual({
      delta: 5,
      percent: 13,
      direction: "up",
      comparable: true,
    });
  });

  it("reports a decrease", () => {
    const result = compareNumbers(30, 60);
    expect(result.delta).toBe(-30);
    expect(result.percent).toBe(-50);
    expect(result.direction).toBe("down");
  });

  it("calls an identical pair 'same'", () => {
    expect(compareNumbers(40, 40).direction).toBe("same");
  });

  it("gives a delta but no percentage against a zero baseline", () => {
    const result = compareNumbers(20, 0);
    expect(result.delta).toBe(20);
    expect(result.percent).toBeNull();
    expect(result.comparable).toBe(true);
  });

  it("is not comparable when either side is missing", () => {
    expect(compareNumbers(null, 40).comparable).toBe(false);
    expect(compareNumbers(40, null).comparable).toBe(false);
  });
});

describe("compareMoney", () => {
  it("compares two amounts in the same currency", () => {
    const result = compareMoney(3_600_000, "PKR", 2_400_000, "PKR");
    expect(result.percent).toBe(50);
    expect(result.comparable).toBe(true);
  });

  it("matches currency codes case-insensitively", () => {
    expect(compareMoney(100, "usd", 100, "USD").comparable).toBe(true);
  });

  it("REFUSES to compare across currencies — there is no FX rate in OfferGuide", () => {
    // The whole point of this function. A relocation offer in USD against a
    // current salary in PKR must never produce a percentage.
    const result = compareMoney(60_000, "USD", 2_400_000, "PKR");
    expect(result.comparable).toBe(false);
    expect(result.percent).toBeNull();
    expect(result.delta).toBeNull();
  });

  it("is not comparable when either currency is unknown", () => {
    expect(compareMoney(100, null, 100, "USD").comparable).toBe(false);
    expect(compareMoney(100, "USD", 100, null).comparable).toBe(false);
  });
});

describe("deltaSentiment", () => {
  it("reads a rise as better for a higher-is-better field", () => {
    expect(deltaSentiment(compareNumbers(120, 100))).toBe("better");
  });

  it("reads a rise as worse for a lower-is-better field such as commute", () => {
    expect(deltaSentiment(compareNumbers(90, 60), true)).toBe("worse");
  });

  it("reads a fall in commute as better", () => {
    expect(deltaSentiment(compareNumbers(20, 60), true)).toBe("better");
  });

  it("has no opinion on an incomparable pair", () => {
    expect(deltaSentiment(compareMoney(1, "USD", 1, "PKR"))).toBeNull();
  });
});
