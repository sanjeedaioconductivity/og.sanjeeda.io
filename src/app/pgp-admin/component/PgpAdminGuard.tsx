"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/portal/AuthProvider";
import { usePermission } from "@/lib/portal/usePermission";

/**
 * The REACTIVE half of the /pgp-admin gate. The server layout has already
 * refused to render for a non-admin; this catches the session ending while
 * an admin is on the page (logout in another tab, cookie expiry) and sends
 * them out without waiting for the next full navigation.
 *
 * Only acts once identity has resolved: AuthProvider starts every page as a
 * guest and widens, so `!isAdmin` on the first render is the normal
 * pre-resolution state, not a revoked session.
 */
export function PgpAdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { resolved } = useAuth();
  const isAdmin = usePermission("portal.admin.access");

  useEffect(() => {
    if (resolved && !isAdmin) router.replace("/pgp-access");
  }, [resolved, isAdmin, router]);

  return <>{children}</>;
}
