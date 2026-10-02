"use client";

/**
 * The portal's single client-side source of identity (Sprint 9, Story 9.1.2).
 *
 * NO NEW localStorage KEY, per NAMING_CONVENTIONS §10 and the sprint DoD. The
 * portal JWT lives in an httpOnly `portalToken` cookie, which script cannot
 * read by design, so identity comes from `GET /api/auth/session` instead. The
 * existing `authToken` localStorage copy is left exactly as it was — nothing
 * here reads or writes it.
 *
 * ================== WHY IT STARTS AS A GUEST ==================
 *
 * The first render is always the public tier, then it resolves. That direction
 * is deliberate and it satisfies the DoD criterion as written:
 *
 *   "A guest must never briefly see admin or authenticated links before the
 *    client resolves identity."
 *
 * Starting public makes that impossible — a guest's nav never contains a
 * higher-tier item at any point. What an ADMIN sees is their extra links
 * appearing a moment after load, which is the opposite, safe direction.
 *
 * The alternative was reading the cookie in the root layout so the server could
 * render the right tier immediately. That was rejected: the root layout wraps
 * every page in the portal, and calling `cookies()` there opts the ENTIRE site
 * out of static rendering — a time-to-first-byte cost paid by every visitor,
 * the overwhelming majority of whom are guests who would see identical output.
 * Trading that for a brief nav expansion seen only by signed-in users is a bad
 * bargain.
 *
 * It also fails safe: if the session request never completes, the nav stays
 * public rather than breaking.
 *
 * If a future admin dashboard makes instant tier resolution matter more than
 * static rendering, the switch is to read the cookie in a server component and
 * pass `initialIdentity` in — this provider already accepts it.
 *
 * ==============================================================
 *
 * SCOPE: this covers the MySQL `sanjeedausers` account only. The pgp modules
 * (candidate / mentor / management) authenticate against separate Mongo
 * collections with their own JWTs and their own `role` field, and are NOT
 * represented here. Unifying the two identity systems is a backlog item, not
 * something this provider quietly pretends to have done.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { PUBLIC_PERMISSION_SET, type Permission } from "./permissions";
import { logoutPortalSession, onAuthChange } from "./session";

export type PortalIdentity = {
  authenticated: boolean;
  userInfoId: number | null;
  role: string | null;
  permissions: ReadonlySet<Permission>;
  /** False until the session request settles. Use it to defer, never to gate access. */
  resolved: boolean;
};

const GUEST: PortalIdentity = {
  authenticated: false,
  userInfoId: null,
  role: null,
  permissions: PUBLIC_PERMISSION_SET,
  resolved: false,
};

type AuthContextValue = PortalIdentity & {
  /** Ends the session and drops back to the public tier without a reload. */
  logout: () => Promise<void>;
  /** Re-reads the session. Call after a login completes in the same document. */
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type SessionResponse = {
  authenticated: boolean;
  userInfoId: number | null;
  role: string | null;
  permissions: Permission[];
};

export function AuthProvider({
  children,
  initialIdentity,
}: {
  children: ReactNode;
  /** Optional server-resolved identity, to skip the guest-first render. */
  initialIdentity?: Omit<PortalIdentity, "permissions" | "resolved"> & {
    permissions: Permission[];
  };
}) {
  const [identity, setIdentity] = useState<PortalIdentity>(() =>
    initialIdentity
      ? { ...initialIdentity, permissions: new Set(initialIdentity.permissions), resolved: true }
      : GUEST
  );

  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await fetch("/api/auth/session", {
        credentials: "include",
        cache: "no-store",
        signal,
      });
      if (!res.ok) throw new Error(`session ${res.status}`);

      const body = (await res.json()) as SessionResponse;
      setIdentity({
        authenticated: body.authenticated,
        userInfoId: body.userInfoId,
        role: body.role,
        permissions: new Set(body.permissions ?? []),
        resolved: true,
      });
    } catch (error) {
      if ((error as Error)?.name === "AbortError") return;
      // Offline, or the endpoint is down. Stay a guest — the safe tier — but
      // mark it resolved so the UI stops waiting on an answer that is not coming.
      setIdentity({ ...GUEST, resolved: true });
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    if (!initialIdentity) void load(controller.signal);

    // ---------------------------------------------------------------------
    // Why this provider revalidates rather than checking once.
    //
    // It is mounted in the root layout, so it NEVER unmounts — a client-side
    // navigation after login does not remount it. Checking only on mount meant
    // logging in as an admin left the nav on the tier resolved when the tab
    // first opened, until a hard refresh. That was the reported bug.
    //
    // Three signals, cheapest first:
    //   1. An explicit announcement from login/logout — instant, same tab and
    //      across tabs.
    //   2. The tab regaining focus — catches a login completed elsewhere, or a
    //      session that expired while the tab sat in the background.
    //   3. refresh(), for callers that want to force it.
    // ---------------------------------------------------------------------
    const unsubscribe = onAuthChange(() => void load());

    // Throttled: alt-tabbing should not fire a request per switch. An explicit
    // announcement is never throttled, so login still updates instantly.
    let lastFocusCheck = Date.now();
    const revalidateOnFocus = () => {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - lastFocusCheck < 10_000) return;
      lastFocusCheck = Date.now();
      void load();
    };

    window.addEventListener("focus", revalidateOnFocus);
    document.addEventListener("visibilitychange", revalidateOnFocus);

    return () => {
      controller.abort();
      unsubscribe();
      window.removeEventListener("focus", revalidateOnFocus);
      document.removeEventListener("visibilitychange", revalidateOnFocus);
    };
  }, [initialIdentity, load]);

  const logout = useCallback(async () => {
    await logoutPortalSession();
    setIdentity({ ...GUEST, resolved: true });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ ...identity, logout, refresh: () => load() }),
    [identity, logout, load]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Reading identity outside a provider yields a resolved guest rather than
 * throwing. A missing provider must not white-screen a public page that never
 * needed identity in the first place.
 */
export function useAuth(): AuthContextValue {
  return (
    useContext(AuthContext) ?? {
      ...GUEST,
      resolved: true,
      logout: async () => {},
      refresh: async () => {},
    }
  );
}
