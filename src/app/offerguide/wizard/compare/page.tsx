'use client';

import * as React from 'react';
import { Plus, Trash2, Trophy } from 'lucide-react';
import toast from 'react-hot-toast';

import WizardShell from '../../_components/WizardShell';
import OfferCompareTable, {
  SectionHeader,
  type CompareOffer,
} from '@/components/shared/OfferCompareTable';
import CurrentJobCompareTable, {
  type CompareOfferFacts,
} from '@/components/shared/CurrentJobCompareTable';
import { calculateCompensation } from '@/components/shared/CompensationBar';
import {
  annualiseSalary,
  buildCurrentJobBaseline,
  type CurrentJobBaseline,
} from '@/lib/offerguide/currentJobBaseline';

import { getScreen } from '../../_constants/screens';
import MarketIntelligencePanel from '../../_components/MarketIntelligencePanel';
import ConsentChips from '../../_components/ConsentChips';
import {
  CATEGORY_SCORE_KEYS,
  SAMPLE_MARKET_INTELLIGENCE,
  SCORE_CATEGORIES,
  SCR009_COPY,
} from '../../_constants/scr009';
import * as api from '../../_state/api';
import { useWizardContext } from '../../_state/useWizardContext';

const SCREEN = getScreen('SCR-009');
const C = SCR009_COPY;

type LoadedOffer = {
  id: number;
  label: string;
  companyName: string | null;
  roleTitle: string | null;
  workArrangement: string | null;
  baseSalary: number | null;
  payPeriod: string | null;
  currency: string | null;
  totalAnnual: number | null;
  /** CR-01 — the offer's own like-for-like figures for the baseline table. */
  annualBaseSalary: number | null;
  workingHoursPerWeek: number | null;
  commuteMinutes: number | null;
  score: api.OfferScore | null;
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
    return `${currency} ${rounded.toLocaleString('en-US')}`;
  }
}

/**
 * SCR-009 — Compare & Market Intelligence.
 *
 * Always shown, single or multiple offers; the content adapts rather than the
 * screen being skipped. Zero data-entry fields — everything here is read back
 * from SCR-003/004 and the scoring engine.
 *
 * Scores are fetched per offer via POST /score, which re-scores from that
 * offer's current answers. That's deliberate: landing here after editing an
 * answer should reflect the edit, not a stale row. Never computed client-side.
 */
export default function ComparePage() {
  const { sessionId, offerId, resolving, navigateWithContext } =
    useWizardContext();

  const [offers, setOffers] = React.useState<LoadedOffer[]>([]);
  // Server-decided, from the /compare endpoint — a list because a tie badges
  // every offer sharing the top score.
  const [winnerOfferIds, setWinnerOfferIds] = React.useState<number[]>([]);
  const [consent, setConsent] = React.useState<api.ConsentSettings | null>(null);
  // CR-01 — the candidate's current job, read from SCR-001. Null until loaded;
  // `hasData: false` for anyone who has no current job to compare against.
  const [baseline, setBaseline] = React.useState<CurrentJobBaseline | null>(null);
  const [toggles, setToggles] = React.useState<api.ConsentToggle[]>([]);
  const [savingConsent, setSavingConsent] = React.useState(false);
  const [hasProfile, setHasProfile] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [removingOfferId, setRemovingOfferId] = React.useState<number | null>(null);
  // The context hook resolves the URL's offer once per mount, so after a removal
  // rewrites the URL this page has to carry the replacement id itself.
  const [replacementOfferId, setReplacementOfferId] = React.useState<number | null>(null);
  const activeOfferId = replacementOfferId ?? offerId;
  // Bumped after a removal to re-run the load below: scores and the winner are
  // server-decided, so the whole set is re-fetched rather than patched locally.
  const [reloadTick, setReloadTick] = React.useState(0);

  React.useEffect(() => {
    if (resolving) return;
    let cancelled = false;

    async function load() {
      if (!sessionId) {
        navigateWithContext(getScreen('SCR-002').href);
        return;
      }

      const [session, profile, consentToggles] = await Promise.all([
        api.getEvaluationSession(sessionId).catch(() => null),
        api.getCandidateProfile().catch(() => null),
        api.getConsentToggles().catch(() => []),
      ]);
      if (cancelled) return;

      setConsent(profile?.consentSettings ?? null);
      setHasProfile(Boolean(profile));
      setToggles(consentToggles ?? []);
      // Same profile fetch that was already happening for consent — the
      // baseline costs no extra request.
      setBaseline(buildCurrentJobBaseline(profile));

      const summaries = session?.offers ?? [];

      const loaded = await Promise.all(
        summaries.map(async (summary) => {
          const [full, score] = await Promise.all([
            api.getOffer(summary.id).catch(() => null),
            api.computeOfferScore(summary.id).catch(() => null),
          ]);

          const comp = full?.compensation ?? null;
          const baseSalary = comp?.offerBaseSalary
            ? Number(comp.offerBaseSalary)
            : null;

          // Reuses the exact SCR-004 bar maths so the annualised total shown
          // here can't drift from what the candidate saw while entering it.
          const totalAnnual = comp
            ? calculateCompensation({
                baseSalary,
                payPeriod: comp.offerPayPeriod ?? 'Monthly',
                currency: comp.offerCurrency,
                signingBonus: comp.offerSigningBonus ? Number(comp.offerSigningBonus) : null,
                annualBonus: comp.offerAnnualBonus ? Number(comp.offerAnnualBonus) : null,
                annualBonusType: comp.offerAnnualBonusType ?? '% of base',
                commission: comp.offerCommission ? Number(comp.offerCommission) : null,
                commissionType: comp.offerCommissionType ?? '% of base',
                equity: comp.offerEquity ? Number(comp.offerEquity) : null,
                equityType: comp.offerEquityType ?? 'Estimated value',
                transportAllowance: comp.offerTransportAllowance
                  ? Number(comp.offerTransportAllowance)
                  : null,
                transportFrequency: comp.offerTransportFrequency ?? 'Monthly',
                otherAllowance: comp.offerOtherAllowance
                  ? Number(comp.offerOtherAllowance)
                  : null,
                otherAllowanceFrequency: comp.offerOtherAllowanceFrequency ?? 'Monthly',
                relocationAmount: comp.offerRelocationAmount
                  ? Number(comp.offerRelocationAmount)
                  : null,
              }).total
            : null;

          return {
            id: summary.id,
            label: summary.label ?? `Offer ${summary.id}`,
            companyName: full?.companyName ?? summary.companyName ?? null,
            roleTitle: full?.roleTitle ?? summary.roleTitle ?? null,
            workArrangement: full?.offerWorkArrangement ?? null,
            baseSalary,
            payPeriod: comp?.offerPayPeriod ?? null,
            currency: comp?.offerCurrency ?? null,
            totalAnnual,
            // Annualised so a monthly offer and an annual current salary line up
            // in the baseline table; the card above still shows the raw figure
            // with its own "/ month" suffix.
            annualBaseSalary: annualiseSalary(
              baseSalary,
              comp?.offerPayPeriod === 'Monthly' ? 'Monthly' : 'Annually',
            ),
            workingHoursPerWeek: full?.workLife?.offerWorkingHours ?? null,
            commuteMinutes: full?.workLife?.offerCommuteMinutes ?? null,
            score,
          } satisfies LoadedOffer;
        }),
      );

      if (cancelled) return;
      setOffers(loaded);

      // Fetched AFTER the per-offer compute-score calls above, so the winner is
      // decided against the scores that were just written, not the previous run's.
      const comparison = await api
        .getSessionComparison(Number(sessionId))
        .catch(() => null);
      if (cancelled) return;
      setWinnerOfferIds(comparison?.winnerOfferIds ?? []);

      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolving, sessionId, reloadTick]);

  const isMultiple = offers.length > 1;

  // Winner comes from GET /evaluation-sessions/{id}/compare — the backend
  // decides it, this screen only renders the badge. Ties badge BOTH offers,
  // which is why this is a list rather than a single id.
  const isWinnerOffer = React.useCallback(
    (offerId: number) => winnerOfferIds.includes(offerId),
    [winnerOfferIds],
  );

  // Highest-scoring offer, used for the competitiveness card's sentence.
  // Falls back to the first offer so a single-offer session still reads
  // naturally ("Offer A is above median").
  const topOffer = React.useMemo(
    () => offers.find((o) => isWinnerOffer(o.id)) ?? offers[0] ?? null,
    [offers, isWinnerOffer],
  );

  // CR-01 — the same offers, reduced to the facts the baseline table compares.
  const offerFacts: CompareOfferFacts[] = offers.map((o) => ({
    id: o.id,
    label: o.label,
    currency: o.currency,
    annualBaseSalary: o.annualBaseSalary,
    totalAnnual: o.totalAnnual,
    workArrangement: o.workArrangement,
    workingHoursPerWeek: o.workingHoursPerWeek,
    commuteMinutes: o.commuteMinutes,
    // Only meaningful with something to be top of, exactly as the card badge.
    isWinner: isMultiple && isWinnerOffer(o.id),
  }));

  const compareOffers: CompareOffer[] = offers.map((o) => ({
    id: o.id,
    label: o.label,
    scores: Object.fromEntries(
      SCORE_CATEGORIES.map((cat) => [
        cat,
        o.score
          ? (o.score[CATEGORY_SCORE_KEYS[cat] as keyof api.OfferScore] as number)
          : undefined,
      ]),
    ),
  }));

  /**
   * Writes through `/candidate-profile/consent`, the same endpoint SCR-001
   * submits on Next, so the value stays single-sourced on the candidate profile.
   *
   * Applied optimistically and rolled back on failure — a toggle that visually
   * flips but silently failed to save would be the worst outcome for a privacy
   * control, so the UI must never claim a state the server didn't accept.
   */
  async function persistConsent(next: api.ConsentSettings) {
    // The endpoint hangs off the candidate profile and 404s without one. That
    // only happens if SCR-009 was opened directly by URL, but the raw 404 text
    // would tell the candidate nothing, so it's translated here.
    if (!hasProfile) {
      toast.error('Complete your profile first to set sharing preferences.');
      return;
    }

    const previous = consent;
    setConsent(next);
    setSavingConsent(true);
    try {
      await api.updateConsent(next);
    } catch (error) {
      setConsent(previous);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Could not save your sharing preferences.',
      );
    } finally {
      setSavingConsent(false);
    }
  }

  function handleShareAnonymousChange(value: boolean) {
    // Sub-selections are intentionally preserved when the master goes off —
    // the backend disregards them while it's off, and turning it back on
    // restores the candidate's earlier choices instead of silently wiping them.
    persistConsent({
      shareAnonymous: value,
      selections: consent?.selections ?? {},
    });
  }

  function handleSelectionChange(toggleId: string, value: boolean) {
    persistConsent({
      shareAnonymous: consent?.shareAnonymous ?? false,
      selections: { ...(consent?.selections ?? {}), [toggleId]: value },
    });
  }

  async function handleAddOffer() {
    if (!sessionId) return;
    // `offer: 'new'` is load-bearing: it is the explicit create intent SCR-003
    // looks for. Dropping the id (`null`) is no longer enough — with no offer
    // in the URL that screen now edits the session's latest offer, by design.
    // Labels sequence from the session's existing count — no cap.
    navigateWithContext(getScreen('SCR-003').href, {
      session: sessionId,
      offer: 'new',
    });
  }

  /**
   * Removes an offer from the session. Multi-offer view only: the last offer
   * can't be removed, because the screens after this one need one to show.
   *
   * Exists because an unwanted offer had no way out — a phantom "Offer B"
   * created by mistake stayed in the comparison forever (QA report B2). The
   * confirm is a native dialog on purpose: this deletes answers and a score,
   * and there is no undo.
   */
  async function handleRemoveOffer(offer: LoadedOffer) {
    if (removingOfferId !== null || offers.length < 2) return;
    if (!window.confirm(C.removeOfferConfirm.replace('{offer}', offer.label))) return;

    setRemovingOfferId(offer.id);
    try {
      await api.deleteOffer(offer.id);
      // If the removed offer was the one in the URL, the rest of the wizard
      // would 404 on it; fall back to whichever offer is left first.
      if (activeOfferId === offer.id) {
        const remaining = offers.find((o) => o.id !== offer.id) ?? null;
        setReplacementOfferId(remaining?.id ?? null);
        navigateWithContext(SCREEN.href, {
          session: sessionId,
          offer: remaining?.id ?? null,
        });
      }
      setLoading(true);
      setReloadTick((n) => n + 1);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Could not remove that offer.',
      );
    } finally {
      setRemovingOfferId(null);
    }
  }

  if (resolving || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading your offers…</p>
      </div>
    );
  }

  const shareOn = consent?.shareAnonymous ?? false;

  return (
    <WizardShell
      screen={SCREEN}
      introPurpose={C.purpose}
      introRequirementNote={
        isMultiple ? C.requirementNoteMultiple : C.requirementNoteSingle
      }
      onBack={() =>
        navigateWithContext(getScreen('SCR-008').href, {
          session: sessionId ?? undefined,
          offer: activeOfferId ?? undefined,
        })
      }
      onNext={() =>
        navigateWithContext(getScreen('SCR-010').href, {
          session: sessionId ?? undefined,
          offer: activeOfferId ?? offers[0]?.id,
        })
      }
    >
      {/* ============================ 1 — Your offers ======================== */}
      <section>
        <SectionHeader
          index={1}
          title={C.sections.offers}
          helpText={C.sectionHelp.offers}
          meta={`${offers.length} offer${offers.length === 1 ? '' : 's'}`}
        />

        {offers.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No offers yet. Add one to see how it scores.
          </p>
        ) : (
          <div
            className={[
              'grid gap-3',
              isMultiple ? 'sm:grid-cols-2' : 'sm:grid-cols-1',
            ].join(' ')}
          >
            {offers.map((o) => {
              const overall = o.score?.overallScore ?? null;
              // Badge only in a multi-offer session — "Top match" is
              // meaningless when there's nothing to be top of.
              const isWinner = isMultiple && isWinnerOffer(o.id);

              // Top 3 categories as tags, per the FRS offer-card spec.
              const topCategories = o.score
                ? [...SCORE_CATEGORIES]
                    .map((cat) => ({
                      cat,
                      score: o.score![
                        CATEGORY_SCORE_KEYS[cat] as keyof api.OfferScore
                      ] as number,
                    }))
                    .sort((a, b) => b.score - a.score)
                    .slice(0, 3)
                : [];

              return (
                <article
                  key={o.id}
                  className={[
                    'rounded-lg border p-3.5',
                    isWinner ? 'border-success' : 'border-border',
                  ].join(' ')}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                      {o.label}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {isWinner && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-success/40 bg-success-subtle px-2 py-0.5 text-[11px] font-semibold text-success">
                          <Trophy className="h-3 w-3" aria-hidden="true" />
                          {C.winnerBadge}
                        </span>
                      )}
                      {/* Only when there is something left to compare against. */}
                      {isMultiple && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOffer(o)}
                          disabled={removingOfferId !== null}
                          aria-label={`${C.removeOffer} ${o.label}`}
                          title={`${C.removeOffer} ${o.label}`}
                          className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground transition-colors hover:border-destructive/40 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Trash2 className="h-3 w-3" aria-hidden="true" />
                          {removingOfferId === o.id ? '…' : C.removeOffer}
                        </button>
                      )}
                    </div>
                  </div>

                  <h3 className="mt-2 text-sm font-semibold">
                    {o.companyName ?? 'Company not set'}
                  </h3>
                  {o.roleTitle && (
                    <p className="text-xs text-muted-foreground">{o.roleTitle}</p>
                  )}

                  <p className="mt-2 text-base font-bold">
                    {formatMoney(o.baseSalary, o.currency)}
                    {o.payPeriod && (
                      <span className="text-xs font-normal text-muted-foreground">
                        {' '}
                        / {o.payPeriod === 'Monthly' ? 'month' : 'year'}
                      </span>
                    )}
                  </p>
                  {o.totalAnnual != null && o.totalAnnual > 0 && (
                    <p className="text-[11px] text-muted-foreground">
                      Total est. {formatMoney(o.totalAnnual, o.currency)} / year
                    </p>
                  )}

                  {overall !== null && (
                    <div className="mt-2.5">
                      <div className="flex items-baseline justify-between">
                        <span className="text-[11px] text-muted-foreground">
                          Overall fit
                        </span>
                        <span className="text-xs font-bold tabular-nums text-success">
                          {overall} / 100
                        </span>
                      </div>
                      <div
                        className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted"
                        role="progressbar"
                        aria-valuenow={overall}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      >
                        <div
                          className="h-full rounded-full bg-success"
                          style={{ width: `${Math.max(0, Math.min(100, overall))}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {topCategories.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {o.workArrangement && (
                        <span className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
                          {o.workArrangement}
                        </span>
                      )}
                      {topCategories.map((t) => (
                        <span
                          key={t.cat}
                          className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground"
                        >
                          {t.cat} {t.score}
                        </span>
                      ))}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}

        {/* Always visible, including in multiple-offer view. No cap enforced. */}
        <button
          type="button"
          onClick={handleAddOffer}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border px-4 py-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          {C.addAnotherOffer}
        </button>

        {/* Hidden entirely in the single-offer view. */}
        {isMultiple && (
          <OfferCompareTable
            categories={SCORE_CATEGORIES}
            offers={compareOffers}
            categoryColumnLabel={C.categoryColumn}
            winnerColumnLabel={C.winnerColumn}
            tieLabel={C.tieBadge}
          />
        )}

        {/*
          CR-01 — every offer against the candidate's current job. Shown from ONE
          offer upward, which is the opposite of the score table above: a single
          offer has nothing to be compared with except the job the candidate
          already has. Renders null by itself when there is no current job on
          file, so no condition is needed here.
        */}
        {baseline && (
          <CurrentJobCompareTable
            baseline={baseline}
            offers={offerFacts}
            heading={C.currentJob.heading}
            baselineColumnLabel={C.currentJob.baselineColumn}
            currencyNote={C.currentJob.currencyNote}
            rowLabels={C.currentJob.rows}
            rowHelp={C.currentJob.help}
          />
        )}
      </section>

      {/* ======================= 2 — Market intelligence ===================== */}
      <section className="mt-6">
        <SectionHeader
          index={2}
          title={C.sections.market}
          helpText={C.sectionHelp.market}
          meta="anonymised · community data"
        />

        {/*
          Populated per the FRS's "Placeholder data shown in MVP" (§5/§6.3) and
          the approved mockup. Carries a visible "Sample data" badge because
          there is no real benchmark data yet — see SAMPLE_MARKET_INTELLIGENCE.
          Swap the payload for the API response when the community pool exists;
          each card already has its own data-absent branch.
        */}
        {isMultiple && topOffer && (
          <p className="mb-3 text-xs text-muted-foreground">
            {C.marketScopeNote.replace('{offer}', topOffer.label)}
          </p>
        )}

        <MarketIntelligencePanel
          data={SAMPLE_MARKET_INTELLIGENCE}
          topOfferLabel={topOffer?.label ?? null}
        />

        <p className="mt-3 rounded-lg border border-border bg-muted/40 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
          {C.communityNote}
        </p>

        {/* -------------------- consent — interactive, per FRS --------------- */}
        <ConsentChips
          toggles={toggles}
          shareAnonymous={shareOn}
          selections={consent?.selections ?? {}}
          onShareAnonymousChange={handleShareAnonymousChange}
          onSelectionChange={handleSelectionChange}
          saving={savingConsent}
          heading={C.consentSectionLabel}
          privacyNote={C.privacyNote}
        />
      </section>
    </WizardShell>
  );
}
