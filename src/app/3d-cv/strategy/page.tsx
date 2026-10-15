'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, EyeOff, ShieldCheck, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import AppShell from '../_components/AppShell';
import { Action, PageHeading, WarningNote } from '../_components/ui';
import { FREE_VERSION_LIMIT, isExpired, makeVersion, planCv } from '../_lib/cv';
import { careerStageLabel, DIMENSIONS } from '../_lib/dimensions';
import type { CvMode } from '../_lib/matching';
import { snapshotOf, stageOf, useCv3d } from '../_lib/store';

/** Screen 18 — CV Strategy Preview: how the CV will be tailored, before it is generated. */
export default function StrategyPage() {
  const router = useRouter();
  const { state, hydrated, createVersion } = useCv3d();
  const [mode, setMode] = useState<CvMode>('standard');
  const job = state.currentJob;

  const plan = useMemo(() => {
    if (!job) return null;
    return planCv(makeVersion({ id: 'preview', job, mode, stage: stageOf(state), profile: snapshotOf(state) }));
  }, [job, mode, state]);

  if (!hydrated) return <AppShell tabs>{null}</AppShell>;
  if (!job || !plan) {
    return (
      <AppShell tabs>
        <PageHeading title="No job selected" subtitle="Add a job description first so we can plan your CV." />
        <Action look="primary" href="/3d-cv/job">
          Add Job Description
        </Action>
      </AppShell>
    );
  }

  const active = state.versions.filter((v) => !isExpired(v)).length;
  const atLimit = active >= FREE_VERSION_LIMIT;
  const stage = stageOf(state);
  const { match, doc, hiddenSections } = plan;
  const included = new Set(doc.sections.map((s) => s.dimension));

  return (
    <AppShell tabs>
      <PageHeading
        title="Your CV Strategy"
        subtitle="Here is how we will tailor your CV for this job. Nothing is added that isn't in your profile."
      />

      <section className="rounded-2xl border border-border bg-card p-4">
        <p className="text-xs font-semibold text-muted-foreground">Target job</p>
        <p className="text-lg font-bold">{job.analysis.title}</p>
        {job.analysis.company && <p className="text-sm text-muted-foreground">{job.analysis.company}</p>}
        <p className="mt-2 text-sm">
          Career stage: <span className="font-semibold">{careerStageLabel(stage)}</span>
        </p>
      </section>

      <h2 className="mt-6 mb-2 font-bold">CV mode</h2>
      <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="CV mode">
        {(
          [
            ['standard', 'Standard CV', 'Uses evidence-backed and candidate-stated entries, worded carefully.', null],
            ['verified', 'Verified CV', 'Uses only entries with evidence. Stronger, but may be shorter.', 'Paid plan'],
          ] as const
        ).map(([id, title, body, tag]) => (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={mode === id}
            onClick={() => setMode(id)}
            className={cn(
              'rounded-2xl border p-4 text-left transition',
              mode === id ? 'border-[hsl(var(--cv-primary))] bg-[hsl(var(--cv-primary-soft))]' : 'border-border bg-card hover:border-[hsl(var(--cv-primary)/0.5)]',
            )}
          >
            <span className="flex items-center gap-2 font-semibold">
              {id === 'verified' && <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-300" aria-hidden />}
              {title}
              {tag && (
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                  {tag}
                </span>
              )}
            </span>
            <span className="mt-1 block text-sm text-muted-foreground">{body}</span>
          </button>
        ))}
      </div>
      {mode === 'verified' && (
        <p className="mt-2 text-xs text-muted-foreground">Available to try in this prototype. It becomes part of the paid plan.</p>
      )}

      <h2 className="mt-6 mb-2 font-bold">Matched strengths ({match.matched.length})</h2>
      {match.matched.length ? (
        <ul className="flex flex-wrap gap-1.5">
          {match.matched.map((m) => (
            <li
              key={m.term.term}
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold',
                m.proven
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                  : 'bg-orange-50 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300',
              )}
              title={m.proven ? 'Backed by evidence' : 'Candidate-stated'}
            >
              {m.proven && <Check className="h-3 w-3" aria-hidden />}
              {m.term.term}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No direct matches yet. The readiness report will show where to build.</p>
      )}
      <p className="mt-2 text-xs text-muted-foreground">Green: backed by evidence. Orange: candidate-stated.</p>

      <h2 className="mt-6 mb-2 font-bold">Section order</h2>
      <ol className="space-y-1.5">
        {doc.sections.map((s, i) => (
          <li key={s.dimension} className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2 text-sm">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[hsl(var(--cv-primary))] text-xs font-bold text-white">{i + 1}</span>
            <span className="flex-1 font-medium">{s.heading}</span>
            <span className="text-xs text-muted-foreground">
              {s.items.length} {s.items.length === 1 ? 'item' : 'items'}
            </span>
          </li>
        ))}
      </ol>

      {hiddenSections.length > 0 && (
        <>
          <h2 className="mt-6 mb-2 font-bold">Sections hidden to keep the CV sharp</h2>
          <ul className="space-y-1.5">
            {hiddenSections.map((h) => (
              <li key={h.dimension} className="flex items-center gap-3 rounded-xl bg-muted px-3 py-2 text-sm">
                <EyeOff className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                <span className="flex-1">{DIMENSIONS[h.dimension].label}</span>
                <span className="text-right text-xs text-muted-foreground">{h.reason}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      {match.gaps.length > 0 && (
        <>
          <h2 className="mt-6 mb-1 font-bold">Development areas</h2>
          <p className="mb-2 text-xs text-muted-foreground">These go in your readiness report, not your CV.</p>
          <ul className="flex flex-wrap gap-1.5">
            {match.gaps.map((g) => (
              <li key={g.term} className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
                {g.term}
                {!g.required && <span className="text-muted-foreground"> (preferred)</span>}
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="mt-8 space-y-3">
        {atLimit && (
          <WarningNote>
            You have used all {FREE_VERSION_LIMIT} free CV versions. Delete one in Downloads or upgrade to keep more.
          </WarningNote>
        )}
        <Action
          look="cta"
          disabled={atLimit || included.size === 0}
          onClick={() => router.push(`/3d-cv/cv/${createVersion(mode)}`)}
        >
          <Sparkles className="h-4 w-4" aria-hidden />
          Generate My CV
        </Action>
        <p className="text-center text-xs text-muted-foreground">
          Free plan: {Math.min(active, FREE_VERSION_LIMIT)} of {FREE_VERSION_LIMIT} versions used. Versions expire after 3 weeks.
        </p>
        <Action look="neutral" href="/3d-cv/job">
          Change Job Description
        </Action>
      </div>
    </AppShell>
  );
}
