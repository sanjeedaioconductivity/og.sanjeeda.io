// Sprint 10, Epic 10.3 — the Questions editor's scoreType-dependent validation.
//
// Mirrors the scoring engine's own rules so a Save can't produce a document the
// engine would later reject or mis-score. yesno is absent by construction
// (Epic 10.6) — SCORE_TYPES is the three writable types.

import { describe, it, expect } from "vitest";
import { SCORE_TYPES, validateScoringShape } from "./questionTypes";

describe("SCORE_TYPES excludes the removed yesno type", () => {
  it("offers exactly enum, rating, numeric", () => {
    expect([...SCORE_TYPES]).toEqual(["enum", "rating", "numeric"]);
  });
});

describe("enum", () => {
  it("accepts options that each have a value and numeric score", () => {
    expect(
      validateScoringShape({ scoreType: "enum", options: [{ value: "Yes", sortOrder: 1, active: true, score: 100 }] })
    ).toBeNull();
  });

  it("rejects no options", () => {
    expect(validateScoringShape({ scoreType: "enum", options: [] })).toMatch(/at least one option/);
  });

  it("rejects an option missing a value", () => {
    expect(
      validateScoringShape({ scoreType: "enum", options: [{ value: "", sortOrder: 1, active: true, score: 10 }] })
    ).toMatch(/needs a value/);
  });
});

describe("rating", () => {
  it("accepts a positive multiplier", () => {
    expect(validateScoringShape({ scoreType: "rating", ratingMultiplier: 20 })).toBeNull();
  });

  it("rejects a zero or missing multiplier", () => {
    expect(validateScoringShape({ scoreType: "rating", ratingMultiplier: 0 })).toMatch(/positive multiplier/);
    expect(validateScoringShape({ scoreType: "rating" })).toMatch(/positive multiplier/);
  });
});

describe("numeric", () => {
  const ok = { scoreType: "numeric" as const, numericBands: [{ upTo: 10, score: 25 }, { upTo: 20, score: 60 }, { score: 100 }], nullScore: 45 };

  it("accepts ascending bands with one open-ended catch-all last and a nullScore", () => {
    expect(validateScoringShape(ok)).toBeNull();
  });

  it("rejects bands that don't strictly ascend", () => {
    expect(
      validateScoringShape({ ...ok, numericBands: [{ upTo: 20, score: 25 }, { upTo: 10, score: 60 }, { score: 100 }] })
    ).toMatch(/strictly ascend/);
  });

  it("rejects when no band is open-ended", () => {
    expect(
      validateScoringShape({ ...ok, numericBands: [{ upTo: 10, score: 25 }, { upTo: 20, score: 60 }] })
    ).toMatch(/one band must be open-ended/);
  });

  it("rejects when the open-ended band isn't last", () => {
    expect(
      validateScoringShape({ ...ok, numericBands: [{ score: 100 }, { upTo: 10, score: 25 }] })
    ).toMatch(/must be last/);
  });

  it("rejects a missing nullScore", () => {
    expect(validateScoringShape({ ...ok, nullScore: null })).toMatch(/null score/);
  });
});
