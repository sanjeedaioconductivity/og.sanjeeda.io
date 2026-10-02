// OfferGuide — Sprint 9, Story 9.1.4: the real admin gate
//
// The gate is LAUNCH-BLOCKING. The admin config API ships with no UI, so these
// routes are the only thing protecting configuration integrity — and a hole in
// them is a hole in scoring itself.
//
// adminAuth.test.ts covers requireAdmin() in isolation. This file covers the
// DoD's four credential cases across EVERY admin operation, plus the structural
// guarantees: every admin route file actually reaches the gate, every call site
// awaits it, and the interim gate is gone rather than lingering as a fallback.
//
// Sprint 8's version of this file asserted that no `role` reference existed in
// the gate, because the column did not exist yet. Sprint 9 inverts that: the
// gate is now defined by the role, and what must not appear is a call site
// comparing one directly.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import fs from "node:fs";
import path from "node:path";

const loadPermissionIdentity = vi.hoisted(() => vi.fn());
vi.mock("@/lib/portal/identityRole", () => ({ loadPermissionIdentity }));

const { requireAdmin } = await import("./adminAuth");
const { GUEST_COOKIE_NAME } = await import("./identity");
const { IDENTITY_TYPE_HEADER, USER_INFO_ID_HEADER, USER_ROLE_HEADER } =
  await import("@/lib/portal/identityHeaders");

const ADMIN_DIR = path.join(
  process.cwd(),
  "src",
  "app",
  "api",
  "offerguide",
  "admin",
  "config"
);

function adminRouteFiles(): string[] {
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name === "route.ts") files.push(full);
    }
  };
  walk(ADMIN_DIR);
  return files;
}

/**
 * Every admin operation the contract declares. The DoD requires all of them to
 * reject three credential shapes and accept one, so they are listed rather than
 * sampled. 30, not the 26 named in the handoff — that count predates the two
 * geography-cities operations Sprint 8 added.
 */
const ADMIN_OPERATIONS: [string, string][] = [
  ...["questions", "market-benchmarks", "geography", "functional-domains", "consent-toggles"]
    .flatMap((c): [string, string][] => [
      ["GET", `/api/offerguide/admin/config/${c}`],
      ["POST", `/api/offerguide/admin/config/${c}`],
      ["GET", `/api/offerguide/admin/config/${c}/x`],
      ["PUT", `/api/offerguide/admin/config/${c}/x`],
      ["DELETE", `/api/offerguide/admin/config/${c}/x`],
    ]),
  ["POST", "/api/offerguide/admin/config/geography/PK/cities"],
  ["PATCH", "/api/offerguide/admin/config/geography/PK/cities/khi"],
  ["GET", "/api/offerguide/admin/config/scoring"],
  ["POST", "/api/offerguide/admin/config/scoring"],
  ["GET", "/api/offerguide/admin/config/scoring/1"],
];

type Credentials = {
  bearer?: string;
  guestToken?: string;
  middlewareRole?: string;
  middlewareId?: number;
};

function request(
  method: string,
  url: string,
  { bearer, guestToken, middlewareRole, middlewareId = 7 }: Credentials = {}
) {
  const headers = new Headers();
  if (bearer) headers.set("authorization", `Bearer ${bearer}`);
  if (guestToken) headers.set("cookie", `${GUEST_COOKIE_NAME}=${guestToken}`);
  if (middlewareRole) {
    headers.set(IDENTITY_TYPE_HEADER, "authenticated");
    headers.set(USER_INFO_ID_HEADER, String(middlewareId));
    headers.set(USER_ROLE_HEADER, middlewareRole);
  }
  return new NextRequest(`http://localhost${url}`, { method, headers });
}

beforeEach(() => {
  loadPermissionIdentity.mockReset();
  loadPermissionIdentity.mockResolvedValue(null);
});

describe("Story 9.1.4 — all 30 admin operations, four credential cases", () => {
  it("enumerates 30 operations", () => {
    expect(ADMIN_OPERATIONS).toHaveLength(30);
  });

  describe("reject: no credentials", () => {
    it.each(ADMIN_OPERATIONS)("%s %s", async (method, url) => {
      expect((await requireAdmin(request(method, url)))?.status).toBe(401);
    });
  });

  describe("reject: a guestToken cookie only", () => {
    it.each(ADMIN_OPERATIONS)("%s %s", async (method, url) => {
      const req = request(method, url, { guestToken: crypto.randomUUID() });
      expect((await requireAdmin(req))?.status).toBe(401);
    });
  });

  describe("reject: a valid JWT belonging to a user-role account", () => {
    it.each(ADMIN_OPERATIONS)("%s %s", async (method, url) => {
      const req = request(method, url, { middlewareRole: "user", middlewareId: 9001 });
      expect((await requireAdmin(req))?.status).toBe(401);
    });
  });

  describe("accept: a valid JWT belonging to an admin-role account", () => {
    it.each(ADMIN_OPERATIONS)("%s %s", async (method, url) => {
      const req = request(method, url, { middlewareRole: "admin" });
      expect(await requireAdmin(req)).toBeNull();
    });
  });

  it("rejects a user JWT and a guest cookie presented together", async () => {
    const req = request("GET", "/api/offerguide/admin/config/questions", {
      middlewareRole: "user",
      guestToken: crypto.randomUUID(),
    });
    expect((await requireAdmin(req))?.status).toBe(401);
  });

  it("still admits an admin whose own guest cookie rides along", async () => {
    const req = request("GET", "/api/offerguide/admin/config/questions", {
      middlewareRole: "admin",
      guestToken: crypto.randomUUID(),
    });
    expect(await requireAdmin(req)).toBeNull();
  });
});

describe("Story 9.1.4 — the gate is applied everywhere", () => {
  const files = adminRouteFiles();

  it("finds every admin config route file", () => {
    expect(files.length).toBeGreaterThanOrEqual(14);
  });

  for (const file of files) {
    const relative = path.relative(process.cwd(), file).replace(/\\/g, "/");

    it(`${relative} is gated`, () => {
      const source = fs.readFileSync(file, "utf8");
      // Either the route calls requireAdmin itself, or it delegates to the
      // adminCrud factory, which calls it in every handler.
      const gated =
        source.includes("requireAdmin") ||
        source.includes("createItemHandlers") ||
        source.includes("createCollectionHandlers");
      expect(gated, "no admin gate found in this route").toBe(true);
    });

    it(`${relative} awaits the gate`, () => {
      // requireAdmin became async in Sprint 9. A forgotten await returns a
      // Promise, which is truthy — so it fails closed rather than open — but it
      // would reject every admin, which is its own outage.
      const source = fs.readFileSync(file, "utf8");
      const calls = source.match(/(await\s+)?requireAdmin\s*\(/g) ?? [];
      for (const call of calls) {
        expect(call.startsWith("await"), `un-awaited requireAdmin in ${relative}`).toBe(true);
      }
    });
  }

  it("the CRUD factory awaits the gate in every handler", () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), "src", "lib", "offerguide", "adminCrud.ts"),
      "utf8"
    );
    const calls = source.match(/(await\s+)?requireAdmin\s*\(/g) ?? [];
    expect(calls.length).toBe(5); // GET, POST on collections; GET, PUT, DELETE on items
    for (const call of calls) expect(call.startsWith("await")).toBe(true);
  });
});

describe("Story 9.1.4 — the interim gate is gone, not disabled", () => {
  const stripComments = (source: string) =>
    source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");

  const sourceFiles = (dir: string, found: string[] = []): string[] => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "generated") continue;
        sourceFiles(full, found);
      } else if (/\.(ts|tsx)$/.test(entry.name)) found.push(full);
    }
    return found;
  };

  it("no executable code reads OFFERGUIDE_ADMIN_TOKEN or the x-og-admin-token header", () => {
    // This file names both strings in its own assertions, so it is excluded —
    // the check would otherwise always find itself.
    const SELF = path.join(process.cwd(), "src", "lib", "offerguide", "adminGate.test.ts");

    const offenders = sourceFiles(path.join(process.cwd(), "src"))
      .filter((file) => file !== SELF)
      .filter((file) => {
        const logic = stripComments(fs.readFileSync(file, "utf8"));
        return /OFFERGUIDE_ADMIN_TOKEN|x-og-admin-token/.test(logic);
      })
      .map((file) => path.relative(process.cwd(), file));

    expect(offenders).toEqual([]);
  });

  it("the published contract no longer offers the interim scheme", () => {
    const contract = fs.readFileSync(
      path.join(process.cwd(), "public", "openapi.yaml"),
      "utf8"
    );
    expect(contract).not.toMatch(/x-og-admin-token/);
    expect(contract).not.toMatch(/OFFERGUIDE_ADMIN_TOKEN/);
    // Still gated, under the renamed scheme. 30 in Sprint 9; Sprint 10 added
    // the scoring activate + preview endpoints, both adminAuth, so 32.
    expect(contract.match(/AdminAuth: \[\]/g) ?? []).toHaveLength(32);
  });

  it("the gate is no longer flagged as a placeholder", () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), "src", "lib", "offerguide", "adminAuth.ts"),
      "utf8"
    );
    expect(source).not.toMatch(/TEMPORARY|PLACEHOLDER/i);
  });
});
