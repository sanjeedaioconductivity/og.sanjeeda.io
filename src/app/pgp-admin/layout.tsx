import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { readIdentityHeaders } from "@/lib/portal/identityHeaders";
import { hasPermission } from "@/lib/portal/permissions";
import { PgpAdminGuard } from "./component/PgpAdminGuard";

/**
 * The PGP admin area — what used to be the "Management Portal".
 *
 * SAME GATE AS /offerguide/admin, ON PURPOSE. The management portal used to
 * have its own self-service signup and login against a separate Mongo
 * collection, which meant anyone could register a "management" account. That
 * is gone. This area is reachable only by a portal account (`sanjeedausers`)
 * whose stored role grants `portal.admin.access` — today, the same two Gmail
 * accounts that run the OfferGuide admin area. Promotion happens only through
 * `scripts/migrate-roles.mjs`, never through a UI.
 *
 * Server-side, and fails closed. `/pgp-admin/*` is in the proxy matcher, so
 * every request arrives with verified identity headers; a missing or public
 * identity reads as null, which does not hold the permission, and nothing
 * renders. The redirect target differs by tier: a guest goes to the portal
 * sign-in (they may well be one of the admins, not yet signed in), while a
 * signed-in non-admin goes back to the PGP portal picker.
 *
 * The client guard below re-checks on the client so an admin whose session
 * ends mid-visit is dropped out without waiting for a full navigation.
 */

export const metadata: Metadata = {
  title: "PGP Admin | Sanjeeda",
  robots: { index: false, follow: false },
};

export default async function PgpAdminLayout({ children }: { children: React.ReactNode }) {
  const identity = readIdentityHeaders({ headers: await headers() });

  if (!hasPermission(identity, "portal.admin.access")) {
    redirect(identity ? "/pgp-access" : "/auth");
  }

  return <PgpAdminGuard>{children}</PgpAdminGuard>;
}
