import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { badRequest } from "@/lib/offerguide/errors";
import { loadOwnedOffer } from "@/lib/offerguide/offerAuth";
import { validateOfferFields } from "@/lib/offerguide/validateBody";
import { pickDefined } from "@/lib/offerguide/pick";
import { serializeDecimals } from "@/lib/offerguide/serialize";

const FIELDS = [
  "offerBaseSalary",
  "offerPayPeriod",
  "offerCurrency",
  "offerGrossNet",
  "offerTakeHome",
  "offerSigningBonus",
  "offerAnnualBonus",
  "offerAnnualBonusType",
  "offerCommission",
  "offerCommissionType",
  "offerEquity",
  "offerEquityType",
  "offerTransportAllowance",
  "offerTransportFrequency",
  "offerOtherAllowance",
  "offerOtherAllowanceFrequency",
  "offerRelocationSupport",
  "offerRelocationAmount",
  "offerReviewCycle",
  "offerNegotiationRoom",
  "offerReviewCycleOtherText",
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

  const existing = await prisma.offerCompensation.findUnique({
    where: { offerId: result.offer.id },
  });

  if (!existing && (body.offerBaseSalary === undefined || body.offerCurrency === undefined)) {
    return badRequest("offerBaseSalary and offerCurrency are required on first write.");
  }

  const fields = pickDefined(body, FIELDS);

  const compensation = await prisma.offerCompensation.upsert({
    where: { offerId: result.offer.id },
    create: {
      offerId: result.offer.id,
      offerBaseSalary: body.offerBaseSalary,
      offerCurrency: body.offerCurrency,
      offerPayPeriod: body.offerPayPeriod ?? "Monthly",
      ...pickDefined(body, FIELDS.filter((f) => f !== "offerBaseSalary" && f !== "offerCurrency" && f !== "offerPayPeriod")),
    },
    update: fields,
  });

  return NextResponse.json(serializeDecimals(compensation));
}
