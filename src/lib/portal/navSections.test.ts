// Sprint 9, Story 9.2.1 — the 3-tier permission-aware nav.
//
// The nav filters a declaration through the caller's permission set, so what is
// testable here is the declaration and the filter — which is the whole of the
// logic. The DoD's criteria map onto these almost one-for-one.
//
// The tier tests run against the MAIN PORTAL shape (OfferGuide not advertised),
// because that is the deployment where a wrong entry does real damage. The
// per-deployment block at the bottom covers both shapes explicitly.

import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  buildNavSections,
  navEntriesInGroup,
  offerGuideAdvertised,
  type NavEntry,
} from "./navSections";
import { PERMISSIONS, permissionsFor, type Permission } from "./permissions";

/** The main portal: sanjeeda.io. */
const PORTAL_SECTIONS = buildNavSections(false);
/** The OfferGuide site: og.sanjeeda.io. */
const OFFERGUIDE_SECTIONS = buildNavSections(true);

/** What usePermissionFilter does, minus React. */
function visibleTo(
  identity: { userInfoId: number; role: string } | null,
  sections: readonly NavEntry[] = PORTAL_SECTIONS
): NavEntry[] {
  const held = permissionsFor(identity);
  return sections.filter((entry) => held.has(entry.permission));
}

const guest = null;
const user = { userInfoId: 1, role: "user" };
const admin = { userInfoId: 2, role: "admin" };

const labels = (entries: NavEntry[]) => entries.map((e) => e.label);

describe("three tiers render correctly", () => {
  it("a guest sees the public entries and nothing else", () => {
    expect(labels(visibleTo(guest)).sort()).toEqual(
      [
        "3D CVs",
        "Blogs",
        "Khudi Assessment",
        "Offer Calculator",
        "Professional Growth Program",
      ].sort()
    );
  });

  it("a registered user sees everything a guest sees, plus the authenticated tier", () => {
    const forGuest = labels(visibleTo(guest));
    const forUser = labels(visibleTo(user));

    expect(forUser).toEqual(expect.arrayContaining(forGuest));
    expect(forUser).toContain("My Evaluations");
    expect(forUser).not.toContain("API Contract");
  });

  it("an admin sees everything a user sees, plus the admin tier", () => {
    const forUser = labels(visibleTo(user));
    const forAdmin = labels(visibleTo(admin));

    expect(forAdmin).toEqual(expect.arrayContaining(forUser));
    expect(forAdmin).toContain("Admin");
    expect(forAdmin).toContain("API Contract");
  });

  it("a registered user does not see the admin area", () => {
    expect(labels(visibleTo(user))).not.toContain("Admin");
  });

  it("the tiers strictly nest — guest ⊆ user ⊆ admin", () => {
    for (const sections of [PORTAL_SECTIONS, OFFERGUIDE_SECTIONS]) {
      const g = new Set(labels(visibleTo(guest, sections)));
      const u = new Set(labels(visibleTo(user, sections)));
      const a = new Set(labels(visibleTo(admin, sections)));

      for (const label of g) expect(u.has(label), `user lost "${label}"`).toBe(true);
      for (const label of u) expect(a.has(label), `admin lost "${label}"`).toBe(true);
    }
  });
});

describe("the guest tier never leaks a higher tier", () => {
  // The DoD's no-hydration-flash criterion: "A guest must never briefly see
  // admin or authenticated links before the client resolves identity."
  //
  // AuthProvider starts at the public tier and only ever widens, so the guest
  // nav is what renders first in every case. This pins the consequence: nothing
  // gated above public can appear in it.
  it("contains no entry requiring a permission a guest lacks", () => {
    const guestPermissions = permissionsFor(guest);
    for (const sections of [PORTAL_SECTIONS, OFFERGUIDE_SECTIONS]) {
      for (const entry of visibleTo(guest, sections)) {
        expect(guestPermissions.has(entry.permission), `"${entry.label}" leaked`).toBe(true);
      }
    }
  });

  it("the first render — before identity resolves — is exactly the guest nav", () => {
    // An unresolved AuthProvider holds PUBLIC_PERMISSION_SET, which is what
    // permissionsFor(null) returns.
    expect(labels(visibleTo(null))).toEqual(labels(visibleTo(guest)));
  });
});

// ---------------------------------------------------------------------------
// One codebase, two domains. This block is what lets the branches converge:
// `v2-no-offerguide-link` existed only to keep these few lines different.
// ---------------------------------------------------------------------------
describe("the OfferGuide entry is per-deployment", () => {
  // Top-level bar (`explore`), not the Services dropdown: it carries the launch
  // sticker, and a callout behind a dropdown click advertises nothing.
  const offerGuideEntries = (sections: readonly NavEntry[]) =>
    sections.filter((e) => e.href === "/offerguide" && e.group === "explore");

  it("the MAIN PORTAL does not advertise OfferGuide", () => {
    expect(
      offerGuideEntries(PORTAL_SECTIONS),
      "OfferGuide was re-added to the main portal nav"
    ).toHaveLength(0);
  });

  it("the OfferGuide site does advertise it, exactly once", () => {
    expect(offerGuideEntries(OFFERGUIDE_SECTIONS)).toHaveLength(1);
  });

  it("where advertised, it is reachable with no account", () => {
    const entry = offerGuideEntries(OFFERGUIDE_SECTIONS)[0];
    expect(permissionsFor(guest).has(entry.permission)).toBe(true);
  });

  it("hiding it changes nothing else — the two shapes differ by that entry alone", () => {
    const difference = labels([...OFFERGUIDE_SECTIONS]).filter(
      (l) => !labels([...PORTAL_SECTIONS]).includes(l)
    );
    expect(difference).toEqual(["Offer Guide"]);
  });

  it("where advertised, leads the top-level bar and leaves the other groups untouched", () => {
    expect(labels(navEntriesInGroup([...OFFERGUIDE_SECTIONS], "explore"))).toEqual([
      "Offer Guide",
      ...labels(navEntriesInGroup([...PORTAL_SECTIONS], "explore")),
    ]);
    expect(labels(navEntriesInGroup([...OFFERGUIDE_SECTIONS], "services"))).toEqual(
      labels(navEntriesInGroup([...PORTAL_SECTIONS], "services"))
    );
  });

  it("carries the launch sticker, and is the only entry that does", () => {
    expect(offerGuideEntries(OFFERGUIDE_SECTIONS)[0].badge).toBe("New");
    expect(OFFERGUIDE_SECTIONS.filter((e) => e.badge)).toHaveLength(1);
    // The sticker is part of the entry, so hiding the entry hides the sticker —
    // the main portal never shows a "New" callout for a service it doesn't list.
    expect(PORTAL_SECTIONS.filter((e) => e.badge)).toHaveLength(0);
  });

  // Defaulting to hidden is the safe direction: a forgotten flag on
  // og.sanjeeda.io loses a link somebody notices at once, while the other way
  // round would silently restore the tab on the main portal.
  it.each([
    ["unset", undefined],
    ["empty", ""],
    ["false", "false"],
    ["a typo", "ture"],
    ["capitalised", "True"],
    ["1", "1"],
  ])("does not advertise OfferGuide when the flag is %s", (_label, flag) => {
    expect(offerGuideAdvertised(flag)).toBe(false);
  });

  it('advertises OfferGuide only for exactly "true"', () => {
    expect(offerGuideAdvertised("true")).toBe(true);
  });
});

describe("the declaration itself", () => {
  it("gates every entry on a real permission", () => {
    for (const entry of OFFERGUIDE_SECTIONS) {
      expect(PERMISSIONS as readonly Permission[]).toContain(entry.permission);
    }
  });

  // Sprint 10, Story 10.1.3: the admin tier gained a real destination. /api-docs
  // is deliberately kept alongside it, not replaced — it is still the reference
  // for what the API accepts.
  it("points the admin tier at both admin areas AND keeps /api-docs", () => {
    const adminOnly = PORTAL_SECTIONS.filter((e) => e.permission === "portal.admin.access");
    expect(adminOnly.map((e) => e.href)).toEqual(["/offerguide/admin", "/pgp-admin", "/api-docs"]);
  });

  it("lists the admin area before the raw contract", () => {
    const hrefs = navEntriesInGroup([...PORTAL_SECTIONS], "account").map((e) => e.href);
    expect(hrefs.indexOf("/offerguide/admin")).toBeLessThan(hrefs.indexOf("/api-docs"));
  });

  it("has no duplicate labels", () => {
    for (const sections of [PORTAL_SECTIONS, OFFERGUIDE_SECTIONS]) {
      const seen = labels([...sections]);
      expect(new Set(seen).size).toBe(seen.length);
    }
  });

  it("assigns every entry to a known group", () => {
    for (const entry of OFFERGUIDE_SECTIONS) {
      expect(["explore", "services", "account"]).toContain(entry.group);
    }
  });

  it("navEntriesInGroup partitions without loss", () => {
    const groups = (["explore", "services", "account"] as const).flatMap((g) =>
      navEntriesInGroup([...OFFERGUIDE_SECTIONS], g)
    );
    expect(groups).toHaveLength(OFFERGUIDE_SECTIONS.length);
  });
});

describe("the nav components hold no hardcoded link list", () => {
  const header = fs.readFileSync(
    path.join(process.cwd(), "src", "app", "components", "nav", "ModernHeader.tsx"),
    "utf8"
  );

  it("ModernHeader reads the shared declaration", () => {
    expect(header).toMatch(/NAV_SECTIONS/);
  });

  it("ModernHeader no longer declares its own arrays", () => {
    // The Sprint 2 shape: `const mainLinks = [ { label: …, href: … } ]`.
    expect(header).not.toMatch(/const\s+(mainLinks|serviceLinks)\s*=\s*\[/);
  });

  it("no nav component hardcodes an OfferGuide link past the flag", () => {
    for (const file of ["ModernHeader.tsx", "ResponsiveNav.tsx", "Header.tsx"]) {
      const full = path.join(process.cwd(), "src", "app", "components", "nav", file);
      if (!fs.existsSync(full)) continue;
      expect(fs.readFileSync(full, "utf8")).not.toMatch(/href=["']\/offerguide["']/);
    }
  });

  it("no nav component branches on a role", () => {
    for (const file of ["ModernHeader.tsx", "ResponsiveNav.tsx", "Header.tsx"]) {
      const full = path.join(process.cwd(), "src", "app", "components", "nav", file);
      if (!fs.existsSync(full)) continue;
      expect(fs.readFileSync(full, "utf8")).not.toMatch(/\brole\b\s*[=!]==?\s*["'`]/);
    }
  });
});
