// OfferGuide — market-benchmark percentile ordering guard (Sprint 10, Epic 10.4).
//
// Extracted from OgMarketBenchmarks.js so the rule is one pure, testable
// function rather than logic buried in a Mongoose hook. The model's pre('save')
// and pre('findOneAndUpdate') hooks both call in here; the unit test calls the
// same functions directly, with no database and no ODM internals.
//
// The rule: p25 <= p50 <= p75. A violated order corrupts every Salary score
// computed against the row while it is live, so it is a hard block on both the
// create and the update path.

const MESSAGE = "p25, p50, and p75 must be in ascending order.";

/** Throws if the three values are not ascending. Equal values are allowed. */
export function assertAscending(p25, p50, p75) {
  if (!(p25 <= p50 && p50 <= p75)) {
    throw new Error(MESSAGE);
  }
}

/**
 * The update path. A PUT is a partial merge, so a one-field edit has to be
 * checked against the row's OTHER two stored values — this is exactly the case
 * the naive field-validator got wrong. Returns early (no throw) when the patch
 * touches no percentile, which is what lets the soft-delete PUT ({active:false})
 * and any other unrelated edit pass untouched.
 *
 * @param patch   the update body, already unwrapped of any `$set`
 * @param current the stored document (or {} if somehow absent)
 */
export function assertMergedAscending(patch, current = {}) {
  if (patch.p25 === undefined && patch.p50 === undefined && patch.p75 === undefined) {
    return;
  }
  assertAscending(
    patch.p25 ?? current.p25,
    patch.p50 ?? current.p50,
    patch.p75 ?? current.p75
  );
}

/** Flattens a Mongoose update ({...} or {$set:{...}}) into a plain patch. */
export function flattenUpdate(update) {
  const u = update || {};
  return { ...u, ...(u.$set || {}) };
}
