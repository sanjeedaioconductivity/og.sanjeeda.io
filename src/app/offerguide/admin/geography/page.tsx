import { GeographyAdmin } from "./GeographyAdmin";

/**
 * ADM-004 — Geography (Story 10.5.2). Not the shared table: cities are embedded
 * in their country document with no independent identity, so a country expands
 * to reveal its cities inline (add / retire as sub-resource operations against
 * the parent), never a separate city screen. See GeographyAdmin.
 */
export default function GeographyPage() {
  return <GeographyAdmin />;
}
