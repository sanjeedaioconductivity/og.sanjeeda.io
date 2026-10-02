import { NextResponse } from "next/server";
import { OgConsentToggles } from "@/lib/db/mongo/models/index.js";
import { createItemHandlers } from "@/lib/offerguide/adminCrud";

// Contract-level integrity rule (§4.3): retiring the master consent toggle
// would orphan every candidate's already-stored consent preference, so it's
// blocked with 409 rather than allowed like any other toggle. Exported (not
// inline) so it's unit-testable without a live DB — see the co-located test.
export function blockMasterToggleDeletion(doc: Record<string, unknown>) {
  return doc.isMaster
    ? NextResponse.json(
        {
          error: "conflict",
          message:
            "The master consent toggle cannot be retired — doing so would orphan every candidate's stored consent preference.",
        },
        { status: 409 }
      )
    : null;
}

export const { GET, PUT, DELETE } = createItemHandlers(OgConsentToggles, {
  keyField: "toggleId",
  beforeDelete: blockMasterToggleDeletion,
});
