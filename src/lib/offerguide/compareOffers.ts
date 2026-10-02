// OfferGuide — SCR-009 comparison outcome
// Sprint 8. Extracted from the /compare route so the winner rule is a pure
// function the golden fixtures can exercise without a live database, and so
// there is exactly one place the rule lives — the client renders the result,
// it never re-derives it.

export type ComparableOffer = {
  id: number;
  /** Null when the offer has never been scored. */
  overallScore: number | null;
};

export type ComparisonOutcome = {
  bestOverallScore: number | null;
  winnerOfferIds: number[];
  isTie: boolean;
};

/**
 * Highest overall score wins. Unscored offers take no part: they don't win,
 * and they can't create a tie. A tie returns every id sharing the top score —
 * SCR-009 badges both rather than arbitrarily picking one.
 */
export function decideComparison(offers: ComparableOffer[]): ComparisonOutcome {
  const scored = offers.filter(
    (offer): offer is ComparableOffer & { overallScore: number } => offer.overallScore !== null
  );

  if (scored.length === 0) {
    return { bestOverallScore: null, winnerOfferIds: [], isTie: false };
  }

  const bestOverallScore = Math.max(...scored.map((offer) => offer.overallScore));
  const winnerOfferIds = scored
    .filter((offer) => offer.overallScore === bestOverallScore)
    .map((offer) => offer.id);

  return { bestOverallScore, winnerOfferIds, isTie: winnerOfferIds.length > 1 };
}
