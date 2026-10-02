// OfferGuide — Sprint 8, Epic 8.1: contract verification
//
// Story 8.1.1 asks for every operation to be exercised in Swagger UI across
// its declared auth modes. Swagger UI can't tell you whether the route file
// behind an operation actually exists, whether the contract quietly omits a
// reachable route, or whether an auth mode drifted — and it can't be re-run in
// CI. This file mechanises all of that, so the manual pass is left with what
// genuinely needs a browser: the live guest-cookie round trip and the wizard
// walkthrough (see OFFERGUIDE_SPRINT8_MANUAL_QA.md).
//
// The inventory below is the handoff §3.1 table, transcribed operation for
// operation.

import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";

type AuthMode = "PUBLIC" | "guestOrAuth" | "bearerAuth" | "adminAuth";
type Operation = { n: number; method: string; apiPath: string; auth: AuthMode };

const BASE = "/api/offerguide";

function ops(auth: AuthMode, entries: [number, string, string][]): Operation[] {
  return entries.map(([n, method, apiPath]) => ({
    n,
    method: method.toLowerCase(),
    apiPath: `${BASE}${apiPath}`,
    auth,
  }));
}

/** Handoff §3.1 — 54 operations across 34 paths. */
const CONTRACT: Operation[] = [
  ...ops("guestOrAuth", [
    [1, "GET", "/candidate-profile"],
    [2, "POST", "/candidate-profile"],
    [3, "PATCH", "/candidate-profile"],
    [4, "PATCH", "/candidate-profile/consent"],
  ]),
  ...ops("bearerAuth", [[5, "POST", "/claim-guest-profile"]]),
  ...ops("guestOrAuth", [
    [6, "GET", "/evaluation-sessions"],
    [7, "POST", "/evaluation-sessions"],
    [8, "GET", "/evaluation-sessions/{sessionId}"],
    [9, "PATCH", "/evaluation-sessions/{sessionId}"],
    [10, "GET", "/evaluation-sessions/{sessionId}/compare"],
    [11, "POST", "/evaluation-sessions/{sessionId}/offers"],
    [12, "GET", "/offers/{offerId}"],
    [13, "PATCH", "/offers/{offerId}"],
    [14, "DELETE", "/offers/{offerId}"],
    [15, "PATCH", "/offers/{offerId}/compensation"],
    [16, "PATCH", "/offers/{offerId}/benefits-security"],
    [17, "PATCH", "/offers/{offerId}/worklife"],
    [18, "PATCH", "/offers/{offerId}/growth"],
    [19, "PATCH", "/offers/{offerId}/culture"],
    [20, "POST", "/offers/{offerId}/compute-score"],
    [21, "GET", "/offers/{offerId}/score"],
    [22, "GET", "/wizard-draft"],
    [23, "PUT", "/wizard-draft"],
    [24, "DELETE", "/wizard-draft"],
  ]),
  ...ops("PUBLIC", [
    [25, "GET", "/config/questions"],
    [26, "GET", "/config/consent-toggles"],
    [27, "GET", "/config/geography"],
    [28, "GET", "/config/functional-domains"],
  ]),
  ...ops("adminAuth", [
    [29, "GET", "/admin/config/questions"],
    [30, "POST", "/admin/config/questions"],
    [31, "GET", "/admin/config/questions/{fieldId}"],
    [32, "PUT", "/admin/config/questions/{fieldId}"],
    [33, "DELETE", "/admin/config/questions/{fieldId}"],
    [34, "GET", "/admin/config/scoring"],
    [35, "POST", "/admin/config/scoring"],
    [36, "GET", "/admin/config/scoring/{version}"],
    [37, "GET", "/admin/config/geography"],
    [38, "POST", "/admin/config/geography"],
    [39, "PUT", "/admin/config/geography/{countryCode}"],
    [40, "DELETE", "/admin/config/geography/{countryCode}"],
    [41, "POST", "/admin/config/geography/{countryCode}/cities"],
    [42, "PATCH", "/admin/config/geography/{countryCode}/cities/{cityId}"],
    [43, "GET", "/admin/config/market-benchmarks"],
    [44, "POST", "/admin/config/market-benchmarks"],
    [45, "PUT", "/admin/config/market-benchmarks/{id}"],
    [46, "DELETE", "/admin/config/market-benchmarks/{id}"],
    [47, "GET", "/admin/config/functional-domains"],
    [48, "POST", "/admin/config/functional-domains"],
    [49, "PUT", "/admin/config/functional-domains/{domainId}"],
    [50, "DELETE", "/admin/config/functional-domains/{domainId}"],
    [51, "GET", "/admin/config/consent-toggles"],
    [52, "POST", "/admin/config/consent-toggles"],
    [53, "PUT", "/admin/config/consent-toggles/{toggleId}"],
    [54, "DELETE", "/admin/config/consent-toggles/{toggleId}"],
  ]),
];

const REPO_ROOT = process.cwd();
const API_ROOT = path.join(REPO_ROOT, "src", "app");

/** `/api/offerguide/offers/{offerId}/score` -> `src/app/api/offerguide/offers/[offerId]/score/route.ts` */
function routeFileFor(apiPath: string): string {
  const segments = apiPath.replace(/^\//, "").split("/").map((segment) =>
    segment.startsWith("{") ? `[${segment.slice(1, -1)}]` : segment
  );
  return path.join(API_ROOT, ...segments, "route.ts");
}

/**
 * The HTTP methods a route file exports. Next.js routes export handlers either
 * as named functions or destructured from a factory, so both forms count.
 */
function exportedMethods(file: string): Set<string> {
  const source = fs.readFileSync(file, "utf8");
  const found = new Set<string>();
  const named = source.matchAll(/export\s+(?:async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE)\b/g);
  for (const match of named) found.add(match[1].toLowerCase());

  for (const match of source.matchAll(/export\s+const\s*\{([^}]*)\}\s*=/g)) {
    for (const name of match[1].split(",")) {
      const method = name.trim();
      if (["GET", "POST", "PUT", "PATCH", "DELETE"].includes(method)) {
        found.add(method.toLowerCase());
      }
    }
  }
  return found;
}

const spec = YAML.parse(
  fs.readFileSync(path.join(REPO_ROOT, "public", "openapi.yaml"), "utf8")
);

const HTTP_METHODS = ["get", "post", "put", "patch", "delete"] as const;

function specOperation(apiPath: string, method: string) {
  return spec.paths?.[apiPath]?.[method];
}

/** The auth mode an operation's `security` block expresses. */
function declaredAuth(operation: Record<string, unknown>): AuthMode {
  const security = operation.security as { [scheme: string]: unknown }[] | undefined;
  if (!security || security.length === 0) return "PUBLIC";
  const schemes = security.flatMap((entry) => Object.keys(entry));
  // Sprint 9 renamed the scheme AdminToken → AdminAuth and changed its type from
  // an `x-og-admin-token` apiKey to a bearer JWT, so the mode can no longer be
  // inferred from the credential's shape — adminAuth and bearerAuth are now the
  // same credential, separated only by the role of the account behind it. The
  // scheme name is what distinguishes them, which is why the rename mattered.
  if (schemes.includes("AdminAuth")) return "adminAuth";
  if (schemes.includes("GuestCookie")) return "guestOrAuth";
  return "bearerAuth";
}

// ===========================================================================

describe("Story 8.1.1 — the §3.1 inventory is 54 operations across 34 paths", () => {
  it("transcribes exactly 54 operations, numbered 1–54 without gaps", () => {
    expect(CONTRACT).toHaveLength(54);
    expect(CONTRACT.map((op) => op.n)).toEqual(
      Array.from({ length: 54 }, (_, i) => i + 1)
    );
  });

  it("covers 34 distinct paths", () => {
    expect(new Set(CONTRACT.map((op) => op.apiPath)).size).toBe(34);
  });

  it("declares 26 operations under /admin/config/*", () => {
    // Story 8.2.3 gates launch on all 26 rejecting non-admin callers.
    const admin = CONTRACT.filter((op) => op.apiPath.includes("/admin/config/"));
    expect(admin).toHaveLength(26);
    expect(admin.every((op) => op.auth === "adminAuth")).toBe(true);
  });
});

describe("Story 8.1.1 — every contract operation exists in code", () => {
  for (const op of CONTRACT) {
    it(`#${op.n} ${op.method.toUpperCase()} ${op.apiPath}`, () => {
      const file = routeFileFor(op.apiPath);
      expect(fs.existsSync(file), `missing route file ${file}`).toBe(true);
      expect(exportedMethods(file)).toContain(op.method);
    });
  }
});

describe("Story 8.1.1 — every contract operation is documented, with its declared auth mode", () => {
  for (const op of CONTRACT) {
    it(`#${op.n} ${op.method.toUpperCase()} ${op.apiPath} — ${op.auth}`, () => {
      const operation = specOperation(op.apiPath, op.method);
      expect(operation, "not present in openapi.yaml").toBeDefined();
      expect(declaredAuth(operation)).toBe(op.auth);
    });
  }
});

describe("openapi.yaml is complete and correctly versioned", () => {
  it("parses with no errors and is version 2.0.0", () => {
    // Sprint 8 DoD. Note this moves BACKWARDS from the 5.0.0 earlier sprints
    // published — the handoff names 2.0.0 explicitly and outranks the older
    // sprint-number convention.
    expect(spec.openapi).toBe("3.0.3");
    expect(spec.info.version).toBe("2.0.0");
  });

  it("documents every route file that exists on disk — nothing reachable is undeclared", () => {
    const undocumented: string[] = [];
    const walk = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(full);
        } else if (entry.name === "route.ts") {
          const apiPath =
            "/" +
            path
              .relative(API_ROOT, dir)
              .split(path.sep)
              .map((s) => (s.startsWith("[") ? `{${s.slice(1, -1)}}` : s))
              .join("/");
          for (const method of exportedMethods(full)) {
            if (!specOperation(apiPath, method)) {
              undocumented.push(`${method.toUpperCase()} ${apiPath}`);
            }
          }
        }
      }
    };
    walk(path.join(API_ROOT, "api", "offerguide"));
    expect(undocumented).toEqual([]);
  });

  it("declares no operation the code does not implement", () => {
    const orphans: string[] = [];
    for (const [apiPath, item] of Object.entries(spec.paths as Record<string, object>)) {
      if (!apiPath.startsWith(BASE)) continue;
      const file = routeFileFor(apiPath);
      const implemented = fs.existsSync(file) ? exportedMethods(file) : new Set<string>();
      for (const method of HTTP_METHODS) {
        if (method in item && !implemented.has(method)) {
          orphans.push(`${method.toUpperCase()} ${apiPath}`);
        }
      }
    }
    expect(orphans).toEqual([]);
  });
});

describe("contract-level integrity rules (handoff §3)", () => {
  it("scoring config versions are immutable — no PUT or PATCH route can be reached", () => {
    const scoringPaths = Object.keys(spec.paths as Record<string, object>).filter((p) =>
      p.includes("/admin/config/scoring")
    );
    expect(scoringPaths.length).toBeGreaterThan(0);
    for (const p of scoringPaths) {
      const item = (spec.paths as Record<string, Record<string, unknown>>)[p];
      expect(item.put, `${p} must not accept PUT`).toBeUndefined();
      expect(item.patch, `${p} must not accept PATCH`).toBeUndefined();
    }

    // Not just undocumented — the route file itself must not export them.
    const dir = path.join(API_ROOT, "api", "offerguide", "admin", "config", "scoring");
    for (const file of [path.join(dir, "route.ts"), path.join(dir, "[version]", "route.ts")]) {
      const methods = exportedMethods(file);
      expect(methods.has("put")).toBe(false);
      expect(methods.has("patch")).toBe(false);
      expect(methods.has("delete")).toBe(false);
    }
  });

  it("retiring the master consent toggle is declared as a 409", () => {
    const operation = specOperation(
      `${BASE}/admin/config/consent-toggles/{toggleId}`,
      "delete"
    );
    expect(operation.responses["409"]).toBeDefined();
  });

  it("every admin DELETE is documented as a soft delete returning the retired document", () => {
    const deletes = Object.entries(spec.paths as Record<string, Record<string, never>>)
      .filter(([p]) => p.includes("/admin/config/"))
      .filter(([, item]) => "delete" in item);
    expect(deletes.length).toBe(5);
    for (const [p, item] of deletes) {
      const responses = (item as Record<string, { responses: Record<string, unknown> }>)
        .delete.responses;
      expect(responses["200"], `${p} should return the retired document`).toBeDefined();
      expect(responses["204"], `${p} must not report a hard delete`).toBeUndefined();
    }
  });
});

describe("GET /config/questions leaks no scoring data", () => {
  const source = fs.readFileSync(
    path.join(API_ROOT, "api", "offerguide", "config", "questions", "route.ts"),
    "utf8"
  );

  // The route builds an explicit allow-list projection rather than deleting
  // keys off the Mongo document, so the check is that the projection contains
  // no scoring key — a new scoring field added to OgQuestions cannot leak
  // through by default.
  it("the response projection never references a scoring field", () => {
    const projection = source.slice(source.indexOf("const publicShape"));
    for (const leak of [
      "score",
      "scoreType",
      "numericBands",
      "nullScore",
      "ratingMultiplier",
      "yesNoScores",
      "category",
    ]) {
      expect(projection.includes(leak), `projection mentions "${leak}"`).toBe(false);
    }
  });

  it("only ever returns retired questions' active options", () => {
    expect(source).toMatch(/active:\s*true/);
    expect(source).toMatch(/opt\.active !== false/);
  });

  it("the documented QuestionPublic schema carries no scoring properties", () => {
    const properties = Object.keys(spec.components.schemas.QuestionPublic.properties);
    expect(properties.sort()).toEqual(
      ["fieldId", "helpText", "label", "options", "screen", "uiControl"].sort()
    );
    const optionProperties = Object.keys(
      spec.components.schemas.QuestionPublic.properties.options.items.properties
    );
    expect(optionProperties.sort()).toEqual(["sortOrder", "value"]);
  });
});
