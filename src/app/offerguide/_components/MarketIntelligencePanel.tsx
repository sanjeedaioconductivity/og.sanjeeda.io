'use client';

import { AlertTriangle, Check } from 'lucide-react';
import HelpIcon from '@/components/shared/HelpIcon';
import {
  MARKET_CARD_HELP,
  MARKET_CARD_TITLES,
  MARKET_EMPTY_BODY,
  MARKET_SAMPLE_BADGE,
  type MarketIntelligence,
} from '../_constants/scr009';

/**
 * SCR-009 §6.3 — the six market intelligence cards.
 *
 * 3-column grid on desktop, 2-column on mobile, per that FRS §10.
 *
 * Every card reads from the `MarketIntelligence` payload and falls back to its
 * own empty state when its slice is null. That per-card branching is what lets
 * real community data replace the sample payload later with no structural
 * change — and it means a partially-populated payload degrades card by card
 * instead of blanking the panel.
 *
 * When `isSampleData` is true the panel shows a visible "Sample data" badge.
 * The FRS asks for placeholder figures in MVP; the Sprint 7 handoff warns
 * against numbers that could be mistaken for real benchmarks. The badge is what
 * lets both hold at once.
 */

function Card({
  title,
  help,
  children,
}: {
  title: string;
  help: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <p className="flex items-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
        <HelpIcon text={help} label={title} />
      </p>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function Empty() {
  return (
    <p className="text-xs leading-snug text-muted-foreground">
      {MARKET_EMPTY_BODY}
    </p>
  );
}

function compact(n: number): string {
  return n >= 1000 ? `${Math.round(n / 1000)}K` : String(n);
}

export default function MarketIntelligencePanel({
  data,
  topOfferLabel,
}: {
  data: MarketIntelligence;
  /** e.g. "Offer A" — used in the competitiveness sentence. */
  topOfferLabel?: string | null;
}) {
  const { salaryRange, competitiveness } = data;

  return (
    <div>
      {data.isSampleData && (
        <p className="mb-2 inline-flex items-center rounded-full border border-warning/40 bg-warning-subtle px-2 py-0.5 text-[11px] font-semibold text-warning">
          {MARKET_SAMPLE_BADGE}
        </p>
      )}

      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-3">
        {/* 1 — Salary range: P25→P75 with the median called out. */}
        <Card
          title={MARKET_CARD_TITLES.salaryRange}
          help={MARKET_CARD_HELP.salaryRange}
        >
          {salaryRange ? (
            <>
              <p className="text-sm font-bold text-primary">
                {salaryRange.currency} {compact(salaryRange.p25)} –{' '}
                {salaryRange.currency} {compact(salaryRange.p75)}
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                Median {salaryRange.currency}{' '}
                {salaryRange.median.toLocaleString('en-US')} /{' '}
                {salaryRange.period}
              </p>
              <div
                className="mt-1.5 h-1.5 w-full rounded-full"
                style={{
                  background:
                    'linear-gradient(to right, hsl(var(--warning)), hsl(var(--success)))',
                }}
                aria-hidden="true"
              />
              <div className="mt-0.5 flex justify-between text-[10px] text-muted-foreground">
                <span>P25</span>
                <span>Median</span>
                <span>P75</span>
              </div>
            </>
          ) : (
            <Empty />
          )}
        </Card>

        {/* 2 — Bonus prevalence */}
        <Card
          title={MARKET_CARD_TITLES.bonusPrevalence}
          help={MARKET_CARD_HELP.bonusPrevalence}
        >
          {data.bonusPrevalencePct !== null ? (
            <>
              <p className="text-xl font-bold">{data.bonusPrevalencePct}%</p>
              <p className="text-[11px] leading-snug text-muted-foreground">
                of similar offers include a bonus
              </p>
            </>
          ) : (
            <Empty />
          )}
        </Card>

        {/* 3 — Typical flexibility */}
        <Card
          title={MARKET_CARD_TITLES.flexibility}
          help={MARKET_CARD_HELP.flexibility}
        >
          {data.flexibilityPct !== null ? (
            <>
              <p className="text-xl font-bold">{data.flexibilityPct}%</p>
              <p className="text-[11px] leading-snug text-muted-foreground">
                hybrid or remote in sample
              </p>
            </>
          ) : (
            <Empty />
          )}
        </Card>

        {/* 4 — Common benefits */}
        <Card
          title={MARKET_CARD_TITLES.commonBenefits}
          help={MARKET_CARD_HELP.commonBenefits}
        >
          {data.commonBenefits.length > 0 ? (
            <ul className="space-y-1">
              {data.commonBenefits.map((b) => (
                <li key={b} className="flex items-center gap-1.5 text-[11px]">
                  <Check
                    className="h-3 w-3 shrink-0 text-success"
                    aria-hidden="true"
                  />
                  {b}
                </li>
              ))}
            </ul>
          ) : (
            <Empty />
          )}
        </Card>

        {/* 5 — Common red flags (amber, matching SCR-008's treatment) */}
        <Card
          title={MARKET_CARD_TITLES.commonRedFlags}
          help={MARKET_CARD_HELP.commonRedFlags}
        >
          {data.commonRedFlags.length > 0 ? (
            <ul className="space-y-1">
              {data.commonRedFlags.map((f) => (
                <li
                  key={f.label}
                  className="flex items-center gap-1.5 text-[11px] text-warning"
                >
                  <AlertTriangle
                    className="h-3 w-3 shrink-0"
                    aria-hidden="true"
                  />
                  {f.label} ({f.count})
                </li>
              ))}
            </ul>
          ) : (
            <Empty />
          )}
        </Card>

        {/* 6 — Competitiveness */}
        <Card
          title={MARKET_CARD_TITLES.competitiveness}
          help={MARKET_CARD_HELP.competitiveness}
        >
          {competitiveness ? (
            <>
              <div
                className="relative mt-0.5 h-1.5 w-full rounded-full"
                style={{
                  background:
                    'linear-gradient(to right, hsl(var(--warning)), hsl(var(--success)))',
                }}
              >
                <span
                  className="absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full border-2 border-background bg-foreground"
                  style={{
                    left: `calc(${Math.max(0, Math.min(100, competitiveness.position))}% - 5px)`,
                  }}
                  aria-hidden="true"
                />
              </div>
              <div className="mt-0.5 flex justify-between text-[10px] text-muted-foreground">
                <span>Below</span>
                <span>Near</span>
                <span>Strong</span>
              </div>
              {topOfferLabel && (
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {topOfferLabel} is {competitiveness.note}
                </p>
              )}
            </>
          ) : (
            <Empty />
          )}
        </Card>
      </div>
    </div>
  );
}
