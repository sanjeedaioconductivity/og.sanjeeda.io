// OfferGuide — OgQuestions model
// Naming convention: PascalCase model name, camelCase fields, per NAMING_CONVENTIONS.md §6.
// LOCATION: src/lib/db/mongo/models/OgQuestions.js — one file per model, per this
// file's own original design note, avoiding the Question-schema-duplicated-across-
// route-files anti-pattern already flagged elsewhere in the portal.
//
// One document per scored field: content (label, help text, UI control, options) AND
// scoring (option -> score, or rating multiplier) together, matching the existing
// Question collection's precedent of keeping a field's content and scoring in one
// place rather than split across collections — avoids the sync-drift risk of updating
// an option in one collection and forgetting its score in another.
//
// Deliberately excludes Salary's fields (offer_base_salary, offer_annual_bonus, etc.)
// — Salary uses a dedicated market-percentile formula against OgMarketBenchmarks, not
// an option-to-score lookup, and is excluded from the generic category-averaging path
// entirely. A handful of other fields (private notes, red-flag penalties, importance
// sliders) are excluded for the same reason — see seed-offerguide.js's top comment.
//
// scoreType "numeric" (added in v3) handles raw numeric inputs like hours/week or
// commute minutes via configurable threshold bands, so even those fields stay
// config-driven rather than hardcoded in the scoring engine — the same principle
// applied to every other scoreType here.
//
// The scoring engine groups documents in this collection by `category` and averages
// within each group. Reassigning a field to a different category, or adding/removing
// a field from scoring, is a document edit here, not a code change.

import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const OgQuestionOptionSchema = new Schema(
  {
    value: { type: String, required: true },
    sortOrder: { type: Number, default: 0 },
    active: { type: Boolean, default: true }, // false instead of deleting — preserves past evaluations' meaning
    score: { type: Number, required: true },
  },
  { _id: false }
);

const OgQuestionsSchema = new Schema(
  {
    fieldId: { type: String, required: true, unique: true }, // e.g. "offer_employment_type"
    screen: { type: String, required: true }, // e.g. "SCR-003"
    category: {
      type: String,
      required: true,
      enum: ["Benefits", "Stability", "Work-Life", "Growth", "Culture", "Purpose"],
    },

    // Content
    label: { type: String, required: true }, // e.g. "Employment type"
    helpText: { type: String, required: true },
    uiControl: { type: String, required: true }, // e.g. "dropdown", "radio_cards", "numeric_input"

    // Scoring
    scoreType: {
      type: String,
      required: true,
      enum: ["enum", "yesno", "rating", "numeric"],
    },
    options: [OgQuestionOptionSchema], // scoreType: "enum" — ordered, content + score together

    // scoreType: "yesno" — Yes/Somewhat/No/Not clear style fields, matches yesScore()
    yesNoScores: {
      yes: { type: Number, default: 100 },
      somewhat: { type: Number, default: 65 },
      unknown: { type: Number, default: 45 },
      no: { type: Number, default: 20 },
    },

    // scoreType: "rating" — 1-5 numeric fields, matches ratingScore(): value * multiplier
    ratingMultiplier: { type: Number, default: 20 },

    // scoreType: "numeric" — threshold-band scoring for raw numeric inputs (hours,
    // minutes, days) that don't fit an option lookup. Bands are evaluated in
    // ascending `upTo` order; the field's raw value gets the score of the first
    // band whose `upTo` it falls at or under. The last band should omit `upTo`
    // (or use a very large number) to act as the catch-all for "anything above."
    // This keeps threshold-based fields config-driven rather than hardcoded in
    // the scoring engine, matching the same "everything except the final
    // aggregation formula is configurable" principle as every other scoreType.
    numericBands: [
      {
        _id: false,
        upTo: { type: Number }, // omit on the last band to mean "no upper limit"
        score: { type: Number, required: true },
      },
    ],
    // Score applied when a numeric field is left blank / explicitly marked
    // "Not clear" (stored as null) — e.g. offer_annual_leave_days' FRS card:
    // "When Not clear is toggled, field value is stored as null and scoring
    // engine applies a neutral unknown score." Config-driven like everything
    // else here, not a hardcoded fallback in the scoring engine.
    nullScore: { type: Number, default: 45 },

    active: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true, collection: "og_questions" }
);
OgQuestionsSchema.index({ screen: 1, sortOrder: 1 }); // matches the render-a-screen-in-order query pattern

export const OgQuestions =
  models.OgQuestions || model("OgQuestions", OgQuestionsSchema);
