import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  LINKEDIN_AUTHORIZE_URL,
  LINKEDIN_SCOPES,
  LINKEDIN_STATE_COOKIE,
  linkedInConfigured,
  linkedInRedirectUri,
} from "@/lib/portal/linkedin";
import { safeReturnPath } from "@/lib/portal/token";

/**
 * GET /api/auth/linkedin?next=/3d-cv/signup — starts "Sign In with LinkedIn".
 *
 * A full-page navigation, not fetch: LinkedIn's consent screen must be the top
 * window. Stores a random state (CSRF) and the return path in an httpOnly cookie
 * that the callback checks, then redirects to LinkedIn.
 */
export function GET(req: NextRequest) {
  const next = safeReturnPath(req.nextUrl.searchParams.get("next"), "/");

  if (!linkedInConfigured()) {
    const back = new URL(next, req.nextUrl.origin);
    back.searchParams.set("signin_error", "linkedin_not_configured");
    return NextResponse.redirect(back);
  }

  const state = randomBytes(24).toString("hex");
  const url = new URL(LINKEDIN_AUTHORIZE_URL);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", process.env.LINKEDIN_CLIENT_ID!);
  url.searchParams.set("redirect_uri", linkedInRedirectUri(req));
  url.searchParams.set("state", state);
  url.searchParams.set("scope", LINKEDIN_SCOPES);

  const response = NextResponse.redirect(url);
  response.cookies.set(LINKEDIN_STATE_COOKIE, JSON.stringify({ state, next }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax", // sent on LinkedIn's top-level redirect back to us
    path: "/api/auth/linkedin",
    maxAge: 10 * 60,
  });
  return response;
}
