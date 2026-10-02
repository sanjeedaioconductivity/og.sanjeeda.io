'use client';

/**
 * CompensationBar — SCR-004's fixed live compensation total.
 *
 * Lives here, in `components/shared/`, deliberately NOT inside the OfferGuide
 * module folder (Sprint 6 handoff §5: "Lives in components/shared/ (portal-wide),
 * not inside the OfferGuide module folder. Flag its location at PR review.") — no
 * shadcn equivalent exists, so this is hand-built, but it's still a reusable
 * portal primitive in spirit, not OfferGuide-private.
 *
 * A DISPLAY CALCULATION ONLY. Never a score, never presented as one — the FRS is
 * explicit about that distinction. Real scoring comes from the Sprint 5 backend
 * engine exclusively.
 *
 * Anchored below the top nav, above the section stepper, sticky at every
 * breakpoint (handled by the caller wrapping this in WizardShell's `stickySlot`,
 * which is itself `sticky top-0`). Desktop shows a pill breakdown by category;
 * mobile shows the total only with an "updates as you fill" hint, since there
 * isn't room for four pills at 375px.
 */

import * as React from 'react';

export type CompensationInputs = {
  baseSalary: number | null;
  payPeriod: 'Monthly' | 'Annually' | string;
  currency: string | null;
  signingBonus: number | null;
  annualBonus: number | null;
  annualBonusType: '% of base' | 'Fixed value' | string;
  commission: number | null;
  commissionType: '% of base' | 'Fixed value' | string;
  equity: number | null;
  equityType: 'Estimated value' | '% of base' | 'Unknown value' | string;
  transportAllowance: number | null;
  transportFrequency: 'Monthly' | 'Quarterly' | 'Annually' | string;
  otherAllowance: number | null;
  otherAllowanceFrequency: 'Monthly' | 'Quarterly' | 'Annually' | string;
  relocationAmount: number | null;
};

const FREQUENCY_MULTIPLIER: Record<string, number> = {
  Monthly: 12,
  Quarterly: 4,
  Annually: 1,
};

function annualize(amount: number | null, frequency: string): number {
  if (!amount) return 0;
  return amount * (FREQUENCY_MULTIPLIER[frequency] ?? 1);
}

function percentOrFixed(
  value: number | null,
  type: string,
  base: number,
): number {
  if (!value) return 0;
  return type === '% of base' ? base * (value / 100) : value;
}

export type CompensationBreakdown = {
  base: number;
  /** Signing bonus + calculated annual bonus + calculated commission. */
  bonus: number;
  /** Annualised transport + other allowance + one-time relocation amount. */
  allowances: number;
  /** Equity, excluded entirely when its type is "Unknown value". */
  equity: number;
  total: number;
};

/**
 * The FRS names four pill categories (Base · Bonus · Allowances · Equity) but
 * doesn't hand down an exact field-to-pill mapping. This grouping is a
 * documented judgement call — the only figure the FRS actually tests is the
 * TOTAL, and that comes out identical regardless of which pill a field lands
 * in. Signing bonus and commission read as "bonus-like" cash; relocation reads
 * as "allowance-like" reimbursement, so it's grouped there rather than
 * invented as a fifth pill.
 */
export function calculateCompensation(
  inputs: CompensationInputs,
): CompensationBreakdown {
  const base = annualize(
    inputs.baseSalary,
    inputs.payPeriod === 'Monthly' ? 'Monthly' : 'Annually',
  );

  const annualBonusValue = percentOrFixed(
    inputs.annualBonus,
    inputs.annualBonusType,
    base,
  );
  const commissionValue = percentOrFixed(
    inputs.commission,
    inputs.commissionType,
    base,
  );
  const bonus = (inputs.signingBonus ?? 0) + annualBonusValue + commissionValue;

  const allowances =
    annualize(inputs.transportAllowance, inputs.transportFrequency) +
    annualize(inputs.otherAllowance, inputs.otherAllowanceFrequency) +
    (inputs.relocationAmount ?? 0);

  // Equity is cash in MVP (SCR-004 FRS §5) — except when its value is genuinely
  // unknown, in which case it must not silently count as zero-value cash.
  const equity =
    inputs.equityType === 'Unknown value'
      ? 0
      : percentOrFixed(inputs.equity, inputs.equityType, base);

  return { base, bonus, allowances, equity, total: base + bonus + allowances + equity };
}

function formatCurrency(amount: number, currency: string | null): string {
  const rounded = Math.round(amount);
  if (!currency) return rounded.toLocaleString('en-US');
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(rounded);
  } catch {
    // Intl throws on a currency code it doesn't recognise (shouldn't happen with
    // our ISO 4217 list, but a candidate's raw string could still slip through).
    return `${currency} ${rounded.toLocaleString('en-US')}`;
  }
}

export default function CompensationBar({
  inputs,
}: {
  inputs: CompensationInputs;
}) {
  const breakdown = React.useMemo(() => calculateCompensation(inputs), [inputs]);
  const fmt = (n: number) => formatCurrency(n, inputs.currency);

  return (
    <div className="border-b border-border bg-card px-4 py-2.5 sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <div className="flex items-baseline gap-2">
          <span className="text-[11px] text-muted-foreground">
            Total estimated compensation
          </span>
          <span className="text-base font-bold text-success sm:text-lg">
            {fmt(breakdown.total)}{' '}
            <span className="text-xs font-normal text-muted-foreground">
              / year
            </span>
          </span>
        </div>

        {/* Desktop: pill breakdown by category. */}
        <div className="hidden items-center gap-1.5 sm:flex">
          <Pill label="Base" value={fmt(breakdown.base)} />
          <Pill label="Bonus" value={fmt(breakdown.bonus)} />
          <Pill label="Allowances" value={fmt(breakdown.allowances)} />
          <Pill label="Equity" value={fmt(breakdown.equity)} />
        </div>

        {/* Mobile: total only, with the hint — no room for four pills at 375px. */}
        <span className="text-[11px] text-muted-foreground sm:hidden">
          updates as you fill
        </span>
      </div>
    </div>
  );
}

function Pill({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-success-subtle px-2 py-0.5 text-[11px] text-success">
      <span className="font-medium">{label}</span>
      {value}
    </span>
  );
}
