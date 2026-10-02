import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { readIdentityHeaders } from "@/lib/portal/identityHeaders";
import { hasPermission } from "@/lib/portal/permissions";
import { AdminShell } from "./_components/AdminShell";

/**
 * The admin area (Sprint 10, Epic 10.1).
 *
 * ============ THE GATE IS SERVER-SIDE, AND THAT IS THE POINT ============
 *
 * Story 10.1.1 asks for a `requireAdmin`-equivalent check on every admin page,
 * redirecting non-admins to /offerguide. The UI/UX doc adds: "server-side check
 * preferred over a client-side flash-then-redirect, if the routing setup allows
 * it cheaply — otherwise a client check with a loading skeleton, never a flash
 * of admin content."
 *
 * The routing setup does allow it cheaply. Every request under /offerguide/*
 * passes through src/proxy.ts, which verifies the JWT, reads the stored role
 * from the database, and stamps the result onto the request as identity
 * headers — after first STRIPPING any identity headers the caller supplied, so
 * they cannot be forged. This layout just reads what the proxy wrote. No second
 * database hit, no token parsing, and nothing renders for a non-admin: they are
 * redirected before the shell exists.
 *
 * FAILS CLOSED. If the headers are somehow absent — a route that bypassed the
 * proxy, a misconfigured matcher — `readIdentityHeaders` returns null, which
 * `hasPermission` treats as the public tier, which does not hold
 * `portal.admin.access`. The redirect fires. An admin area that cannot confirm
 * you are an admin shows you nothing.
 *
 * `headers()` makes this segment dynamic. Correct for an operator tool — there
 * is nothing here to statically render, and the trade-off Sprint 9 made for the
 * public nav (stay static, resolve identity client-side) does not apply to a
 * surface that has no public state at all.
 *
 * The AdminShell below ALSO checks `usePermission` on the client. That is not
 * redundancy for its own sake: it is what drops an admin back out of the area
 * if their session ends while they are in it — logout in another tab, an
 * expired cookie — without waiting for the next full navigation.
 *
 * NO NEW PERMISSION STRING. `portal.admin.access` already means "can reach
 * admin surfaces" and is what the API gates on; this reuses it as-is (Epic 10.1
 * "Out of scope").
 *
 * ========================================================================
 */

export const metadata: Metadata = {
  title: "Admin | OfferGuide | Sanjeeda",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const identity = readIdentityHeaders({ headers: await headers() });

  if (!hasPermission(identity, "portal.admin.access")) {
    redirect("/offerguide");
  }

  return <AdminShell>{children}</AdminShell>;
}
