// OfferGuide — OgGeography model
// Naming convention: PascalCase model name, camelCase fields, per NAMING_CONVENTIONS.md §6.
// LOCATION: src/lib/db/mongo/models/OgGeography.js
//
// Countries embedded with their cities, since the actual query pattern is always
// "give me the city list for this country" (a dependent dropdown), never "find a
// city across the whole world independent of country." Embedding avoids a second
// round-trip / $lookup for a bounded, rarely-changing list. NOTE: current_city/
// offer_city in MySQL remain plain free-text strings regardless — this collection
// only powers the dropdown's suggested options, it does not constrain what MySQL
// can store, since the Other + free-text escape hatch always exists.

import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const OgGeographySchema = new Schema(
  {
    countryCode: { type: String, required: true, unique: true }, // e.g. "PK"
    countryName: { type: String, required: true },
    active: { type: Boolean, default: true },
    cities: [
      {
        _id: false,
        cityId: { type: String, required: true },
        name: { type: String, required: true },
        active: { type: Boolean, default: true },
      },
    ],
  },
  { timestamps: true, collection: "og_geography" }
);

export const OgGeography =
  models.OgGeography || model("OgGeography", OgGeographySchema);
