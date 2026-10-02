"use client";

/**
 * Permission checks for client components (Sprint 9, Story 9.1.2).
 *
 * ================== NOT AN ENFORCEMENT POINT ==================
 *
 * This hook decides what to RENDER. It never decides what a request may do.
 * Anything it hides is still reachable by anyone who types the URL, and it must
 * be — the server check in `hasPermission` is the only thing that actually
 * stops a request, and it is the one that has to be right.
 *
 * Hiding a link the server does not also refuse is a bug, not a feature.
 *
 * ==============================================================
 *
 * Reads the permission set the server sent, rather than re-deriving it from a
 * role on the client. That keeps one copy of the role→permission map, so a
 * stale bundle cannot disagree with the server about what "admin" means.
 */

import { useAuth } from "./AuthProvider";
import type { Permission } from "./permissions";

/**
 * Does the current caller hold this permission?
 *
 * Answers `false` for a guest and during the brief window before identity
 * resolves — never throws, never redirects, never logs. A guest is a normal,
 * expected caller, and OfferGuide's whole wizard runs in that state.
 */
export function usePermission(permission: Permission): boolean {
  return useAuth().permissions.has(permission);
}

/**
 * Filters a list of permission-gated items in one pass. The nav uses this
 * rather than calling usePermission() per item, because hooks cannot be called
 * in a loop whose length changes.
 */
export function usePermissionFilter<T extends { permission: Permission }>(
  items: readonly T[]
): T[] {
  const { permissions } = useAuth();
  return items.filter((item) => permissions.has(item.permission));
}
