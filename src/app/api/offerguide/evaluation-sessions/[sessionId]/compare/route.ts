import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { resolveIdentity } from "@/lib/offerguide/identity";
import { notFound } from "@/lib/offerguide/errors";
import { findCandidateProfile, findOwnedSession } from "@/lib/offerguide/profile";
import { decideComparison } from "@/lib/offerguide/compareOffers";

// SCR-009 (Compare). Returns every offer in the session alongside its stored
// score, plus the comparison outcome.
//
// The winner is decided HERE, not on the client, for the same reason SCR-010's
// strengths/watch-outs are derived server-side: it's a displayed value produced
// by comparing scores, and a threshold/comparison in the frontend that produces
// a displayed value is a defect. `winnerOfferIds` is an array because a tie
// badges BOTH offers rather than arbitrarily picking one — with `isTie` stated
// explicitly so the client never has to infer it from the array length.
//
// Offers that have never been scored carry `score: null` and are excluded from
// the winner comparison entirely; they don't win, and they don't create a tie.
export async function GET(
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

  const offers = await prisma.offer.findMany({
    where: { evaluationSessionId: session.id },
    include: { score: true },
    orderBy: { id: "asc" },
  });

  const { bestOverallScore, winnerOfferIds, isTie } = decideComparison(
    offers.map((offer) => ({ id: offer.id, overallScore: offer.score?.overallScore ?? null }))
  );

  return NextResponse.json({
    sessionId: session.id,
    evaluationOfferCount: session.evaluationOfferCount,
    offerCount: offers.length,
    bestOverallScore,
    isTie,
    winnerOfferIds,
    offers: offers.map((offer) => ({
      id: offer.id,
      label: offer.label,
      companyName: offer.companyName,
      roleTitle: offer.roleTitle,
      offerWorkArrangement: offer.offerWorkArrangement,
      isWinner: winnerOfferIds.includes(offer.id),
      score: offer.score,
    })),
  });
}
