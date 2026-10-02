// OfferGuide — Sprint 8, Story 8.2.2: scoring engine vs. the specification
//
// Everything here is checked against SCR-010's FRS and the seeded
// configuration data, never against the prototype — `app.js` is superseded and
// is not a test reference. Where the two disagree, the FRS wins and the
// prototype's behaviour is the thing that was deliberately corrected.

import { describe, it, expect } from "vitest";
import { scoreOffer } from "./scoreOffer";
import { scoreField } from "./fieldScore";
import { scoreCategories } from "./categoryScore";
import { scoreSalary } from "./salaryScore";
import { computeCategoryWeights } from "./weightCalculation";
import { RECOMMENDATION_LABELS, RECOMMENDATION_THRESHOLDS } from "./constants";
import type { ScoringQuestionDoc } from "./fieldScore";
import {
  activeScoringConfig,
  seedQuestions,
  seedBenchmarks,
  buildAnswers,
  scoreInputFor,
  fixtureById,
} from "./goldenFixtures";

const questionById = (fieldId: string): ScoringQuestionDoc => {
  const question = seedQuestions.find((q) => q.fieldId === fieldId);
  if (!question) throw new Error(`Seed has no question "${fieldId}".`);
  return question;
};

// ===========================================================================
// SCR-010 §6.1 — recommendation thresholds and labels
// ===========================================================================
describe("SCR-010 §6.1 — four thresholds, four labels", () => {
  it("uses the 85 / 72 / 58 boundaries", () => {
    expect(RECOMMENDATION_THRESHOLDS).toEqual({ strong: 85, good: 72, caution: 58 });
  });

  it("uses the FRS's exact label wording", () => {
    expect(RECOMMENDATION_LABELS).toEqual({
      strong: "Excellent fit — strong offer",
      good: "Good fit — negotiate a few points",
      caution: "Moderate fit — clarify concerns",
      weak: "Weak fit — proceed carefully",
    });
  });
});

// ===========================================================================
// §4.2 — category composition is field-driven
// ===========================================================================
describe("category composition is derived from OgQuestions.category, not hardcoded", () => {
  it("a new question joins its category's average with no code change", () => {
    // The acceptance criterion names adding a question via the admin API; the
    // engine-side equivalent is passing one extra document in. If any
    // field-to-category map were hardcoded, this new fieldId would be ignored.
    const purposeOnly = seedQuestions.filter((q) => q.category === "Purpose");
    const answers = { ...buildAnswers("best") };

    const before = scoreCategories(purposeOnly, answers).categoryScores.Purpose;
    expect(before).toBe(100);

    const added: ScoringQuestionDoc = {
      fieldId: "offer_new_purpose_signal",
      category: "Purpose",
      scoreType: "rating",
      ratingMultiplier: 20,
    };
    answers[added.fieldId] = 1; // 1 x 20 = 20

    const after = scoreCategories([...purposeOnly, added], answers).categoryScores.Purpose;
    expect(after).toBe(60); // (100 + 20) / 2
  });

  it("reassigning a question's category moves its score with it", () => {
    const question: ScoringQuestionDoc = {
      fieldId: "offer_movable",
      category: "Growth",
      scoreType: "rating",
      ratingMultiplier: 20,
    };
    const answers = { offer_movable: 5 };

    expect(scoreCategories([question], answers).categoryScores.Growth).toBe(100);
    expect(
      scoreCategories([{ ...question, category: "Culture" }], answers).categoryScores.Culture
    ).toBe(100);
  });

  it("Purpose is composed of exactly one field, offer_purpose_sense", () => {
    const purpose = seedQuestions.filter((q) => q.category === "Purpose");
    expect(purpose.map((q) => q.fieldId)).toEqual(["offer_purpose_sense"]);
  });

  it("offer_values_alignment scores into Culture and does not feed Purpose", () => {
    expect(questionById("offer_values_alignment").category).toBe("Culture");
  });

  it("offer_restrictive_clause scores into Stability, not Benefits", () => {
    expect(questionById("offer_restrictive_clause").category).toBe("Stability");
  });

  it("never scores offer_notes, the importance sliders, or offer_red_flags as questions", () => {
    const scoredFieldIds = seedQuestions.map((q) => q.fieldId);
    for (const excluded of [
      "offer_notes",
      "offer_red_flags",
      "offer_worklife_importance",
      "offer_growth_importance",
      "offer_culture_importance",
    ]) {
      expect(scoredFieldIds, `${excluded} must not be a scored question`).not.toContain(excluded);
    }
  });
});

// ===========================================================================
// §4.2 — the enum scale and its two documented overrides
// ===========================================================================
describe("enum scale 100 / 65 / 45 / 20, with two documented overrides", () => {
  it("offer_probation's 'Not clear' scores 20, not the standard 45", () => {
    expect(scoreField(questionById("offer_probation"), "Not clear")).toBe(20);
  });

  it("offer_restrictive_clause's 'Not clear' scores 65, not the standard 45", () => {
    expect(scoreField(questionById("offer_restrictive_clause"), "Not clear")).toBe(65);
  });

  it("every other field's uncertainty options score the standard 45", () => {
    const overrides = new Set(["offer_probation", "offer_restrictive_clause"]);
    for (const question of seedQuestions) {
      if (question.scoreType !== "enum" || overrides.has(question.fieldId)) continue;
      for (const option of question.options ?? []) {
        if (["Not clear", "Not sure", "Not applicable"].includes(option.value)) {
          expect(option.score, `${question.fieldId} / ${option.value}`).toBe(45);
        }
      }
    }
  });

  it("keeps every enum option inside the 20–100 anchor range", () => {
    // Not every field uses only the four anchors: fields with more than four
    // ordered options (offer_sick_leave, offer_weekend_work, offer_hybrid_days
    // and friends) grade between them — 78, 55, 30 and so on. That is the
    // configured scale, deliberately. What must hold is that no option scores
    // below the WORST anchor or above the BEST one.
    for (const question of seedQuestions) {
      if (question.scoreType !== "enum") continue;
      for (const option of question.options ?? []) {
        const label = `${question.fieldId} / ${option.value}`;
        expect(option.score, label).toBeGreaterThanOrEqual(20);
        expect(option.score, label).toBeLessThanOrEqual(100);
      }
    }
  });

  it("gives every enum field a best option at the 100 anchor", () => {
    for (const question of seedQuestions) {
      if (question.scoreType !== "enum") continue;
      const scores = (question.options ?? []).map((option) => option.score);
      expect(Math.max(...scores), question.fieldId).toBe(100);
    }
  });

  it("scores an unmatched or blank enum answer as uncertainty, not as zero", () => {
    const question = questionById("offer_health_coverage");
    expect(scoreField(question, null)).toBe(45);
    expect(scoreField(question, "")).toBe(45);
    expect(scoreField(question, "a value that is not an option")).toBe(45);
  });
});

// ===========================================================================
// §4.2 — rating and numeric fields
// ===========================================================================
describe("rating fields resolve as 1–5 × the configured multiplier", () => {
  const rating = questionById("offer_purpose_sense");

  it("scales each point by the multiplier", () => {
    for (const [answer, expected] of [
      [1, 20],
      [2, 40],
      [3, 60],
      [4, 80],
      [5, 100],
    ] as const) {
      expect(scoreField(rating, answer)).toBe(expected);
    }
  });

  it("treats an untouched slider as uncertainty, never as zero", () => {
    // Regression guard, Sprint 8: Number(null) is 0, not NaN, so a blank rating
    // used to score 0 — worse than the worst answer a candidate could give.
    expect(scoreField(rating, null)).toBe(45);
    expect(scoreField(rating, undefined)).toBe(45);
    expect(scoreField(rating, "")).toBe(45);
  });
});

describe("numeric fields resolve through numericBands, verified at each boundary", () => {
  const cases: [string, [number, number][]][] = [
    [
      "offer_working_hours",
      [
        [35, 100],
        [36, 85],
        [40, 85],
        [41, 65],
        [45, 65],
        [46, 45],
        [50, 45],
        [51, 20],
      ],
    ],
    [
      "offer_commute_minutes",
      [
        [30, 90],
        [31, 70],
        [60, 70],
        [61, 48],
        [90, 48],
        [91, 30],
      ],
    ],
    [
      "offer_annual_leave_days",
      [
        [10, 25],
        [11, 50],
        [15, 50],
        [16, 75],
        [20, 75],
        [21, 90],
        [30, 90],
        [31, 100],
      ],
    ],
  ];

  for (const [fieldId, boundaries] of cases) {
    describe(fieldId, () => {
      const question = questionById(fieldId);
      for (const [value, expected] of boundaries) {
        it(`${value} scores ${expected}`, () => {
          expect(scoreField(question, value)).toBe(expected);
        });
      }
      it("resolves a blank value through nullScore", () => {
        expect(scoreField(question, null)).toBe(question.nullScore ?? 45);
      });
    });
  }
});

// ===========================================================================
// §4.2 — Salary
// ===========================================================================
describe("Salary uses its dedicated percentile formula and is excluded from generic averaging", () => {
  it("is not a question in OgQuestions at all", () => {
    expect(seedQuestions.some((q) => q.category === "Salary")).toBe(false);
  });

  it("scales between the benchmark p25 and p75", () => {
    const at = (baseSalary: number) =>
      scoreSalary({
        baseSalary,
        payPeriod: "Annually",
        negotiationRoom: "Low",
        roleTitle: "Software Engineer",
        location: "Lahore",
        benchmarks: seedBenchmarks,
      }).score;

    // Only one benchmark matches the role, so the pool degrades to the full
    // set — the point being that the score still rises monotonically with pay.
    expect(at(150_000)).toBeLessThan(at(300_000));
    expect(at(300_000)).toBeLessThan(at(500_000));
  });

  it("adds the negotiation-room bonus", () => {
    const withRoom = (negotiationRoom: string) =>
      scoreSalary({
        baseSalary: 250_000,
        payPeriod: "Annually",
        negotiationRoom,
        roleTitle: "Software Engineer",
        location: "Lahore",
        benchmarks: seedBenchmarks,
      }).score;

    expect(withRoom("High")).toBeGreaterThan(withRoom("Medium"));
    expect(withRoom("Medium")).toBeGreaterThan(withRoom("Low"));
  });

  it("annualises a monthly figure before comparing it to annual benchmarks", () => {
    const common = {
      negotiationRoom: "Low",
      roleTitle: "Software Engineer",
      location: "Lahore",
      benchmarks: seedBenchmarks,
    };
    expect(scoreSalary({ ...common, baseSalary: 25_000, payPeriod: "Monthly" }).score).toBe(
      scoreSalary({ ...common, baseSalary: 300_000, payPeriod: "Annually" }).score
    );
  });

  it("has a DEFINED no-benchmark path — it degrades in stages, then falls back flat", () => {
    // The handoff flagged this as a possible Sprint 5 defect. It is not one:
    // role match -> location match -> whole pool, and only a genuinely empty
    // collection reaches the flat fallback.
    const unmatched = scoreSalary({
      baseSalary: 300_000,
      payPeriod: "Annually",
      negotiationRoom: "Low",
      roleTitle: "Astronaut",
      location: "Reykjavik",
      benchmarks: seedBenchmarks,
    });
    expect(unmatched.benchmarkPoolStage).toBe("full");
    expect(unmatched.usedNoBaseSalaryFallback).toBe(false);

    const noData = scoreSalary({
      baseSalary: 300_000,
      payPeriod: "Annually",
      negotiationRoom: "Low",
      roleTitle: "Astronaut",
      location: "Reykjavik",
      benchmarks: [],
    });
    expect(noData.benchmarkPoolStage).toBe("none");
    expect(noData.usedNoBaseSalaryFallback).toBe(true);
    expect(noData.score).toBe(45);
  });

  it("falls back flat when no base salary was entered, without selecting a pool", () => {
    const result = scoreSalary({
      baseSalary: null,
      payPeriod: null,
      negotiationRoom: "High",
      roleTitle: "Software Engineer",
      location: "Lahore",
      benchmarks: seedBenchmarks,
    });
    expect(result.usedNoBaseSalaryFallback).toBe(true);
    expect(result.benchmarkPoolStage).toBe("none");
  });
});

// ===========================================================================
// SCR-010 §7 — weighting
// ===========================================================================
describe("SCR-010 §7 — category weights", () => {
  const baseWeightInput = {
    config: activeScoringConfig,
    evaluationPriorities: [] as string[],
    evaluationType: "New job offer",
    worklifeImportance: null,
    growthImportance: null,
    cultureImportance: null,
  };

  it("starts every category at base weight 1.0", () => {
    const weights = computeCategoryWeights(baseWeightInput);
    for (const weight of Object.values(weights)) expect(weight).toBe(1);
  });

  it("adds priorityBoost 1.2 per selected priority", () => {
    const weights = computeCategoryWeights({
      ...baseWeightInput,
      evaluationPriorities: ["Salary"],
    });
    expect(weights.Salary).toBeCloseTo(2.2);
    expect(weights.Growth).toBe(1);
  });

  it("maps every priority exactly as §7's table does", () => {
    const mapping: [string, string][] = [
      ["Salary", "Salary"],
      ["Growth", "Growth"],
      ["Stability", "Stability"],
      ["Flexibility / Commute", "Work-Life"],
      ["Benefits", "Benefits"],
      ["Culture", "Culture"],
      ["Purpose", "Purpose"],
      ["Security", "Stability"],
    ];

    for (const [priority, category] of mapping) {
      const weights = computeCategoryWeights({
        ...baseWeightInput,
        evaluationPriorities: [priority],
      });
      expect(weights[category as keyof typeof weights], `${priority} -> ${category}`).toBeCloseTo(2.2);
    }
  });

  it("boosts Stability — not a category of its own — for the Security priority", () => {
    const weights = computeCategoryWeights({
      ...baseWeightInput,
      evaluationPriorities: ["Security"],
    });
    expect(weights.Stability).toBeCloseTo(2.2);
    expect(Object.keys(weights)).not.toContain("Security");
  });

  it("routes Flexibility / Commute to Work-Life", () => {
    const weights = computeCategoryWeights({
      ...baseWeightInput,
      evaluationPriorities: ["Flexibility / Commute"],
    });
    expect(weights["Work-Life"]).toBeCloseTo(2.2);
  });

  it("ignores an unmapped 'Other' free-text priority entirely", () => {
    const weights = computeCategoryWeights({
      ...baseWeightInput,
      evaluationPriorities: ["Something the candidate typed"],
    });
    for (const weight of Object.values(weights)) expect(weight).toBe(1);
  });

  it("lets the importance sliders adjust their category weights", () => {
    const high = computeCategoryWeights({ ...baseWeightInput, worklifeImportance: "High" });
    const low = computeCategoryWeights({ ...baseWeightInput, worklifeImportance: "Low" });
    expect(high["Work-Life"]).toBeGreaterThan(low["Work-Life"]);

    const keenOnGrowth = computeCategoryWeights({ ...baseWeightInput, growthImportance: 5 });
    expect(keenOnGrowth.Growth).toBeGreaterThan(1);
  });

  it("treats an untouched importance slider (midpoint 3) as no adjustment", () => {
    const weights = computeCategoryWeights({
      ...baseWeightInput,
      growthImportance: 3,
      cultureImportance: 3,
    });
    expect(weights.Growth).toBe(1);
    expect(weights.Culture).toBe(1);
  });
});

// ===========================================================================
// Reproducibility
// ===========================================================================
describe("scoring is reproducible and version-stamped", () => {
  it("stamps the session's pinned config version, not the active one", () => {
    const input = scoreInputFor(fixtureById("A"));
    expect(scoreOffer({ ...input, configVersion: 7 }).scoringConfigVersion).toBe(7);
  });

  it("produces byte-identical output across runs under an unchanged config", () => {
    const input = scoreInputFor(fixtureById("C"));
    expect(JSON.stringify(scoreOffer(input))).toBe(JSON.stringify(scoreOffer(input)));
  });
});
