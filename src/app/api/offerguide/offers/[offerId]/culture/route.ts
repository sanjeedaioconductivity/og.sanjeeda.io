import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { badRequest } from "@/lib/offerguide/errors";
import { loadOwnedOffer } from "@/lib/offerguide/offerAuth";
import { validateOfferFields } from "@/lib/offerguide/validateBody";
import { pickDefined } from "@/lib/offerguide/pick";

// All 14 fields are fully independent — none of them feeds more than one
// scoring category, so this route (like the others) writes whichever subset
// of them the request includes, with no cross-field special-casing.
const FIELDS = [
  "offerManagerImpression",
  "offerTeamCultureFit",
  "offerRedFlags",
  "offerNotes",
  "offerValuesAlignment",
  "offerInclusionConfidence",
  "offerWorkPressure",
  "offerCompanyReputation",
  "offerLeadershipStability",
  "offerEmployerTreatmentSignal",
  "offerLeadershipStyle",
  "offerPsychSafety",
  "offerPurposeSense",
  "offerCultureImportance",
] as const;

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ offerId: string }> }
) {
  const { offerId } = await params;
  const result = await loadOwnedOffer(req, Number(offerId));
  if ("error" in result) return result.error;

  const body = await req.json();
  const validationError = await validateOfferFields(body);
  if (validationError) return badRequest(validationError);

  const fields = pickDefined(body, FIELDS);

  const culture = await prisma.offerCulture.upsert({
    where: { offerId: result.offer.id },
    create: { offerId: result.offer.id, ...fields },
    update: fields,
  });

  return NextResponse.json(culture);
}
