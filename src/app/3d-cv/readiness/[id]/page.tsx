'use client';

import { use } from 'react';
import Link from 'next/link';
import { BookOpen, CheckCircle2, GraduationCap, MessageSquareText, Paperclip, Sprout, UsersRound } from 'lucide-react';
import toast from 'react-hot-toast';
import AppShell from '../../_components/AppShell';
import ProgressRing from '../../_components/ProgressRing';
import { useVersion } from '../../_components/useVersion';
import { Action, VerificationBadge } from '../../_components/ui';
import { buildReadiness, type CvPlan } from '../../_lib/cv';
import { DIMENSIONS } from '../../_lib/dimensions';
import { useCv3d } from '../../_lib/store';

/**
 * Screen 20 — Readiness Report. Role fit and what to build next. Tone is
 * developmental: gaps are "areas to develop", never failures.
 */
export default function ReadinessPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { plan, fallback } = useVersion(id);
  return plan ? <Report plan={plan} /> : fallback;
}

function Card({ icon: Icon, title, children }: { icon: typeof BookOpen; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-4">
      <h2 className="mb-3 flex items-center gap-2 font-bold">
        <Icon className="h-5 w-5 text-[hsl(var(--cv-primary-ink))]" aria-hidden />
        {title}
      </h2>
      {children}
    </section>
  );
}

function Report({ plan }: { plan: CvPlan }) {
  const { updateVersion } = useCv3d();
  const { version, match } = plan;
  const r = buildReadiness(plan);
  const { experience, education } = match;

  return (
    <AppShell tabs>
      <p className="text-xs font-semibold uppercase tracking-wide text-[hsl(var(--cv-primary-ink))]">Readiness Report</p>
      <h1 className="text-2xl font-bold">{version.job.analysis.title}</h1>
      {version.job.analysis.company && <p className="text-sm text-muted-foreground">{version.job.analysis.company}</p>}

      <div className="my-6">
        {r.readiness === null ? (
          <p className="text-sm text-muted-foreground">The job description had too little detail to score readiness.</p>
        ) : (
          <ProgressRing
            percent={r.readiness}
            label="Job Readiness"
            note={
              r.readiness >= 75
                ? 'A strong fit. Polish the points below before you apply.'
                : r.readiness >= 50
                  ? 'A good base. A few focused steps will raise your readiness.'
                  : 'An early fit. Use the plan below to build towards this role.'
            }
          />
        )}
      </div>

      <div className="space-y-4">
        <Card icon={CheckCircle2} title={`Matched strengths (${r.strengths.length})`}>
          {r.strengths.length ? (
            <ul className="space-y-2">
              {r.strengths.map((m) => (
                <li key={m.term.term} className="rounded-xl bg-muted p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold">
                      {m.term.term}
                      {!m.term.required && <span className="font-normal text-muted-foreground"> (preferred)</span>}
                    </span>
                    <VerificationBadge status={m.proven ? 'evidence-uploaded' : 'candidate-stated'} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Shown by {m.sources.slice(0, 3).map((s) => s.label).join(', ')}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No direct matches yet. The areas below are where to start.</p>
          )}
          <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <div className="rounded-xl border border-border p-3">
              <dt className="text-xs font-semibold text-muted-foreground">Education</dt>
              <dd>
                {!education.asked ? 'Not specified by the job' : education.met ? `Meets: ${education.best}` : `Asked: ${education.asked}`}
              </dd>
            </div>
            <div className="rounded-xl border border-border p-3">
              <dt className="text-xs font-semibold text-muted-foreground">Experience</dt>
              <dd>
                {experience.years === null
                  ? 'Not specified by the job'
                  : experience.years === 0
                    ? 'Entry level: fits'
                    : `${experience.years}+ years asked · you have ${Math.floor(experience.months / 12)}y ${experience.months % 12}m`}
              </dd>
            </div>
          </dl>
        </Card>

        {(r.knowledgeToDevelop.length > 0 || r.skillGaps.length > 0 || r.developmentNotes.length > 0) && (
          <Card icon={Sprout} title="Areas to develop">
            {r.knowledgeToDevelop.length > 0 && (
              <>
                <p className="mb-1 text-xs font-semibold text-muted-foreground">Knowledge to develop</p>
                <Chips items={r.knowledgeToDevelop.map((g) => g.term)} />
              </>
            )}
            {r.skillGaps.length > 0 && (
              <>
                <p className="mt-3 mb-1 text-xs font-semibold text-muted-foreground">Skills and tools to build</p>
                <Chips items={r.skillGaps.map((g) => g.term)} />
              </>
            )}
            {r.developmentNotes.length > 0 && (
              <ul className="mt-3 space-y-2 text-sm">
                {r.developmentNotes.map((n, i) => (
                  <li key={i} className="rounded-xl bg-muted p-3">
                    {n}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}

        {r.evidenceMissing.length > 0 && (
          <Card icon={Paperclip} title="Add proof to strengthen these">
            <p className="mb-2 text-sm text-muted-foreground">
              These match the job but have no evidence yet. Adding proof raises your readiness and unlocks them for a Verified CV.
            </p>
            <ul className="space-y-1.5 text-sm">
              {r.evidenceMissing.map((m) => {
                const src = m.sources[0];
                return (
                  <li key={m.term.term} className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2">
                    <span>
                      <span className="font-semibold">{m.term.term}</span>
                      <span className="text-muted-foreground"> · {src.label}</span>
                    </span>
                    <Link href={`/3d-cv/profile/${src.dimension}`} className="shrink-0 text-xs font-semibold text-[hsl(var(--cv-primary-ink))] hover:underline">
                      Open {DIMENSIONS[src.dimension].label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Card>
        )}

        {r.interviewPoints.length > 0 && (
          <Card icon={MessageSquareText} title="Interview preparation">
            <ol className="space-y-2 text-sm">
              {r.interviewPoints.map((p, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--cv-primary-soft))] text-xs font-bold text-[hsl(var(--cv-primary-ink))]">
                    {i + 1}
                  </span>
                  <span className="pt-0.5">{p}</span>
                </li>
              ))}
            </ol>
          </Card>
        )}

        {r.trainingTopics.length > 0 && (
          <Card icon={GraduationCap} title="Training recommendations">
            <p className="mb-2 text-sm text-muted-foreground">Sanjeeda can help you build these through its training programs:</p>
            <Chips items={r.trainingTopics} />
            <div className="mt-3">
              <Action
                look="outline"
                onClick={() => toast.success('Thanks! The Sanjeeda team will share matching training options.')}
              >
                Ask Sanjeeda About Training
              </Action>
            </div>
          </Card>
        )}

        <Card icon={UsersRound} title="Mentor support">
          <p className="text-sm text-muted-foreground">
            {r.mentorRecommended
              ? 'We recommend a session with a Sanjeeda mentor to close the key gaps and prepare for interviews.'
              : 'You are in good shape. A mentor can still help you rehearse interviews for this role.'}
          </p>
          <div className="mt-3">
            <Action
              look={r.mentorRecommended ? 'primary' : 'outline'}
              disabled={version.mentorRequested}
              onClick={() => {
                updateVersion(version.id, { mentorRequested: true });
                toast.success('Mentor support requested.');
              }}
            >
              {version.mentorRequested ? 'Mentor Support Requested' : 'Request Mentor Support'}
            </Action>
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Action look="neutral" href={`/3d-cv/cv/${version.id}`}>
          Back to CV
        </Action>
        <Action look="cta" href={`/3d-cv/downloads/${version.id}`}>
          Cover Letter & Downloads
        </Action>
      </div>
    </AppShell>
  );
}

function Chips({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {items.map((t) => (
        <li key={t} className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-500/15 dark:text-amber-200">
          {t}
        </li>
      ))}
    </ul>
  );
}
