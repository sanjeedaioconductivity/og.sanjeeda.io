import { ScoringAdmin } from "./ScoringAdmin";

/**
 * ADM-002 — Scoring Configuration (Epic 10.2). A 3-step flow, not a CRUD table:
 * version history → draft a new version (cloned from the active one) → preview
 * it against the golden fixtures → activate. Versions are immutable; the only
 * mutation is which one is active, via the activate endpoint.
 */
export default function ScoringPage() {
  return <ScoringAdmin />;
}
