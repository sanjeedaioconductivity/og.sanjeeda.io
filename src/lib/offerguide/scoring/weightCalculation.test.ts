import { describe, it, expect } from "vitest";
import { computeCategoryWeights, ALL_SCORE_CATEGORIES } from "./weightCalculation";
import { ogScoringConfigsData } from "@/lib/db/mongo/seed-offerguide.js";
import { OgScoringConfig } from "@/lib/db/mongo/models/OgScoringConfig.js";

// Materializing a Mongoose document in-memory (no DB connection needed) is
// how these tests get the *real* schema defaults — priorityCategoryMap,
// priorityBoost, etc. — the exact same values a live-queried config would
// carry, without hand-duplicating them here.
const v1Config = new OgScoringConfig(ogScoringConfigsData[0]).toObject();
const v2Config = new OgScoringConfig(ogScoringConfigsData[1]).toObject();

describe("computeCategoryWeights — base weights", () => {
  it("defaults every category to weight 1.0 with no priorities/importance", () => {
    const weights = computeCategoryWeights({
      config: v1Config,
      evaluationPriorities: [],
      evaluationType: "New job offer",
      worklifeImportance: undefined,
      growthImportance: undefined,
      cultureImportance: undefined,
    });
    for (const category of ALL_SCORE_CATEGORIES) {
      expect(weights[category]).toBe(1);
    }
  });
});

describe("computeCategoryWeights — priority boost", () => {
  it("adds +1.2 to a directly-named category", () => {
    const weights = computeCategoryWeights({
      config: v1Config,
      evaluationPriorities: ["Growth"],
      evaluationType: "New job offer",
      worklifeImportance: undefined,
      growthImportance: undefined,
      cultureImportance: undefined,
    });
    expect(weights.Growth).toBeCloseTo(2.2);
    expect(weights.Culture).toBe(1);
  });

  it("maps the Security priority to the Stability category (special case)", () => {
    const weights = computeCategoryWeights({
      config: v1Config,
      evaluationPriorities: ["Security"],
      evaluationType: "New job offer",
      worklifeImportance: undefined,
      growthImportance: undefined,
      cultureImportance: undefined,
    });
    expect(weights.Stability).toBeCloseTo(2.2);
  });

  it("maps Flexibility / Commute to Work-Life", () => {
    const weights = computeCategoryWeights({
      config: v1Config,
      evaluationPriorities: ["Flexibility / Commute"],
      evaluationType: "New job offer",
      worklifeImportance: undefined,
      growthImportance: undefined,
      cultureImportance: undefined,
    });
    expect(weights["Work-Life"]).toBeCloseTo(2.2);
  });

  it("stacks boosts for multiple selected priorities", () => {
    const weights = computeCategoryWeights({
      config: v1Config,
      evaluationPriorities: ["Growth", "Culture"],
      evaluationType: "New job offer",
      worklifeImportance: undefined,
      growthImportance: undefined,
      cultureImportance: undefined,
    });
    expect(weights.Growth).toBeCloseTo(2.2);
    expect(weights.Culture).toBeCloseTo(2.2);
  });
});

describe("computeCategoryWeights — importance-slider and evaluation_type layers stay neutral under v1 (schema defaults)", () => {
  it("has zero effect from worklife/growth/culture importance at v1 defaults, even with non-default answers", () => {
    const weights = computeCategoryWeights({
      config: v1Config,
      evaluationPriorities: [],
      evaluationType: "Counteroffer",
      worklifeImportance: "High",
      growthImportance: 5,
      cultureImportance: 1,
    });
    expect(weights["Work-Life"]).toBe(1);
    expect(weights.Growth).toBe(1);
    expect(weights.Culture).toBe(1);
  });

  it("has zero effect when importance sliders sit at their own neutral midpoint, even under v1", () => {
    const weights = computeCategoryWeights({
      config: v1Config,
      evaluationPriorities: [],
      evaluationType: "New job offer",
      worklifeImportance: "Medium",
      growthImportance: 3,
      cultureImportance: 3,
    });
    expect(weights["Work-Life"]).toBe(1);
    expect(weights.Growth).toBe(1);
    expect(weights.Culture).toBe(1);
  });
});

describe("computeCategoryWeights — importance-slider layer is exercised (non-zero) under v2", () => {
  it("adjusts Work-Life weight by the configured Low/Medium/High delta", () => {
    const high = computeCategoryWeights({
      config: v2Config,
      evaluationPriorities: [],
      evaluationType: "New job offer",
      worklifeImportance: "High",
      growthImportance: undefined,
      cultureImportance: undefined,
    });
    expect(high["Work-Life"]).toBeCloseTo(1.4);

    const low = computeCategoryWeights({
      config: v2Config,
      evaluationPriorities: [],
      evaluationType: "New job offer",
      worklifeImportance: "Low",
      growthImportance: undefined,
      cultureImportance: undefined,
    });
    expect(low["Work-Life"]).toBeCloseTo(0.6);
  });

  it("adjusts Growth/Culture weight per point away from the 3-point midpoint", () => {
    const weights = computeCategoryWeights({
      config: v2Config,
      evaluationPriorities: [],
      evaluationType: "New job offer",
      worklifeImportance: undefined,
      growthImportance: 5, // (5-3) * 0.2 = +0.4
      cultureImportance: 1, // (1-3) * 0.2 = -0.4
    });
    expect(weights.Growth).toBeCloseTo(1.4);
    expect(weights.Culture).toBeCloseTo(0.6);
  });

  it("still stays neutral at the midpoint under v2", () => {
    const weights = computeCategoryWeights({
      config: v2Config,
      evaluationPriorities: [],
      evaluationType: "New job offer",
      worklifeImportance: "Medium",
      growthImportance: 3,
      cultureImportance: 3,
    });
    expect(weights["Work-Life"]).toBe(1);
    expect(weights.Growth).toBe(1);
    expect(weights.Culture).toBe(1);
  });
});

describe("computeCategoryWeights — weights never go negative", () => {
  it("floors a category's weight at 0", () => {
    const weights = computeCategoryWeights({
      config: {
        categoryBaseWeights: { "Work-Life": 0.1 },
        priorityBoost: 1.2,
        importanceWeighting: {
          offer_worklife_importance: { Low: -5, Medium: 0, High: 0 },
        },
      },
      evaluationPriorities: [],
      evaluationType: "New job offer",
      worklifeImportance: "Low",
      growthImportance: undefined,
      cultureImportance: undefined,
    });
    expect(weights["Work-Life"]).toBe(0);
  });
});
