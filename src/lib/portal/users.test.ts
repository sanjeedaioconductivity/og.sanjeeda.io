import { describe, it, expect } from "vitest";
import { userIdOf } from "./users";

describe("userIdOf", () => {
  it("reads the local column name, user_id", () => {
    expect(userIdOf({ user_id: 42, name: "Ada" })).toBe(42);
  });

  it("reads id, in case production names it that", () => {
    expect(userIdOf({ id: 42, name: "Ada" })).toBe(42);
  });

  it("prefers user_id when a row somehow carries both", () => {
    expect(userIdOf({ user_id: 42, id: 99 })).toBe(42);
  });

  it("coerces the string a driver may hand back for a BIGINT", () => {
    expect(userIdOf({ user_id: "42" })).toBe(42);
  });

  // The regression this whole function exists for: `SELECT *` on a table keyed
  // `user_id`, read as `.id`, yielded undefined — and `jwt.sign({ id: undefined })`
  // silently produced a token with no id claim at all.
  it("returns null for a row with neither column", () => {
    expect(userIdOf({ name: "Ada", email: "ada@example.com" })).toBeNull();
  });

  it.each([
    ["null", null],
    ["undefined", undefined],
    ["an empty string", ""],
    ["zero", 0],
    ["a negative id", -1],
    ["a float", 1.5],
    ["a non-numeric string", "admin"],
  ])("returns null for %s", (_label, user_id) => {
    expect(userIdOf({ user_id })).toBeNull();
  });

  it("returns null for a missing row", () => {
    expect(userIdOf(null)).toBeNull();
    expect(userIdOf(undefined)).toBeNull();
  });
});
