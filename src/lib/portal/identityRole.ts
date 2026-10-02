import { normalizeRole, type PermissionIdentity, type Role } from "./permissions";

/**
 * Reads a caller's stored role (Sprint 9, Story 9.1.2).
 *
 * WHY A DATABASE READ AND NOT A JWT CLAIM. The role could be stamped into the
 * token at sign time and read for free. It is not, for two reasons: the portal's
 * tokens live an hour, so a demotion would keep working for up to an hour after
 * it was made; and a claim is asserted by whoever signed the token, whereas this
 * is asserted by the table that owns the fact. The admin surface is 30
 * low-traffic operations — one indexed primary-key lookup per call is not a cost
 * worth trading correctness for. Caching it is a later optimisation, if ever.
 *
 * FAILS CLOSED. A database error, a deleted account, or an id that matches no
 * row all resolve to null — which `hasPermission` then treats as the public
 * tier. The interim gate this replaces failed closed on an unset env var; that
 * property is preserved deliberately.
 */
export async function loadPermissionIdentity(
  userInfoId: number | null
): Promise<PermissionIdentity> {
  if (userInfoId === null) return null;

  try {
    // Imported lazily, on purpose. `@/lib/db/prisma` builds its adapter at
    // module scope and THROWS if the database env vars are absent, so a static
    // import here would make merely importing adminAuth.ts require a configured
    // database — which broke three unit-test files that have no database and
    // never touch one. It also means a guest request, which returns above,
    // never constructs a client at all.
    const { prisma } = await import("@/lib/db/prisma");

    const row = await prisma.userInfo.findUnique({
      where: { userInfoId },
      select: { userInfoId: true, role: true },
    });

    if (!row) return null;

    return { userInfoId: row.userInfoId, role: normalizeRole(row.role) };
  } catch (error) {
    // A token that verified but whose role cannot be read is not an admin. Log
    // it — this is the difference between "no permissions" and "database down",
    // and a silent downgrade to guest is otherwise very hard to diagnose.
    console.error("[permissions] could not read role for", userInfoId, error);
    return null;
  }
}

/** The stored role alone, for callers that already know the identity resolves. */
export async function loadRole(userInfoId: number | null): Promise<Role | null> {
  const identity = await loadPermissionIdentity(userInfoId);
  return identity ? normalizeRole(identity.role) : null;
}
