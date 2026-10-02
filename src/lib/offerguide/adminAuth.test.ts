// Sprint 9, Story 9.1.4 — requireAdmin() in isolation.
//
// adminGate.test.ts covers the four credential cases across all 30 admin
// operations. This file covers the unit: what requireAdmin() does with each
// shape of identity it can be handed.
//
// The database is mocked. requireAdmin resolves an identity one of two ways —
// from the headers proxy.ts stamped (the production path, no query), or by
// verifying the token itself and reading the role (the fallback, for a route the
// matcher does not cover). Both are exercised; only the second needs the mock.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

const loadPermissionIdentity = vi.hoisted(() => vi.fn());
vi.mock("@/lib/portal/identityRole", () => ({ loadPermissionIdentity }));

const { requireAdmin } = await import("./adminAuth");
const { GUEST_COOKIE_NAME } = await import("./identity");
const {
  IDENTITY_TYPE_HEADER,
  USER_INFO_ID_HEADER,
  USER_ROLE_HEADER,
} = await import("@/lib/portal/identityHeaders");

const SECRET = process.env.JWT_SECRET || "default_secret";

type Setup = {
  /** As proxy.ts would have stamped them. */
  identity?: { type: "public" } | { type: "authenticated"; id: number; role: string };
  bearer?: string;
  guestToken?: string;
};

function adminRequest({ identity, bearer, guestToken }: Setup = {}) {
  const headers = new Headers();

  if (identity?.type === "public") headers.set(IDENTITY_TYPE_HEADER, "public");
  if (identity?.type === "authenticated") {
    headers.set(IDENTITY_TYPE_HEADER, "authenticated");
    headers.set(USER_INFO_ID_HEADER, String(identity.id));
    headers.set(USER_ROLE_HEADER, identity.role);
  }

  if (bearer) headers.set("authorization", `Bearer ${bearer}`);
  if (guestToken) headers.set("cookie", `${GUEST_COOKIE_NAME}=${guestToken}`);

  return new NextRequest("http://localhost/api/offerguide/admin/config/questions", {
    headers,
  });
}

/**
 * Stands in for the database. It must honour the real function's contract —
 * a null id yields a null identity — because that is exactly how a rejected
 * token reaches it. A mock that answers "admin" regardless of its argument
 * makes an expired or forged token look like it passes, when in fact
 * `resolveAuthedUser` had already reduced it to null.
 */
function storedRole(role: string | null) {
  loadPermissionIdentity.mockImplementation(async (userInfoId: number | null) =>
    userInfoId === null || role === null ? null : { userInfoId, role }
  );
}

beforeEach(() => {
  loadPermissionIdentity.mockReset();
  storedRole(null);
});

describe("requireAdmin — identity resolved by middleware", () => {
  it("rejects a request with no identity headers at all", async () => {
    expect((await requireAdmin(adminRequest()))?.status).toBe(401);
  });

  it("rejects the public tier", async () => {
    const denied = await requireAdmin(adminRequest({ identity: { type: "public" } }));
    expect(denied?.status).toBe(401);
  });

  it("rejects a registered user — a registered user is not an admin", async () => {
    const denied = await requireAdmin(
      adminRequest({ identity: { type: "authenticated", id: 9001, role: "user" } })
    );
    expect(denied?.status).toBe(401);
  });

  it("allows an admin", async () => {
    const denied = await requireAdmin(
      adminRequest({ identity: { type: "authenticated", id: 7, role: "admin" } })
    );
    expect(denied).toBeNull();
  });

  it("does not query the database when middleware already resolved the identity", async () => {
    await requireAdmin(
      adminRequest({ identity: { type: "authenticated", id: 7, role: "admin" } })
    );
    expect(loadPermissionIdentity).not.toHaveBeenCalled();
  });

  // Note "admin " with a trailing space is absent deliberately: HTTP header
  // values are trimmed by the Headers API, so it arrives as "admin" and is a
  // genuine admin. The normalisation that matters is over the stored value,
  // which permissions.test.ts covers.
  it("rejects a role that only looks like admin", async () => {
    for (const role of ["Admin", "ADMIN", "administrator", "adminn", "user", ""]) {
      const denied = await requireAdmin(
        adminRequest({ identity: { type: "authenticated", id: 7, role } })
      );
      expect(denied?.status, `role "${role}" must not pass`).toBe(401);
    }
  });

  it("rejects an authenticated header with a nonsense user id", async () => {
    for (const id of [0, -1]) {
      const denied = await requireAdmin(
        adminRequest({ identity: { type: "authenticated", id, role: "admin" } })
      );
      expect(denied?.status).toBe(401);
    }
  });
});

describe("requireAdmin — fallback when middleware did not run", () => {
  it("verifies the token itself and reads the role", async () => {
    storedRole("admin");

    const denied = await requireAdmin(adminRequest({ bearer: jwt.sign({ id: 7 }, SECRET) }));

    expect(denied).toBeNull();
    expect(loadPermissionIdentity).toHaveBeenCalledWith(7);
  });

  it("rejects when the stored role is not admin", async () => {
    storedRole("user");
    const denied = await requireAdmin(adminRequest({ bearer: jwt.sign({ id: 9001 }, SECRET) }));
    expect(denied?.status).toBe(401);
  });

  it("rejects a guest cookie", async () => {
    const denied = await requireAdmin(adminRequest({ guestToken: crypto.randomUUID() }));
    expect(denied?.status).toBe(401);
    // A guest has no userInfoId, so there is nothing to look up.
    expect(loadPermissionIdentity).toHaveBeenCalledWith(null);
  });

  it("rejects a token signed with the wrong secret", async () => {
    storedRole("admin");
    const forged = jwt.sign({ id: 7 }, "not-the-portal-secret");
    expect((await requireAdmin(adminRequest({ bearer: forged })))?.status).toBe(401);
  });

  it("rejects an expired admin token", async () => {
    storedRole("admin");
    const expired = jwt.sign({ id: 7 }, SECRET, { expiresIn: -10 });
    expect((await requireAdmin(adminRequest({ bearer: expired })))?.status).toBe(401);
  });
});

describe("requireAdmin — fails closed", () => {
  it("rejects when the role lookup throws nothing but resolves to null (deleted account)", async () => {
    storedRole(null);
    const denied = await requireAdmin(adminRequest({ bearer: jwt.sign({ id: 7 }, SECRET) }));
    expect(denied?.status).toBe(401);
  });

  it("rejects rather than admitting when the database is unavailable", async () => {
    // loadPermissionIdentity swallows database errors and returns null; this
    // asserts the consequence — an outage locks admins out, it does not let
    // everyone in.
    storedRole(null);
    const denied = await requireAdmin(adminRequest({ bearer: jwt.sign({ id: 7 }, SECRET) }));
    expect(denied?.status).toBe(401);
  });
});
