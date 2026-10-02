'use client';

import { ArrowDown, ArrowUp, Briefcase, Minus } from 'lucide-react';
import HelpIcon from './HelpIcon';
import {
  compareMoney,
  compareNumbers,
  deltaSentiment,
  type CurrentJobBaseline,
  type NumericDelta,
} from '@/lib/offerguide/currentJobBaseline';

/**
 * CurrentJobCompareTable — CR-01's offer-vs-current-job table.
 *
 * Lives in `components/shared/` with OfferCompareTable and CompensationBar, per
 * the Sprint 7 handoff §2.2 "build once, reuse": SCR-009 (Compare) and SCR-010
 * (Report) both render it, and CR-01 names both screens.
 *
 * HOW IT DIFFERS FROM OfferCompareTable, which sits directly above it on SCR-009:
 *
 *   OfferCompareTable        category FIT SCORES, offer against offer, and a
 *                            Winner column. Hidden with fewer than 2 offers,
 *                            because one column compares nothing.
 *   this                     the candidate's OWN FIGURES against each offer's.
 *                            Shown from ONE offer upward — a single offer
 *                            against the job you already have is the case the
 *                            prototype review found missing.
 *
 * The leftmost data column is the baseline, visually pinned with a muted
 * background so the eye reads left-to-right as "what I have now -> what I am
 * being offered".
 *
 * DELTAS COME FROM THE LIB, NOT FROM HERE. `compareMoney` refuses to subtract
 * across currencies — see currentJobBaseline.ts — so a relocation offer in a
 * second currency shows both figures with no arrow rather than a fabricated
 * percentage. This component never does arithmetic on money itself.
 *
 * Renders nothing at all when `baseline.hasData` is false: a student or an
 * unemployed candidate has no current job, and a column of em-dashes would be
 * worse than no column.
 */

export type CompareOfferFacts = {
  id: number;
  label: string;
  currency: string | null;
  annualBaseSalary: number | null;
  totalAnnual: number | null;
  workArrangement: string | null;
  workingHoursPerWeek: number | null;
  commuteMinutes: number | null;
  /** Badged in the header, so the winning column is obvious in both tables. */
  isWinner?: boolean;
};

type Row = {
  label: string;
  help?: string;
  /** Lower is better — commute, working hours. Flips the colour, not the arrow. */
  betterWhenLower?: boolean;
  baselineText: string;
  cell: (offer: CompareOfferFacts) => { text: string; delta: NumericDelta };
};

function formatMoney(amount: number | null, currency: string | null): string {
  if (amount == null) return '—';
  const rounded = Math.round(amount);
  if (!currency) return rounded.toLocaleString('en-US');
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(rounded);
  } catch {
    // An unknown or malformed ISO code must not blank the cell.
    return `${currency} ${rounded.toLocaleString('en-US')}`;
  }
}

const NO_DELTA: NumericDelta = {
  delta: null,
  percent: null,
  direction: null,
  comparable: false,
};

/** Signed percentage, or the signed raw delta when there is no usable percentage. */
function deltaText(delta: NumericDelta): string | null {
  if (!delta.comparable) return null;
  if (delta.direction === 'same') return 'same';
  if (delta.percent !== null) {
    return `${delta.percent > 0 ? '+' : ''}${delta.percent}%`;
  }
  if (delta.delta === null) return null;
  return `${delta.delta > 0 ? '+' : ''}${delta.delta}`;
}

export default function CurrentJobCompareTable({
  baseline,
  offers,
  heading,
  baselineColumnLabel,
  currencyNote,
  rowLabels,
  rowHelp,
}: {
  baseline: CurrentJobBaseline;
  offers: CompareOfferFacts[];
  heading?: string;
  baselineColumnLabel: string;
  /** Shown only when at least one offer is priced in another currency. */
  currencyNote: string;
  rowLabels: {
    baseSalary: string;
    totalPackage: string;
    workArrangement: string;
    workingHours: string;
    commute: string;
  };
  rowHelp?: { baseSalary?: string; totalPackage?: string };
}) {
  if (!baseline.hasData || offers.length === 0) return null;

  const rows: Row[] = [
    {
      label: rowLabels.baseSalary,
      help: rowHelp?.baseSalary,
      baselineText: formatMoney(baseline.annualBaseSalary, baseline.currency),
      cell: (offer) => ({
        text: formatMoney(offer.annualBaseSalary, offer.currency),
        delta: compareMoney(
          offer.annualBaseSalary,
          offer.currency,
          baseline.annualBaseSalary,
          baseline.currency,
        ),
      }),
    },
    {
      label: rowLabels.totalPackage,
      help: rowHelp?.totalPackage,
      // The baseline has no bonus/equity/allowance fields — SCR-001 captures a
      // base salary and benefit chips only — so its total IS its base. Shown as
      // the same figure rather than a dash: that is what the candidate earns.
      baselineText: formatMoney(baseline.annualBaseSalary, baseline.currency),
      cell: (offer) => ({
        text: formatMoney(offer.totalAnnual, offer.currency),
        delta: compareMoney(
          offer.totalAnnual,
          offer.currency,
          baseline.annualBaseSalary,
          baseline.currency,
        ),
      }),
    },
    {
      label: rowLabels.workArrangement,
      baselineText: baseline.workArrangement ?? '—',
      // Categorical: On-site vs Remote has no arithmetic direction, and which
      // one is "better" is the candidate's own preference (scored on SCR-001
      // against preferredWorkArrangement, not here).
      cell: (offer) => ({ text: offer.workArrangement ?? '—', delta: NO_DELTA }),
    },
    {
      label: rowLabels.workingHours,
      baselineText:
        baseline.workingHoursPerWeek != null
          ? `${baseline.workingHoursPerWeek} / week`
          : '—',
      betterWhenLower: true,
      cell: (offer) => ({
        text:
          offer.workingHoursPerWeek != null
            ? `${offer.workingHoursPerWeek} / week`
            : '—',
        delta: compareNumbers(
          offer.workingHoursPerWeek,
          baseline.workingHoursPerWeek,
        ),
      }),
    },
    {
      label: rowLabels.commute,
      baselineText:
        baseline.commuteMinutes != null ? `${baseline.commuteMinutes} min` : '—',
      betterWhenLower: true,
      cell: (offer) => ({
        text: offer.commuteMinutes != null ? `${offer.commuteMinutes} min` : '—',
        delta: compareNumbers(offer.commuteMinutes, baseline.commuteMinutes),
      }),
    },
  ];

  // Drop rows where neither side has anything — a table of dashes is noise.
  const visibleRows = rows.filter(
    (row) =>
      row.baselineText !== '—' ||
      offers.some((offer) => row.cell(offer).text !== '—'),
  );
  if (visibleRows.length === 0) return null;

  const hasForeignCurrency = offers.some(
    (offer) =>
      offer.currency &&
      baseline.currency &&
      offer.currency.trim().toUpperCase() !==
        baseline.currency.trim().toUpperCase(),
  );

  return (
    <div className="mt-4">
      {heading && (
        <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold">
          <Briefcase className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
          {heading}
        </h3>
      )}

      {/* Wrapped so 3+ offers scroll horizontally instead of forcing the page to. */}
      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-[480px] border-collapse text-xs">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="py-2 pr-3 font-semibold">&nbsp;</th>
              <th className="bg-muted/40 px-3 py-2 font-semibold">
                <span className="flex items-center gap-1.5">
                  {baselineColumnLabel}
                  {baseline.jobTitle && (
                    <span className="font-normal text-muted-foreground">
                      · {baseline.jobTitle}
                    </span>
                  )}
                </span>
              </th>
              {offers.map((offer) => (
                <th key={offer.id} className="py-2 pr-3 font-semibold">
                  <span className="flex items-center gap-1.5">
                    {offer.label}
                    {offer.isWinner && (
                      <span className="inline-flex items-center rounded-full border border-success/40 bg-success-subtle px-1.5 py-0.5 text-[10px] font-semibold text-success">
                        top
                      </span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row) => (
              <tr key={row.label} className="border-b border-border/60">
                <td className="py-2 pr-3 font-medium">
                  <span className="flex items-center">
                    {row.label}
                    {row.help && <HelpIcon text={row.help} label={row.label} />}
                  </span>
                </td>
                <td className="bg-muted/40 px-3 py-2 tabular-nums text-muted-foreground">
                  {row.baselineText}
                </td>
                {offers.map((offer) => {
                  const { text, delta } = row.cell(offer);
                  const sentiment = deltaSentiment(delta, row.betterWhenLower);
                  const badge = deltaText(delta);
                  return (
                    <td key={offer.id} className="py-2 pr-3 tabular-nums">
                      <span className="flex flex-wrap items-center gap-1.5">
                        <span className="font-medium">{text}</span>
                        {badge && sentiment && (
                          <span
                            className={[
                              'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
                              sentiment === 'better'
                                ? 'bg-success-subtle text-success'
                                : sentiment === 'worse'
                                  ? 'bg-warning-subtle text-warning'
                                  : 'bg-muted text-muted-foreground',
                            ].join(' ')}
                          >
                            {sentiment === 'same' ? (
                              <Minus className="h-2.5 w-2.5" aria-hidden="true" />
                            ) : delta.direction === 'up' ? (
                              <ArrowUp className="h-2.5 w-2.5" aria-hidden="true" />
                            ) : (
                              <ArrowDown className="h-2.5 w-2.5" aria-hidden="true" />
                            )}
                            {badge}
                          </span>
                        )}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hasForeignCurrency && (
        <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
          {currencyNote}
        </p>
      )}
    </div>
  );
}
