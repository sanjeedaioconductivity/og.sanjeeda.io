'use client';

import { useId, useRef, useState } from 'react';
import { FileText, Link2, Paperclip, Trash2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { newId, verificationOf, type DimensionSpec, type Entry, type EvidenceRef } from '../_lib/entries';
import { Action, CheckboxRow, Field, SelectInput, TextInput, VerificationBadge } from './ui';

/**
 * Add / edit form for one entry of any list dimension, built from its
 * DimensionSpec. Rendered inline in place of the list (not in a dialog): a Radix
 * portal would mount outside `.cv3d-surface` and lose the module's colour tokens.
 */

const EVIDENCE_ACCEPT = '.pdf,.doc,.docx,.jpg,.jpeg,.png,.xlsx,.pptx';
const EVIDENCE_MAX = 10 * 1024 * 1024;

function omit(obj: Record<string, string>, ...keys: string[]): Record<string, string> {
  return Object.fromEntries(Object.entries(obj).filter(([k]) => !keys.includes(k)));
}

export default function EntryForm({
  spec,
  initial,
  presets,
  onSave,
  onCancel,
  onDelete,
}: {
  spec: DimensionSpec;
  /** The entry being edited; null when adding. */
  initial: Entry | null;
  /** Starting values for a new entry (e.g. a suggested knowledge area). */
  presets?: Record<string, string>;
  onSave: (entry: Entry) => void;
  onCancel: () => void;
  onDelete?: () => void;
}) {
  const [values, setValues] = useState<Record<string, string>>(() => ({ ...presets, ...initial?.values }));
  const [evidence, setEvidence] = useState<EvidenceRef | null>(initial?.evidence ?? null);
  const [link, setLink] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmDelete, setConfirmDelete] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const formId = `ef-${useId().replace(/:/g, '')}`;

  const visible = spec.fields.filter((f) => !f.hiddenWhen?.(values));

  const set = (key: string, value: string) => {
    setValues((v) => ({ ...v, [key]: value }));
    if (errors[key]) setErrors((e) => omit(e, key));
  };

  function validate(): Record<string, string> {
    const e: Record<string, string> = {};
    for (const f of visible) {
      if (f.required && !values[f.key]?.trim()) e[f.key] = `Please add ${f.label.toLowerCase()}.`;
    }
    return { ...spec.validate?.(values, evidence), ...e };
  }

  function submit(ev: React.FormEvent) {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    const first = Object.keys(e)[0];
    if (first) {
      document.getElementById(`${formId}-${first}`)?.focus();
      return;
    }
    // Drop values for hidden fields (e.g. End when "currently working here").
    const clean: Record<string, string> = {};
    for (const f of visible) {
      const v = values[f.key]?.trim();
      if (v) clean[f.key] = v;
    }
    onSave({ id: initial?.id ?? newId(), values: clean, evidence });
  }

  function attachFile(file: File | undefined) {
    if (!file) return;
    if (file.size > EVIDENCE_MAX) {
      setErrors((e) => ({ ...e, evidence: 'Evidence files must be 10 MB or smaller.' }));
      return;
    }
    setEvidence({ name: file.name, size: file.size, kind: 'file' });
    setErrors((e) => omit(e, 'evidence', 'level'));
  }

  function attachLink() {
    const v = link.trim();
    if (!/^(https?:\/\/)?[\w-]+(\.[\w-]+)+(\/\S*)?$/i.test(v)) {
      setErrors((e) => ({ ...e, evidence: 'Paste a full link, e.g. github.com/you/project' }));
      return;
    }
    setEvidence({ name: v.replace(/^https?:\/\//i, ''), size: 0, kind: 'link' });
    setLink('');
    setErrors((e) => omit(e, 'evidence', 'level'));
  }

  const aria = (key: string) =>
    errors[key] ? { 'aria-invalid': true as const, 'aria-describedby': `${formId}-${key}-error` } : {};

  return (
    <form onSubmit={submit} noValidate className="rounded-2xl border border-border bg-card p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold">{initial ? `Edit ${spec.noun}` : `Add ${spec.noun}`}</h2>
        <button type="button" onClick={onCancel} aria-label="Close" className="rounded-md p-1.5 text-muted-foreground hover:bg-muted">
          <X className="h-5 w-5" aria-hidden />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {visible.map((f) => {
          const id = `${formId}-${f.key}`;
          const value = values[f.key] ?? '';
          const col = f.half ? 'col-span-2 sm:col-span-1' : 'col-span-2';
          if (f.kind === 'checkbox') {
            return (
              <div key={f.key} className={col}>
                <CheckboxRow id={id} checked={value === 'true'} onChange={(c) => set(f.key, c ? 'true' : '')}>
                  {f.label}
                </CheckboxRow>
              </div>
            );
          }
          return (
            <div key={f.key} className={col}>
              <Field id={id} label={f.label} required={f.required} error={errors[f.key]}>
                {f.kind === 'select' ? (
                  <SelectInput id={id} value={value} onChange={(e) => set(f.key, e.target.value)} {...aria(f.key)}>
                    <option value="">Select…</option>
                    {f.options?.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </SelectInput>
                ) : f.kind === 'textarea' ? (
                  <textarea
                    id={id}
                    rows={3}
                    value={value}
                    placeholder={f.placeholder}
                    onChange={(e) => set(f.key, e.target.value)}
                    className="w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/80 focus:border-[hsl(var(--cv-primary))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--cv-primary)/0.25)] aria-[invalid=true]:border-rose-500"
                    {...aria(f.key)}
                  />
                ) : (
                  <TextInput
                    id={id}
                    type={f.kind === 'year' || f.kind === 'number' ? 'number' : f.kind === 'month' ? 'month' : 'text'}
                    inputMode={f.kind === 'year' || f.kind === 'number' ? 'numeric' : f.kind === 'url' ? 'url' : undefined}
                    min={f.kind === 'number' ? 0 : undefined}
                    placeholder={f.placeholder ?? (f.kind === 'year' ? 'YYYY' : f.kind === 'month' ? 'YYYY-MM' : undefined)}
                    value={value}
                    onChange={(e) => set(f.key, e.target.value)}
                    {...aria(f.key)}
                  />
                )}
                {f.hint && !errors[f.key] && <p className="text-xs text-muted-foreground">{f.hint}</p>}
              </Field>
            </div>
          );
        })}
      </div>

      {/* Evidence */}
      <section className="mt-5 rounded-xl border border-dashed border-[hsl(var(--cv-primary)/0.45)] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">Evidence</h3>
          <VerificationBadge status={verificationOf(evidence)} />
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Optional, but proof makes this entry stronger in your CV. Certificates, letters, transcripts, project files or a link.
        </p>

        {evidence ? (
          <div className="mt-3 flex items-center gap-3 rounded-lg bg-muted p-2.5">
            {evidence.kind === 'link' ? <Link2 className="h-4 w-4 shrink-0" aria-hidden /> : <FileText className="h-4 w-4 shrink-0" aria-hidden />}
            <span className="min-w-0 flex-1 truncate text-sm">{evidence.name}</span>
            <button
              type="button"
              onClick={() => setEvidence(null)}
              className="rounded-md px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-card dark:text-rose-300"
            >
              Remove
            </button>
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-lg border border-[hsl(var(--cv-primary))] px-3 py-2 text-sm font-semibold text-[hsl(var(--cv-primary-ink))] hover:bg-[hsl(var(--cv-primary-soft))]"
            >
              <Paperclip className="h-4 w-4" aria-hidden />
              Attach file
            </button>
            <input
              ref={fileRef}
              type="file"
              accept={EVIDENCE_ACCEPT}
              className="sr-only"
              onChange={(e) => {
                attachFile(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
            <div className="flex gap-2">
              <TextInput
                aria-label="Evidence link"
                placeholder="or paste a link (GitHub, portfolio, credential)"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    attachLink();
                  }
                }}
              />
              <button
                type="button"
                onClick={attachLink}
                className="shrink-0 rounded-lg border border-border px-3 text-sm font-semibold hover:bg-muted"
              >
                Add
              </button>
            </div>
          </div>
        )}
        {errors.evidence && <p className="mt-2 text-xs font-medium text-rose-600 dark:text-rose-300">{errors.evidence}</p>}
      </section>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Action look="neutral" onClick={onCancel}>
          Cancel
        </Action>
        <Action look="cta" type="submit">
          {initial ? 'Save Changes' : `Add ${spec.noun}`}
        </Action>
      </div>

      {onDelete && (
        <div className="mt-4 text-center">
          {confirmDelete ? (
            <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
              <span>Delete this {spec.noun.toLowerCase()}?</span>
              <button type="button" onClick={onDelete} className="font-semibold text-rose-600 hover:underline dark:text-rose-300">
                Yes, delete
              </button>
              <button type="button" onClick={() => setConfirmDelete(false)} className="font-semibold text-muted-foreground hover:underline">
                Keep it
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className={cn('inline-flex items-center gap-1.5 text-sm font-semibold text-rose-600 hover:underline dark:text-rose-300')}
            >
              <Trash2 className="h-4 w-4" aria-hidden />
              Delete {spec.noun.toLowerCase()}
            </button>
          )}
        </div>
      )}
    </form>
  );
}
