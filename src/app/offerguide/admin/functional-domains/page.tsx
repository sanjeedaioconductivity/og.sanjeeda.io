import { AdminCollectionTable } from "../_components/AdminCollectionTable";
import { FUNCTIONAL_DOMAINS_CONFIG } from "../_lib/collectionConfig";

/**
 * ADM-005 — Functional Domains (Story 10.5.3). The simplest screen in the
 * sprint: the shared table with nothing collection-specific.
 */
export default function FunctionalDomainsPage() {
  return <AdminCollectionTable config={FUNCTIONAL_DOMAINS_CONFIG} />;
}
