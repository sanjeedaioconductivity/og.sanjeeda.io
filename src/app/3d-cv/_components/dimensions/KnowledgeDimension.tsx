'use client';

import { useState } from 'react';
import { Check, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import EntryForm from '../EntryForm';
import { Action } from '../ui';
import DimensionFrame, { useEditor } from './DimensionFrame';
import EntryCard from './EntryCard';
import { SPECS, suggestedKnowledge } from '../../_lib/entries';
import { useCv3d } from '../../_lib/store';

/**
 * Screen 8 — Knowledge Status. Suggested areas for the candidate's target job
 * family (tap + to add one with a level), or their own; then the added list.
 */
export default function KnowledgeDimension() {
  const spec = SPECS.knowledge;
  const { state, saveEntry, removeEntry } = useCv3d();
  const { editor, open, close } = useEditor();
  const [tab, setTab] = useState<'suggested' | 'own'>('suggested');
  const entries = state.entries.knowledge;
  const suggested = suggestedKnowledge(state.basic.jobFamilies);
  const added = new Set(entries.map((e) => e.values.area?.toLowerCase()));

  return (
    <DimensionFrame dimension="knowledge" heading={spec.heading} subtitle={spec.subtitle} hideFooter={editor.open}>
      {editor.open ? (
        <EntryForm
          key={editor.entry?.id ?? `new-${editor.presets?.area ?? ''}`}
          spec={spec}
          initial={editor.entry}
          presets={editor.presets}
          onCancel={close}
          onSave={(entry) => {
            saveEntry('knowledge', entry);
            toast.success(editor.entry ? 'Knowledge area updated.' : 'Knowledge area added.');
            close();
          }}
          onDelete={
            editor.entry
              ? () => {
                  removeEntry('knowledge', editor.entry!.id);
                  toast.success('Knowledge area removed.');
                  close();
                }
              : undefined
          }
        />
      ) : (
        <>
          <div role="tablist" aria-label="Knowledge source" className="mb-3 flex gap-2">
            {(
              [
                ['suggested', suggested.label],
                ['own', 'Add Your Own'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                role="tab"
                type="button"
                aria-selected={tab === id}
                onClick={() => (id === 'own' ? open(null) : setTab(id))}
                className={cn(
                  'rounded-full px-4 py-1.5 text-sm font-medium transition',
                  tab === id ? 'bg-[hsl(var(--cv-primary))] text-white' : 'text-muted-foreground hover:bg-muted',
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <ul className="space-y-2">
            {suggested.areas.map((area) => {
              const isAdded = added.has(area.toLowerCase());
              return (
                <li key={area}>
                  <button
                    type="button"
                    disabled={isAdded}
                    onClick={() => open(null, { area })}
                    className="flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-card px-3 py-2.5 text-left text-sm transition hover:border-[hsl(var(--cv-primary))] disabled:cursor-default disabled:opacity-60 disabled:hover:border-border"
                  >
                    {area}
                    {isAdded ? (
                      <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-300" aria-label="Added" />
                    ) : (
                      <Plus className="h-4 w-4 text-[hsl(var(--cv-primary-ink))]" aria-label="Add" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>

          <h2 className="mt-6 mb-2 text-lg font-bold">Added Knowledge ({entries.length})</h2>
          {entries.length > 0 ? (
            <ul className="space-y-2">
              {entries.map((entry) => (
                <li key={entry.id}>
                  <EntryCard dimension="knowledge" entry={entry} onEdit={() => open(entry)} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-xl bg-muted p-3 text-sm text-muted-foreground">
              Nothing added yet. Tap + on a suggestion above, or add your own.
            </p>
          )}

          <div className="mt-4">
            <Action look="primary" onClick={() => open(null)}>
              Add Knowledge Area
            </Action>
          </div>
        </>
      )}
    </DimensionFrame>
  );
}
