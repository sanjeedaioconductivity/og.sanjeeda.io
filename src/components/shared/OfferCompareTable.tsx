'use client';

import HelpIcon from './HelpIcon';

/**
 * OfferCompareTable — SCR-009's per-category comparison.
 *
 * Lives in `components/shared/` per the Sprint 7 handoff §2.2 ("build once,
 * reuse"), alongside CompensationBar and HelpIcon.
 *
 * Shown ONLY in the multiple-offer view. The single-offer view hides it
 * entirely — a comparison table with one column compares nothing, and the FRS
 * says to show category tags on the offer card instead.
 *
 * Tie handling is a real requirement, not an edge case: when the top score in a
 * category is shared, the Winner column shows a Tie badge rather than silently
 * picking whichever offer happens to sort first.
 */

export type CompareOffer = {
  id: number;
  label: string;
  /** Category label → score. Missing means "not scored yet". */
  scores: Record<string, number | undefined>;
};

export default function OfferCompareTable({
  categories,
  offers,
  categoryColumnLabel,
  winnerColumnLabel,
  tieLabel,
}: {
  categories: readonly string[];
  offers: CompareOffer[];
  categoryColumnLabel: string;
  winnerColumnLabel: string;
  tieLabel: string;
}) {
  if (offers.length < 2) return null;

  return (
    // Wrapped so 3+ offers scroll horizontally instead of forcing the page to.
    <div className="mt-4 w-full overflow-x-auto">
      <table className="w-full min-w-[480px] border-collapse text-xs">
        <thead>
          <tr className="border-b border-border text-left">
            <th className="py-2 pr-3 font-semibold">{categoryColumnLabel}</th>
            {offers.map((o) => (
              <th key={o.id} className="py-2 pr-3 font-semibold">
                {o.label}
              </th>
            ))}
            <th className="py-2 font-semibold">{winnerColumnLabel}</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((category) => {
            const row = offers.map((o) => o.scores[category]);
            const scored = row.filter((s): s is number => typeof s === 'number');
            const best = scored.length ? Math.max(...scored) : null;
            // More than one offer holding the top score is a tie — including
            // the 3+ offer case, where two can tie while a third trails.
            const winners =
              best === null
                ? []
                : offers.filter((o) => o.scores[category] === best);
            const isTie = winners.length > 1;

            return (
              <tr key={category} className="border-b border-border/60">
                <td className="py-2 pr-3 font-medium">{category}</td>
                {offers.map((o) => {
                  const score = o.scores[category];
                  const isWinner = !isTie && best !== null && score === best;
                  return (
                    <td
                      key={o.id}
                      className={[
                        'py-2 pr-3 tabular-nums',
                        isWinner ? 'font-semibold text-foreground' : 'text-muted-foreground',
                      ].join(' ')}
                    >
                      {typeof score === 'number' ? score : '—'}
                    </td>
                  );
                })}
                <td className="py-2">
                  {best === null ? (
                    <span className="text-muted-foreground">—</span>
                  ) : isTie ? (
                    <span className="inline-flex items-center rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                      {tieLabel}
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full border border-success/40 bg-success-subtle px-2 py-0.5 text-[11px] font-semibold text-success">
                      {winners[0]?.label}
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** Section header with an inline HelpIcon — used by SCR-009 and SCR-010. */
export function SectionHeader({
  index,
  title,
  helpText,
  meta,
}: {
  index: number;
  title: string;
  helpText?: string;
  meta?: string;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3 border-b border-border pb-1.5">
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
          {index}
        </span>
        {title}
        {helpText && <HelpIcon text={helpText} label={title} />}
      </h2>
      {meta && (
        <span className="shrink-0 text-[11px] text-muted-foreground">{meta}</span>
      )}
    </div>
  );
}
