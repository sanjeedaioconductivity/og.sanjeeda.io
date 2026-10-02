import { describe, it, expect } from "vitest";
import { scoreCategories, GENERIC_CATEGORIES } from "./categoryScore";
import { ogQuestionsData } from "@/lib/db/mongo/seed-offerguide.js";
import type { ScoringQuestionDoc } from "./fieldScore";

// The scoring engine must group fields by whatever OgQuestions.category
// currently says — this test exercises the actual seed data (the "current
// seed data" the Sprint 5 handoff's acceptance criteria refer to), not a
// hand-duplicated copy that could silently drift from it.
const questions = ogQuestionsData as unknown as ScoringQuestionDoc[];

describe("scoreCategories — category grouping against real seed data", () => {
  it("seed data contains exactly 48 fields, all in the 6 generic categories", () => {
    expect(questions).toHaveLength(48);
    for (const q of questions) {
      expect(GENERIC_CATEGORIES).toContain(q.category);
    }
  });

  it("every field resolves to the category declared on its own OgQuestions document", () => {
    // No answers supplied — every field falls back to a neutral/nullScore,
    // but fieldDetails still records which category each field landed in.
    const { fieldDetails } = scoreCategories(questions, {});
    const expected = new Map(questions.map((q) => [q.fieldId, q.category]));

    expect(fieldDetails).toHaveLength(48);
    for (const detail of fieldDetails) {
      expect(detail.category).toBe(expected.get(detail.fieldId));
    }
  });

  it("reassigning a field's category (config-driven, not hardcoded) changes its bucket with no code change", () => {
    const original = questions.find((q) => q.fieldId === "offer_purpose_sense")!;
    const reassigned: ScoringQuestionDoc = { ...original, category: "Culture" };
    const patched = questions.map((q) => (q.fieldId === "offer_purpose_sense" ? reassigned : q));

    const { fieldDetails } = scoreCategories(patched, {});
    const purposeField = fieldDetails.find((f) => f.fieldId === "offer_purpose_sense");
    expect(purposeField?.category).toBe("Culture");
  });

  it("averages each category's field scores using each field's own scoring rules", () => {
    const { categoryScores } = scoreCategories(questions, {
      offer_probation: "No probation", // Stability, enum, score 100
      offer_employment_type: "Full-time", // Stability, enum, score 100
      offer_job_security: "Very secure", // Stability, enum, score 100
      offer_restrictive_clause: "No", // Stability, enum, score 100
      offer_company_reputation: "Strong", // Stability, enum, score 100
      offer_leadership_stability: "Stable", // Stability, enum, score 100
    });
    expect(categoryScores.Stability).toBe(100);
  });

  it("never places Salary in the generic categories (Salary isn't in OgQuestions)", () => {
    expect(questions.some((q) => q.category === "Salary")).toBe(false);
  });
});
