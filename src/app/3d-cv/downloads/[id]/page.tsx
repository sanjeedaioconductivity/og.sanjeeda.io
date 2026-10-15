'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { FileDown, FileText, RotateCcw, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import AppShell from '../../_components/AppShell';
import { useVersion } from '../../_components/useVersion';
import { Action, Field, PageHeading, TextInput, WarningNote } from '../../_components/ui';
import { buildCoverLetter, isExpired, safeFileName, type CvPlan } from '../../_lib/cv';
import { downloadCvPdf, downloadCvWord, downloadLetterPdf, downloadLetterWord } from '../../_lib/export';
import { useCv3d } from '../../_lib/store';
import PlanBox from '../../_components/PlanBox';

/** Screen 21 — Cover letter, downloads and version naming for one CV version. */
export default function VersionDownloadsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { plan, fallback } = useVersion(id);
  return plan ? <Downloads key={plan.version.id} plan={plan} /> : fallback;
}

function Downloads({ plan }: { plan: CvPlan }) {
  const { state, updateVersion } = useCv3d();
  const { version, doc } = plan;
  const generated = buildCoverLetter(plan);
  const letter = version.coverLetterOverride ?? generated;
  const [name, setName] = useState(version.name);
  const [busy, setBusy] = useState<string | null>(null);
  const base = safeFileName(doc.name, version.job.analysis.title);
  const approved = version.approved;

  async function run(key: string, fn: () => void | Promise<void>) {
    setBusy(key);
    try {
      await fn();
    } finally {
      setBusy(null);
    }
  }

  return (
    <AppShell tabs>
      <PageHeading title="Cover Letter & Downloads" subtitle={`${version.job.analysis.title}${version.job.analysis.company ? ` · ${version.job.analysis.company}` : ''}`} />

      <section className="rounded-2xl border border-border bg-card p-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="font-bold">Cover letter</h2>
          {version.coverLetterOverride !== null && (
            <button
              type="button"
              onClick={() => updateVersion(version.id, { coverLetterOverride: null })}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[hsl(var(--cv-primary-ink))] hover:underline"
            >
              <RotateCcw className="h-3 w-3" aria-hidden />
              Use generated letter
            </button>
          )}
        </div>
        <textarea
          aria-label="Cover letter"
          rows={16}
          value={letter}
          onChange={(e) => updateVersion(version.id, { coverLetterOverride: e.target.value })}
          className="w-full rounded-lg border border-input bg-white p-3 font-serif text-sm leading-relaxed text-[#141414] focus:border-[hsl(var(--cv-primary))] focus:outline-none"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Written only from your profile. Edit freely; keep every claim true.
        </p>
      </section>

      <section className="mt-4 rounded-2xl border border-border bg-card p-4">
        <h2 className="mb-3 font-bold">Downloads</h2>
        {!approved && (
          <div className="mb-3">
            <WarningNote>
              Please review and approve your CV before downloading.{' '}
              <Link href={`/3d-cv/cv/${version.id}`} className="font-semibold underline">
                Review CV
              </Link>
            </WarningNote>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Action look="cta" className="text-sm" disabled={!approved || busy !== null} onClick={() => run('cv-pdf', () => downloadCvPdf(doc, `${base}-CV`))}>
            <FileDown className="h-4 w-4" aria-hidden />
            CV as PDF
          </Action>
          <Action look="outline" className="text-sm" disabled={!approved} onClick={() => downloadCvWord(doc, `${base}-CV`)}>
            <FileText className="h-4 w-4" aria-hidden />
            CV as Word
          </Action>
          <Action
            look="outline"
            className="text-sm"
            disabled={!approved || busy !== null}
            onClick={() => run('cl-pdf', () => downloadLetterPdf(letter, `${base}-Cover-Letter`))}
          >
            <FileDown className="h-4 w-4" aria-hidden />
            Letter as PDF
          </Action>
          <Action look="outline" className="text-sm" disabled={!approved} onClick={() => downloadLetterWord(letter, `${base}-Cover-Letter`)}>
            <FileText className="h-4 w-4" aria-hidden />
            Letter as Word
          </Action>
        </div>
      </section>

      <section className="mt-4 rounded-2xl border border-border bg-card p-4">
        <h2 className="mb-3 font-bold">Save version</h2>
        <form
          className="flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) return;
            updateVersion(version.id, { name: name.trim() });
            toast.success('Version saved.');
          }}
        >
          <div className="flex-1">
            <Field id="version-name" label="Version name">
              <TextInput id="version-name" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} />
            </Field>
          </div>
          <button type="submit" className="inline-flex h-[42px] items-center gap-1 rounded-lg bg-[hsl(var(--cv-primary))] px-3 text-sm font-semibold text-white hover:brightness-110">
            <Save className="h-4 w-4" aria-hidden />
            Save
          </button>
        </form>
        {version.expiresAt && (
          <p className="mt-2 text-xs text-muted-foreground">
            Free version: available until {new Date(version.expiresAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}.
          </p>
        )}
      </section>

      <div className="mt-4">
        <PlanBox used={state.versions.filter((v) => !isExpired(v)).length} />
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Action look="neutral" href={`/3d-cv/readiness/${version.id}`}>
          Readiness Report
        </Action>
        <Action look="neutral" href="/3d-cv/downloads">
          All My CVs
        </Action>
      </div>
    </AppShell>
  );
}
