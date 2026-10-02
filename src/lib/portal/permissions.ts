/**
 * The portal's access model (Sprint 9, Story 9.1.2).
 *
 * THREE TIERS, and the first one is an absence:
 *
 *   public         no JWT. May or may not carry a guestToken cookie. Not a
 *                  stored role — there is no `sanjeedausers` row at all.
 *   authenticated  a valid JWT for a registered account. Stored role: 'user'.
 *   admin          a valid JWT whose stored role is 'admin'. Everything.
 *
 * A null identity is a NORMAL, EXPECTED state, not an error and not a redirect.
 * OfferGuide's entire wizard is usable in it and must stay that way — so every
 * function here takes `Identity | null` and answers rather than throwing.
 *
 * CHECK PERMISSIONS, NOT ROLES. `hasPermission(identity, 'offerguide.config.write')`,
 * never `role === 'admin'`. The second form is what makes a fourth role a
 * codebase-wide edit instead of a line in ROLE_PERMISSIONS, and it is what
 * eventually grants something to `user` and forgets to grant it to `admin`.
 * permissions.test.ts asserts no such comparison exists anywhere in src/.
 *
 * THIS IS THE WHOLE MODEL. No permission table, no database round-trip on a
 * check, no per-user overrides, no permission-editing UI. Sprint 9 §6 puts all
 * of that explicitly out of scope; the real RBAC module is the §7 backlog item
 * this static map is the deliberate minimum stand-in for.
 */

/** Stored role values. VARCHAR(32) in the database validates nothing — this does. */
export const ROLES = ["user", "admin"] as const;
export type Role = (typeof ROLES)[number];

export const PERMISSIONS = [
  "offerguide.wizard.use",
  "offerguide.history.view",
  "offerguide.config.read",
  "offerguide.config.write",
  "portal.admin.access",
] as const;
export type Permission = (typeof PERMISSIONS)[number];

/**
 * What a guest can do without an account. OfferGuide's whole reason for existing
 * is that this list is not empty.
 */
const PUBLIC_PERMISSIONS: readonly Permission[] = ["offerguide.wizard.use"];

/** What a registered account adds on top of public. */
const USER_PERMISSIONS: readonly Permission[] = ["offerguide.history.view"];

/** What admin adds on top of user. */
const ADMIN_PERMISSIONS: readonly Permission[] = [
  "offerguide.config.read",
  "offerguide.config.write",
  "portal.admin.access",
];

/**
 * Built by accumulation, not by listing each role's permissions separately.
 *
 * That is the point: `admin` is a SUPERSET of `user`, which is a superset of
 * public. Composing the sets makes it structurally impossible to write a check
 * that grants something to `user` and denies it to `admin` — the bug the handoff
 * calls out by name. Adding a permission to USER_PERMISSIONS grants it to admin
 * in the same edit, with no second place to remember.
 */
export const ROLE_PERMISSIONS: Record<Role, ReadonlySet<Permission>> = {
  user: new Set([...PUBLIC_PERMISSIONS, ...USER_PERMISSIONS]),
  admin: new Set([...PUBLIC_PERMISSIONS, ...USER_PERMISSIONS, ...ADMIN_PERMISSIONS]),
};

/** What a caller with no account at all can do. */
export const PUBLIC_PERMISSION_SET: ReadonlySet<Permission> = new Set(PUBLIC_PERMISSIONS);

/**
 * The caller, as far as permissions are concerned. Deliberately smaller than
 * OfferGuide's `Identity`: a guest and a total stranger have identical
 * permissions, so the guestToken is not modelled here.
 */
export type PermissionIdentity = {
  userInfoId: number;
  role: string;
} | null;

/**
 * An unrecognised stored role degrades to `user`, never to `admin`.
 *
 * The column is a VARCHAR with no constraint, so a typo, a legacy value, or a
 * future role this build has not been taught about are all reachable states. Any
 * of them granting admin would be a privilege escalation via a typo; granting
 * the ordinary authenticated tier is the safe reading of "this is a real,
 * registered account whose exact role we do not recognise".
 */
export function normalizeRole(role: string | null | undefined): Role {
  return (ROLES as readonly string[]).includes(role ?? "") ? (role as Role) : "user";
}

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

/**
 * THE enforcement point. The client's usePermission() hook reads this same map,
 * but a client check is a convenience for hiding links — it is never what stops
 * a request. Every protected route calls this, server-side, on every request.
 */
export function hasPermission(
  identity: PermissionIdentity,
  permission: Permission
): boolean {
  if (!identity) return PUBLIC_PERMISSION_SET.has(permission);
  return ROLE_PERMISSIONS[normalizeRole(identity.role)].has(permission);
}

/** Every permission a caller holds. For the nav, which filters rather than asks. */
export function permissionsFor(identity: PermissionIdentity): ReadonlySet<Permission> {
  if (!identity) return PUBLIC_PERMISSION_SET;
  return ROLE_PERMISSIONS[normalizeRole(identity.role)];
}
