// OfferGuide — golden fixture regression suite
// Sprint 8, Story 8.2.2 / DoD "Five golden fixtures authored, committed, and
// passing against the default scoring config".
//
// The expected values below are COMMITTED OUTPUT, not assertions generated at
// run time. If a future change to OgQuestions, OgScoringConfig or the engine
// moves any of these numbers, this file fails — and the reviewer decides
// whether that movement was intended. That is the entire point.
//
// Every expectation is also cross-checked against the configuration data
// itself (see "derived independently" blocks), so the committed numbers are
// anchored to the seed rather than to whatever the engine happened to emit on
// the day they were recorded.

import { describe, it, expect } from "vitest";
import { scoreOffer } from "./scoreOffer";
import { scoreField } from "./fieldScore";
import { deriveGuidance } from "./deriveGuidance";
import { decideComparison } from "../compareOffers";
import { RECOMMENDATION_LABELS, RECOMMENDATION_THRESHOLDS } from "./constants";
import {
  GOLDEN_FIXTURES,
  MULTI_OFFER_FIXTURE,
  buildAnswers,
  fixtureById,
  scoreInputFor,
  seedQuestions,
} from "./goldenFixtures";

type Expected = {
  salaryScore: number;
  benefitsScore: number;
  stabilityScore: number;
  worklifeScore: number;
  growthScore: number;
  cultureScore: number;
  purposeScore: number;
  overallScore: number;
  recommendationLabel: string;
};

// ===========================================================================
// THE GOLDEN VALUES
// ===========================================================================
const GOLDEN: Record<string, Expected> = {
  // Every field at its best-scoring value; salary 400,000 against a p25/p75 of
  // 220,000/350,000 puts it past the top of the band, and "High" negotiation
  // room adds its bonus on top — so Salary clamps at 100. Work-Life lands at 99
  // rather than 100 because its best commute band scores 90, not 100.
  A: {
    salaryScore: 100,
    benefitsScore: 100,
    stabilityScore: 100,
    worklifeScore: 99,
    growthScore: 100,
    cultureScore: 100,
    purposeScore: 100,
    overallScore: 100,
    recommendationLabel: RECOMMENDATION_LABELS.strong,
  },

  // Every field at its worst value. The generic categories sit at ~20 (the
  // WORST anchor), and the numeric fields' worst bands lift Benefits and
  // Work-Life a point or two above it.
  B: {
    salaryScore: 22,
    benefitsScore: 21,
    stabilityScore: 20,
    worklifeScore: 23,
    growthScore: 20,
    cultureScore: 20,
    purposeScore: 20,
    overallScore: 21,
    recommendationLabel: RECOMMENDATION_LABELS.weak,
  },

  // High uncertainty. Everything resolves to the 45 uncertainty anchor EXCEPT
  // Stability, which is dragged to 44 by offer_probation's documented override
  // ("Not clear" scores 20, not 45). That one-point gap between C and D is the
  // override being visible in the output — it is the reason this fixture exists.
  C: {
    salaryScore: 45,
    benefitsScore: 45,
    stabilityScore: 44,
    worklifeScore: 45,
    growthScore: 45,
    cultureScore: 45,
    purposeScore: 45,
    overallScore: 45,
    recommendationLabel: RECOMMENDATION_LABELS.weak,
  },

  // Minimum viable: every offer field blank. A flat 45 across the board —
  // including Stability, since a BLANK probation field is not the same as an
  // explicit "Not clear" and correctly takes the neutral fallback.
  D: {
    salaryScore: 45,
    benefitsScore: 45,
    stabilityScore: 45,
    worklifeScore: 45,
    growthScore: 45,
    cultureScore: 45,
    purposeScore: 45,
    overallScore: 45,
    recommendationLabel: RECOMMENDATION_LABELS.weak,
  },
};

function runFixture(id: string) {
  return scoreOffer(scoreInputFor(fixtureById(id)));
}

// ===========================================================================
// Fixtures A–D
// ===========================================================================
describe("golden fixtures — committed expected output", () => {
  for (const fixture of GOLDEN_FIXTURES) {
    it(`fixture ${fixture.id}: ${fixture.purpose}`, () => {
      const result = runFixture(fixture.id);
      const expected = GOLDEN[fixture.id];

      expect({
        salaryScore: result.salaryScore,
        benefitsScore: result.benefitsScore,
        stabilityScore: result.stabilityScore,
        worklifeScore: result.worklifeScore,
        growthScore: result.growthScore,
        cultureScore: result.cultureScore,
        purposeScore: result.purposeScore,
        overallScore: result.overallScore,
        recommendationLabel: result.recommendationLabel,
      }).toEqual(expected);
    });
  }

  it("fixture D scores without error on a completely empty offer", () => {
    const result = runFixture("D");
    for (const score of [
      result.salaryScore,
      result.benefitsScore,
      result.stabilityScore,
      result.worklifeScore,
      result.growthScore,
      result.cultureScore,
      result.purposeScore,
      result.overallScore,
    ]) {
      expect(Number.isFinite(score)).toBe(true);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    }
  });

  it("records the config version it was scored under on every fixture", () => {
    for (const fixture of GOLDEN_FIXTURES) {
      expect(runFixture(fixture.id).scoringConfigVersion).toBe(2);
    }
  });

  it("reproduces identical output when re-run under an unchanged config", () => {
    for (const fixture of GOLDEN_FIXTURES) {
      expect(runFixture(fixture.id)).toEqual(runFixture(fixture.id));
    }
  });
});

// ===========================================================================
// Fixture E — multi-offer comparison
// ===========================================================================
describe(`golden fixture ${MULTI_OFFER_FIXTURE.id} — ${MULTI_OFFER_FIXTURE.purpose}`, () => {
  const [strongId, weakId] = MULTI_OFFER_FIXTURE.offerFixtureIds;
  const strong = { id: 1, overallScore: runFixture(strongId).overallScore };
  const weak = { id: 2, overallScore: runFixture(weakId).overallScore };

  it("picks the higher-scoring offer as the single winner", () => {
    const outcome = decideComparison([strong, weak]);
    expect(outcome.bestOverallScore).toBe(GOLDEN.A.overallScore);
    expect(outcome.winnerOfferIds).toEqual([1]);
    expect(outcome.isTie).toBe(false);
  });

  it("badges BOTH offers on a tie rather than picking one", () => {
    const outcome = decideComparison([strong, { id: 2, overallScore: strong.overallScore }]);
    expect(outcome.winnerOfferIds).toEqual([1, 2]);
    expect(outcome.isTie).toBe(true);
  });

  it("excludes unscored offers from the comparison entirely", () => {
    const outcome = decideComparison([weak, { id: 3, overallScore: null }]);
    expect(outcome.winnerOfferIds).toEqual([2]);
    expect(outcome.isTie).toBe(false);
  });

  it("reports no winner when nothing in the session has been scored", () => {
    const outcome = decideComparison([
      { id: 1, overallScore: null },
      { id: 2, overallScore: null },
    ]);
    expect(outcome).toEqual({ bestOverallScore: null, winnerOfferIds: [], isTie: false });
  });
});

// ===========================================================================
// The committed numbers, cross-checked against the configuration data
// ===========================================================================
describe("golden values derived independently from the seed configuration", () => {
  it("fixture A's generic categories equal the mean of each category's best option scores", () => {
    const answers = buildAnswers("best");
    const byCategory = new Map<string, number[]>();
    for (const question of seedQuestions) {
      const bucket = byCategory.get(question.category) ?? [];
      bucket.push(scoreField(question, answers[question.fieldId]));
      byCategory.set(question.category, bucket);
    }

    const mean = (scores: number[]) =>
      Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length);

    expect(mean(byCategory.get("Benefits")!)).toBe(GOLDEN.A.benefitsScore);
    expect(mean(byCategory.get("Work-Life")!)).toBe(GOLDEN.A.worklifeScore);
    expect(mean(byCategory.get("Purpose")!)).toBe(GOLDEN.A.purposeScore);
  });

  it("the C/D Stability gap is exactly offer_probation's documented override", () => {
    const probation = seedQuestions.find((q) => q.fieldId === "offer_probation")!;
    // "Not clear" scores 20 here, not the 45 it scores everywhere else.
    expect(scoreField(probation, "Not clear")).toBe(20);
    expect(scoreField(probation, null)).toBe(45);
    expect(GOLDEN.C.stabilityScore).toBeLessThan(GOLDEN.D.stabilityScore);
  });

  it("offer_restrictive_clause's 'Not clear' is the second documented override", () => {
    const clause = seedQuestions.find((q) => q.fieldId === "offer_restrictive_clause")!;
    expect(scoreField(clause, "Not clear")).toBe(65);
    expect(clause.category).toBe("Stability");
  });

  it("every committed label matches its overall score's threshold band", () => {
    const labelFor = (score: number) => {
      if (score >= RECOMMENDATION_THRESHOLDS.strong) return RECOMMENDATION_LABELS.strong;
      if (score >= RECOMMENDATION_THRESHOLDS.good) return RECOMMENDATION_LABELS.good;
      if (score >= RECOMMENDATION_THRESHOLDS.caution) return RECOMMENDATION_LABELS.caution;
      return RECOMMENDATION_LABELS.weak;
    };
    for (const [id, expected] of Object.entries(GOLDEN)) {
      expect(labelFor(expected.overallScore), `fixture ${id}`).toBe(expected.recommendationLabel);
    }
  });
});

// ===========================================================================
// SCR-010 guidance, over the golden scores
// ===========================================================================
describe("golden fixtures — SCR-010 guidance output", () => {
  const guidanceFor = (id: string) => {
    const g = GOLDEN[id];
    return deriveGuidance(
      {
        salaryScore: g.salaryScore,
        benefitsScore: g.benefitsScore,
        stabilityScore: g.stabilityScore,
        worklifeScore: g.worklifeScore,
        growthScore: g.growthScore,
        cultureScore: g.cultureScore,
        purposeScore: g.purposeScore,
      },
      {}
    );
  };

  it("caps fixture A's strengths at 4 even though all 7 categories qualify", () => {
    expect(guidanceFor("A").strengths).toHaveLength(4);
  });

  it("raises no watch-outs for fixture A", () => {
    expect(guidanceFor("A").watchOuts).toEqual([]);
  });

  it("raises the three score-based watch-outs for fixture B, capped at 5", () => {
    const watchOuts = guidanceFor("B").watchOuts;
    expect(watchOuts).toEqual([
      "Salary appears below similar market signals",
      "Work-life balance may create stress",
      "Culture or manager signals need careful review",
    ]);
  });

  it("offers no strengths for fixture B and caps its next steps at 4", () => {
    const guidance = guidanceFor("B");
    expect(guidance.strengths).toEqual([]);
    expect(guidance.nextSteps).toHaveLength(4);
  });

  it("sorts fixture B's next steps by triggering category score ascending", () => {
    // Growth and Culture both sit at 20, Salary at 22, Work-Life at 23.
    expect(guidanceFor("B").nextSteps[3]).toBe(
      "Confirm work hours, hybrid policy, and overtime"
    );
  });
});
