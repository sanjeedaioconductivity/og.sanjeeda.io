import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { loadOwnedOffer } from "@/lib/offerguide/offerAuth";
import { notFound } from "@/lib/offerguide/errors";

// Reads the stored score for an offer without recomputing it — so revisiting
// SCR-010, or reloading it, shows the same numbers that were computed before
// rather than silently re-running the engine against a config that may have
// been retuned since. Computing is POST ../compute-score.
//
// 404 when the offer has never been scored: there is no score resource yet,
// and inventing a zeroed one would be indistinguishable from a genuinely
// terrible offer.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ offerId: string }> }
) {
  const { offerId } = await params;
  const result = await loadOwnedOffer(req, Number(offerId));
  if ("error" in result) return result.error;

  const score = await prisma.offerScore.findUnique({
    where: { offerId: result.offer.id },
  });
  if (!score) return notFound();

  return NextResponse.json(score);
}
