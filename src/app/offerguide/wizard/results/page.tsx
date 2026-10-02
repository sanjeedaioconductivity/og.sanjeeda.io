'use client';

import * as React from 'react';
import { ArrowRight, Check, Download, FilePlus2, Plus, RotateCcw, TriangleAlert } from 'lucide-react';
import toast from 'react-hot-toast';

import WizardShell from '../../_components/WizardShell';
import { SectionHeader } from '@/components/shared/OfferCompareTable';
import CurrentJobCompareTable, {
  type CompareOfferFacts,
} from '@/components/shared/CurrentJobCompareTable';
import { calculateCompensation } from '@/components/shared/CompensationBar';
import ScoreBreakdown from '@/components/shared/ScoreBreakdown';
import {
  annualiseSalary,
  buildCurrentJobBaseline,
  type CurrentJobBaseline,
} from '@/lib/offerguide/currentJobBaseline';

import { getScreen } from '../../_constants/screens';
import {
  buildSummaryText,
  RESULT_CATEGORIES,
  SCR010_COPY,
} from '../../_constants/scr010';
import * as api from '../../_state/api';
import { useWizardContext } from '../../_state/useWizardContext';

const SCREEN = getScreen('SCR-010');
const C = SCR010_COPY;

/**
 * Hands a generated blob to the browser as a file download.
 *
 * The object URL is revoked on a delay rather than immediately: Safari and
 * Firefox read the href asynchronously after the synthetic click, and revoking
 * while that read is still in flight aborts the save. Holding one blob for a
 * few seconds costs nothing next to a Download button that silently produces
 * no file.
 *
 * (Headless Chrome reports `downloadProgress: canceled` for blob-URL downloads
 * regardless of this delay — that is a quirk of its download manager, not this
 * code. The PDF bytes are verified directly from the blob instead.)
 */
const REVOKE_DELAY_MS = 10_000;

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.setTimeout(() => URL.revokeObjectURL(url), REVOKE_DELAY_MS);
}

/**
 * SCR-010 — Results. Zero input fields, fully read-only.
 *
 * Every number, label, strength, watch-out and next step is READ from the
 * scoring engine response. There is deliberately no threshold comparison
 * anywhere in this file — the recommendation label, the three guidance lists
 * and their empty states all arrive already derived from
 * `deriveGuidance()` server-side.
 *
 * "Next" becomes "Finish" here; this is the last screen of the flow.
 */
export default function ResultsPage() {
  const { sessionId, offerId, resolving, navigateWithContext } = useWizardContext();

  const [score, setScore] = React.useState<api.OfferScore | null>(null);
  const [offer, setOffer] = React.useState<{
    label: string | null;
    companyName: string | null;
    roleTitle: string | null;
  } | null>(null);
  const [isSingleOffer, setIsSingleOffer] = React.useState(true);
  const [loading, setLoading] = React.useState(true);
  const [downloading, setDownloading] = React.useState(false);
  // CR-01 — the current-job baseline and this offer's matching figures, so the
  // report answers "is this better than what I have?" and not only "how good is
  // this offer on its own?".
  const [baseline, setBaseline] = React.useState<CurrentJobBaseline | null>(null);
  const [offerFacts, setOfferFacts] = React.useState<CompareOfferFacts | null>(null);

  React.useEffect(() => {
    if (resolving) return;
    let cancelled = false;

    async function load() {
      if (!sessionId || !offerId) {
        navigateWithContext(getScreen('SCR-009').href, {
          session: sessionId ?? undefined,
        });
        return;
      }

      const [full, computed, session, profile] = await Promise.all([
        api.getOffer(offerId).catch(() => null),
        api.computeOfferScore(offerId).catch(() => null),
        api.getEvaluationSession(sessionId).catch(() => null),
        api.getCandidateProfile().catch(() => null),
      ]);
      if (cancelled) return;

      setOffer({
        label: full?.label ?? null,
        companyName: full?.companyName ?? null,
        roleTitle: full?.roleTitle ?? null,
      });
      setScore(computed);

      setBaseline(buildCurrentJobBaseline(profile));

      const comp = full?.compensation ?? null;
      const baseSalary = comp?.offerBaseSalary ? Number(comp.offerBaseSalary) : null;
      setOfferFacts({
        id: offerId,
        label: full?.label ?? 'This offer',
        currency: comp?.offerCurrency ?? null,
        annualBaseSalary: annualiseSalary(
          baseSalary,
          comp?.offerPayPeriod === 'Monthly' ? 'Monthly' : 'Annually',
        ),
        // Same SCR-004 bar maths SCR-009 uses, so the report's total package
        // cannot differ from the one on the compare screen.
        totalAnnual: comp
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
          : null,
        workArrangement: full?.offerWorkArrangement ?? null,
        workingHoursPerWeek: full?.workLife?.offerWorkingHours ?? null,
        commuteMinutes: full?.workLife?.offerCommuteMinutes ?? null,
      });

      // Community insight shows for a single offer only — multiple-offer
      // candidates already got comparison context on SCR-009.
      setIsSingleOffer((session?.offers?.length ?? 1) <= 1);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolving, sessionId, offerId]);

  // Keyed `category` to match ScoreBreakdown's Recharts `dataKey`.
  const categories = React.useMemo<{ category: string; score: number }[]>(
    () =>
      score
        ? RESULT_CATEGORIES.map((c) => ({
            category: c.label as string,
            score: score[c.key as keyof api.OfferScore] as number,
          }))
        : [],
    [score],
  );

  async function handleDownload() {
    if (!score || downloading) return;

    const payload = {
      offerLabel: offer?.label ?? 'Offer',
      companyName: offer?.companyName ?? null,
      roleTitle: offer?.roleTitle ?? null,
      overallScore: score.overallScore,
      recommendationLabel: score.recommendationLabel,
      categories: categories.map((c) => ({ label: c.category, score: c.score })),
      strengths: score.strengths ?? [],
      watchOuts: score.watchOuts ?? [],
      nextSteps: score.nextSteps ?? [],
    };

    // Guarded because jsPDF is fetched on demand — the chunk can fail on a bad
    // connection, and a Download button that silently does nothing is worse
    // than one that says why. The text build is the fallback so the candidate
    // still leaves with their summary rather than empty-handed.
    setDownloading(true);
    try {
      const { buildSummaryPdf, summaryPdfFilename } = await import(
        '@/lib/offerguide/buildSummaryPdf'
      );
      const blob = await buildSummaryPdf(payload);
      triggerDownload(blob, summaryPdfFilename(offer?.label ?? null));
    } catch {
      const text = buildSummaryText(payload);
      triggerDownload(
        new Blob([text], { type: 'text/plain;charset=utf-8' }),
        `offerguide-summary-${(offer?.label ?? 'offer')
          .toLowerCase()
          .replace(/\s+/g, '-')}.txt`,
      );
      toast.error('Could not build the PDF — downloaded a text summary instead.');
    } finally {
      setDownloading(false);
    }
  }

  if (resolving || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">Calculating your results…</p>
      </div>
    );
  }

  if (!score) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <p className="max-w-sm text-center text-sm text-muted-foreground">
          We couldn&apos;t calculate results for this offer yet. Go back and make
          sure the offer&apos;s compensation details are saved.
        </p>
      </div>
    );
  }

  const strengths = score.strengths ?? [];
  const watchOuts = score.watchOuts ?? [];
  const nextSteps = score.nextSteps ?? [];

  return (
    <WizardShell
      screen={SCREEN}
      introPurpose={C.purpose}
      introRequirementNote={C.requirementNote}
      onBack={() =>
        navigateWithContext(getScreen('SCR-009').href, {
          session: sessionId ?? undefined,
          offer: offerId ?? undefined,
        })
      }
      // Last screen of the flow — "Next →" becomes "Finish".
      onNext={() => {
        toast.success('Evaluation complete.');
        navigateWithContext('/offerguide');
      }}
      nextLabel={C.finishLabel}
    >
      {/* ============================ 1 — Offer fit score ==================== */}
      <section>
        <SectionHeader
          index={1}
          title={C.sections.fitScore}
          helpText={C.sectionHelp.fitScore}
          meta={
            [offer?.companyName, offer?.label].filter(Boolean).join(' · ') ||
            undefined
          }
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="flex items-baseline gap-1.5">
              <span className="text-4xl font-bold tabular-nums text-primary">
                {score.overallScore}
              </span>
              <span className="text-sm text-muted-foreground">/ 100</span>
            </p>
            <div
              className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-valuenow={score.overallScore}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full rounded-full bg-success"
                style={{
                  width: `${Math.max(0, Math.min(100, score.overallScore))}%`,
                }}
              />
            </div>
            <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
              {C.scoreHint}
            </p>
          </div>

          {/* Label comes straight from the engine — never recomputed here. */}
          <div className="rounded-lg border border-success bg-success-subtle p-4">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold text-success">
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
              {C.recommendationEyebrow}
            </p>
            <p className="mt-1.5 text-base font-bold leading-snug">
              {score.recommendationLabel}
            </p>
            {(offer?.companyName || offer?.roleTitle) && (
              <p className="mt-1 text-[11px] text-muted-foreground">
                {[offer?.companyName, offer?.roleTitle].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ============================ 2 — Category scores ==================== */}
      <section className="mt-6">
        <SectionHeader
          index={2}
          title={C.sections.categories}
          helpText={C.sectionHelp.categories}
        />
        <ScoreBreakdown scores={categories} infoNote={C.categoriesInfoNote} />
      </section>

      {/* =================== 3 — Compared with your current job ============== */}
      {/*
        CR-01. Facts against facts — no score is derived for the current job (see
        currentJobBaseline.ts for why), so this sits after the category scores
        rather than inside them. The table hides itself when there is no current
        job on file, which is why the empty-state line is handled here instead.
      */}
      <section className="mt-6">
        <SectionHeader
          index={3}
          title={C.sections.currentJob}
          helpText={C.sectionHelp.currentJob}
        />
        {baseline?.hasData && offerFacts ? (
          <CurrentJobCompareTable
            baseline={baseline}
            offers={[offerFacts]}
            baselineColumnLabel={C.currentJob.baselineColumn}
            currencyNote={C.currentJob.currencyNote}
            rowLabels={C.currentJob.rows}
            rowHelp={C.currentJob.help}
          />
        ) : (
          <p className="rounded-lg border border-border bg-muted/40 px-3.5 py-2.5 text-xs leading-relaxed text-muted-foreground">
            {C.currentJob.noBaseline}
          </p>
        )}
      </section>

      {/* ==================== 4 — Strengths & watch-outs ===================== */}
      <section className="mt-6">
        <SectionHeader
          index={4}
          title={C.sections.strengthsWatchOuts}
          helpText={C.sectionHelp.strengthsWatchOuts}
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-card p-3.5">
            <h3 className="flex items-center gap-1.5 text-xs font-semibold text-success">
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
              {C.strengthsTitle}
            </h3>
            {strengths.length === 0 ? (
              <p className="mt-2 text-xs text-muted-foreground">
                {C.strengthsEmpty}
              </p>
            ) : (
              <ul className="mt-2 space-y-1.5">
                {strengths.map((s) => (
                  <li key={s.category} className="flex items-center gap-2 text-xs">
                    <Check
                      className="h-3 w-3 shrink-0 text-success"
                      aria-hidden="true"
                    />
                    <span>
                      {s.category}: {s.score} / 100
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-lg border border-warning/40 bg-warning-subtle p-3.5">
            <h3 className="flex items-center gap-1.5 text-xs font-semibold text-warning">
              <TriangleAlert className="h-3.5 w-3.5" aria-hidden="true" />
              {C.watchOutsTitle}
            </h3>
            {watchOuts.length === 0 ? (
              <p className="mt-2 text-xs text-muted-foreground">
                {C.watchOutsEmpty}
              </p>
            ) : (
              <ul className="mt-2 space-y-1.5">
                {watchOuts.map((w) => (
                  <li key={w} className="flex items-start gap-2 text-xs">
                    <TriangleAlert
                      className="mt-0.5 h-3 w-3 shrink-0 text-warning"
                      aria-hidden="true"
                    />
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {/* ======================= 5 — Suggested next steps ==================== */}
      <section className="mt-6">
        <SectionHeader
          index={5}
          title={C.sections.nextSteps}
          helpText={C.sectionHelp.nextSteps}
        />
        <ul className="space-y-2">
          {nextSteps.map((step) => (
            <li key={step}>
              <div className="flex w-full items-center gap-2.5 rounded-lg border border-border bg-card px-3.5 py-2.5 text-xs font-medium">
                <ArrowRight
                  className="h-3.5 w-3.5 shrink-0 text-primary"
                  aria-hidden="true"
                />
                {step}
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* ===================== 6 — Community insight (single) ================ */}
      {isSingleOffer && (
        <section className="mt-6">
          <SectionHeader
            index={6}
            title={C.sections.community}
            helpText={C.sectionHelp.community}
            meta={C.communityMeta}
          />
          <div className="rounded-lg border border-border bg-card p-3.5">
            <p className="text-xs font-semibold">{C.communityTitle}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {C.communityBody}
            </p>
          </div>
        </section>
      )}

      {/* ============================== action strip ========================= */}
      <div className="mt-6 flex flex-wrap gap-2">
        {/* Disabled while building: the PDF chunk has to download and render,
            which is long enough that a second click would produce a second file. */}
        <button
          type="button"
          onClick={handleDownload}
          disabled={downloading}
          aria-busy={downloading}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Download className="h-3.5 w-3.5" aria-hidden="true" />
          {downloading ? 'Preparing PDF…' : C.actions.download}
        </button>

        <button
          type="button"
          onClick={() =>
            // `offer: 'new'` is the explicit create intent SCR-003 looks for;
            // without it that screen edits the latest offer — see useWizardContext.
            navigateWithContext(getScreen('SCR-003').href, {
              session: sessionId ?? undefined,
              offer: 'new',
            })
          }
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-xs font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          {C.actions.addOffer}
        </button>

        <button
          type="button"
          onClick={() => navigateWithContext(getScreen('SCR-001').href)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-xs font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
          {C.actions.revisit}
        </button>

        <button
          type="button"
          onClick={() =>
            // A fresh session, not another offer on this one. `session: 'new'`
            // keeps SCR-002 from locking onto the current session, and the
            // profile step is kept (it is reused across evaluations).
            navigateWithContext(getScreen('SCR-001').href, {
              session: 'new',
              offer: null,
            })
          }
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-xs font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <FilePlus2 className="h-3.5 w-3.5" aria-hidden="true" />
          {C.actions.startNew}
        </button>
      </div>

      {/* ============================ footer disclaimer ====================== */}
      <div className="mt-4 rounded-lg border border-border bg-muted/40 px-4 py-3 text-center">
        <p className="text-xs font-semibold">{C.disclaimerPrimary}</p>
        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
          {C.disclaimerSecondary}
        </p>
      </div>
    </WizardShell>
  );
}
