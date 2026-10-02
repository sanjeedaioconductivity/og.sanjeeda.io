import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { badRequest } from "@/lib/offerguide/errors";
import { loadOwnedOffer } from "@/lib/offerguide/offerAuth";
import { validateOfferFields } from "@/lib/offerguide/validateBody";
import { pickDefined } from "@/lib/offerguide/pick";

const FIELDS = [
  "offerWorkingHours",
  "offerWeekendWork",
  "offerTravelRequirement",
  "offerHybridDays",
  "offerCommuteMinutes",
  "offerTimeFlexibility",
  "offerWfhSupport",
  "offerOvertimeCompensation",
  "offerAfterHoursAvailability",
  "offerLeaveFlexibility",
  "offerPersonalEnergy",
  "offerWorklifeImportance",
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

  const workLife = await prisma.offerWorkLife.upsert({
    where: { offerId: result.offer.id },
    create: { offerId: result.offer.id, ...fields },
    update: fields,
  });

  return NextResponse.json(workLife);
}
