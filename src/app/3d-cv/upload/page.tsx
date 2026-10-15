'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CloudUpload, FileImage, FileText, Link2, Loader2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import AppShell from '../_components/AppShell';
import { Action, PageHeading, SafeNote, TextInput } from '../_components/ui';
import { useCv3d, type UploadItem } from '../_lib/store';

/**
 * Screen 4 — Upload Existing CV.
 *
 * Rules from the concept doc: up to 3 old CVs on the free plan (a LinkedIn URL
 * takes a slot too), duplicates are rejected, and the candidate sees what they
 * added before extraction runs.
 *
 * Prototype: files never leave the browser. Only their name and size are kept,
 * and "extraction" loads the sample profile (see _lib/sample.ts).
 */

const MAX_SLOTS = 3;
const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPT = '.pdf,.doc,.docx,.jpg,.jpeg,.png';
const ACCEPT_RE = /\.(pdf|docx?|jpe?g|png)$/i;
const LINKEDIN_RE = /^(https?:\/\/)?([a-z]{2,3}\.)?linkedin\.com\/in\/[A-Za-z0-9\-_%]+\/?$/i;

const FORMATS = [
  { label: 'PDF', cls: 'text-red-600 dark:text-red-300' },
  { label: 'DOCX', cls: 'text-sky-600 dark:text-sky-300' },
  { label: 'JPG/PNG', cls: 'text-sky-600 dark:text-sky-300' },
  { label: 'LinkedIn URL', cls: 'text-[hsl(var(--cv-primary-ink))]' },
  { label: 'LinkedIn PDF', cls: 'text-foreground' },
];

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function normaliseLinkedIn(url: string) {
  return url.trim().replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/$/, '').toLowerCase();
}

export default function UploadPage() {
  const router = useRouter();
  const { state, setUploads, runExtraction, hydrated } = useCv3d();
  const uploads = state.uploads;
  const [dragging, setDragging] = useState(false);
  const [linkedin, setLinkedin] = useState('');
  const [linkedinError, setLinkedinError] = useState('');
  const [extracting, setExtracting] = useState(false);
  // Image previews live only in memory for this visit; object URLs can't be persisted.
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  const inputRef = useRef<HTMLInputElement>(null);

  const thumbsRef = useRef(thumbs);
  useEffect(() => {
    thumbsRef.current = thumbs;
  }, [thumbs]);
  useEffect(() => () => Object.values(thumbsRef.current).forEach((u) => URL.revokeObjectURL(u)), []);

  const slotsLeft = MAX_SLOTS - uploads.length;

  function addFiles(list: FileList | null) {
    if (!list) return;
    const next = [...uploads];
    const newThumbs: Record<string, string> = {};
    for (const file of Array.from(list)) {
      if (next.length >= MAX_SLOTS) {
        toast.error(`You can upload up to ${MAX_SLOTS} CVs on the free plan.`);
        break;
      }
      if (!ACCEPT_RE.test(file.name)) {
        toast.error(`${file.name}: please upload a PDF, Word or image file.`);
        continue;
      }
      if (file.size > MAX_BYTES) {
        toast.error(`${file.name} is larger than 10 MB.`);
        continue;
      }
      if (next.some((u) => u.kind === 'file' && u.name === file.name && u.size === file.size)) {
        toast.error(`${file.name} is already added.`);
        continue;
      }
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      next.push({ id, kind: 'file', name: file.name, size: file.size });
      if (/\.(jpe?g|png)$/i.test(file.name)) newThumbs[id] = URL.createObjectURL(file);
    }
    setUploads(next);
    if (Object.keys(newThumbs).length) setThumbs((t) => ({ ...t, ...newThumbs }));
  }

  function addLinkedIn() {
    const value = linkedin.trim();
    if (!LINKEDIN_RE.test(value)) {
      setLinkedinError('Paste a profile link like linkedin.com/in/your-name');
      return;
    }
    if (uploads.length >= MAX_SLOTS) {
      setLinkedinError(`All ${MAX_SLOTS} slots are used. Remove one to import LinkedIn.`);
      return;
    }
    const norm = normaliseLinkedIn(value);
    if (uploads.some((u) => u.kind === 'linkedin' && normaliseLinkedIn(u.name) === norm)) {
      setLinkedinError('This LinkedIn profile is already added.');
      return;
    }
    setUploads([...uploads, { id: `li-${Date.now()}`, kind: 'linkedin', name: norm, size: 0 }]);
    setLinkedin('');
    setLinkedinError('');
  }

  function remove(item: UploadItem) {
    setUploads(uploads.filter((u) => u.id !== item.id));
    if (thumbs[item.id]) {
      URL.revokeObjectURL(thumbs[item.id]);
      setThumbs((t) => Object.fromEntries(Object.entries(t).filter(([id]) => id !== item.id)));
    }
  }

  function extract() {
    setExtracting(true);
    // Simulated parsing delay so the step reads as work being done.
    window.setTimeout(() => {
      runExtraction();
      router.push('/3d-cv/review');
    }, 1800);
  }

  return (
    <AppShell>
      <PageHeading
        title={
          <>
            Upload Your
            <br />
            Existing CV
          </>
        }
        subtitle="We will read your CV and organize your information into your 3D profile. You can review and edit everything before using it."
      />

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          addFiles(e.dataTransfer.files);
        }}
        className={`flex flex-col items-center rounded-2xl border-2 border-dashed px-4 py-10 text-center transition ${
          dragging
            ? 'border-[hsl(var(--cv-primary))] bg-[hsl(var(--cv-primary-soft))]'
            : 'border-[hsl(var(--cv-primary)/0.45)] bg-card'
        }`}
      >
        <CloudUpload className="h-10 w-10 text-[hsl(var(--cv-primary-ink))]" aria-hidden />
        <p className="mt-3 text-sm">Drag and drop your CV here</p>
        <p className="my-2 text-xs text-muted-foreground">or</p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={slotsLeft <= 0}
          className="rounded-xl bg-[hsl(var(--cv-primary))] px-8 py-2.5 font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Browse Files
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple
          className="sr-only"
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </div>

      <div className="mt-6">
        <p className="text-center text-sm font-semibold">Supported formats</p>
        <ul className="mt-3 grid grid-cols-5 gap-2">
          {FORMATS.map((f) => (
            <li key={f.label} className="flex flex-col items-center gap-1.5 text-center">
              <span className={`flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card ${f.cls}`}>
                {f.label.startsWith('LinkedIn URL') ? <Link2 className="h-5 w-5" aria-hidden /> : f.label === 'JPG/PNG' ? <FileImage className="h-5 w-5" aria-hidden /> : <FileText className="h-5 w-5" aria-hidden />}
              </span>
              <span className="text-[11px] leading-tight text-muted-foreground">{f.label}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-6 text-sm" aria-live="polite">
        {hydrated &&
          (slotsLeft > 0
            ? `You can upload up to ${MAX_SLOTS} CVs. ${slotsLeft === MAX_SLOTS ? 'All' : slotsLeft} ${slotsLeft === 1 ? 'slot' : 'slots'} available.`
            : `All ${MAX_SLOTS} slots are used. Remove one to add another.`)}
      </p>

      {uploads.length > 0 && (
        <section className="mt-4">
          <h2 className="mb-2 text-sm font-semibold">Ready to extract ({uploads.length})</h2>
          <ul className="space-y-2">
            {uploads.map((u) => (
              <li key={u.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
                {thumbs[u.id] ? (
                  // eslint-disable-next-line @next/next/no-img-element -- local object URL preview
                  <img src={thumbs[u.id]} alt="" className="h-10 w-10 rounded-md object-cover" />
                ) : (
                  <span className="flex h-10 w-10 items-center justify-center rounded-md bg-muted text-muted-foreground">
                    {u.kind === 'linkedin' ? <Link2 className="h-5 w-5" aria-hidden /> : <FileText className="h-5 w-5" aria-hidden />}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{u.name}</p>
                  <p className="text-xs text-muted-foreground">{u.kind === 'linkedin' ? 'LinkedIn profile' : formatSize(u.size)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => remove(u)}
                  aria-label={`Remove ${u.name}`}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
          {uploads.length > 1 && (
            <p className="mt-2 text-xs text-muted-foreground">We will merge these into one profile.</p>
          )}
        </section>
      )}

      <section className="mt-6 rounded-2xl border border-border bg-card p-4">
        <h2 className="font-semibold">Import from LinkedIn Profile URL</h2>
        <div className="mt-3 flex gap-2">
          <TextInput
            aria-label="LinkedIn profile URL"
            placeholder="Paste your LinkedIn profile URL"
            value={linkedin}
            onChange={(e) => {
              setLinkedin(e.target.value);
              setLinkedinError('');
            }}
            onKeyDown={(e) => e.key === 'Enter' && addLinkedIn()}
            aria-invalid={!!linkedinError || undefined}
          />
          <button
            type="button"
            onClick={addLinkedIn}
            className="shrink-0 rounded-lg bg-[hsl(var(--cv-primary))] px-4 text-sm font-semibold text-white hover:brightness-110"
          >
            Import
          </button>
        </div>
        {linkedinError && <p className="mt-2 text-xs font-medium text-rose-600 dark:text-rose-300">{linkedinError}</p>}
      </section>

      <div className="mt-6">
        <Action look="cta" onClick={extract} disabled={uploads.length === 0 || extracting}>
          {extracting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
              Organizing into 9 dimensions…
            </>
          ) : (
            'Build My 3D Profile from CV'
          )}
        </Action>
      </div>

      <div className="mt-8">
        <SafeNote>
          Your uploaded CV is used to build your 3D profile. You can edit, remove or verify imported information before
          generating any CV.
        </SafeNote>
      </div>
    </AppShell>
  );
}
