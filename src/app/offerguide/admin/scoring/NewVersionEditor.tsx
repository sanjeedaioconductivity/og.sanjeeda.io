"use client";

/**
 * New scoring version editor (Story 10.2.5). Pre-filled by cloning the currently
 * active version; Save POSTs a NEW version (inactive — a draft, per 10.2.1),
 * never edits an existing one. The form always produces the next version number.
 *
 * Category weights and the priority boost are the primary tuning levers and are
 * directly editable here. priorityCategoryMap, importanceWeighting and
 * evaluationTypeBonus are cloned through unchanged — a friendlier editor for
 * those is explicitly deferred by the plan; they carry over exactly rather than
 * being dropped, so the new version is a faithful starting point.
 */

import { useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminApi, AdminApiError } from "../_lib/adminApi";
import { SCORE_CATEGORIES, type ScoringConfig } from "./scoringTypes";

const DEFAULT_WEIGHTS = Object.fromEntries(SCORE_CATEGORIES.map((c) => [c, 1]));

export function NewVersionEditor({
  activeConfig,
  nextVersion,
  onCancel,
  onCreated,
}: {
  activeConfig: ScoringConfig | null;
  nextVersion: number;
  onCancel: () => void;
  onCreated: (version: number) => void | Promise<void>;
}) {
  const [weights, setWeights] = useState<Record<string, number>>(() => ({
    ...DEFAULT_WEIGHTS,
    ...(activeConfig?.categoryBaseWeights ?? {}),
  }));
  const [priorityBoost, setPriorityBoost] = useState<number>(activeConfig?.priorityBoost ?? 1.2);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const clonedFrom = useMemo(() => activeConfig?.version ?? null, [activeConfig]);

  const save = async () => {
    for (const c of SCORE_CATEGORIES) {
      if (typeof weights[c] !== "number" || Number.isNaN(weights[c]) || weights[c] < 0) {
        return setError(`${c} weight must be a number ≥ 0.`);
      }
    }
    if (!(priorityBoost > 0)) return setError("Priority boost must be greater than 0.");

    setSaving(true);
    setError(null);
    try {
      const created = await adminApi.create<ScoringConfig>("scoring", {
        version: nextVersion,
        categoryBaseWeights: weights,
        priorityBoost,
        // Carried through from the active version unchanged (see header).
        priorityCategoryMap: activeConfig?.priorityCategoryMap,
        importanceWeighting: activeConfig?.importanceWeighting,
        evaluationTypeBonus: activeConfig?.evaluationTypeBonus,
        // Explicitly a draft — activation is a separate, deliberate step.
        isActive: false,
      });
      await onCreated(created.version);
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : "Couldn't create the version.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <button onClick={onCancel} className="mb-6 inline-flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-[#0b163f] dark:hover:text-white">
        <ArrowLeft size={14} />
        Version history
      </button>

      <h2 className="text-lg font-black text-[#0b163f] dark:text-white">New version {nextVersion}</h2>
      <p className="mb-4 mt-1 text-sm text-slate-500 dark:text-slate-400">
        {clonedFrom ? `Cloned from the active version ${clonedFrom}.` : "Starting from defaults — no active version to clone."}{" "}
        Saved as a draft; activate it separately once you&apos;ve previewed the impact.
      </p>

      {error && (
        <p role="alert" className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300">
          {error}
        </p>
      )}

      <div className="rounded-xl border border-[#0b163f]/10 p-4 dark:border-white/10">
        <Label className="text-xs font-bold uppercase tracking-wide text-slate-500">Category weights</Label>
        <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {SCORE_CATEGORIES.map((c) => (
            <div key={c} className="space-y-1">
              <Label htmlFor={`w-${c}`} className="text-xs">{c}</Label>
              <Input
                id={`w-${c}`}
                type="number"
                step="0.1"
                value={weights[c]}
                onChange={(e) => setWeights((w) => ({ ...w, [c]: Number(e.target.value) }))}
                className="h-8"
              />
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-2">
          <Label htmlFor="priorityBoost" className="text-xs">Priority boost</Label>
          <Input id="priorityBoost" type="number" step="0.1" value={priorityBoost} onChange={(e) => setPriorityBoost(Number(e.target.value))} className="h-8 w-24" />
          <span className="text-xs text-slate-500">Multiplier applied to a candidate&apos;s prioritised categories.</span>
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel} disabled={saving}>Cancel</Button>
        <Button onClick={save} disabled={saving}>{saving ? "Saving…" : `Save version ${nextVersion}`}</Button>
      </div>
    </div>
  );
}
