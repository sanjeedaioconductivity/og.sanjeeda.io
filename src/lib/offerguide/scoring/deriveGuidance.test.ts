import { describe, it, expect } from "vitest";
import {
  deriveGuidance,
  DEFAULT_NEXT_STEP,
  type CategoryScores,
} from "./deriveGuidance";

// SCR-010 §6.3-6.5. These tests encode the FRS trigger tables directly — if a
// threshold here is changed without the FRS changing, that's the bug.

const scores = (over: Partial<CategoryScores> = {}): CategoryScores => ({
  salaryScore: 80,
  benefitsScore: 80,
  stabilityScore: 80,
  worklifeScore: 80,
  growthScore: 80,
  cultureScore: 80,
  purposeScore: 80,
  ...over,
});

/** Negotiation room "Low" is the only value that does NOT trigger the salary step. */
const noTriggers = { offerNegotiationRoom: "Low" };

describe("strengths (§6.3)", () => {
  it("includes only categories at or above 75, sorted descending, capped at 4", () => {
    const { strengths } = deriveGuidance(
      scores({
        salaryScore: 90,
        benefitsScore: 88,
        stabilityScore: 86,
        worklifeScore: 84,
        growthScore: 82, // 5th qualifier — must be dropped by the cap
        cultureScore: 74, // just below the threshold
        purposeScore: 20,
      }),
      noTriggers,
    );

    expect(strengths).toHaveLength(4);
    expect(strengths.map((s) => s.score)).toEqual([90, 88, 86, 84]);
    expect(strengths.map((s) => s.category)).not.toContain("Culture");
  });

  it("treats exactly 75 as qualifying, not excluded", () => {
    const { strengths } = deriveGuidance(
      scores({
        salaryScore: 75,
        benefitsScore: 10,
        stabilityScore: 10,
        worklifeScore: 10,
        growthScore: 10,
        cultureScore: 10,
        purposeScore: 10,
      }),
      noTriggers,
    );
    expect(strengths).toEqual([{ category: "Salary", score: 75 }]);
  });

  it("returns an empty list when nothing scores 75+ (drives the empty state)", () => {
    const { strengths } = deriveGuidance(
      scores({
        salaryScore: 74,
        benefitsScore: 60,
        stabilityScore: 60,
        worklifeScore: 60,
        growthScore: 60,
        cultureScore: 60,
        purposeScore: 60,
      }),
      noTriggers,
    );
    expect(strengths).toEqual([]);
  });
});

describe("watch-outs (§6.4)", () => {
  it("fires the three score-based triggers below 60", () => {
    const { watchOuts } = deriveGuidance(
      scores({ salaryScore: 59, worklifeScore: 59, cultureScore: 59 }),
      noTriggers,
    );
    expect(watchOuts).toEqual([
      "Salary appears below similar market signals",
      "Work-life balance may create stress",
      "Culture or manager signals need careful review",
    ]);
  });

  it("does not fire score triggers at exactly 60", () => {
    const { watchOuts } = deriveGuidance(
      scores({ salaryScore: 60, worklifeScore: 60, cultureScore: 60 }),
      noTriggers,
    );
    expect(watchOuts).toEqual([]);
  });

  it("flags a variable bonus only when the type is % of base AND an amount exists", () => {
    const withAmount = deriveGuidance(scores(), {
      ...noTriggers,
      offerAnnualBonusType: "% of base",
      offerAnnualBonus: 15,
    });
    expect(withAmount.watchOuts).toContain(
      "Bonus is variable — confirm payout rules",
    );

    // Type set but no amount entered is an unanswered question, not a risk.
    const withoutAmount = deriveGuidance(scores(), {
      ...noTriggers,
      offerAnnualBonusType: "% of base",
      offerAnnualBonus: null,
    });
    expect(withoutAmount.watchOuts).toEqual([]);
  });

  it("flags unclear overtime and a restrictive clause", () => {
    const { watchOuts } = deriveGuidance(scores(), {
      ...noTriggers,
      offerOvertimeCompensation: "Not clear",
      offerRestrictiveClause: "Yes",
    });
    expect(watchOuts).toEqual([
      "Overtime expectations are not clear",
      "Restrictive clause should be reviewed before accepting",
    ]);
  });

  it("emits one watch-out per selected red flag", () => {
    const { watchOuts } = deriveGuidance(scores(), {
      ...noTriggers,
      offerRedFlags: ["Poor communication", "Toxic manager vibe"],
    });
    expect(watchOuts).toEqual([
      "Interview red flag: Poor communication",
      "Interview red flag: Toxic manager vibe",
    ]);
  });

  it("parses red flags stored as a JSON string (Json column round-trip)", () => {
    const { watchOuts } = deriveGuidance(scores(), {
      ...noTriggers,
      offerRedFlags: '["Unclear role"]',
    });
    expect(watchOuts).toEqual(["Interview red flag: Unclear role"]);
  });

  it("caps at 5 and keeps score-based watch-outs ahead of field-signal ones", () => {
    const { watchOuts } = deriveGuidance(
      scores({ salaryScore: 10, worklifeScore: 10, cultureScore: 10 }),
      {
        ...noTriggers,
        offerOvertimeCompensation: "Not clear",
        offerRestrictiveClause: "Yes",
        offerRedFlags: ["Poor communication", "Unclear role"],
      },
    );

    expect(watchOuts).toHaveLength(5);
    // The 3 score-based ones survive the cap; the red flags are cut.
    expect(watchOuts.slice(0, 3)).toEqual([
      "Salary appears below similar market signals",
      "Work-life balance may create stress",
      "Culture or manager signals need careful review",
    ]);
    expect(watchOuts.join(" ")).not.toContain("red flag");
  });

  it("returns an empty list when nothing triggers (drives the empty state)", () => {
    expect(deriveGuidance(scores(), noTriggers).watchOuts).toEqual([]);
  });
});

describe("next steps (§6.5)", () => {
  it("falls back to the default when nothing triggers", () => {
    const { nextSteps } = deriveGuidance(scores(), noTriggers);
    expect(nextSteps).toEqual([DEFAULT_NEXT_STEP]);
  });

  it("triggers the salary step on negotiation room alone, even with a high salary score", () => {
    // The FRS trigger is an OR: "Salary score < 75 OR negotiation room ≠ Low".
    const { nextSteps } = deriveGuidance(scores({ salaryScore: 95 }), {
      offerNegotiationRoom: "High",
    });
    expect(nextSteps).toEqual(["Negotiate salary or guaranteed cash value"]);
  });

  it("sorts by category score ascending — lowest scoring categories first", () => {
    const { nextSteps } = deriveGuidance(
      scores({
        salaryScore: 70,
        growthScore: 40,
        worklifeScore: 55,
        cultureScore: 60,
      }),
      noTriggers,
    );
    expect(nextSteps).toEqual([
      "Clarify promotion path and learning support", // growth 40
      "Confirm work hours, hybrid policy, and overtime", // work-life 55
      "Ask more about manager expectations and team culture", // culture 60
      "Negotiate salary or guaranteed cash value", // salary 70
    ]);
  });

  it("caps at 4", () => {
    const { nextSteps } = deriveGuidance(
      scores({
        salaryScore: 10,
        growthScore: 20,
        worklifeScore: 30,
        cultureScore: 40,
      }),
      { offerNegotiationRoom: "High" },
    );
    expect(nextSteps).toHaveLength(4);
  });
});
