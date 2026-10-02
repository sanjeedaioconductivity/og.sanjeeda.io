/**
 * How proxy.ts hands a resolved identity to the route handlers behind it
 * (Sprint 9, Story 9.1.1).
 *
 * ================== THE ONE THING TO GET RIGHT ==================
 *
 * These headers are TRUSTED downstream. A request that arrives from the public
 * internet already carrying `x-og-user-role: admin` must never reach a handler
 * with that header intact — that would make proxy.ts an authentication
 * BYPASS rather than an authentication layer, and it is the single highest-risk
 * line in this sprint.
 *
 * The protection is `stripIdentityHeaders()`, called on every request before
 * anything is set, unconditionally — including for guests, including for
 * rejected requests, including on paths that set nothing afterwards. Never make
 * the strip conditional on having something to write.
 *
 * ===============================================================
 *
 * `x-og-` prefixed to match the codebase's existing `x-og-admin-token`, and to
 * make an accidental collision with a real client header implausible.
 */

import type { PermissionIdentity } from "./permissions";
import { normalizeRole } from "./permissions";

export const IDENTITY_TYPE_HEADER = "x-og-identity-type";
export const USER_INFO_ID_HEADER = "x-og-user-info-id";
export const USER_ROLE_HEADER = "x-og-user-role";

export const IDENTITY_HEADERS = [
  IDENTITY_TYPE_HEADER,
  USER_INFO_ID_HEADER,
  USER_ROLE_HEADER,
] as const;

/** public = no token at all (a guest, with or without a guestToken cookie). */
export type IdentityType = "public" | "authenticated";

/**
 * Removes any identity headers the CALLER supplied. Call this on every request,
 * before setting anything, with no condition attached. See the header comment.
 */
export function stripIdentityHeaders(headers: Headers): void {
  for (const header of IDENTITY_HEADERS) headers.delete(header);
}

/** Stamps a verified identity onto the request going downstream. */
export function applyIdentityHeaders(
  headers: Headers,
  identity: { userInfoId: number; role: string } | null
): void {
  if (!identity) {
    headers.set(IDENTITY_TYPE_HEADER, "public");
    return;
  }

  headers.set(IDENTITY_TYPE_HEADER, "authenticated");
  headers.set(USER_INFO_ID_HEADER, String(identity.userInfoId));
  headers.set(USER_ROLE_HEADER, identity.role);
}

/**
 * Reads back what middleware stamped.
 *
 * Returns null — the public tier — for anything that does not parse, rather
 * than guessing. A route that somehow ran without middleware in front of it
 * therefore sees a guest, which is the safe answer: `hasPermission` grants a
 * null identity the public set and nothing more.
 */
export function readIdentityHeaders(request: {
  headers: { get(name: string): string | null };
}): PermissionIdentity {
  if (request.headers.get(IDENTITY_TYPE_HEADER) !== "authenticated") return null;

  const userInfoId = Number(request.headers.get(USER_INFO_ID_HEADER));
  if (!Number.isInteger(userInfoId) || userInfoId <= 0) return null;

  return {
    userInfoId,
    role: normalizeRole(request.headers.get(USER_ROLE_HEADER)),
  };
}
