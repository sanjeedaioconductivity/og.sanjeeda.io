import { NextRequest, NextResponse } from "next/server";
import { loadOwnedOffer } from "@/lib/offerguide/offerAuth";
import { computeAndPersistOfferScore } from "@/lib/offerguide/scoring/persistOfferScore";

// SCR-010 (Results): computes this offer's score and persists it, recording
// the scoringConfigVersion/fieldScoringRulesVersion that produced it. Safe
// to call repeatedly (e.g. after the candidate edits an answer) — each call
// re-scores from the offer's current answers and overwrites the prior result.
//
// Reading a score back without recomputing is GET ../score — the two are
// separate operations in the contract precisely because this one has a side
// effect and that one doesn't.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ offerId: string }> }
) {
  const { offerId } = await params;
  const result = await loadOwnedOffer(req, Number(offerId));
  if ("error" in result) return result.error;

  const score = await computeAndPersistOfferScore(result.offer.id);
  return NextResponse.json(score, { status: 201 });
}
