// OfferGuide — OgFunctionalDomains model
// Naming convention: PascalCase model name, camelCase fields, per NAMING_CONVENTIONS.md §6.
// LOCATION: src/lib/db/mongo/models/OgFunctionalDomains.js
//
// Flat reference list (SCR-001 target_functional_domain). Simple enough that a
// dedicated flat collection is clearer than embedding it inside something else
// it has no real relationship to.

import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const OgFunctionalDomainsSchema = new Schema(
  {
    domainId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    active: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true, collection: "og_functional_domains" }
);

export const OgFunctionalDomains =
  models.OgFunctionalDomains || model("OgFunctionalDomains", OgFunctionalDomainsSchema);
