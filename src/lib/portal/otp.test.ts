import { describe, expect, it } from "vitest";
import { toE164 } from "./otp";
import { safeReturnPath } from "./token";

describe("toE164", () => {
  it.each([
    ["+92 300 1234567", "+923001234567"],
    ["0300-1234567", "+923001234567"],
    ["0092 300 1234567", "+923001234567"],
    ["3001234567", "+923001234567"],
    ["+44 7700 900123", "+447700900123"],
  ])("normalises %s", (input, expected) => {
    expect(toE164(input, "+92")).toBe(expected);
  });

  it.each(["", "abc", "12345", "+1234567890123456"])("rejects %j", (input) => {
    expect(toE164(input, "+92")).toBeNull();
  });
});

describe("safeReturnPath", () => {
  it("keeps same-site paths", () => {
    expect(safeReturnPath("/3d-cv/signup?then=upload")).toBe("/3d-cv/signup?then=upload");
  });

  it.each(["https://evil.example", "//evil.example", "/\\evil.example", "", null, undefined])(
    "falls back for %j",
    (input) => {
      expect(safeReturnPath(input, "/home")).toBe("/home");
    }
  );
});
