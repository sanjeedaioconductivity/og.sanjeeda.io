import type { NextRequest } from "next/server";

/**
 * "Sign In with LinkedIn using OpenID Connect" — configuration and endpoints.
 *
 * Needs a LinkedIn app with that product enabled (developer.linkedin.com):
 *   LINKEDIN_CLIENT_ID       the app's Client ID
 *   LINKEDIN_CLIENT_SECRET   the app's Primary Client Secret (server only)
 *   LINKEDIN_REDIRECT_URI    optional; defaults to <site origin>/api/auth/linkedin/callback.
 *                            Whatever it is, it must be listed EXACTLY under the app's
 *                            Auth → Authorized redirect URLs.
 */

export const LINKEDIN_AUTHORIZE_URL = "https://www.linkedin.com/oauth/v2/authorization";
export const LINKEDIN_TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken";
export const LINKEDIN_USERINFO_URL = "https://api.linkedin.com/v2/userinfo";
export const LINKEDIN_SCOPES = "openid profile email";

/** httpOnly cookie carrying the CSRF state and the return path across the redirect. */
export const LINKEDIN_STATE_COOKIE = "li_oauth_state";

/**
 * Short-lived, NOT httpOnly: hands the signed-in name and email to the page the
 * browser lands on, so it can prefill a form. The session itself is the httpOnly
 * portal cookie; this only carries display data, and the page deletes it on read.
 * Kept out of the URL so personal data never lands in history or server logs.
 */
export const OAUTH_PROFILE_COOKIE = "oauth_profile";

export function linkedInConfigured(): boolean {
  return !!process.env.LINKEDIN_CLIENT_ID && !!process.env.LINKEDIN_CLIENT_SECRET;
}

export function linkedInRedirectUri(req: NextRequest): string {
  return process.env.LINKEDIN_REDIRECT_URI || `${req.nextUrl.origin}/api/auth/linkedin/callback`;
}
