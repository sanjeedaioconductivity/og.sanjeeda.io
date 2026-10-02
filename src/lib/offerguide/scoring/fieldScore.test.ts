import { describe, it, expect } from "vitest";
import { scoreField, ScoringDataError, ENUM_FALLBACK_SCORE, type ScoringQuestionDoc } from "./fieldScore";

const enumQuestion: ScoringQuestionDoc = {
  fieldId: "offer_probation",
  category: "Stability",
  scoreType: "enum",
  options: [
    { value: "No probation", score: 100 },
    { value: "3 months", score: 65 },
    { value: "Not clear", score: 20 }, // offer_probation's documented override
    { value: "Retired option", score: 999, active: false },
  ],
};

const ratingQuestion: ScoringQuestionDoc = {
  fieldId: "offer_team_culture_fit",
  category: "Culture",
  scoreType: "rating",
  ratingMultiplier: 20,
};

const numericQuestion: ScoringQuestionDoc = {
  fieldId: "offer_working_hours",
  category: "Work-Life",
  scoreType: "numeric",
  numericBands: [
    { upTo: 35, score: 100 },
    { upTo: 40, score: 85 },
    { upTo: 45, score: 65 },
    { upTo: 50, score: 45 },
    { score: 20 },
  ],
  nullScore: 45,
};

describe("scoreField — enum", () => {
  it("scores a matching active option", () => {
    expect(scoreField(enumQuestion, "3 months")).toBe(65);
  });

  it("honors a field's own per-field override (offer_probation Not clear = 20)", () => {
    expect(scoreField(enumQuestion, "Not clear")).toBe(20);
  });

  it("falls back to the neutral score for a blank answer", () => {
    expect(scoreField(enumQuestion, null)).toBe(ENUM_FALLBACK_SCORE);
    expect(scoreField(enumQuestion, undefined)).toBe(ENUM_FALLBACK_SCORE);
    expect(scoreField(enumQuestion, "")).toBe(ENUM_FALLBACK_SCORE);
  });

  it("falls back to the neutral score for an unmatched/retired option", () => {
    expect(scoreField(enumQuestion, "Retired option")).toBe(ENUM_FALLBACK_SCORE);
    expect(scoreField(enumQuestion, "Something unexpected")).toBe(ENUM_FALLBACK_SCORE);
  });
});

describe("scoreField — rating", () => {
  it("multiplies the 1-5 value by ratingMultiplier", () => {
    expect(scoreField(ratingQuestion, 3)).toBe(60);
    expect(scoreField(ratingQuestion, 5)).toBe(100);
    expect(scoreField(ratingQuestion, 1)).toBe(20);
  });
});

describe("scoreField — numeric", () => {
  it("scores a value inside a band", () => {
    expect(scoreField(numericQuestion, 32)).toBe(100); // inside first band
    expect(scoreField(numericQuestion, 42)).toBe(65); // inside a middle band
  });

  it("scores a value exactly at a band boundary as inclusive", () => {
    expect(scoreField(numericQuestion, 35)).toBe(100); // <= 35
    expect(scoreField(numericQuestion, 40)).toBe(85); // <= 40
  });

  it("falls into the catch-all band above every upTo threshold", () => {
    expect(scoreField(numericQuestion, 60)).toBe(20);
  });

  it("returns the field's own nullScore for a blank value", () => {
    expect(scoreField(numericQuestion, null)).toBe(45);
    expect(scoreField(numericQuestion, undefined)).toBe(45);
    expect(scoreField(numericQuestion, "")).toBe(45);
  });

  it("returns the field's own nullScore for malformed/unparseable input", () => {
    expect(scoreField(numericQuestion, "not a number" as unknown as number)).toBe(45);
  });
});

describe("scoreField — removed yesno scoreType (Epic 10.6)", () => {
  it("throws a ScoringDataError for a stale yesno document instead of silently guessing", () => {
    // "yesno" is off the type now, so a document still carrying it can only come
    // from stale data — the cast mimics exactly that untyped Mongo row.
    const yesnoQuestion = {
      fieldId: "offer_stale_field",
      category: "Culture",
      scoreType: "yesno",
    } as unknown as ScoringQuestionDoc;
    expect(() => scoreField(yesnoQuestion, "Yes")).toThrow(ScoringDataError);
  });
});
