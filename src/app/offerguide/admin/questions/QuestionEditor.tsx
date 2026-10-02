"use client";

/**
 * The Questions create/edit slide-over (Epic 10.3). The form body switches on
 * scoreType — enum options table, rating multiplier with a live preview, or
 * numeric bands. Two fields are create-only and lock on edit: fieldId (the
 * business key) and scoreType (changing it would re-interpret historical
 * scores). Category is a locked dropdown of the six live categories.
 */

import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { adminApi, AdminApiError } from "../_lib/adminApi";
import {
  CATEGORIES,
  SCORE_TYPES,
  validateScoringShape,
  type NumericBand,
  type Question,
  type QuestionOption,
  type ScoreType,
} from "./questionTypes";

type Draft = {
  fieldId: string;
  screen: string;
  category: string;
  label: string;
  helpText: string;
  uiControl: string;
  scoreType: ScoreType;
  options: QuestionOption[];
  ratingMultiplier: number;
  numericBands: NumericBand[];
  nullScore: number;
};

function toDraft(q: Question | null): Draft {
  return {
    fieldId: q?.fieldId ?? "",
    screen: q?.screen ?? "",
    category: q?.category ?? CATEGORIES[0],
    label: q?.label ?? "",
    helpText: q?.helpText ?? "",
    uiControl: q?.uiControl ?? "dropdown",
    scoreType: (SCORE_TYPES.includes(q?.scoreType as ScoreType) ? q!.scoreType : "enum") as ScoreType,
    options: q?.options?.map((o) => ({ ...o })) ?? [{ value: "", sortOrder: 1, active: true, score: 0 }],
    ratingMultiplier: q?.ratingMultiplier ?? 20,
    numericBands: q?.numericBands?.map((b) => ({ ...b })) ?? [{ upTo: 10, score: 25 }, { score: 100 }],
    nullScore: q?.nullScore ?? 45,
  };
}

export function QuestionEditor({
  record,
  open,
  onClose,
  onSaved,
}: {
  record: Question | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = record !== null;
  const [draft, setDraft] = useState<Draft>(() => toDraft(record));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setDraft(toDraft(record));
      setError(null);
    }
  }, [open, record]);

  const patch = (p: Partial<Draft>) => {
    setDraft((d) => ({ ...d, ...p }));
    setError(null);
  };

  const save = async () => {
    for (const [k, label] of [["fieldId", "Field ID"], ["screen", "Screen"], ["label", "Label"], ["helpText", "Help text"]] as const) {
      if (String(draft[k]).trim() === "") return setError(`${label} is required.`);
    }
    const shapeError = validateScoringShape(draft);
    if (shapeError) return setError(shapeError);

    // Only the fields the chosen scoreType uses are sent, so switching type on
    // create never leaves stale sibling fields on the document.
    const body: Record<string, unknown> = {
      screen: draft.screen.trim(),
      category: draft.category,
      label: draft.label.trim(),
      helpText: draft.helpText.trim(),
      uiControl: draft.uiControl.trim() || "dropdown",
    };
    if (draft.scoreType === "enum") body.options = draft.options;
    if (draft.scoreType === "rating") body.ratingMultiplier = draft.ratingMultiplier;
    if (draft.scoreType === "numeric") {
      body.numericBands = draft.numericBands;
      body.nullScore = draft.nullScore;
    }
    if (!isEdit) {
      body.fieldId = draft.fieldId.trim();
      body.scoreType = draft.scoreType; // create-only
    }

    setSaving(true);
    setError(null);
    try {
      if (isEdit) await adminApi.update("questions", record!.fieldId, body);
      else await adminApi.create("questions", body);
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{isEdit ? "Edit question" : "Add question"}</SheetTitle>
          <SheetDescription>
            {isEdit ? draft.fieldId : "fieldId and score type are set once and cannot change later."}
          </SheetDescription>
        </SheetHeader>

        {error && (
          <p role="alert" className="mt-4 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300">
            {error}
          </p>
        )}

        <div className="mt-4 space-y-4">
          <TextField id="fieldId" label="Field ID" value={draft.fieldId} onChange={(v) => patch({ fieldId: v })} required locked={isEdit} help={isEdit ? undefined : "Stable identifier, e.g. offer_probation. Cannot change later."} />

          <div className="grid grid-cols-2 gap-3">
            <TextField id="screen" label="Screen" value={draft.screen} onChange={(v) => patch({ screen: v })} required placeholder="SCR-003" />
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={draft.category} onValueChange={(v) => patch({ category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <TextField id="label" label="Label" value={draft.label} onChange={(v) => patch({ label: v })} required />
          <div className="space-y-1.5">
            <Label htmlFor="helpText">Help text <span className="text-red-500">*</span></Label>
            <textarea id="helpText" rows={2} value={draft.helpText} onChange={(e) => patch({ helpText: e.target.value })} className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm" />
          </div>
          <TextField id="uiControl" label="UI control" value={draft.uiControl} onChange={(v) => patch({ uiControl: v })} help="Informational — how the wizard renders it, e.g. dropdown, radio_cards." />

          <div className="space-y-1.5">
            <Label>Score type {isEdit && <span className="ml-1 text-xs font-normal text-slate-400">(cannot change)</span>}</Label>
            <Select value={draft.scoreType} onValueChange={(v) => patch({ scoreType: v as ScoreType })} disabled={isEdit}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SCORE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-xl border border-[#0b163f]/10 p-3 dark:border-white/10">
            {draft.scoreType === "enum" && <EnumEditor options={draft.options} onChange={(options) => patch({ options })} />}
            {draft.scoreType === "rating" && <RatingEditor multiplier={draft.ratingMultiplier} onChange={(ratingMultiplier) => patch({ ratingMultiplier })} />}
            {draft.scoreType === "numeric" && <NumericEditor bands={draft.numericBands} nullScore={draft.nullScore} onBands={(numericBands) => patch({ numericBands })} onNullScore={(nullScore) => patch({ nullScore })} />}
          </div>
        </div>

        <SheetFooter className="mt-6 flex-row justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Saving…" : isEdit ? "Save changes" : "Add question"}</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function EnumEditor({ options, onChange }: { options: QuestionOption[]; onChange: (o: QuestionOption[]) => void }) {
  const set = (i: number, p: Partial<QuestionOption>) => onChange(options.map((o, idx) => (idx === i ? { ...o, ...p } : o)));
  const add = () => onChange([...options, { value: "", sortOrder: options.length + 1, active: true, score: 0 }]);
  const remove = (i: number) => onChange(options.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-2">
      <Label className="text-xs font-bold uppercase tracking-wide text-slate-500">Options</Label>
      {options.map((o, i) => (
        <div key={i} className="flex items-center gap-2">
          <Input aria-label={`Option ${i + 1} value`} value={o.value} placeholder="Value" onChange={(e) => set(i, { value: e.target.value })} className="h-8 flex-1" />
          <Input aria-label={`Option ${i + 1} score`} type="number" value={o.score} onChange={(e) => set(i, { score: Number(e.target.value) })} className="h-8 w-20" />
          <Button variant="ghost" size="icon" aria-label={`Remove option ${i + 1}`} onClick={() => remove(i)} disabled={options.length === 1}>
            <Trash2 size={14} />
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={add}><Plus size={14} className="mr-1" />Add option</Button>
    </div>
  );
}

function RatingEditor({ multiplier, onChange }: { multiplier: number; onChange: (n: number) => void }) {
  const preview = useMemo(() => [1, 2, 3, 4, 5].map((r) => r * multiplier), [multiplier]);
  return (
    <div className="space-y-2">
      <Label htmlFor="ratingMultiplier" className="text-xs font-bold uppercase tracking-wide text-slate-500">Rating multiplier</Label>
      <Input id="ratingMultiplier" type="number" value={multiplier} onChange={(e) => onChange(Number(e.target.value))} className="h-8 w-24" />
      <p className="text-xs text-slate-500">A rating of 4 scores <span className="font-semibold">{4 * multiplier}</span> (1–5 → {preview.join(", ")}).</p>
    </div>
  );
}

function NumericEditor({
  bands,
  nullScore,
  onBands,
  onNullScore,
}: {
  bands: NumericBand[];
  nullScore: number;
  onBands: (b: NumericBand[]) => void;
  onNullScore: (n: number) => void;
}) {
  const set = (i: number, p: Partial<NumericBand>) => onBands(bands.map((b, idx) => (idx === i ? { ...b, ...p } : b)));
  const add = () => {
    // insert a capped band before the open-ended last one
    const next = [...bands];
    next.splice(Math.max(0, next.length - 1), 0, { upTo: 0, score: 0 });
    onBands(next);
  };
  const remove = (i: number) => onBands(bands.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-2">
      <Label className="text-xs font-bold uppercase tracking-wide text-slate-500">Bands (ascending; last is open-ended)</Label>
      {bands.map((b, i) => {
        const openEnded = b.upTo === undefined || b.upTo === null;
        return (
          <div key={i} className="flex items-center gap-2">
            <span className="w-16 text-xs text-slate-500">{openEnded ? "above" : "up to"}</span>
            <Input
              aria-label={`Band ${i + 1} upper limit`}
              type="number"
              value={openEnded ? "" : (b.upTo as number)}
              placeholder={openEnded ? "∞" : ""}
              disabled={openEnded}
              onChange={(e) => set(i, { upTo: Number(e.target.value) })}
              className="h-8 w-24"
            />
            <span className="text-xs text-slate-500">→</span>
            <Input aria-label={`Band ${i + 1} score`} type="number" value={b.score} onChange={(e) => set(i, { score: Number(e.target.value) })} className="h-8 w-20" />
            <Button variant="ghost" size="icon" aria-label={`Remove band ${i + 1}`} onClick={() => remove(i)} disabled={openEnded || bands.length <= 1}>
              <Trash2 size={14} />
            </Button>
          </div>
        );
      })}
      <Button variant="outline" size="sm" onClick={add}><Plus size={14} className="mr-1" />Add band</Button>

      <div className="mt-3 flex items-center gap-2">
        <Label htmlFor="nullScore" className="text-xs">Null score (blank / Not clear)</Label>
        <Input id="nullScore" type="number" value={nullScore} onChange={(e) => onNullScore(Number(e.target.value))} className="h-8 w-20" />
      </div>
    </div>
  );
}

function TextField({
  id,
  label,
  value,
  onChange,
  required,
  locked,
  help,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  locked?: boolean;
  help?: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-red-500"> *</span>}
        {locked && <span className="ml-2 text-xs font-normal text-slate-400">(cannot change)</span>}
      </Label>
      <Input id={id} value={value} placeholder={placeholder} disabled={locked} onChange={(e) => onChange(e.target.value)} />
      {help && <p className="text-xs text-slate-500">{help}</p>}
    </div>
  );
}
