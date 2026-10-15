'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import AppShell from '../AppShell';
import { Action, PageHeading, StatusBadge } from '../ui';
import { DIMENSIONS, STAGE_ORDER, statusFromScore, type DimensionId } from '../../_lib/dimensions';
import type { Entry } from '../../_lib/entries';
import { useCv3d } from '../../_lib/store';

/**
 * Chrome shared by the nine dimension screens: back link, step counter, heading,
 * and "Save and Continue" to the next dimension in this candidate's career-stage
 * order (the last one returns to the dashboard). Entries save as they are added,
 * so the button only moves on.
 */
export default function DimensionFrame({
  dimension,
  heading,
  subtitle,
  action,
  hideFooter,
  children,
}: {
  dimension: DimensionId;
  heading: string;
  subtitle: string;
  action?: React.ReactNode;
  /** Hidden while an add/edit form is open, so there is one clear next step. */
  hideFooter?: boolean;
  children: React.ReactNode;
}) {
  const { state, scores } = useCv3d();
  const stage = state.basic.careerStage || state.account?.careerStage || 'junior';
  const order = STAGE_ORDER[stage];
  const index = order.indexOf(dimension);
  const next = order[index + 1];

  return (
    <AppShell tabs>
      <div className="mb-4 flex items-center justify-between gap-3 text-sm">
        <Link href="/3d-cv/dashboard" className="inline-flex items-center gap-1 font-medium text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" aria-hidden />
          Dashboard
        </Link>
        <span className="flex items-center gap-2 text-muted-foreground">
          {index + 1} of {order.length}
          <StatusBadge status={statusFromScore(scores[dimension])} />
        </span>
      </div>

      <PageHeading title={heading} subtitle={subtitle} action={action} />

      {children}

      {!hideFooter && (
        <div className="mt-8">
          <Action look="cta" href={next ? `/3d-cv/profile/${next}` : '/3d-cv/dashboard'}>
            {next ? 'Save and Continue' : 'Save and Finish'}
          </Action>
          {next && (
            <p className="mt-2 text-center text-xs text-muted-foreground">Next: {DIMENSIONS[next].label}</p>
          )}
        </div>
      )}
    </AppShell>
  );
}

export function AddButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="shrink-0 rounded-lg border border-[hsl(var(--cv-primary))] px-3 py-1.5 text-sm font-semibold text-[hsl(var(--cv-primary-ink))] hover:bg-[hsl(var(--cv-primary-soft))]"
    >
      {children}
    </button>
  );
}

/** Which entry the inline editor is showing: none, a new one, or an existing one. */
export type EditorState = { open: false } | { open: true; entry: Entry | null; presets?: Record<string, string> };

export function useEditor() {
  const [editor, setEditor] = useState<EditorState>({ open: false });
  const open = (entry: Entry | null, presets?: Record<string, string>) => {
    setEditor({ open: true, entry, presets });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const close = () => setEditor({ open: false });
  return { editor, open, close };
}
