'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import EntryForm from '../EntryForm';
import { Action } from '../ui';
import DimensionFrame, { AddButton, useEditor } from './DimensionFrame';
import EntryCard from './EntryCard';
import { EmptyState } from './ListDimension';
import { SKILL_CATEGORIES, SPECS } from '../../_lib/entries';
import { useCv3d } from '../../_lib/store';

/** Screen 9 — Skill Status, filtered by the four skill categories. */

const TAB_LABEL: Record<(typeof SKILL_CATEGORIES)[number], string> = {
  Technical: 'Technical',
  Functional: 'Functional',
  'Soft / Behavioral': 'Soft Skills',
  'Tools / Software': 'Tools',
};

export default function SkillsDimension() {
  const spec = SPECS.skills;
  const { state, saveEntry, removeEntry } = useCv3d();
  const { editor, open, close } = useEditor();
  const [tab, setTab] = useState<(typeof SKILL_CATEGORIES)[number] | 'all'>('all');
  const entries = state.entries.skills;
  const shown = tab === 'all' ? entries : entries.filter((e) => e.values.category === tab);

  return (
    <DimensionFrame dimension="skills" heading={spec.heading} subtitle={spec.subtitle} hideFooter={editor.open}>
      {editor.open ? (
        <EntryForm
          key={editor.entry?.id ?? 'new'}
          spec={spec}
          initial={editor.entry}
          presets={editor.presets}
          onCancel={close}
          onSave={(entry) => {
            saveEntry('skills', entry);
            toast.success(editor.entry ? 'Skill updated.' : 'Skill added.');
            close();
          }}
          onDelete={
            editor.entry
              ? () => {
                  removeEntry('skills', editor.entry!.id);
                  toast.success('Skill removed.');
                  close();
                }
              : undefined
          }
        />
      ) : (
        <>
          <div role="tablist" aria-label="Skill category" className="flex flex-wrap gap-2">
            {(['all', ...SKILL_CATEGORIES] as const).map((c) => (
              <button
                key={c}
                role="tab"
                type="button"
                aria-selected={tab === c}
                onClick={() => setTab(c)}
                className={cn(
                  'rounded-full px-4 py-1.5 text-sm font-medium transition',
                  tab === c ? 'bg-[hsl(var(--cv-primary))] text-white' : 'bg-muted text-foreground hover:brightness-95',
                )}
              >
                {c === 'all' ? `All (${entries.length})` : TAB_LABEL[c]}
              </button>
            ))}
          </div>

          <div className="mt-4 mb-3 flex justify-end">
            <AddButton onClick={() => open(null, tab === 'all' ? undefined : { category: tab })}>Add Skill</AddButton>
          </div>

          {entries.length === 0 ? (
            <EmptyState noun="Skill" onAdd={() => open(null)} />
          ) : shown.length > 0 ? (
            <ul className="space-y-3">
              {shown.map((entry) => (
                <li key={entry.id}>
                  <EntryCard dimension="skills" entry={entry} onEdit={() => open(entry)} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-xl bg-muted p-3 text-sm text-muted-foreground">
              No {TAB_LABEL[tab as (typeof SKILL_CATEGORIES)[number]].toLowerCase()} skills yet.
            </p>
          )}

          {tab !== 'all' && entries.length > 0 && (
            <div className="mt-4">
              <Action look="outline" onClick={() => setTab('all')}>
                View All Skills ({entries.length})
              </Action>
            </div>
          )}
        </>
      )}
    </DimensionFrame>
  );
}
