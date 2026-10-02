// Sprint 10, Epic 10.1 — the admin area's single declaration.
//
// The sidebar, the landing cards and the page titles all read from
// ADMIN_DESTINATIONS. These pin the shape the FRS specifies, and the one
// property the landing page's count fetch depends on: every resource's
// `collection` is a real admin API segment.

import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  ADMIN_BASE,
  ADMIN_DESTINATIONS,
  ADMIN_RESOURCES,
  API_DOCS_LINK,
  adminHref,
} from "./adminNav";

describe("the declaration matches the FRS", () => {
  it("has the overview plus exactly six resources, in sidebar order", () => {
    expect(ADMIN_DESTINATIONS.map((d) => d.label)).toEqual([
      "Overview",
      "Questions",
      "Scoring",
      "Market Benchmarks",
      "Geography",
      "Functional Domains",
      "Consent Toggles",
    ]);
  });

  it("assigns ADM-000 through ADM-006, in order", () => {
    expect(ADMIN_DESTINATIONS.map((d) => d.screenId)).toEqual([
      "ADM-000",
      "ADM-001",
      "ADM-002",
      "ADM-003",
      "ADM-004",
      "ADM-005",
      "ADM-006",
    ]);
  });

  it("ADMIN_RESOURCES is everything except the overview", () => {
    expect(ADMIN_RESOURCES).toHaveLength(6);
    expect(ADMIN_RESOURCES.every((d) => d.collection !== undefined)).toBe(true);
    expect(ADMIN_RESOURCES.some((d) => d.segment === "")).toBe(false);
  });

  it("keeps /api-docs as a deliberate seventh link, outside the six", () => {
    expect(API_DOCS_LINK.href).toBe("/api-docs");
    expect(ADMIN_DESTINATIONS.some((d) => adminHref(d.segment) === "/api-docs")).toBe(false);
  });
});

describe("every resource's collection is a real admin API route", () => {
  const ADMIN_API = path.join(
    process.cwd(),
    "src",
    "app",
    "api",
    "offerguide",
    "admin",
    "config"
  );

  for (const { label, collection } of ADMIN_RESOURCES) {
    it(`${label} → /admin/config/${collection} exists`, () => {
      expect(fs.existsSync(path.join(ADMIN_API, collection, "route.ts"))).toBe(true);
    });
  }
});

describe("adminHref", () => {
  it("maps the empty segment to the base", () => {
    expect(adminHref("")).toBe(ADMIN_BASE);
    expect(ADMIN_BASE).toBe("/offerguide/admin");
  });

  it("nests every resource under the base", () => {
    for (const { segment } of ADMIN_RESOURCES) {
      expect(adminHref(segment)).toBe(`/offerguide/admin/${segment}`);
    }
  });

  it("segments are URL-safe", () => {
    for (const { segment } of ADMIN_DESTINATIONS) {
      expect(segment).toMatch(/^[a-z-]*$/);
    }
  });
});

describe("the admin area lives under the offerguide feature folder", () => {
  // Story 10.1.1: nested under `offerguide`, not a new top-level feature, so
  // the top-level naming rule ("lowercase, single word") stays intact.
  it("the route group is src/app/offerguide/admin", () => {
    const dir = path.join(process.cwd(), "src", "app", "offerguide", "admin");
    expect(fs.existsSync(path.join(dir, "layout.tsx"))).toBe(true);
    expect(fs.existsSync(path.join(dir, "page.tsx"))).toBe(true);
  });

  it("the layout gates on portal.admin.access and redirects, server-side", () => {
    const layout = fs.readFileSync(
      path.join(process.cwd(), "src", "app", "offerguide", "admin", "layout.tsx"),
      "utf8"
    );
    expect(layout).toMatch(/hasPermission\([^)]*"portal\.admin\.access"\)/);
    expect(layout).toMatch(/redirect\("\/offerguide"\)/);
    expect(layout).toMatch(/from "next\/headers"/);
  });

  it("introduces no new permission string", () => {
    // Epic 10.1 "Out of scope": reuse portal.admin.access as-is.
    const dir = path.join(process.cwd(), "src", "app", "offerguide", "admin");
    const walk = (d: string): string[] =>
      fs.readdirSync(d, { withFileTypes: true }).flatMap((e) =>
        e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]
      );
    const permissions = new Set<string>();
    for (const file of walk(dir)) {
      if (!/\.tsx?$/.test(file)) continue;
      for (const m of fs.readFileSync(file, "utf8").matchAll(/"(offerguide|portal)\.[a-z.]+"/g)) {
        permissions.add(m[1] === "portal" ? m[0] : m[0]);
      }
    }
    for (const p of permissions) {
      expect(["\"portal.admin.access\""]).toContain(p);
    }
  });
});
