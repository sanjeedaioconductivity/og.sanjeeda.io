// OfferGuide — OgMarketBenchmarks model
// Naming convention: PascalCase model name, camelCase fields, per NAMING_CONVENTIONS.md §6.
// LOCATION: src/lib/db/mongo/models/OgMarketBenchmarks.js
//
// Salary percentile data feeding the dedicated Salary formula
// (40 + ((base - p25)/(p75 - p25)) * 45, per the prototype). Its own collection
// because it's queried by a completely different key (role + location) than
// geography or field content ever would be.

import mongoose from "mongoose";
import { assertAscending, assertMergedAscending, flattenUpdate } from "./benchmarkOrder.js";

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
    // Sprint 8: every admin-editable collection soft-deletes rather than
    // hard-deletes, so a benchmark row that produced a past Salary score is
    // still there to explain it. This collection was the only one missing the
    // flag the other five already had.
    active: { type: Boolean, default: true },
  },
  { timestamps: true, collection: "og_market_benchmarks" }
);
OgMarketBenchmarksSchema.index({ role: 1, location: 1 }, { unique: true });

// Sprint 10, Epic 10.4 — enforce p25 <= p50 <= p75 at the model layer, so a
// violating row is impossible regardless of which client wrote it. A violated
// order corrupts every Salary score computed against the row while it is live,
// so this is a hard block, not a soft warning.
//
// WHY HOOKS, NOT A FIELD VALIDATOR. The obvious `validate` on the p50 path
// works on create but SILENTLY MISBEHAVES on update: in an update validator
// Mongoose binds `this` to the Query, not the document, so `this.p25` is
// undefined — the check would reject every valid edit, while a partial update
// that omits p50 would skip the validator entirely and let p25 > p50 through.
// (Confirmed against mongoose 8.16's updateValidators.js.) The two hooks below
// cover both write paths adminCrud.ts actually uses — `.create()` / `.save()`
// and `findOneAndUpdate(..., {runValidators:true})`. The ordering logic itself
// lives in benchmarkOrder.js so it is unit-testable without a database.
OgMarketBenchmarksSchema.pre("save", function () {
  assertAscending(this.p25, this.p50, this.p75);
});

OgMarketBenchmarksSchema.pre(["findOneAndUpdate", "updateOne"], async function () {
  const patch = flattenUpdate(this.getUpdate());
  if (patch.p25 === undefined && patch.p50 === undefined && patch.p75 === undefined) return;

  const current = (await this.model.findOne(this.getFilter()).lean()) || {};
  assertMergedAscending(patch, current);
});

export const OgMarketBenchmarks =
  models.OgMarketBenchmarks || model("OgMarketBenchmarks", OgMarketBenchmarksSchema);
