/**
 * The admin area's destinations, declared once (Sprint 10, Epic 10.1).
 *
 * Six resources plus the raw contract, in the order the sidebar shows them.
 * Every screen — the sidebar, the landing cards, the page titles — reads from
 * here rather than keeping its own list, for the same reason the portal nav
 * moved to one declaration in Sprint 9: two lists drift, one cannot.
 *
 * `collection` is the segment of the admin API each resource lives under
 * (`/api/offerguide/admin/config/{collection}`). It is what the landing page
 * uses to fetch live counts, and it is deliberately the ONLY place the mapping
 * from screen to endpoint is written down.
 */

import {
  BookOpenCheck,
  FileQuestion,
  Globe2,
  LayoutDashboard,
  Layers,
  ScrollText,
  SlidersHorizontal,
  Terminal,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

export type AdminDestination = {
  /** Route segment under /offerguide/admin. Empty string is the landing page. */
  segment: string;
  label: string;
  icon: LucideIcon;
  /** ADM-0xx screen id from the FRS, for page titles and tests. */
  screenId: string;
  /** Admin API collection segment, where the page has one. */
  collection?: AdminCollection;
  /** One line under the label on the landing card. */
  blurb?: string;
};

export type AdminCollection =
  | "questions"
  | "scoring"
  | "market-benchmarks"
  | "geography"
  | "functional-domains"
  | "consent-toggles";

export const ADMIN_BASE = "/offerguide/admin";

export const ADMIN_DESTINATIONS: readonly AdminDestination[] = [
  {
    segment: "",
    label: "Overview",
    icon: LayoutDashboard,
    screenId: "ADM-000",
  },
  {
    segment: "questions",
    label: "Questions",
    icon: FileQuestion,
    screenId: "ADM-001",
    collection: "questions",
    blurb: "The scored fields that drive the wizard and the engine.",
  },
  {
    segment: "scoring",
    label: "Scoring",
    icon: SlidersHorizontal,
    screenId: "ADM-002",
    collection: "scoring",
    blurb: "Versioned weights. Draft, preview against the fixtures, activate.",
  },
  {
    segment: "market-benchmarks",
    label: "Market Benchmarks",
    icon: TrendingUp,
    screenId: "ADM-003",
    collection: "market-benchmarks",
    blurb: "Salary percentiles by role and location.",
  },
  {
    segment: "geography",
    label: "Geography",
    icon: Globe2,
    screenId: "ADM-004",
    collection: "geography",
    blurb: "Countries, with their cities embedded.",
  },
  {
    segment: "functional-domains",
    label: "Functional Domains",
    icon: Layers,
    screenId: "ADM-005",
    collection: "functional-domains",
    blurb: "The candidate profile's domain list.",
  },
  {
    segment: "consent-toggles",
    label: "Consent Toggles",
    icon: BookOpenCheck,
    screenId: "ADM-006",
    collection: "consent-toggles",
    blurb: "The consent options a candidate sees on SCR-001.",
  },
];

/**
 * The raw contract, kept as a deliberate seventh link. It is not a resource
 * screen and it is public (Sprint 9 D-3), so it sits below a separator rather
 * than among the six.
 */
export const API_DOCS_LINK = {
  href: "/api-docs",
  label: "API Docs",
  icon: Terminal,
} as const;

/** Icon for the small "admin" badge beside the portal logo. */
export const ADMIN_BADGE_ICON = ScrollText;

export function adminHref(segment: string): string {
  return segment ? `${ADMIN_BASE}/${segment}` : ADMIN_BASE;
}

/** The six resource destinations — everything with a collection behind it. */
export const ADMIN_RESOURCES = ADMIN_DESTINATIONS.filter(
  (d): d is AdminDestination & { collection: AdminCollection } => d.collection !== undefined
);
