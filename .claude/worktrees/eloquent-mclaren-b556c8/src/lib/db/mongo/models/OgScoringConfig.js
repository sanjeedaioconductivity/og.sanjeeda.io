// OfferGuide — OgScoringConfig model
// Naming convention: PascalCase model name, camelCase fields, per NAMING_CONVENTIONS.md §6.
// LOCATION: src/lib/db/mongo/models/OgScoringConfig.js
//
// Category weights, priority boost, importance-slider and evaluation_type adjustments.
// Versioned: evaluation_sessions.scoring_config_version (MySQL) records which version
// produced a given result, so tuning weights later never silently changes a
// candidate's past scores.
//
// Every adjustment below defaults to zero-impact, matching the prototype's actual
// scoreOffer() behavior exactly (base 1.0 + priority boost 1.2, nothing else).

import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const OgScoringConfigSchema = new Schema(
  {
    version: { type: Number, required: true, unique: true },
    effectiveFrom: { type: Date, required: true, default: Date.now },
    isActive: { type: Boolean, default: true }, // exactly one version should be active at a time

    categoryBaseWeights: {
      Salary: { type: Number, default: 1 },
      Benefits: { type: Number, default: 1 },
      Stability: { type: Number, default: 1 },
      "Work-Life": { type: Number, default: 1 },
      Growth: { type: Number, default: 1 },
      Culture: { type: Number, default: 1 },
      Purpose: { type: Number, default: 1 },
    },

    priorityBoost: { type: Number, default: 1.2 },

    priorityCategoryMap: {
      type: Map,
      of: String,
      default: {
        Salary: "Salary",
        Growth: "Growth",
        Stability: "Stability",
        "Flexibility / Commute": "Work-Life",
        Benefits: "Benefits",
        Culture: "Culture",
        Purpose: "Purpose",
        Security: "Stability",
      },
    },

    importanceWeighting: {
      offer_worklife_importance: {
        scale: { type: String, default: "3-point" },
        Low: { type: Number, default: 0 },
        Medium: { type: Number, default: 0 },
        High: { type: Number, default: 0 },
      },
      offer_growth_importance: {
        scale: { type: String, default: "5-point" },
        perPointIncrement: { type: Number, default: 0 },
      },
      offer_culture_importance: {
        scale: { type: String, default: "5-point" },
        perPointIncrement: { type: Number, default: 0 },
      },
    },

    evaluationTypeBonus: {
      "New job offer": { type: Map, of: Number, default: {} },
      Counteroffer: { type: Map, of: Number, default: {} },
      "Promotion offer": { type: Map, of: Number, default: {} },
      "Internal transfer": { type: Map, of: Number, default: {} },
    },
  },
  { timestamps: true, collection: "og_scoring_configs" }
);

export const OgScoringConfig =
  models.OgScoringConfig || model("OgScoringConfig", OgScoringConfigSchema);
