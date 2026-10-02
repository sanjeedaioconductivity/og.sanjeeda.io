import { NextRequest, NextResponse } from "next/server";
import { resolveAuthedUser } from "@/lib/offerguide/identity";
import { loadPermissionIdentity } from "@/lib/portal/identityRole";
import { permissionsFor } from "@/lib/portal/permissions";

/**
 * Who is the caller? (Sprint 9, Story 9.1.2)
 *
 * AuthProvider's source of truth. It exists because the portal JWT lives in an
 * httpOnly cookie — which is the point, since script cannot read it — so the
 * client cannot decode its own identity and has to ask.
 *
 * Returns the caller's PERMISSIONS, not just the role, so the client never has
 * to own a second copy of the role→permission map. Adding a permission stays a
 * one-file change, and a stale bundle cannot disagree with the server about
 * what a role means.
 *
 * NEVER an error. A guest is a normal, expected caller here and gets
 * `authenticated: false` with the public permission set — the same 200 an admin
 * gets. A 401 would make every guest page load log a failed request.
 *
 * Deliberately outside proxy.ts's matcher: this route resolves its own identity
 * so the nav works portal-wide, not only on OfferGuide paths.
 */
export async function GET(req: NextRequest) {
  const identity = await loadPermissionIdentity(resolveAuthedUser(req));

  const response = NextResponse.json({
    authenticated: identity !== null,
    userInfoId: identity?.userInfoId ?? null,
    role: identity?.role ?? null,
    permissions: [...permissionsFor(identity)],
  });

  // Per-user and cheap to recompute. A shared cache here would hand one
  // candidate's identity to the next visitor.
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
