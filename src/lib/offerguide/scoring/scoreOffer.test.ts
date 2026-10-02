import { describe, it, expect } from "vitest";
import { scoreOffer } from "./scoreOffer";
import { FIELD_SCORING_RULES_VERSION } from "./constants";
import type { ScoringQuestionDoc } from "./fieldScore";
import type { MarketBenchmark } from "./salaryScore";

// One rating-type field per generic category, each pinned to a distinct
// score via its 1-5 answer, so the category average is exactly that field's
// score and the overall weighted total is fully predictable by hand.
const questions: ScoringQuestionDoc[] = [
  { fieldId: "offer_benefits_field", category: "Benefits", scoreType: "rating", ratingMultiplier: 20 }, // 5*20=100
  { fieldId: "offer_stability_field", category: "Stability", scoreType: "rating", ratingMultiplier: 20 }, // 4*20=80
  { fieldId: "offer_worklife_field", category: "Work-Life", scoreType: "rating", ratingMultiplier: 20 }, // 3*20=60
  { fieldId: "offer_growth_field", category: "Growth", scoreType: "rating", ratingMultiplier: 20 }, // 2*20=40
  { fieldId: "offer_culture_field", category: "Culture", scoreType: "rating", ratingMultiplier: 20 }, // 1*20=20
  { fieldId: "offer_purpose_field", category: "Purpose", scoreType: "rating", ratingMultiplier: 20 }, // 5*20=100
];

const answerSources = [
  {
    offerBenefitsField: 5,
    offerStabilityField: 4,
  },
  {
    offerWorklifeField: 3,
    offerGrowthField: 2,
  },
  {
    offerCultureField: 1,
    offerPurposeField: 5,
  },
];

const benchmarks: MarketBenchmark[] = [
  { role: "Software Engineer", location: "Lahore", p25: 200000, p75: 300000, sampleSize: 10 },
];

const neutralConfig = {
  categoryBaseWeights: {},
  priorityBoost: 1.2,
  priorityCategoryMap: {},
  importanceWeighting: {},
  evaluationTypeBonus: {},
};

function baseInput(configVersion: number) {
  return {
    compensation: {
      offerBaseSalary: 300000, // exactly p75, Annually -> percentile contributes +45
      offerPayPeriod: "Annually",
      offerNegotiationRoom: "Not applicable", // bonus 0 -> salaryScore 85
    },
    roleTitle: "Software Engineer",
    offerCity: "Lahore",
    offerCountry: "Pakistan",
    answerSources,
    session: { evaluationPriorities: [] as string[], evaluationType: "New job offer" },
    questions,
    config: neutralConfig,
    configVersion,
    benchmarks,
  };
}

describe("scoreOffer — orchestration", () => {
  it("computes the weighted overall score across all 7 categories with equal weights", () => {
    const result = scoreOffer(baseInput(1));

    expect(result.salaryScore).toBe(85);
    expect(result.benefitsScore).toBe(100);
    expect(result.stabilityScore).toBe(80);
    expect(result.worklifeScore).toBe(60);
    expect(result.growthScore).toBe(40);
    expect(result.cultureScore).toBe(20);
    expect(result.purposeScore).toBe(100);

    // (85+100+80+60+40+20+100) / 7 = 485/7 = 69.28... -> rounds to 69
    expect(result.overallScore).toBe(69);
  });

  it("derives the recommendation label from the 85/72/58 thresholds", () => {
    const result = scoreOffer(baseInput(1));
    expect(result.overallScore).toBe(69);
    expect(result.recommendationLabel).toBe("Moderate fit — clarify concerns");
  });

  it("records the exact configVersion it was given — never derives one from the config doc itself", () => {
    const result = scoreOffer(baseInput(7));
    expect(result.scoringConfigVersion).toBe(7);
  });

  it("stamps the current fieldScoringRulesVersion", () => {
    const result = scoreOffer(baseInput(1));
    expect(result.fieldScoringRulesVersion).toBe(FIELD_SCORING_RULES_VERSION);
  });

  it("includes a per-field and per-category breakdown for traceability", () => {
    const result = scoreOffer(baseInput(1));
    expect(result.scoreBreakdown.fields).toHaveLength(6);
    expect(result.scoreBreakdown.salary.score).toBe(85);
    expect(result.scoreBreakdown.categoryWeights.Salary).toBe(1);
  });
});
