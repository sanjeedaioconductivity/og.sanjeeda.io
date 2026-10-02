// OfferGuide — admin access gate
// Sprint 9, Story 9.1.4.
//
// This replaced the Sprint 5 interim gate: a single env-configured token
// (OFFERGUIDE_ADMIN_TOKEN, sent as x-og-admin-token) that knew nothing about
// who was calling. That gate is gone — code, env var and all — not kept as a
// fallback. A fallback would mean the weakest of the two paths defines the
// security of /admin/config/*.
//
// Now: a valid portal JWT whose account's stored role grants
// `portal.admin.access`. The role is read from `sanjeedausers` on each check
// rather than trusted from a token claim, so a demotion takes effect
// immediately instead of at the next token expiry.
//
// FAILS CLOSED, exactly as the interim gate did. No token, an unreadable role,
// a deleted account, a database error — every one of them resolves to the
// public tier, which does not hold `portal.admin.access`.

import { NextRequest } from "next/server";
import { unauthorized } from "./errors";
import { resolveAuthedUser } from "./identity";
import { hasPermission } from "@/lib/portal/permissions";
import { loadPermissionIdentity } from "@/lib/portal/identityRole";
import { readIdentityHeaders } from "@/lib/portal/identityHeaders";

/**
 * Returns an error Response if the caller isn't an admin, or null if the
 * request may proceed. Callers: `const denied = await requireAdmin(req); if
 * (denied) return denied;`
 *
 * ASYNC as of Sprint 9 — it reads the database. Every call site must await it.
 * An un-awaited call returns a Promise, which is truthy, so a forgotten `await`
 * fails closed and rejects everyone rather than admitting everyone. That is the
 * safe direction for this particular mistake, and adminGate.test.ts asserts the
 * real behaviour regardless.
 */
export async function requireAdmin(req: NextRequest) {
  // Prefer what proxy.ts already verified — it stripped any caller-supplied
  // identity headers before stamping these, so they cannot be forged. Falling
  // back to verifying the token here keeps the gate correct on its own if the
  // matcher ever stops covering a route, rather than silently opening it.
  const identity =
    readIdentityHeaders(req) ?? (await loadPermissionIdentity(resolveAuthedUser(req)));

  if (!hasPermission(identity, "portal.admin.access")) return unauthorized();

  return null;
}
