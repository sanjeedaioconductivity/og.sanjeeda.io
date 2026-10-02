import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { badRequest } from "@/lib/offerguide/errors";
import { loadOwnedOffer } from "@/lib/offerguide/offerAuth";
import { validateOfferFields } from "@/lib/offerguide/validateBody";
import { serializeDecimals } from "@/lib/offerguide/serialize";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ offerId: string }> }
) {
  const { offerId } = await params;
  const result = await loadOwnedOffer(req, Number(offerId));
  if ("error" in result) return result.error;

  const full = await prisma.offer.findUnique({
    where: { id: result.offer.id },
    include: {
      compensation: true,
      benefitsSecurity: true,
      workLife: true,
      growth: true,
      culture: true,
    },
  });

  return NextResponse.json(serializeDecimals(full));
}

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

  const {
    label,
    companyName,
    roleTitle,
    offerFunctionalDomain,
    offerReceivedDate,
    offerCountry,
    offerCity,
    offerWorkArrangement,
    offerEmploymentType,
    offerContractDuration,
    offerProbation,
    reportingLevel,
    offerContractDurationOtherText,
    offerProbationOtherText,
    reportingLevelOtherText,
  } = body;

  const offer = await prisma.offer.update({
    where: { id: result.offer.id },
    data: {
      ...(label !== undefined && { label }),
      ...(companyName !== undefined && { companyName }),
      ...(roleTitle !== undefined && { roleTitle }),
      ...(offerFunctionalDomain !== undefined && { offerFunctionalDomain }),
      ...(offerReceivedDate !== undefined && {
        offerReceivedDate: offerReceivedDate ? new Date(offerReceivedDate) : null,
      }),
      ...(offerCountry !== undefined && { offerCountry }),
      ...(offerCity !== undefined && { offerCity }),
      ...(offerWorkArrangement !== undefined && { offerWorkArrangement }),
      ...(offerEmploymentType !== undefined && { offerEmploymentType }),
      // Accepted regardless of the gating field's current state — frontend
      // controls visibility, a candidate can submit out of "expected" order.
      ...(offerContractDuration !== undefined && { offerContractDuration }),
      ...(offerProbation !== undefined && { offerProbation }),
      ...(reportingLevel !== undefined && { reportingLevel }),
      // Free text captured when the paired enum above is "Other".
      ...(offerContractDurationOtherText !== undefined && { offerContractDurationOtherText }),
      ...(offerProbationOtherText !== undefined && { offerProbationOtherText }),
      ...(reportingLevelOtherText !== undefined && { reportingLevelOtherText }),
    },
  });

  return NextResponse.json(offer);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ offerId: string }> }
) {
  const { offerId } = await params;
  const result = await loadOwnedOffer(req, Number(offerId));
  if ("error" in result) return result.error;

  // No cascading FK on offers' 1:1 children — delete them first, in a
  // transaction so a partial failure can't leave an orphaned offer.
  const offerId_ = result.offer.id;
  await prisma.$transaction([
    prisma.offerCompensation.deleteMany({ where: { offerId: offerId_ } }),
    prisma.offerBenefitsSecurity.deleteMany({ where: { offerId: offerId_ } }),
    prisma.offerWorkLife.deleteMany({ where: { offerId: offerId_ } }),
    prisma.offerGrowth.deleteMany({ where: { offerId: offerId_ } }),
    prisma.offerCulture.deleteMany({ where: { offerId: offerId_ } }),
    prisma.offerScore.deleteMany({ where: { offerId: offerId_ } }),
    prisma.offer.delete({ where: { id: offerId_ } }),
  ]);

  return new NextResponse(null, { status: 204 });
}
