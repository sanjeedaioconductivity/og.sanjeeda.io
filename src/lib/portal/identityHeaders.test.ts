// Sprint 9, Story 9.1.1 — the middleware→handler identity contract.
//
// The headers here are trusted downstream, so the test that matters is the
// forgery one: a request arriving from the public internet already carrying
// `x-og-user-role: admin` must not reach a handler with it intact. Get that
// wrong and proxy.ts is an authentication BYPASS rather than an
// authentication layer.

import { describe, it, expect } from "vitest";
import {
  IDENTITY_HEADERS,
  IDENTITY_TYPE_HEADER,
  USER_INFO_ID_HEADER,
  USER_ROLE_HEADER,
  applyIdentityHeaders,
  readIdentityHeaders,
  stripIdentityHeaders,
} from "./identityHeaders";
import { hasPermission } from "./permissions";

/** What proxy.ts does, in order. Kept in one place so the test mirrors it. */
function throughMiddleware(
  incoming: Record<string, string>,
  resolved: { userInfoId: number; role: string } | null
) {
  const headers = new Headers(incoming);
  stripIdentityHeaders(headers);
  applyIdentityHeaders(headers, resolved);
  return headers;
}

describe("forged identity headers", () => {
  const FORGED = {
    [IDENTITY_TYPE_HEADER]: "authenticated",
    [USER_INFO_ID_HEADER]: "1",
    [USER_ROLE_HEADER]: "admin",
  };

  it("a caller claiming to be an admin arrives as a guest", () => {
    const headers = throughMiddleware(FORGED, null);

    expect(readIdentityHeaders({ headers })).toBeNull();
    expect(hasPermission(readIdentityHeaders({ headers }), "portal.admin.access")).toBe(false);
  });

  it("a caller claiming admin while genuinely a user arrives as that user", () => {
    const headers = throughMiddleware(FORGED, { userInfoId: 9001, role: "user" });

    expect(readIdentityHeaders({ headers })).toEqual({ userInfoId: 9001, role: "user" });
    expect(hasPermission(readIdentityHeaders({ headers }), "portal.admin.access")).toBe(false);
  });

  it("a caller cannot impersonate another account id", () => {
    const headers = throughMiddleware(
      { ...FORGED, [USER_INFO_ID_HEADER]: "1" },
      { userInfoId: 9001, role: "user" }
    );
    expect(readIdentityHeaders({ headers })?.userInfoId).toBe(9001);
  });

  it("strips every identity header, not just the role", () => {
    const headers = new Headers(FORGED);
    stripIdentityHeaders(headers);
    for (const header of IDENTITY_HEADERS) expect(headers.get(header)).toBeNull();
  });

  it("strips regardless of header casing — Headers is case-insensitive", () => {
    const headers = new Headers({ "X-OG-USER-ROLE": "admin" });
    stripIdentityHeaders(headers);
    expect(headers.get(USER_ROLE_HEADER)).toBeNull();
  });

  it("leaves the caller's other headers alone", () => {
    const headers = throughMiddleware(
      { ...FORGED, authorization: "Bearer abc", "content-type": "application/json" },
      null
    );
    expect(headers.get("authorization")).toBe("Bearer abc");
    expect(headers.get("content-type")).toBe("application/json");
  });
});

describe("applyIdentityHeaders", () => {
  it("stamps the public tier for a null identity, with no id or role", () => {
    const headers = throughMiddleware({}, null);
    expect(headers.get(IDENTITY_TYPE_HEADER)).toBe("public");
    expect(headers.get(USER_INFO_ID_HEADER)).toBeNull();
    expect(headers.get(USER_ROLE_HEADER)).toBeNull();
  });

  it("stamps an authenticated identity", () => {
    const headers = throughMiddleware({}, { userInfoId: 7, role: "admin" });
    expect(headers.get(IDENTITY_TYPE_HEADER)).toBe("authenticated");
    expect(headers.get(USER_INFO_ID_HEADER)).toBe("7");
    expect(headers.get(USER_ROLE_HEADER)).toBe("admin");
  });
});

describe("readIdentityHeaders — anything unparseable is a guest, not a guess", () => {
  const read = (headers: Record<string, string>) =>
    readIdentityHeaders({ headers: new Headers(headers) });

  it("returns null when no headers are present — a route running without middleware", () => {
    expect(read({})).toBeNull();
  });

  it("returns null for the public tier", () => {
    expect(read({ [IDENTITY_TYPE_HEADER]: "public" })).toBeNull();
  });

  it.each([
    ["a missing id", { [IDENTITY_TYPE_HEADER]: "authenticated" }],
    ["a non-numeric id", { [IDENTITY_TYPE_HEADER]: "authenticated", [USER_INFO_ID_HEADER]: "abc" }],
    ["a zero id", { [IDENTITY_TYPE_HEADER]: "authenticated", [USER_INFO_ID_HEADER]: "0" }],
    ["a negative id", { [IDENTITY_TYPE_HEADER]: "authenticated", [USER_INFO_ID_HEADER]: "-1" }],
    ["an empty id", { [IDENTITY_TYPE_HEADER]: "authenticated", [USER_INFO_ID_HEADER]: "" }],
  ])("returns null for %s", (_label, headers) => {
    expect(read(headers)).toBeNull();
  });

  it("normalises an unrecognised role to user rather than trusting it", () => {
    const identity = read({
      [IDENTITY_TYPE_HEADER]: "authenticated",
      [USER_INFO_ID_HEADER]: "7",
      [USER_ROLE_HEADER]: "Admin",
    });
    expect(identity).toEqual({ userInfoId: 7, role: "user" });
    expect(hasPermission(identity, "portal.admin.access")).toBe(false);
  });

  it("round-trips what applyIdentityHeaders wrote", () => {
    for (const identity of [
      null,
      { userInfoId: 1, role: "user" },
      { userInfoId: 2, role: "admin" },
    ]) {
      expect(readIdentityHeaders({ headers: throughMiddleware({}, identity) })).toEqual(identity);
    }
  });
});
