'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Briefcase, ClipboardPaste, FileUp, Link2, Lock, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import AppShell from '../_components/AppShell';
import { Action, Field, PageHeading, TextInput, WarningNote } from '../_components/ui';
import { MIN_COMPLETION_FOR_CV } from '../_lib/dimensions';
import { newId } from '../_lib/entries';
import { analyzeJob, SAVED_ROLES, type JobAnalysis, type JobDescription, type JobTerm, type TermKind } from '../_lib/jobs';
import { profileTerms } from '../_lib/matching';
import { useCv3d } from '../_lib/store';

/** Screen 17 — Job Description input and extraction. */

type Source = JobDescription['source'];
const SOURCES: { id: Source; label: string; icon: typeof ClipboardPaste }[] = [
  { id: 'paste', label: 'Paste', icon: ClipboardPaste },
  { id: 'file', label: 'Upload', icon: FileUp },
  { id: 'link', label: 'Job link', icon: Link2 },
  { id: 'saved', label: 'Saved roles', icon: Briefcase },
];
const MIN_CHARS = 80;

export default function JobPage() {
  const { hydrated, completion } = useCv3d();
  if (!hydrated) return <AppShell tabs>{null}</AppShell>;
  if (completion < MIN_COMPLETION_FOR_CV) {
    return (
      <AppShell tabs>
        <PageHeading title="Add a Job Description" subtitle="Tell us the job and we will tailor your CV to it." />
        <WarningNote>
          Your profile is {completion}% complete. Please reach {MIN_COMPLETION_FOR_CV}% before generating a job-specific
          CV, or request mentor support.
        </WarningNote>
        <div className="mt-6">
          <Action look="cta" href="/3d-cv/dashboard">
            <Lock className="h-4 w-4" aria-hidden />
            Complete My Profile
          </Action>
        </div>
      </AppShell>
    );
  }
  return <JobForm />;
}

function JobForm() {
  const router = useRouter();
  const { state, setJob } = useCv3d();
  const existing = state.currentJob;
  const [source, setSource] = useState<Source>(existing?.source ?? 'paste');
  const [text, setText] = useState(existing?.text ?? '');
  const [link, setLink] = useState(existing?.link ?? '');
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [analysis, setAnalysis] = useState<JobAnalysis | null>(existing?.analysis ?? null);

  function analyze() {
    if (text.trim().length < MIN_CHARS) {
      setError(`Please add the full job description (at least ${MIN_CHARS} characters) so we can read its requirements.`);
      return;
    }
    if (source === 'link' && link && !/^(https?:\/\/)?[\w-]+(\.[\w-]+)+(\/\S*)?$/i.test(link.trim())) {
      setError('That job link does not look valid.');
      return;
    }
    setError('');
    setAnalysis(analyzeJob(text, profileTerms(state.entries)));
  }

  async function readFile(file: File | undefined) {
    if (!file) return;
    setFileName(file.name);
    if (/\.txt$/i.test(file.name) && file.size < 200_000) {
      setText(await file.text());
      setError('');
    } else {
      setError(
        'This prototype can read .txt files only. Please open the file and paste its text in the box below; PDF and Word reading comes with the backend.',
      );
    }
  }

  function proceed() {
    if (!analysis) return;
    setJob({
      id: existing && existing.text === text ? existing.id : newId(),
      source,
      link: source === 'link' ? link.trim() : undefined,
      text,
      analysis,
    });
    router.push('/3d-cv/strategy');
  }

  return (
    <AppShell tabs>
      <PageHeading
        title={
          <>
            Add the Job
            <br />
            You Want
          </>
        }
        subtitle="Paste or upload the job description. We will read its requirements and tailor your CV to it."
      />

      <div role="tablist" aria-label="Job description source" className="grid grid-cols-4 gap-2">
        {SOURCES.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            role="tab"
            type="button"
            aria-selected={source === id}
            onClick={() => {
              setSource(id);
              setError('');
            }}
            className={cn(
              'flex flex-col items-center gap-1 rounded-xl border px-2 py-3 text-xs font-semibold transition',
              source === id
                ? 'border-[hsl(var(--cv-primary))] bg-[hsl(var(--cv-primary-soft))] text-[hsl(var(--cv-primary-ink))]'
                : 'border-border bg-card text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="h-5 w-5" aria-hidden />
            {label}
          </button>
        ))}
      </div>

      <div className="mt-5 space-y-4">
        {source === 'file' && (
          <label className="flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed border-[hsl(var(--cv-primary)/0.45)] bg-card px-4 py-6 text-center text-sm">
            <FileUp className="h-8 w-8 text-[hsl(var(--cv-primary-ink))]" aria-hidden />
            <span className="mt-2 font-semibold">{fileName || 'Choose a job description file'}</span>
            <span className="text-xs text-muted-foreground">.txt is read automatically</span>
            <input type="file" accept=".txt,.pdf,.doc,.docx" className="sr-only" onChange={(e) => readFile(e.target.files?.[0])} />
          </label>
        )}

        {source === 'link' && (
          <Field id="job-link" label="Job link">
            <TextInput id="job-link" inputMode="url" placeholder="https://…" value={link} onChange={(e) => setLink(e.target.value)} />
            <p className="text-xs text-muted-foreground">
              We keep the link with your CV version. In this prototype, also paste the job text below.
            </p>
          </Field>
        )}

        {source === 'saved' && (
          <ul className="space-y-2">
            {SAVED_ROLES.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => {
                    setText(r.text);
                    setError('');
                    setAnalysis(null);
                  }}
                  className="flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left text-sm font-medium hover:border-[hsl(var(--cv-primary))]"
                >
                  {r.label}
                  <span className="text-xs text-[hsl(var(--cv-primary-ink))]">Use this</span>
                </button>
              </li>
            ))}
          </ul>
        )}

        <Field id="job-text" label="Job description" required error={error || undefined}>
          <textarea
            id="job-text"
            rows={10}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setAnalysis(null);
            }}
            placeholder="Paste the full job description: title, responsibilities, requirements and preferred skills."
            aria-invalid={!!error || undefined}
            className="w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/80 focus:border-[hsl(var(--cv-primary))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--cv-primary)/0.25)] aria-[invalid=true]:border-rose-500"
          />
        </Field>

        {!analysis && (
          <Action look="primary" onClick={analyze}>
            <Sparkles className="h-4 w-4" aria-hidden />
            Analyze Job Description
          </Action>
        )}
      </div>

      {analysis && (
        <AnalysisPanel
          analysis={analysis}
          onChange={setAnalysis}
          onContinue={proceed}
        />
      )}
    </AppShell>
  );
}

const KIND_LABEL: Record<TermKind, string> = {
  skill: 'Skills',
  tool: 'Tools',
  knowledge: 'Knowledge areas',
  attribute: 'Attributes',
};

function TermChips({ terms }: { terms: JobTerm[] }) {
  if (!terms.length) return <p className="text-sm text-muted-foreground">None found.</p>;
  const kinds = (['knowledge', 'skill', 'tool', 'attribute'] as TermKind[]).filter((k) => terms.some((t) => t.kind === k));
  return (
    <div className="space-y-2">
      {kinds.map((k) => (
        <div key={k}>
          <p className="mb-1 text-xs font-semibold text-muted-foreground">{KIND_LABEL[k]}</p>
          <ul className="flex flex-wrap gap-1.5">
            {terms
              .filter((t) => t.kind === k)
              .map((t) => (
                <li key={t.term} className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
                  {t.term}
                </li>
              ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function AnalysisPanel({
  analysis,
  onChange,
  onContinue,
}: {
  analysis: JobAnalysis;
  onChange: (a: JobAnalysis) => void;
  onContinue: () => void;
}) {
  const required = analysis.terms.filter((t) => t.required);
  const preferred = analysis.terms.filter((t) => !t.required);
  return (
    <section className="mt-6 rounded-2xl border border-border bg-card p-4 sm:p-5" aria-live="polite">
      <h2 className="text-lg font-bold">What we found</h2>
      <p className="text-xs text-muted-foreground">Check the title and company. Everything below comes from the text you gave us.</p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field id="job-title" label="Job title" required>
          <TextInput id="job-title" value={analysis.title} onChange={(e) => onChange({ ...analysis, title: e.target.value })} />
        </Field>
        <Field id="job-company" label="Company">
          <TextInput id="job-company" value={analysis.company} placeholder="Optional" onChange={(e) => onChange({ ...analysis, company: e.target.value })} />
        </Field>
      </div>

      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div className="rounded-xl bg-muted p-3">
          <dt className="text-xs font-semibold text-muted-foreground">Education</dt>
          <dd className="mt-0.5">{analysis.education ?? 'Not specified'}</dd>
        </div>
        <div className="rounded-xl bg-muted p-3">
          <dt className="text-xs font-semibold text-muted-foreground">Experience</dt>
          <dd className="mt-0.5">
            {analysis.experienceYears === null
              ? 'Not specified'
              : analysis.experienceYears === 0
                ? 'Entry level / fresh graduates'
                : `${analysis.experienceYears}+ years`}
          </dd>
        </div>
      </dl>

      <h3 className="mt-5 mb-2 font-semibold">Required ({required.length})</h3>
      <TermChips terms={required} />
      <h3 className="mt-5 mb-2 font-semibold">Preferred ({preferred.length})</h3>
      <TermChips terms={preferred} />

      {analysis.responsibilities.length > 0 && (
        <>
          <h3 className="mt-5 mb-2 font-semibold">Responsibilities</h3>
          <ul className="space-y-1 text-sm">
            {analysis.responsibilities.map((r, i) => (
              <li key={i} className="flex gap-2">
                <span aria-hidden>•</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      {analysis.terms.length === 0 && (
        <div className="mt-4">
          <WarningNote>
            We could not find specific skills or requirements in this text. Try pasting the full description including its
            requirements section.
          </WarningNote>
        </div>
      )}

      <div className="mt-6">
        <Action look="cta" onClick={onContinue} disabled={!analysis.title.trim() || analysis.terms.length === 0}>
          Continue to CV Strategy
        </Action>
      </div>
    </section>
  );
}
