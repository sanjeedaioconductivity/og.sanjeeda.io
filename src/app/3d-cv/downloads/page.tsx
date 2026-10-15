'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Clock, Pencil, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import AppShell from '../_components/AppShell';
import PlanBox from '../_components/PlanBox';
import { Action, PageHeading, TextInput } from '../_components/ui';
import { isExpired, type CvVersion } from '../_lib/cv';
import { useCv3d } from '../_lib/store';

/** CVs tab — every generated version, with the free plan's 3-version / 3-week rules. */
export default function VersionsPage() {
  const { state, hydrated } = useCv3d();
  if (!hydrated) return <AppShell tabs>{null}</AppShell>;
  const versions = state.versions;
  const active = versions.filter((v) => !isExpired(v)).length;

  return (
    <AppShell tabs>
      <PageHeading
        title="My CVs"
        subtitle="Every job-specific CV you have generated. Open one to review, download or get its cover letter."
        action={
          <Link
            href="/3d-cv/job"
            className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-[hsl(var(--cv-primary))] px-3 py-1.5 text-sm font-semibold text-[hsl(var(--cv-primary-ink))] hover:bg-[hsl(var(--cv-primary-soft))]"
          >
            <Plus className="h-4 w-4" aria-hidden />
            New CV
          </Link>
        }
      />

      <PlanBox used={active} />

      {versions.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-border bg-card px-4 py-10 text-center">
          <p className="text-base font-semibold">No CVs yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Add a job description to generate your first tailored CV.</p>
          <div className="mx-auto mt-4 max-w-xs">
            <Action look="primary" href="/3d-cv/job">
              Add a Job Description
            </Action>
          </div>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {versions.map((v) => (
            <li key={v.id}>
              <VersionCard version={v} />
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}

function daysLeft(v: CvVersion): number {
  return v.expiresAt ? Math.max(0, Math.ceil((new Date(v.expiresAt).getTime() - Date.now()) / 86_400_000)) : Infinity;
}

function VersionCard({ version }: { version: CvVersion }) {
  const { updateVersion, deleteVersion } = useCv3d();
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(version.name);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const expired = isExpired(version);
  const left = daysLeft(version);

  return (
    <div className={cn('rounded-2xl border border-border bg-card p-4', expired && 'opacity-70')}>
      {renaming ? (
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) return;
            updateVersion(version.id, { name: name.trim() });
            setRenaming(false);
          }}
        >
          <TextInput aria-label="Version name" value={name} onChange={(e) => setName(e.target.value)} autoFocus maxLength={80} />
          <button type="submit" className="shrink-0 rounded-lg bg-[hsl(var(--cv-primary))] px-3 text-sm font-semibold text-white">
            Save
          </button>
        </form>
      ) : (
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="truncate text-base font-bold">{version.name}</h2>
            <p className="text-xs text-muted-foreground">
              {version.job.analysis.title}
              {version.job.analysis.company && ` · ${version.job.analysis.company}`} ·{' '}
              {version.mode === 'verified' ? 'Verified' : 'Standard'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setRenaming(true)}
            aria-label={`Rename ${version.name}`}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Pencil className="h-4 w-4" aria-hidden />
          </button>
        </div>
      )}

      <div className="mt-2 flex flex-wrap gap-2 text-xs">
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-semibold',
            expired
              ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300'
              : left <= 5
                ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'
                : 'bg-muted text-muted-foreground',
          )}
        >
          <Clock className="h-3 w-3" aria-hidden />
          {expired ? 'Expired' : `Expires in ${left} ${left === 1 ? 'day' : 'days'}`}
        </span>
        {version.approved && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
            <CheckCircle2 className="h-3 w-3" aria-hidden />
            Approved
          </span>
        )}
      </div>

      {!expired && (
        <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
          <Link href={`/3d-cv/cv/${version.id}`} className="rounded-lg border border-border py-2 text-center font-semibold hover:bg-muted">
            CV
          </Link>
          <Link href={`/3d-cv/readiness/${version.id}`} className="rounded-lg border border-border py-2 text-center font-semibold hover:bg-muted">
            Readiness
          </Link>
          <Link href={`/3d-cv/downloads/${version.id}`} className="rounded-lg border border-border py-2 text-center font-semibold hover:bg-muted">
            Downloads
          </Link>
        </div>
      )}

      <div className="mt-3 text-right">
        {confirmDelete ? (
          <span className="inline-flex flex-wrap items-center justify-end gap-3 text-sm">
            Delete this version?
            <button
              type="button"
              onClick={() => {
                deleteVersion(version.id);
                toast.success('CV version deleted.');
              }}
              className="font-semibold text-rose-600 hover:underline dark:text-rose-300"
            >
              Yes, delete
            </button>
            <button type="button" onClick={() => setConfirmDelete(false)} className="font-semibold text-muted-foreground hover:underline">
              Keep it
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:underline dark:text-rose-300"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden />
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
