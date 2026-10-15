'use client';

import { Info, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import EntryForm from '../EntryForm';
import DimensionFrame, { AddButton, useEditor } from './DimensionFrame';
import EntryCard from './EntryCard';
import { SPECS, type ListDimensionId } from '../../_lib/entries';
import { useCv3d } from '../../_lib/store';

/**
 * Projects, Education, Certifications, Trainings, Experience and Exposure:
 * a list of cards with "+ Add" and an inline editor (mockups 10–13, 15; Exposure
 * has no mockup and follows the same pattern).
 */
export default function ListDimension({ dimension }: { dimension: ListDimensionId }) {
  const spec = SPECS[dimension];
  const { state, saveEntry, removeEntry, addSampleEntries } = useCv3d();
  const { editor, open, close } = useEditor();
  const entries = state.entries[dimension];
  const stage = state.basic.careerStage || state.account?.careerStage;
  const hasExperience = state.entries.experience.length > 0;

  return (
    <DimensionFrame
      dimension={dimension}
      heading={spec.heading}
      subtitle={spec.subtitle}
      hideFooter={editor.open}
      action={!editor.open && <AddButton onClick={() => open(null)}>+ Add {spec.noun}</AddButton>}
    >
      {editor.open ? (
        <EntryForm
          key={editor.entry?.id ?? 'new'}
          spec={spec}
          initial={editor.entry}
          presets={editor.presets}
          onCancel={close}
          onSave={(entry) => {
            saveEntry(dimension, entry);
            toast.success(editor.entry ? `${spec.noun} updated.` : `${spec.noun} added.`);
            close();
          }}
          onDelete={
            editor.entry
              ? () => {
                  removeEntry(dimension, editor.entry!.id);
                  toast.success(`${spec.noun} deleted.`);
                  close();
                }
              : undefined
          }
        />
      ) : (
        <>
          {dimension === 'projects' && stage === 'junior' && entries.length === 0 && (
            <div className="mb-4 flex gap-3 rounded-xl bg-[hsl(var(--cv-primary-soft))] p-3 text-sm text-[hsl(var(--cv-primary-ink))]">
              <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <p className="text-sm">
                {hasExperience
                  ? 'Projects are strongly recommended for junior candidates, even with internship experience.'
                  : 'Junior candidates need at least one project. Academic, self-initiated and training projects all count.'}
              </p>
            </div>
          )}

          {entries.length > 0 ? (
            <ul className="space-y-3">
              {entries.map((entry) => (
                <li key={entry.id}>
                  <EntryCard dimension={dimension} entry={entry} onEdit={() => open(entry)} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState noun={spec.noun} onAdd={() => open(null)} onSample={() => addSampleEntries(dimension)} />
          )}
        </>
      )}
    </DimensionFrame>
  );
}

export function EmptyState({ noun, onAdd, onSample }: { noun: string; onAdd: () => void; onSample?: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card px-4 py-10 text-center">
      <p className="text-base font-semibold">No {noun.toLowerCase()} entries yet</p>
      <p className="mt-1 text-sm text-muted-foreground">Add your first one. You can attach proof now or later.</p>
      <div className="mx-auto mt-4 max-w-xs">
        <button
          type="button"
          onClick={onAdd}
          className="w-full rounded-xl bg-[hsl(var(--cv-primary))] px-4 py-2.5 font-semibold text-white hover:brightness-110"
        >
          + Add {noun}
        </button>
      </div>
      {onSample && (
        <button
          type="button"
          onClick={onSample}
          className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[hsl(var(--cv-primary-ink))] hover:underline"
        >
          <Sparkles className="h-3.5 w-3.5" aria-hidden />
          Use sample entries (prototype)
        </button>
      )}
    </div>
  );
}
