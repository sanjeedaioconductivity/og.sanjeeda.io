import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { resolveIdentity } from "@/lib/offerguide/identity";
import { badRequest, notFound } from "@/lib/offerguide/errors";
import { findCandidateProfile, findOwnedSession } from "@/lib/offerguide/profile";
import { validateOfferFields } from "@/lib/offerguide/validateBody";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const identity = resolveIdentity(req);
  if (!identity) return notFound();

  const profile = await findCandidateProfile(identity);
  if (!profile) return notFound();

  const { sessionId } = await params;
  const session = await findOwnedSession(Number(sessionId), profile.id);
  if (!session) return notFound();

  const body = await req.json();
  if (!body.offerWorkArrangement || !body.offerEmploymentType) {
    return badRequest("offerWorkArrangement and offerEmploymentType are required.");
  }

  const validationError = await validateOfferFields(body);
  if (validationError) return badRequest(validationError);

  const offer = await prisma.offer.create({
    data: {
      evaluationSessionId: session.id,
      label: body.label ?? null,
      companyName: body.companyName ?? null,
      roleTitle: body.roleTitle ?? null,
      offerFunctionalDomain: body.offerFunctionalDomain ?? null,
      offerReceivedDate: body.offerReceivedDate ? new Date(body.offerReceivedDate) : null,
      offerCountry: body.offerCountry ?? null,
      offerCity: body.offerCity ?? null,
      offerWorkArrangement: body.offerWorkArrangement,
      offerEmploymentType: body.offerEmploymentType,
      offerContractDuration: body.offerContractDuration ?? null,
      offerProbation: body.offerProbation ?? "Not clear",
      reportingLevel: body.reportingLevel ?? null,
      // Free text captured when the paired enum above is "Other".
      offerContractDurationOtherText: body.offerContractDurationOtherText ?? null,
      offerProbationOtherText: body.offerProbationOtherText ?? null,
      reportingLevelOtherText: body.reportingLevelOtherText ?? null,
    },
  });

  return NextResponse.json(offer, { status: 201 });
}
