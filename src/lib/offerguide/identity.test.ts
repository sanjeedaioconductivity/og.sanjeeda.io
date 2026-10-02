// Sprint 9, Phase 0 — the portal session.
//
// The bug this file exists to keep closed: `/api/auth` signed login tokens with
// `{ id: user.id }` off a `SELECT *` whose primary key column is `user_id`, so
// `id` was `undefined`, `JSON.stringify` dropped it, and every login-issued JWT
// carried no id at all. Nothing rejected those tokens loudly — they just made
// every logged-in user resolve as a guest, and made `/claim-guest-profile` 401
// for anyone who logged in rather than signed up.
//
// So the important assertions here are the negative ones: a claimless token, a
// non-numeric claim and an expired token must each resolve to "not a user",
// and must do it without throwing.

import { describe, it, expect } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import {
  GUEST_COOKIE_NAME,
  PORTAL_COOKIE_NAME,
  clearPortalCookie,
  resolveAuthedUser,
  resolveIdentity,
  setGuestCookie,
  setPortalCookie,
} from "./identity";

const SECRET = process.env.JWT_SECRET || "default_secret";

function sign(payload: Record<string, unknown>, expiresIn = "1h") {
  return jwt.sign(payload, SECRET, { expiresIn } as jwt.SignOptions);
}

/** What every login issued before Sprint 9: a valid signature over no id. */
function claimlessToken() {
  return sign({ name: "Ada", email: "ada@example.com" });
}

function expiredToken() {
  return jwt.sign({ id: 9001 }, SECRET, { expiresIn: -10 });
}

type Credentials = { bearer?: string; portalCookie?: string; guestToken?: string };

function request({ bearer, portalCookie, guestToken }: Credentials = {}) {
  const headers = new Headers();
  if (bearer) headers.set("authorization", `Bearer ${bearer}`);

  const cookies: string[] = [];
  if (portalCookie) cookies.push(`${PORTAL_COOKIE_NAME}=${portalCookie}`);
  if (guestToken) cookies.push(`${GUEST_COOKIE_NAME}=${guestToken}`);
  if (cookies.length) headers.set("cookie", cookies.join("; "));

  return new NextRequest("http://localhost/api/offerguide/candidate-profile", {
    headers,
  });
}

describe("resolveIdentity — transports", () => {
  it("resolves a bearer JWT to a user", () => {
    expect(resolveIdentity(request({ bearer: sign({ id: 42 }) }))).toEqual({
      type: "user",
      userInfoId: 42,
    });
  });

  it("resolves the portalToken cookie to a user", () => {
    expect(resolveIdentity(request({ portalCookie: sign({ id: 42 }) }))).toEqual({
      type: "user",
      userInfoId: 42,
    });
  });

  it("prefers the bearer header over the portalToken cookie", () => {
    const req = request({ bearer: sign({ id: 1 }), portalCookie: sign({ id: 2 }) });
    expect(resolveIdentity(req)).toEqual({ type: "user", userInfoId: 1 });
  });

  it("falls back to the cookie when the bearer header is unusable", () => {
    const req = request({ bearer: "not-a-jwt", portalCookie: sign({ id: 7 }) });
    expect(resolveIdentity(req)).toEqual({ type: "user", userInfoId: 7 });
  });

  it("resolves a guestToken cookie alone to a guest", () => {
    expect(resolveIdentity(request({ guestToken: "guest-uuid" }))).toEqual({
      type: "guest",
      guestToken: "guest-uuid",
    });
  });

  it("resolves no credentials at all to null", () => {
    expect(resolveIdentity(request())).toBeNull();
  });

  it("prefers a portal token over a guest cookie held at the same time", () => {
    const req = request({ portalCookie: sign({ id: 5 }), guestToken: "guest-uuid" });
    expect(resolveIdentity(req)).toEqual({ type: "user", userInfoId: 5 });
  });
});

describe("resolveIdentity — tokens that must not read as a user", () => {
  it("rejects a token signed with no id claim", () => {
    expect(resolveIdentity(request({ bearer: claimlessToken() }))).toBeNull();
    expect(resolveIdentity(request({ portalCookie: claimlessToken() }))).toBeNull();
  });

  it("falls through to guest for a claimless token when a guest cookie is present", () => {
    const req = request({ bearer: claimlessToken(), guestToken: "guest-uuid" });
    expect(resolveIdentity(req)).toEqual({ type: "guest", guestToken: "guest-uuid" });
  });

  it("rejects a non-numeric id claim", () => {
    expect(resolveIdentity(request({ bearer: sign({ id: "admin" }) }))).toBeNull();
  });

  // `Number(null)` and `Number("")` are both 0, so a coercion-only check reads
  // these as "user 0" — an account sanjeedausers can never have, and therefore
  // one nobody would notice granting.
  it.each([
    ["null", null],
    ["an empty string", ""],
    ["zero", 0],
    ["a negative id", -1],
    ["a float", 1.5],
  ])("rejects %s as an id claim", (_label, id) => {
    expect(resolveIdentity(request({ bearer: sign({ id }) }))).toBeNull();
  });

  it("rejects a token signed with the wrong secret", () => {
    const forged = jwt.sign({ id: 42 }, "not-the-portal-secret");
    expect(resolveIdentity(request({ bearer: forged }))).toBeNull();
  });

  it("falls through to guest for an expired token rather than throwing", () => {
    const req = request({ bearer: expiredToken(), guestToken: "guest-uuid" });
    expect(resolveIdentity(req)).toEqual({ type: "guest", guestToken: "guest-uuid" });
  });

  it("resolves an expired token with no guest cookie to null", () => {
    expect(resolveIdentity(request({ bearer: expiredToken() }))).toBeNull();
  });

  it("ignores an Authorization header that isn't a Bearer scheme", () => {
    const headers = new Headers({ authorization: `Basic ${sign({ id: 42 })}` });
    const req = new NextRequest("http://localhost/api/offerguide/candidate-profile", {
      headers,
    });
    expect(resolveIdentity(req)).toBeNull();
  });
});

describe("resolveAuthedUser — bearerAuth routes, no guest fallback", () => {
  it("returns the id from a bearer header", () => {
    expect(resolveAuthedUser(request({ bearer: sign({ id: 42 }) }))).toBe(42);
  });

  it("returns the id from the portalToken cookie", () => {
    expect(resolveAuthedUser(request({ portalCookie: sign({ id: 42 }) }))).toBe(42);
  });

  it("returns null for a claimless token — the bug that 401'd /claim-guest-profile", () => {
    expect(resolveAuthedUser(request({ bearer: claimlessToken() }))).toBeNull();
  });

  it("returns null for a guest cookie — a guest is not an authenticated user", () => {
    expect(resolveAuthedUser(request({ guestToken: "guest-uuid" }))).toBeNull();
  });

  it("never returns NaN", () => {
    for (const bearer of [claimlessToken(), sign({ id: "abc" }), expiredToken()]) {
      const result = resolveAuthedUser(request({ bearer }));
      expect(result).toBeNull();
      expect(Number.isNaN(result as unknown as number)).toBe(false);
    }
  });
});

describe("cookies", () => {
  function cookie(response: NextResponse, name: string) {
    return response.cookies.get(name);
  }

  it("sets the portal cookie httpOnly, path-wide, and no longer-lived than the JWT", () => {
    const response = NextResponse.json({});
    setPortalCookie(response, sign({ id: 42 }));

    const set = cookie(response, PORTAL_COOKIE_NAME);
    expect(set?.httpOnly).toBe(true);
    expect(set?.sameSite).toBe("lax");
    expect(set?.path).toBe("/");
    expect(set?.maxAge).toBe(60 * 60);
  });

  it("expires the portal cookie on logout", () => {
    const response = NextResponse.json({});
    clearPortalCookie(response);

    const set = cookie(response, PORTAL_COOKIE_NAME);
    expect(set?.value).toBe("");
    expect(set?.maxAge).toBe(0);
  });

  it("leaves the guest cookie alone on logout — logging out makes you a guest, not a stranger", () => {
    const response = NextResponse.json({});
    setGuestCookie(response, "guest-uuid");
    clearPortalCookie(response);

    expect(cookie(response, GUEST_COOKIE_NAME)?.value).toBe("guest-uuid");
    expect(cookie(response, PORTAL_COOKIE_NAME)?.maxAge).toBe(0);
  });
});
