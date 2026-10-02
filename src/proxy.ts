/**
 * Centralized JWT verification (Sprint 9, Story 9.1.1).
 *
 * FILE NAME. `src/proxy.ts`, beside `app/`. Next 16 renamed the `middleware`
 * file convention to `proxy`; `middleware.ts` still loads but warns, and the
 * exported function must be named `proxy` (or be the default export). The
 * handoff's `apps/web/app/middleware.ts` is wrong twice over — this is not a
 * monorepo, and Next has never read this file from inside `app/`.
 *
 * RUNTIME. Do NOT add `export const runtime = "nodejs"`. Proxy already defaults
 * to the Node runtime as of Next 16, and the docs are explicit that setting the
 * runtime option here THROWS. It does not fail loudly: every matched route 404s
 * instead, which reads exactly like a routing mistake. This cost an hour.
 *
 * That default is also what makes the rest of this work — `jsonwebtoken` needs
 * Node's crypto and cannot load on Edge, so on the old Edge default this would
 * have needed a second JWT implementation on `jose`, defeating the point of a
 * story about centralizing verification.
 *
 * SCOPE IS DELIBERATELY NARROW: OfferGuide's pages and API, plus the PGP
 * admin area (which reuses the same portal role).
 *
 *   Read this before widening it. The other portal features — PP, CRR, Blogs,
 *   the pgp modules, the khudi endpoints — are excluded, and NOT because they
 *   have auth checks of their own that would conflict. They have none. A grep
 *   for `jwt.`, `authorization` or `Bearer` across `src/app/api/` returns only
 *   the four auth endpoints themselves, and those sign tokens rather than
 *   verifying them. The pgp dashboards gate on a localStorage object in the
 *   browser, which is not access control, and they authenticate against
 *   entirely separate Mongo collections with their own JWTs.
 *
 *   So the follow-up is not "migrate the legacy routes onto this proxy". It is
 *   "add authentication to features that have never had any" — a much larger
 *   piece of work, with no regression suite behind it, which is why this sprint
 *   does not start it.
 *
 * WHAT THIS DOES NOT DO. It does not authorize. It resolves who the caller is
 * and forwards that; each route decides what that identity may do, through
 * `hasPermission`. A matcher cannot express "this collection is admin-only but
 * that one is public" without restating the route tree in a second, silently
 * drifting place.
 */

import { NextRequest, NextResponse } from "next/server";
import { resolveIdentity } from "@/lib/offerguide/identity";
import {
  applyIdentityHeaders,
  stripIdentityHeaders,
} from "@/lib/portal/identityHeaders";
import { loadPermissionIdentity } from "@/lib/portal/identityRole";

export const config = {
  matcher: [
    // OfferGuide's pages.
    "/offerguide/:path*",
    // OfferGuide's API, which includes /api/offerguide/admin/config/* — the real
    // prefix for the routes the handoff calls "/admin/config/*".
    "/api/offerguide/:path*",
    // The PGP admin area and the API behind it. Formerly the "management"
    // portal with its own Mongo login; now gated on the portal role exactly
    // like /offerguide/admin. The candidate and mentor portals are NOT here —
    // they still authenticate against their own collections (see above).
    "/pgp-admin/:path*",
    "/api/pgp-management/:path*",
  ],
};

export async function proxy(request: NextRequest) {
  // Unconditional, and first. A caller-supplied x-og-user-role must never
  // survive to a route handler. See identityHeaders.ts.
  const headers = new Headers(request.headers);
  stripIdentityHeaders(headers);

  // Three states, per the contract's optional-auth semantics:
  //
  //   no token            -> public. May still hold a guestToken cookie; that
  //                          cookie is untouched here and keeps working exactly
  //                          as it does today.
  //   valid token         -> authenticated, with userInfoId and role.
  //   invalid or expired  -> ALSO public, NOT a 401. resolveIdentity already
  //                          collapses this case, which is what makes an expired
  //                          session degrade a candidate to guest mid-wizard
  //                          instead of throwing them out of it. Only bearerAuth
  //                          and adminAuth routes reject, and they do that
  //                          themselves, downstream.
  const identity = resolveIdentity(request);
  const userInfoId = identity?.type === "user" ? identity.userInfoId : null;

  // Guests never reach the database: no token means no lookup. That matters —
  // the public wizard is the hot path and most of its traffic has no account.
  const permissionIdentity = await loadPermissionIdentity(userInfoId);

  applyIdentityHeaders(headers, permissionIdentity);

  return NextResponse.next({ request: { headers } });
}
