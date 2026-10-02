/**
 * The portal's client-side session, in one place (Sprint 9, Phase 0).
 *
 * Before this file the portal had two storage keys for one JWT — `authToken`
 * written by the auth page and `token` written by GoogleLoginButton — and read
 * neither of them. It also had no logout: the token was written on login and
 * left in localStorage forever.
 *
 * The server-side half of the session is the httpOnly `portalToken` cookie set
 * by `POST /api/auth` (see `lib/offerguide/identity.ts`). That cookie is what
 * middleware and server rendering actually read. The localStorage copy exists
 * for client code that needs to attach an explicit `Authorization` header, and
 * is deliberately kept in sync with it rather than replacing it.
 *
 * NAMING: `authToken` is kept as the key because it is the one the auth page
 * already wrote — changing it would silently log out everyone holding the old
 * key on deploy, for no gain.
 */

export const PORTAL_TOKEN_STORAGE_KEY = "authToken";

/**
 * Broadcast channel name for "the session changed". AuthProvider listens; login
 * and logout announce.
 *
 * This exists because the provider lives in the root layout and therefore never
 * unmounts. A client-side navigation after login does not remount it, so
 * without an explicit signal it would keep showing the tier it resolved when
 * the tab first opened — which is exactly the bug where you log in as admin and
 * the nav stays on the guest tier until a hard refresh.
 */
const AUTH_CHANNEL = "portal-auth";

/**
 * Tells every AuthProvider in every open tab to re-read the session.
 *
 * Cross-tab matters: logging out in one tab must not leave another tab showing
 * admin links that no longer work. Falls back silently where BroadcastChannel
 * is unavailable — the provider also revalidates on focus, which covers it.
 */
export function announceAuthChange(): void {
  try {
    if (typeof BroadcastChannel === "undefined") return;
    const channel = new BroadcastChannel(AUTH_CHANNEL);
    channel.postMessage("changed");
    channel.close();
  } catch {
    /* unsupported or blocked — focus revalidation is the fallback */
  }
}

/** Subscribes to session-changed announcements. Returns an unsubscribe function. */
export function onAuthChange(handler: () => void): () => void {
  try {
    if (typeof BroadcastChannel === "undefined") return () => {};
    const channel = new BroadcastChannel(AUTH_CHANNEL);
    channel.onmessage = () => handler();
    return () => channel.close();
  } catch {
    return () => {};
  }
}

/** The key GoogleLoginButton used to write via a dead code path. Cleared on logout so no stale copy survives the upgrade. */
const LEGACY_TOKEN_STORAGE_KEY = "token";

function safeLocalStorage(): Storage | null {
  // Private-mode Safari and storage-blocking browsers throw on access, not just
  // on write. A session that can't be cached is a working session, not an error.
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function storePortalToken(token: string): void {
  try {
    safeLocalStorage()?.setItem(PORTAL_TOKEN_STORAGE_KEY, token);
  } catch {
    /* quota or blocked storage — the cookie is the authoritative copy anyway */
  }
  // The server already set the httpOnly cookie on the response that carried
  // this token; announcing here is what makes the nav update without a reload.
  announceAuthChange();
}

export function readPortalToken(): string | null {
  try {
    return safeLocalStorage()?.getItem(PORTAL_TOKEN_STORAGE_KEY) ?? null;
  } catch {
    return null;
  }
}

/**
 * Clears both halves of the session: the httpOnly cookie (server-side, via the
 * logout action) and the localStorage copy.
 *
 * The cookie call is best-effort — if it fails, clearing localStorage still has
 * to happen, or the user is left looking logged in on a session they asked to
 * end. The cookie expires within the hour regardless.
 */
export async function logoutPortalSession(): Promise<void> {
  try {
    await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ action: "logout" }),
    });
  } catch {
    /* offline or server down — fall through and clear the client copy */
  }

  try {
    const storage = safeLocalStorage();
    storage?.removeItem(PORTAL_TOKEN_STORAGE_KEY);
    storage?.removeItem(LEGACY_TOKEN_STORAGE_KEY);
  } catch {
    /* nothing more we can do client-side */
  }

  // Other tabs must drop back to the guest tier too, or they keep showing admin
  // links for a session that no longer exists.
  announceAuthChange();
}
