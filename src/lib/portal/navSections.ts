/**
 * The portal's navigation, declared once (Sprint 9, Story 9.2.1).
 *
 * VISIBILITY IS DATA, NOT BRANCHING. Each entry names the permission it needs;
 * the nav renders whatever survives filtering that through the caller's
 * permission set. There is no `if (role === ...)` in any nav component, and
 * permissions.test.ts asserts that no such comparison exists anywhere in src/.
 * Adding an admin-only destination is a line in this file.
 *
 * ONE DECLARATION, EVERY SURFACE. `ModernHeader` renders the same filtered list
 * twice — the desktop bar and the mobile drawer — and both read from here. It
 * used to hold two hardcoded arrays and render each of them twice, which is how
 * a link ends up in one menu and not the other.
 *
 * WHY `offerguide.wizard.use` GATES PUBLIC LINKS. It reads oddly to gate links
 * everyone can see, but the alternative — an `always visible` escape hatch — is
 * the thing that erodes. Every entry naming a permission means every new entry
 * has to answer "who is this for?", and the public tier holds
 * `offerguide.wizard.use`, so guests see them.
 *
 * ============ THE OFFERGUIDE ENTRY IS PER-DEPLOYMENT ============
 *
 * One codebase serves two domains:
 *
 *   sanjeeda.io       the main portal — must NOT advertise OfferGuide
 *   og.sanjeeda.io    the OfferGuide site — must advertise it
 *
 * That used to be handled by keeping a whole branch (`v2-no-offerguide-link`)
 * permanently different by exactly these few lines, which meant every change had
 * to be merged twice forever and the branches silently drifted. It is now a
 * build-time flag instead, so the branches can converge:
 *
 *   NEXT_PUBLIC_SHOW_OFFERGUIDE=true    advertise it (set on og.sanjeeda.io)
 *   anything else / unset               hide it      (the default)
 *
 * DEFAULTING TO HIDDEN IS DELIBERATE. Forgetting the flag on og.sanjeeda.io
 * costs a missing link that anyone using the site notices immediately.
 * Forgetting it the other way would put the tab back on the main portal — the
 * exact thing this is here to prevent — and nobody would notice until someone
 * looked. The failure modes are not symmetric, so the default guards the one
 * that matters.
 *
 * This only controls whether the header ADVERTISES OfferGuide. `/offerguide`
 * stays a public route on both domains, reachable by URL and by direct link.
 *
 * ================================================================
 */

import {
  BookOpen,
  Calculator,
  FileText,
  GraduationCap,
  History,
  Layers3,
  ShieldCheck,
  Sparkles,
  Terminal,
  type LucideIcon,
} from "lucide-react";
import type { Permission } from "./permissions";

/** Which menu grouping an entry belongs to, mirroring the existing header. */
export type NavGroup = "explore" | "services" | "account";

export type NavEntry = {
  label: string;
  href: string;
  icon: LucideIcon;
  group: NavGroup;
  permission: Permission;
  /**
   * A short sticker rendered beside the label ("New"). Declared here, like
   * visibility, so a launch callout is one line in this file — not a special
   * case in the header. Drop the field when the feature is no longer new.
   */
  badge?: string;
};

/**
 * Whether this deployment advertises OfferGuide in the header.
 *
 * Takes the flag as a parameter so both states are testable — reading
 * `process.env` directly at module scope would pin the tests to whatever the
 * machine running them happens to have set. The literal member expression is
 * kept in the default so Next still inlines it at build time.
 */
export function offerGuideAdvertised(
  flag: string | undefined = process.env.NEXT_PUBLIC_SHOW_OFFERGUIDE
): boolean {
  return flag === "true";
}

/**
 * Public tier — visible to guests, and to everyone above them.
 *
 * The top-level bar is deliberately short: OfferGuide (where advertised) and
 * Blogs. The assessment, calculator and CV tools moved into the Services
 * dropdown alongside PGP — they are services, and grouping them there keeps
 * the bar from crowding the logo at the `lg` breakpoint.
 */
const EXPLORE_SECTIONS: readonly NavEntry[] = [
  {
    label: "Blogs",
    href: "/Blogs/",
    icon: BookOpen,
    group: "explore",
    permission: "offerguide.wizard.use",
  },
];

/**
 * The OfferGuide entry point. Included only where the flag says so — see the
 * per-deployment note at the top of this file. Public, so a guest can reach the
 * wizard with no account wherever it IS advertised.
 *
 * Sits in the top-level bar rather than the Services dropdown, first, with a
 * "New" sticker: it is the site's newly launched service, and a callout hidden
 * behind a dropdown click advertises nothing. Sprint 10 shipped the admin area
 * that completes it, which is the launch moment.
 */
const OFFERGUIDE_ENTRY: NavEntry = {
  label: "Offer Guide",
  href: "/offerguide",
  icon: FileText,
  group: "explore",
  permission: "offerguide.wizard.use",
  badge: "New",
};

/** Services shown on every deployment, in dropdown order. */
const SERVICE_SECTIONS: readonly NavEntry[] = [
  {
    label: "Khudi Assessment",
    href: "/khudiassessment",
    icon: Sparkles,
    group: "services",
    permission: "offerguide.wizard.use",
  },
  {
    label: "Offer Calculator",
    href: "/FinancialOffer",
    icon: Calculator,
    group: "services",
    permission: "offerguide.wizard.use",
  },
  {
    label: "3D CVs",
    href: "/cv",
    icon: Layers3,
    group: "services",
    permission: "offerguide.wizard.use",
  },
  {
    label: "Professional Growth Program",
    href: "/pgp-access",
    icon: GraduationCap,
    group: "services",
    permission: "offerguide.wizard.use",
  },
];

const ACCOUNT_SECTIONS: readonly NavEntry[] = [
  {
    // Authenticated tier. The screen behind this does not exist yet (§7
    // backlog); it points at the wizard, which lists a returning candidate's
    // sessions. Declared so the tier is real and exercised rather than
    // theoretical.
    label: "My Evaluations",
    href: "/offerguide",
    icon: History,
    group: "account",
    permission: "offerguide.history.view",
  },
  {
    // Admin tier. Sprint 10 gave `portal.admin.access` a real destination —
    // the admin configuration area — where Sprint 9 could only point at the
    // raw contract. The area's own layout re-checks the permission server-side
    // and redirects non-admins, so this link is a convenience, not the gate.
    label: "Admin",
    href: "/offerguide/admin",
    icon: ShieldCheck,
    group: "account",
    permission: "portal.admin.access",
  },
  {
    // The PGP admin area — what used to be the "Management Portal" with its
    // own self-service login. It now sits behind the same portal role as the
    // OfferGuide admin area, so it is advertised in the same tier. Its layout
    // re-checks server-side; this link is a convenience, not the gate.
    label: "PGP Admin",
    href: "/pgp-admin",
    icon: GraduationCap,
    group: "account",
    permission: "portal.admin.access",
  },
  {
    // Kept alongside the admin area rather than replaced by it — it is still
    // the reference for what the API accepts. NOTE: the Swagger page itself is
    // PUBLIC — hiding this link is not access control, and the routes it
    // documents are gated server-side.
    label: "API Contract",
    href: "/api-docs",
    icon: Terminal,
    group: "account",
    permission: "portal.admin.access",
  },
];

/**
 * Builds the declaration for a given deployment.
 *
 * OfferGuide is spliced in FIRST rather than appended: `navEntriesInGroup`
 * preserves declaration order, so this is what puts it at the front of the
 * top-level bar where a launch callout belongs. The other groups read exactly
 * as they always have.
 */
export function buildNavSections(showOfferGuide: boolean): readonly NavEntry[] {
  return [
    ...(showOfferGuide ? [OFFERGUIDE_ENTRY] : []),
    ...EXPLORE_SECTIONS,
    ...SERVICE_SECTIONS,
    ...ACCOUNT_SECTIONS,
  ];
}

export const NAV_SECTIONS: readonly NavEntry[] = buildNavSections(offerGuideAdvertised());

export function navEntriesInGroup(
  entries: readonly NavEntry[],
  group: NavGroup
): NavEntry[] {
  return entries.filter((entry) => entry.group === group);
}
