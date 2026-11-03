import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { setPortalCookie } from "@/lib/offerguide/identity";
import {
  LINKEDIN_STATE_COOKIE,
  LINKEDIN_TOKEN_URL,
  LINKEDIN_USERINFO_URL,
  OAUTH_PROFILE_COOKIE,
  linkedInConfigured,
  linkedInRedirectUri,
} from "@/lib/portal/linkedin";
import { createPortalToken, findOrCreateUserByVerifiedEmail, safeReturnPath } from "@/lib/portal/token";

/**
 * GET /api/auth/linkedin/callback — LinkedIn sends the browser back here.
 *
 * 1. Check `state` against the httpOnly cookie (CSRF).
 * 2. Exchange the one-time `code` for an access token (server-to-server, with the secret).
 * 3. Read the OpenID userinfo: name, email, email_verified.
 * 4. Find or create the portal user by VERIFIED email and set the portal session
 *    cookie, exactly like Google sign-in does.
 *
 * Every failure redirects back with `?signin_error=…` rather than showing a raw
 * error page; the reason codes are stable so the page can explain them.
 */

type StateCookie = { state: string; next: string };
type UserInfo = { sub?: string; name?: string; given_name?: string; family_name?: string; email?: string; email_verified?: boolean };

function back(req: NextRequest, next: string, error?: string) {
  const url = new URL(next, req.nextUrl.origin);
  if (error) url.searchParams.set("signin_error", error);
  else url.searchParams.set("signin", "linkedin");
  const response = NextResponse.redirect(url);
  response.cookies.set(LINKEDIN_STATE_COOKIE, "", { path: "/api/auth/linkedin", maxAge: 0 });
  return response;
}

function sameString(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export async function GET(req: NextRequest) {
  let saved: StateCookie | null = null;
  try {
    saved = JSON.parse(req.cookies.get(LINKEDIN_STATE_COOKIE)?.value ?? "null");
  } catch {
    saved = null;
  }
  const next = safeReturnPath(saved?.next, "/");
  const params = req.nextUrl.searchParams;

  // The user pressed Cancel on LinkedIn's consent screen.
  if (params.get("error")) return back(req, next, params.get("error") === "user_cancelled_login" ? "linkedin_cancelled" : "linkedin_denied");
  if (!linkedInConfigured()) return back(req, next, "linkedin_not_configured");

  const code = params.get("code");
  const state = params.get("state");
  if (!code || !state || !saved?.state || !sameString(state, saved.state)) {
    return back(req, next, "linkedin_state");
  }

  try {
    const tokenRes = await fetch(LINKEDIN_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: linkedInRedirectUri(req),
        client_id: process.env.LINKEDIN_CLIENT_ID!,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
      }),
      cache: "no-store",
    });
    if (!tokenRes.ok) {
      console.error("LINKEDIN: token exchange failed", tokenRes.status, await tokenRes.text());
      return back(req, next, "linkedin_failed");
    }
    const { access_token } = (await tokenRes.json()) as { access_token?: string };
    if (!access_token) return back(req, next, "linkedin_failed");

    const infoRes = await fetch(LINKEDIN_USERINFO_URL, {
      headers: { Authorization: `Bearer ${access_token}` },
      cache: "no-store",
    });
    if (!infoRes.ok) {
      console.error("LINKEDIN: userinfo failed", infoRes.status);
      return back(req, next, "linkedin_failed");
    }
    const info = (await infoRes.json()) as UserInfo;

    // Never link an account by an email LinkedIn hasn't verified.
    if (!info.email || info.email_verified === false) return back(req, next, "linkedin_no_email");

    const name = info.name || [info.given_name, info.family_name].filter(Boolean).join(" ") || "LinkedIn User";
    const user = await findOrCreateUserByVerifiedEmail(name, info.email);
    const token = createPortalToken({ id: user.id, name: user.name, email: user.email });

    const response = back(req, next);
    setPortalCookie(response, token);
    response.cookies.set(OAUTH_PROFILE_COOKIE, JSON.stringify({ provider: "linkedin", name: user.name, email: user.email }), {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 5 * 60,
    });
    return response;
  } catch (error) {
    console.error("LINKEDIN: sign-in failed", error);
    return back(req, next, "linkedin_failed");
  }
}
