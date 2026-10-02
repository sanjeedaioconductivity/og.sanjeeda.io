// OfferGuide — OgConsentToggles model
// Naming convention: PascalCase model name, camelCase fields, per NAMING_CONVENTIONS.md §6.
// LOCATION: src/lib/db/mongo/models/OgConsentToggles.js
//
// The 6 community-consent categories (SCR-009/SCR-001 per the pending FRS
// relocation). Add/remove/reorder a toggle without touching code or the
// candidate_profiles.consent_settings JSON shape.

import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const OgConsentTogglesSchema = new Schema(
  {
    toggleId: { type: String, required: true, unique: true }, // e.g. "consent_salary_ranges"
    label: { type: String, required: true },
    helpText: { type: String, required: true },
    sourceScreen: { type: String, required: true }, // e.g. "SCR-004" — which screen's data this contributes
    isMaster: { type: Boolean, default: false }, // true only for consent_share_anonymous
    active: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true, collection: "og_consent_toggles" }
);

export const OgConsentToggles =
  models.OgConsentToggles || model("OgConsentToggles", OgConsentTogglesSchema);
