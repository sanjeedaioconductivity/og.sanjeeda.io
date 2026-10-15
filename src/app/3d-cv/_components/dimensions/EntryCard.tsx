'use client';

import { useState } from 'react';
import { Check, ChevronDown, ChevronRight, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VerificationBadge } from '../ui';
import {
  formatMonth,
  monthsBetween,
  splitLines,
  splitList,
  verificationOf,
  type Entry,
  type ListDimensionId,
} from '../../_lib/entries';

/**
 * One saved entry as a card, laid out per dimension to match mockups 8–15.
 * Clicking a card opens it in the editor.
 */

const CARD =
  'w-full rounded-2xl border border-border bg-card p-4 text-left transition hover:border-[hsl(var(--cv-primary))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--cv-primary))]';

function Chip({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'neutral' | 'blue' | 'orange' | 'green' }) {
  const tones = {
    neutral: 'bg-muted text-foreground',
    blue: 'bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
    orange: 'bg-orange-50 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300',
    green: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  };
  return <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold', tones[tone])}>{children}</span>;
}

function range(start?: string, end?: string, current?: boolean) {
  if (!start) return '';
  const to = current ? 'Present' : end ? formatMonth(end) : '';
  return to ? `${formatMonth(start)} – ${to}` : formatMonth(start);
}

export default function EntryCard({
  dimension,
  entry,
  onEdit,
}: {
  dimension: ListDimensionId;
  entry: Entry;
  onEdit: () => void;
}) {
  const v = entry.values;
  const badge = <VerificationBadge status={verificationOf(entry.evidence)} />;

  switch (dimension) {
    case 'knowledge':
      return (
        <button type="button" onClick={onEdit} className={cn(CARD, 'flex items-center gap-3 py-3')}>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">{v.area}</span>
            <span className="block text-xs text-muted-foreground">{v.level}</span>
          </span>
          {badge}
        </button>
      );

    case 'skills':
      return (
        <button type="button" onClick={onEdit} className={cn(CARD, 'flex gap-3')}>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300">
            <Check className="h-5 w-5" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-start justify-between gap-2">
              <span className="text-base font-bold">{v.name}</span>
              {badge}
            </span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              {v.category} • {v.level}
            </span>
            {(v.source || v.related) && (
              <span className="mt-1 block text-xs">{[v.source, v.related].filter(Boolean).join(' • ')}</span>
            )}
            {v.lastUsed && <span className="mt-0.5 block text-xs text-muted-foreground">{v.lastUsed}</span>}
          </span>
        </button>
      );

    case 'projects':
      return (
        <button type="button" onClick={onEdit} className={cn(CARD, 'flex items-center gap-3')}>
          <span className="min-w-0 flex-1">
            <span className="block text-base font-bold">{v.title}</span>
            <span className="mt-1.5 flex flex-wrap gap-1.5">
              <Chip tone="blue">{v.type}</Chip>
              {v.role && <Chip>{v.role}</Chip>}
              {v.start && <Chip>{range(v.start, v.end)}</Chip>}
            </span>
            <span className="mt-2 block text-sm">{v.summary}</span>
            {v.skills && <span className="mt-1.5 block text-xs text-muted-foreground">{splitList(v.skills).join(', ')}</span>}
            <span className="mt-2 block">{badge}</span>
          </span>
          <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
        </button>
      );

    case 'education':
      return (
        <button type="button" onClick={onEdit} className={CARD}>
          <span className="block text-base font-bold">{v.degree}</span>
          <span className="block text-sm text-muted-foreground">{v.institution}</span>
          <span className="block text-sm text-muted-foreground">
            {v.startYear} – {v.endYear}
          </span>
          {v.grade && <span className="block text-sm text-muted-foreground">{v.grade}</span>}
          <span className="mt-2 flex justify-end">{badge}</span>
        </button>
      );

    case 'certifications': {
      const thisMonth = new Date().toISOString().slice(0, 7);
      const expired = v.expires && v.expires < thisMonth;
      return (
        <button type="button" onClick={onEdit} className={CARD}>
          <span className="block text-base font-bold">{v.name}</span>
          <span className="block text-sm text-muted-foreground">{v.issuer}</span>
          <span className="block text-sm text-muted-foreground">Issued: {formatMonth(v.issued)}</span>
          <span className={cn('block text-sm', expired ? 'font-semibold text-amber-700 dark:text-amber-300' : 'text-muted-foreground')}>
            {!v.expires ? 'No Expiry' : expired ? `Expired: ${formatMonth(v.expires)}` : `Expires: ${formatMonth(v.expires)}`}
          </span>
          <span className="mt-2 flex justify-end">{badge}</span>
        </button>
      );
    }

    case 'trainings':
      return (
        <button type="button" onClick={onEdit} className={CARD}>
          <span className="block text-base font-bold">{v.title}</span>
          <span className="block text-sm text-muted-foreground">{v.provider}</span>
          {v.hours && <span className="block text-sm text-muted-foreground">Duration: {v.hours} Hours</span>}
          {v.completed && <span className="block text-sm text-muted-foreground">Completed: {formatMonth(v.completed)}</span>}
          <span className="mt-2 flex justify-end">{badge}</span>
        </button>
      );

    case 'experience':
      return <ExperienceCard entry={entry} onEdit={onEdit} badge={badge} />;

    case 'exposure':
      return (
        <button type="button" onClick={onEdit} className={CARD}>
          <span className="block text-base font-bold">{v.title}</span>
          <span className="mt-1.5 flex flex-wrap gap-1.5">
            <Chip tone="blue">{v.type}</Chip>
            {v.duration && <Chip>{v.duration}</Chip>}
            {v.related && <Chip>{v.related}</Chip>}
          </span>
          <span className="mt-2 block text-sm">{v.context}</span>
          {v.learned && <span className="mt-1 block text-xs text-muted-foreground">Learned: {v.learned}</span>}
          <span className="mt-2 block">{badge}</span>
        </button>
      );
  }
}

function ExperienceCard({ entry, onEdit, badge }: { entry: Entry; onEdit: () => void; badge: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  const v = entry.values;
  const current = v.current === 'true';
  const end = current ? new Date().toISOString().slice(0, 7) : v.end;
  const months = v.start && end ? monthsBetween(v.start, end) : 0;
  const bullets = splitLines(v.responsibilities);
  const typeTone = v.type === 'Internship' ? 'blue' : v.type === 'Full-time' ? 'green' : 'orange';

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold">{v.title}</h3>
          <p className="text-sm text-muted-foreground">{v.organization}</p>
          <p className="text-xs text-muted-foreground">
            {range(v.start, v.end, current)}
            {months > 0 && ` (${months} ${months === 1 ? 'month' : 'months'})`}
          </p>
        </div>
        <button
          type="button"
          onClick={onEdit}
          aria-label={`Edit ${v.title}`}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Pencil className="h-4 w-4" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label={open ? 'Collapse details' : 'Expand details'}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <ChevronDown className={cn('h-4 w-4 transition-transform', !open && '-rotate-90')} aria-hidden />
        </button>
      </div>
      {open && bullets.length > 0 && (
        <ul className="mt-3 space-y-1 pl-1 text-sm">
          {bullets.map((b, i) => (
            <li key={i} className="flex gap-2"><span aria-hidden>•</span><span>{b}</span></li>
          ))}
        </ul>
      )}
      {open && splitLines(v.achievements).length > 0 && (
        <>
          <p className="mt-3 text-xs font-semibold">Achievements</p>
          <ul className="mt-1 space-y-1 pl-1 text-sm">
            {splitLines(v.achievements).map((b, i) => (
              <li key={i} className="flex gap-2"><span aria-hidden>•</span><span>{b}</span></li>
            ))}
          </ul>
        </>
      )}
      <div className="mt-3 flex flex-wrap gap-1.5">
        <Chip tone={typeTone}>{v.type}</Chip>
        {v.location && <Chip tone="blue">{v.location}</Chip>}
        {current && <Chip tone="green">Current</Chip>}
      </div>
      <div className="mt-2">{badge}</div>
    </div>
  );
}
