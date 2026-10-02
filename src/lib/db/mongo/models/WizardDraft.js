// OfferGuide — WizardDraft model
// Naming convention: PascalCase model name, camelCase fields, per NAMING_CONVENTIONS.md §6.
// LOCATION: src/lib/db/mongo/models/WizardDraft.js
//
// In-progress, incomplete wizard state. NOT the system of record — on wizard
// completion, finalized answers are written to the MySQL relational tables and
// the draft is deleted or left to expire via the TTL index below.
//
// Deliberately reuses Mongo (matching the existing PersonalityTest pattern for
// partial multi-step submission state) rather than introducing Redis, per the
// "prefer the existing stack" discussion.

import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const WizardDraftSchema = new Schema(
  {
    // Identity the draft is keyed by. candidateProfileId is optional because a
    // candidate can start autosaving mid-wizard before SCR-001 (candidate-profile)
    // is ever submitted — guestToken/userInfoId let the draft resolve from the
    // very first screen. Once SCR-001 is submitted, the route backfills
    // candidateProfileId onto the existing draft (best-effort, not required for
    // the draft to keep working).
    candidateProfileId: { type: Number }, // FK to MySQL candidate_profiles.id, once known
    guestToken: { type: String }, // set for guest identities
    userInfoId: { type: Number }, // set for authenticated identities
    evaluationSessionId: { type: Number }, // FK to MySQL evaluation_sessions.id, once created
    currentScreen: { type: String, required: true }, // e.g. "SCR-004"
    answers: { type: Schema.Types.Mixed, default: {} }, // partial, screen-by-screen field values
    updatedAt: { type: Date, default: Date.now }, // TTL anchor — see index below
  },
  { collection: "wizard_drafts" }
);
// Auto-expires abandoned drafts 30 days after last update. Adjust the number,
// not the mechanism, if a different retention window is wanted later.
WizardDraftSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 2592000 });
WizardDraftSchema.index({ guestToken: 1 }, { sparse: true });
WizardDraftSchema.index({ userInfoId: 1 }, { sparse: true });

export const WizardDraft =
  models.WizardDraft || model("WizardDraft", WizardDraftSchema);
