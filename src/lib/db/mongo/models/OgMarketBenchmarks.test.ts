// Sprint 10, Epic 10.4 — the p25 <= p50 <= p75 guard.
//
// The Endpoints doc proposed a field `validate` on p50. That works on create
// but breaks on update: Mongoose binds `this` to the Query in an update
// validator, so `this.p25` is undefined — it would reject valid edits and let
// partial ones through. The rule was therefore extracted into benchmarkOrder.js
// (pure, no DB) and driven from the model's pre('save')/pre('findOneAndUpdate')
// hooks. These tests cover the pure logic directly, including the partial-update
// case the field validator got wrong.

import { describe, it, expect } from "vitest";
import {
  assertAscending,
  assertMergedAscending,
  flattenUpdate,
} from "./benchmarkOrder.js";

describe("assertAscending — the create/save path", () => {
  it("accepts an ascending row", () => {
    expect(() => assertAscending(100, 200, 300)).not.toThrow();
  });

  it("accepts equal percentiles", () => {
    expect(() => assertAscending(200, 200, 200)).not.toThrow();
  });

  it("rejects p25 > p50", () => {
    expect(() => assertAscending(300, 200, 400)).toThrow(/ascending order/);
  });

  it("rejects p50 > p75", () => {
    expect(() => assertAscending(100, 400, 300)).toThrow(/ascending order/);
  });
});

describe("assertMergedAscending — the update path the field validator got wrong", () => {
  const stored = { p25: 100, p50: 200, p75: 300 };

  it("validates a PARTIAL edit against the stored other two (the whole point)", () => {
    // Only p25 is sent; stored p50 is 200. 250 > 200 must be rejected — the
    // broken field validator would have skipped this update entirely.
    expect(() => assertMergedAscending({ p25: 250 }, stored)).toThrow(/ascending order/);
  });

  it("accepts a partial edit that stays ordered", () => {
    expect(() => assertMergedAscending({ p25: 150 }, stored)).not.toThrow();
  });

  it("rejects lowering p75 below p50", () => {
    expect(() => assertMergedAscending({ p75: 100 }, stored)).toThrow(/ascending order/);
  });

  it("skips the check when no percentile is touched — e.g. the soft-delete PUT", () => {
    expect(() => assertMergedAscending({ active: false }, stored)).not.toThrow();
  });

  it("validates a full ascending update", () => {
    expect(() => assertMergedAscending({ p25: 10, p50: 20, p75: 30 }, stored)).not.toThrow();
  });

  it("tolerates an absent stored doc when the patch is self-sufficient", () => {
    expect(() => assertMergedAscending({ p25: 1, p50: 2, p75: 3 }, {})).not.toThrow();
  });
});

describe("flattenUpdate", () => {
  it("passes a plain update through", () => {
    expect(flattenUpdate({ p25: 5 })).toEqual({ p25: 5 });
  });

  it("unwraps $set", () => {
    expect(flattenUpdate({ $set: { p75: 100 } })).toMatchObject({ p75: 100 });
  });

  it("handles a null/undefined update", () => {
    expect(flattenUpdate(undefined)).toEqual({});
  });
});
