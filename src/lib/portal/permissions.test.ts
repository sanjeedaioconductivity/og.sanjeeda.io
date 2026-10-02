// Sprint 9, Story 9.1.2 — the access model.
//
// Two properties matter more than any individual case here:
//
//   1. A null identity (a guest) is answered, never thrown at. OfferGuide's
//      whole wizard runs in that state.
//   2. admin ⊇ user ⊇ public, structurally. The handoff names the inverse as a
//      bug to never write: "Never write a check that grants a permission to user
//      but denies it to admin." The property tests below hold for permissions
//      added years from now, which a hand-written case list would not.

import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  PERMISSIONS,
  PUBLIC_PERMISSION_SET,
  ROLES,
  ROLE_PERMISSIONS,
  hasPermission,
  isRole,
  normalizeRole,
  permissionsFor,
  type Permission,
} from "./permissions";

const guest = null;
const user = { userInfoId: 1, role: "user" };
const admin = { userInfoId: 2, role: "admin" };

describe("the five named permissions", () => {
  it("defines exactly the set the handoff names", () => {
    expect([...PERMISSIONS].sort()).toEqual(
      [
        "offerguide.config.read",
        "offerguide.config.write",
        "offerguide.history.view",
        "offerguide.wizard.use",
        "portal.admin.access",
      ].sort()
    );
  });

  it.each([
    ["offerguide.wizard.use", true, true, true],
    ["offerguide.history.view", false, true, true],
    ["offerguide.config.read", false, false, true],
    ["offerguide.config.write", false, false, true],
    ["portal.admin.access", false, false, true],
  ] as [Permission, boolean, boolean, boolean][])(
    "%s — guest:%s user:%s admin:%s",
    (permission, forGuest, forUser, forAdmin) => {
      expect(hasPermission(guest, permission)).toBe(forGuest);
      expect(hasPermission(user, permission)).toBe(forUser);
      expect(hasPermission(admin, permission)).toBe(forAdmin);
    }
  );
});

describe("a guest is a normal state, not an error", () => {
  it("answers every permission for a null identity without throwing", () => {
    for (const permission of PERMISSIONS) {
      expect(() => hasPermission(guest, permission)).not.toThrow();
      expect(typeof hasPermission(guest, permission)).toBe("boolean");
    }
  });

  it("lets a guest use the wizard — OfferGuide's whole premise", () => {
    expect(hasPermission(guest, "offerguide.wizard.use")).toBe(true);
  });

  it("returns the public set from permissionsFor(null)", () => {
    expect(permissionsFor(guest)).toBe(PUBLIC_PERMISSION_SET);
  });
});

describe("admin is a superset — structurally, not by listing", () => {
  it("grants admin everything user has", () => {
    for (const permission of ROLE_PERMISSIONS.user) {
      expect(hasPermission(admin, permission)).toBe(true);
    }
  });

  it("grants every role everything public has", () => {
    for (const role of ROLES) {
      for (const permission of PUBLIC_PERMISSION_SET) {
        expect(ROLE_PERMISSIONS[role].has(permission)).toBe(true);
      }
    }
  });

  it("has no permission granted to user but denied to admin", () => {
    const denied = [...PERMISSIONS].filter(
      (p) => hasPermission(user, p) && !hasPermission(admin, p)
    );
    expect(denied).toEqual([]);
  });
});

describe("unrecognised roles degrade to user, never to admin", () => {
  it.each([
    ["a typo", "adminn"],
    ["the old pgp value", "Candidate"],
    ["a future role", "steward"],
    ["empty", ""],
    ["whitespace", "   "],
    ["case-shifted admin", "Admin"],
    ["null", null],
    ["undefined", undefined],
  ])("normalises %s to user", (_label, role) => {
    expect(normalizeRole(role)).toBe("user");
  });

  it("never grants an admin permission to an unrecognised role", () => {
    const impostor = { userInfoId: 3, role: "Admin" };
    expect(hasPermission(impostor, "portal.admin.access")).toBe(false);
    expect(hasPermission(impostor, "offerguide.config.write")).toBe(false);
  });

  it("still grants the authenticated tier — an unknown role is a real account", () => {
    expect(hasPermission({ userInfoId: 3, role: "steward" }, "offerguide.history.view")).toBe(true);
  });

  it("isRole accepts only the stored values", () => {
    expect(isRole("user")).toBe(true);
    expect(isRole("admin")).toBe(true);
    expect(isRole("Admin")).toBe(false);
    expect(isRole(null)).toBe(false);
    expect(isRole(42)).toBe(false);
  });
});

// The DoD asks for this by name: "Grep confirms no direct `role ===` comparison
// at any call site." Making it a test rather than a pre-PR ritual means it also
// catches the one somebody adds next year.
describe("no call site compares role directly", () => {
  const SRC = path.join(process.cwd(), "src");

  /** This file quotes the forbidden pattern in prose; permissions.ts defines the model. */
  const ALLOWED = new Set([
    path.join(SRC, "lib", "portal", "permissions.test.ts"),
    path.join(SRC, "lib", "portal", "permissions.ts"),
  ]);

  function sourceFiles(dir: string, found: string[] = []): string[] {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        // Prisma's generated client is not a call site.
        if (entry.name === "generated") continue;
        sourceFiles(full, found);
      } else if (/\.(ts|tsx)$/.test(entry.name)) {
        found.push(full);
      }
    }
    return found;
  }

  /** Matches role === "admin", identity.role !== 'user', user.role == "admin", … */
  const DIRECT_ROLE_COMPARISON = /\brole\b\s*[=!]==?\s*["'`]/;

  it("finds no `role === '...'` or `role !== '...'` outside the map itself", () => {
    const offenders = sourceFiles(SRC)
      .filter((file) => !ALLOWED.has(file))
      .filter((file) => DIRECT_ROLE_COMPARISON.test(fs.readFileSync(file, "utf8")))
      .map((file) => path.relative(process.cwd(), file));

    expect(offenders).toEqual([]);
  });

  it("would catch one if it existed", () => {
    expect(DIRECT_ROLE_COMPARISON.test(`if (role === "admin") {}`)).toBe(true);
    expect(DIRECT_ROLE_COMPARISON.test(`if (identity.role !== 'user') {}`)).toBe(true);
    expect(DIRECT_ROLE_COMPARISON.test(`if (user.role == "admin") {}`)).toBe(true);
    expect(
      DIRECT_ROLE_COMPARISON.test(`hasPermission(identity, "portal.admin.access")`)
    ).toBe(false);
  });
});
