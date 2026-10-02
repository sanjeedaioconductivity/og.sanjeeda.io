// OfferGuide — OgMarketBenchmarks model
// Naming convention: PascalCase model name, camelCase fields, per NAMING_CONVENTIONS.md §6.
// LOCATION: src/lib/db/mongo/models/OgMarketBenchmarks.js
//
// Salary percentile data feeding the dedicated Salary formula
// (40 + ((base - p25)/(p75 - p25)) * 45, per the prototype). Its own collection
// because it's queried by a completely different key (role + location) than
// geography or field content ever would be.

import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const OgMarketBenchmarksSchema = new Schema(
  {
    role: { type: String, required: true },
    location: { type: String, required: true },
    currency: { type: String, required: true },
    p25: { type: Number, required: true },
    p50: { type: Number, required: true },
    p75: { type: Number, required: true },
    sampleSize: { type: Number, default: 0 },
    effectiveFrom: { type: Date, default: Date.now },
  },
  { timestamps: true, collection: "og_market_benchmarks" }
);
OgMarketBenchmarksSchema.index({ role: 1, location: 1 }, { unique: true });

export const OgMarketBenchmarks =
  models.OgMarketBenchmarks || model("OgMarketBenchmarks", OgMarketBenchmarksSchema);
