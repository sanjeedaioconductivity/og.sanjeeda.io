import jwt from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";

export const GUEST_COOKIE_NAME = "guestToken";

/**
 * The portal's own JWT, in an httpOnly cookie (Sprint 9, Phase 0).
 *
 * The portal already writes the same token to `localStorage` on login, but a
 * localStorage value is invisible to two things this sprint needs: `proxy.ts`,
 * which only ever sees cookies on a page navigation, and server rendering, which
 * has to know the caller's tier before the first paint or the nav flashes
 * higher-tier links at guests. The cookie is issued alongside the existing
 * localStorage write rather than replacing it, so no existing caller changes.
 */
export const PORTAL_COOKIE_NAME = "portalToken";

export type Identity =
  | { type: "user"; userInfoId: number }
  | { type: "guest"; guestToken: string };

type PortalJwtPayload = {
  id: number;
  name?: string;
  email?: string;
};

/**
 * Verifies a portal JWT and returns its `userInfoId`, or null if the token is
 * absent, malformed, expired, or — the case that actually bit us — signed
 * without an `id` claim at all. `SELECT *` against `sanjeedausers` yields
 * `user_id`, so `{ id: user.id }` silently signed `{}` for every login until
 * Sprint 9 Phase 0. Anything that isn't a real number resolves to null here so
 * a claimless token can never be mistaken for user 0 or NaN.
 */
function verifyToken(token: string | undefined | null): number | null {
  if (!token) return null;

  try {
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET || "default_secret"
    ) as PortalJwtPayload;

    // Must be a POSITIVE integer, not merely a number. `Number(null)` is 0 and
    // `Number("")` is 0, so a token carrying `id: null` would otherwise
    // authenticate as user 0 — and `sanjeedausers` auto-increments from 1, so
    // nobody would ever notice the account it claims to be does not exist.
    const userInfoId = Number(payload.id);
    if (payload.id === null || payload.id === undefined) return null;
    return Number.isInteger(userInfoId) && userInfoId > 0 ? userInfoId : null;
  } catch {
    return null;
  }
}

function bearerToken(req: NextRequest): string | null {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.slice("Bearer ".length).trim() || null;
}

/**
 * The portal JWT, from whichever transport carried it. The Authorization header
 * wins over the cookie: an explicit header is a deliberate act by an API caller,
 * the cookie is ambient.
 */
function verifyPortalToken(req: NextRequest): number | null {
  return (
    verifyToken(bearerToken(req)) ??
    verifyToken(req.cookies.get(PORTAL_COOKIE_NAME)?.value)
  );
}

/**
 * Resolves the caller's identity for guestOrAuth routes. Precedence:
 * bearer header → portal cookie → guest cookie → null (a first-time visitor).
 *
 * An invalid or expired portal token is not an error on these routes — it falls
 * through to the guest path, per the contract's optional-auth semantics. Only
 * bearerAuth and adminAuth routes reject.
 */
export function resolveIdentity(req: NextRequest): Identity | null {
  const userInfoId = verifyPortalToken(req);
  if (userInfoId !== null) {
    return { type: "user", userInfoId };
  }

  const guestToken = req.cookies.get(GUEST_COOKIE_NAME)?.value;
  if (guestToken) {
    return { type: "guest", guestToken };
  }

  return null;
}

/**
 * bearerAuth-only routes: no guest fallback.
 */
export function resolveAuthedUser(req: NextRequest): number | null {
  return verifyPortalToken(req);
}

export function mintGuestToken(): string {
  return crypto.randomUUID();
}

export function setGuestCookie(response: NextResponse, guestToken: string) {
  response.cookies.set(GUEST_COOKIE_NAME, guestToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 180, // 180 days — guests may take a while to register
  });
}

/**
 * Same flags as the guest cookie, but scoped to the JWT's own lifetime: the
 * token is signed with `expiresIn: "1h"`, so a cookie that outlived it would
 * only ever produce a token that fails verification and silently downgrades the
 * caller to guest. Expiring both together makes logging back in the obvious
 * next step rather than a mystery.
 */
export function setPortalCookie(response: NextResponse, token: string) {
  response.cookies.set(PORTAL_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60, // 1 hour — matches createToken()'s expiresIn
  });
}

/**
 * Logout. Deliberately does NOT clear the guest cookie: a candidate who logs out
 * mid-wizard is a guest again, not a stranger, and their in-progress evaluation
 * still has to resolve.
 */
export function clearPortalCookie(response: NextResponse) {
  response.cookies.set(PORTAL_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
