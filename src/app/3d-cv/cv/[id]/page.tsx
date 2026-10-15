'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Eye, EyeOff, FileDown, FileText, Pencil, RotateCcw, ShieldCheck, Undo2, UsersRound } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import AppShell from '../../_components/AppShell';
import { useVersion } from '../../_components/useVersion';
import { Action, CheckboxRow, VerificationBadge } from '../../_components/ui';
import { safeFileName, type CvItem, type CvPlan } from '../../_lib/cv';
import { DIMENSIONS } from '../../_lib/dimensions';
import { downloadCvPdf, downloadCvWord } from '../../_lib/export';
import { useCv3d } from '../../_lib/store';

/**
 * Screen 19 — Generated CV Preview. ATS-style single column, with optional
 * source tags under every item (traceability), light editing, and a required
 * human approval before download.
 */
export default function GeneratedCvPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { plan, fallback } = useVersion(id);
  return plan ? <CvView key={plan.version.id} plan={plan} /> : fallback;
}

function CvView({ plan }: { plan: CvPlan }) {
  const { updateVersion } = useCv3d();
  const { version, doc } = plan;
  const [showSources, setShowSources] = useState(true);
  const [editing, setEditing] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const fileBase = safeFileName(doc.name, version.job.analysis.title, 'CV');

  /** Any edit withdraws approval: the candidate approves what they download. */
  const edit = (patch: Parameters<typeof updateVersion>[1]) => {
    updateVersion(version.id, { ...patch, approved: false });
    setConfirm(false);
  };

  const hiddenItems = version.hidden;

  async function pdf() {
    setBusy(true);
    try {
      await downloadCvPdf(doc, fileBase);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell tabs wide>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[hsl(var(--cv-primary-ink))]">Generated CV</p>
          <h1 className="text-2xl font-bold">{version.job.analysis.title}</h1>
          <p className="text-sm text-muted-foreground">
            {version.mode === 'verified' ? 'Verified CV · evidence-backed entries only' : 'Standard CV'}
            {version.job.analysis.company && ` · ${version.job.analysis.company}`}
          </p>
        </div>
        <div className="flex gap-2">
          <ToggleButton on={showSources} onClick={() => setShowSources((s) => !s)} icon={showSources ? Eye : EyeOff}>
            Sources
          </ToggleButton>
          <ToggleButton on={editing} onClick={() => setEditing((e) => !e)} icon={Pencil}>
            {editing ? 'Done' : 'Edit'}
          </ToggleButton>
        </div>
      </div>

      {/* The CV itself: deliberately plain, like the exported file. */}
      <article className="rounded-2xl border border-border bg-white p-5 text-[#141414] shadow-sm sm:p-8 dark:border-transparent">
        <header>
          <h2 className="text-2xl font-bold">{doc.name}</h2>
          <p className="text-sm">{doc.title}</p>
          <p className="mt-1 text-xs text-neutral-600">{doc.contact.join('  |  ')}</p>
        </header>

        <CvHeading>Professional Summary</CvHeading>
        {editing ? (
          <div>
            <textarea
              aria-label="Professional summary"
              rows={4}
              value={doc.summary}
              onChange={(e) => edit({ summaryOverride: e.target.value })}
              className="w-full rounded-lg border border-neutral-300 bg-white p-2 text-sm focus:border-[hsl(var(--cv-primary))] focus:outline-none"
            />
            {version.summaryOverride !== null && (
              <button
                type="button"
                onClick={() => edit({ summaryOverride: null })}
                className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-[hsl(251_60%_48%)]"
              >
                <RotateCcw className="h-3 w-3" aria-hidden />
                Use generated summary
              </button>
            )}
            <p className="mt-1 text-xs text-neutral-500">Keep it factual. Only claims you can back up.</p>
          </div>
        ) : (
          <p className="text-sm">{doc.summary}</p>
        )}
        {showSources && !editing && version.summaryOverride === null && (
          <SourceTag>Built from your basic profile, education, experience and matched skills</SourceTag>
        )}

        {doc.sections.map((section) => (
          <section key={section.dimension}>
            <CvHeading>{section.heading}</CvHeading>
            <div className="space-y-3">
              {section.items.map((item) => (
                <Item
                  key={item.id}
                  item={item}
                  showSources={showSources}
                  editing={editing}
                  onRemove={() => edit({ hidden: [...hiddenItems, item.id] })}
                />
              ))}
            </div>
          </section>
        ))}
      </article>

      {hiddenItems.length > 0 && (
        <div className="mt-3 rounded-xl bg-muted p-3 text-sm">
          <span className="font-semibold">{hiddenItems.length} removed from this CV.</span>{' '}
          <button
            type="button"
            onClick={() => edit({ hidden: [] })}
            className="inline-flex items-center gap-1 font-semibold text-[hsl(var(--cv-primary-ink))] hover:underline"
          >
            <Undo2 className="h-3.5 w-3.5" aria-hidden />
            Restore all
          </button>
        </div>
      )}

      {/* Approval + actions */}
      <section className="mt-6 rounded-2xl border border-border bg-card p-4">
        {version.approved ? (
          <p className="flex items-center gap-2 font-semibold text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="h-5 w-5" aria-hidden />
            Approved for download
          </p>
        ) : (
          <>
            <CheckboxRow id="approve" checked={confirm} onChange={setConfirm}>
              I have reviewed this CV. Everything in it is accurate and describes my own work.
            </CheckboxRow>
            <div className="mt-3">
              <Action
                look="primary"
                disabled={!confirm}
                onClick={() => {
                  updateVersion(version.id, { approved: true });
                  toast.success('CV approved. You can download it now.');
                }}
              >
                <ShieldCheck className="h-4 w-4" aria-hidden />
                Approve CV
              </Action>
            </div>
          </>
        )}

        <div className="mt-4 grid grid-cols-2 gap-3">
          <Action look="cta" disabled={!version.approved || busy} onClick={pdf} className="text-sm">
            <FileDown className="h-4 w-4" aria-hidden />
            Download PDF
          </Action>
          <Action look="outline" disabled={!version.approved} onClick={() => downloadCvWord(doc, fileBase)} className="text-sm">
            <FileText className="h-4 w-4" aria-hidden />
            Download Word
          </Action>
        </div>
        {!version.approved && <p className="mt-2 text-center text-xs text-muted-foreground">Approve your CV to enable downloads.</p>}
      </section>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Action look="neutral" href={`/3d-cv/readiness/${version.id}`}>
          View Readiness Report
        </Action>
        <Action look="neutral" href={`/3d-cv/downloads/${version.id}`}>
          Cover Letter & Downloads
        </Action>
      </div>
      <div className="mt-3">
        <Action
          look="outline"
          disabled={version.mentorRequested}
          onClick={() => {
            updateVersion(version.id, { mentorRequested: true });
            toast.success('Mentor review requested for this CV.');
          }}
        >
          <UsersRound className="h-4 w-4" aria-hidden />
          {version.mentorRequested ? 'Mentor Review Requested' : 'Request Mentor Review'}
        </Action>
      </div>
      <p className="mt-4 text-center text-xs text-muted-foreground">
        Want to change what goes in? <Link href="/3d-cv/dashboard" className="font-semibold underline">Update your profile</Link>, then
        generate a new version.
      </p>
    </AppShell>
  );
}

function CvHeading({ children }: { children: React.ReactNode }) {
  return <h3 className="mt-5 mb-2 border-b border-neutral-300 pb-1 text-sm font-bold uppercase tracking-wide">{children}</h3>;
}

function SourceTag({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 text-[11px] leading-snug text-[hsl(251_60%_48%)]">↳ {children}</p>;
}

function Item({
  item,
  showSources,
  editing,
  onRemove,
}: {
  item: CvItem;
  showSources: boolean;
  editing: boolean;
  onRemove: () => void;
}) {
  return (
    <div className={cn(editing && 'rounded-lg border border-dashed border-neutral-300 p-2')}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-bold">{item.heading}</p>
          {item.sub && <p className="text-xs text-neutral-600">{item.sub}</p>}
        </div>
        {editing && (
          <button type="button" onClick={onRemove} className="shrink-0 text-xs font-semibold text-rose-600 hover:underline">
            Remove
          </button>
        )}
      </div>
      {item.bullets.length > 0 && (
        <ul className="mt-1 space-y-0.5 text-sm">
          {item.bullets.map((b, i) => (
            <li key={i} className="flex gap-2">
              <span aria-hidden>•</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
      )}
      {showSources && (
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <SourceTag>
            From {DIMENSIONS[item.dimension].label}
            {item.matched ? ' · matches this job' : ''}
          </SourceTag>
          {item.dimension !== 'attributes' && (
            <span className="inline-block origin-left scale-90">
              <VerificationBadge status={item.evidence ? 'evidence-uploaded' : 'candidate-stated'} />
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function ToggleButton({
  on,
  onClick,
  icon: Icon,
  children,
}: {
  on: boolean;
  onClick: () => void;
  icon: typeof Eye;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-semibold transition',
        on
          ? 'border-[hsl(var(--cv-primary))] bg-[hsl(var(--cv-primary-soft))] text-[hsl(var(--cv-primary-ink))]'
          : 'border-border bg-card text-muted-foreground hover:text-foreground',
      )}
    >
      <Icon className="h-4 w-4" aria-hidden />
      {children}
    </button>
  );
}
