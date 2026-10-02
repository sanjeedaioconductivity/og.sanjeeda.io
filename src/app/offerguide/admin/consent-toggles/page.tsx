import { AdminCollectionTable } from "../_components/AdminCollectionTable";
import { CONSENT_TOGGLES_CONFIG } from "../_lib/collectionConfig";

/**
 * ADM-006 — Consent Toggles (Story 10.5.4). The shared table, plus the one
 * collection-specific behaviour the FRS calls for: retiring the master toggle
 * (isMaster) surfaces the server's existing 409 inline on the row rather than
 * hiding the action. That is handled by AdminCollectionTable's row-level error
 * state — the button is present and clicking it shows the reason, matching the
 * FRS's "show, then explain" decision. No special-casing needed here.
 */
export default function ConsentTogglesPage() {
  return <AdminCollectionTable config={CONSENT_TOGGLES_CONFIG} />;
}
