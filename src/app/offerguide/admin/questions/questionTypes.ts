/**
 * Shared types + the scoreType-dependent validation for the Questions editor
 * (Epic 10.3). Pure, so the validation is unit-testable without React or a DB.
 */

export const CATEGORIES = [
  "Benefits",
  "Stability",
  "Work-Life",
  "Growth",
  "Culture",
  "Purpose",
] as const;
export type Category = (typeof CATEGORIES)[number];

/** yesno was removed in Epic 10.6 — the editor only ever offers these three. */
export const SCORE_TYPES = ["enum", "rating", "numeric"] as const;
export type ScoreType = (typeof SCORE_TYPES)[number];

export type QuestionOption = { value: string; sortOrder: number; active: boolean; score: number };
export type NumericBand = { upTo?: number | null; score: number };

export type Question = {
  fieldId: string;
  screen: string;
  category: string;
  label: string;
  helpText: string;
  uiControl: string;
  scoreType: string;
  options?: QuestionOption[];
  ratingMultiplier?: number;
  numericBands?: NumericBand[];
  nullScore?: number;
  active?: boolean;
  sortOrder?: number;
};

/**
 * Validates the type-specific part of a question draft. Returns an error string
 * or null. The scoring engine's own rules are mirrored here so a Save can't
 * produce a document the engine would later reject or mis-score:
 *   - enum: at least one option, each with a value and a numeric score;
 *   - rating: a positive multiplier;
 *   - numeric: bands strictly ascending on `upTo`, exactly one open-ended (the
 *     catch-all last band), and a nullScore.
 */
export function validateScoringShape(q: {
  scoreType: string;
  options?: QuestionOption[];
  ratingMultiplier?: number;
  numericBands?: NumericBand[];
  nullScore?: number | null;
}): string | null {
  if (q.scoreType === "enum") {
    const opts = q.options ?? [];
    if (opts.length === 0) return "An enum question needs at least one option.";
    for (const o of opts) {
      if (!o.value?.trim()) return "Every option needs a value.";
      if (typeof o.score !== "number" || Number.isNaN(o.score)) {
        return `Option "${o.value}" needs a numeric score.`;
      }
    }
    return null;
  }

  if (q.scoreType === "rating") {
    if (typeof q.ratingMultiplier !== "number" || !(q.ratingMultiplier > 0)) {
      return "A rating question needs a positive multiplier.";
    }
    return null;
  }

  if (q.scoreType === "numeric") {
    const bands = q.numericBands ?? [];
    if (bands.length === 0) return "A numeric question needs at least one band.";

    const openEnded = bands.filter((b) => b.upTo === undefined || b.upTo === null);
    if (openEnded.length !== 1) {
      return "Exactly one band must be open-ended (no upper limit) as the catch-all.";
    }
    // The open-ended band must be last, and every capped band must ascend.
    const last = bands[bands.length - 1];
    if (last.upTo !== undefined && last.upTo !== null) {
      return "The open-ended catch-all band must be last.";
    }
    const capped = bands.slice(0, -1);
    for (let i = 0; i < capped.length; i++) {
      const b = capped[i];
      if (typeof b.upTo !== "number") return "Every band except the last needs an upper limit.";
      if (typeof b.score !== "number" || Number.isNaN(b.score)) return "Every band needs a numeric score.";
      if (i > 0 && b.upTo <= (capped[i - 1].upTo as number)) {
        return "Band upper limits must strictly ascend.";
      }
    }
    if (typeof q.nullScore !== "number" || Number.isNaN(q.nullScore)) {
      return "A numeric question needs a null score for blank / Not-clear answers.";
    }
    return null;
  }

  return `Unknown score type "${q.scoreType}".`;
}
