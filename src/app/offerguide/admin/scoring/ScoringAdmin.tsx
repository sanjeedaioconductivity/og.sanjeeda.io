"use client";

/**
 * ADM-002 — Scoring Configuration admin (Epic 10.2).
 *
 * Three views behind one screen:
 *   1. version history — every version, effectiveFrom, Active/Draft badge, View;
 *   2. new-version editor — cloned from the active version, Save POSTs a new
 *      (inactive) version, never edits an existing one;
 *   3. a version detail with Preview (fixture diff) and, for a non-active
 *      version, Activate — which shows the same diff as its confirmation.
 *
 * The history table has no edit affordance anywhere: clicking a row only opens
 * a read-only detail, reinforcing immutability. "New version" is a separate
 * action, not a row edit.
 */

import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { adminApi, AdminApiError } from "../_lib/adminApi";
import { FixtureDiff } from "./FixtureDiff";
import { NewVersionEditor } from "./NewVersionEditor";
import type { PreviewResponse, ScoringConfig } from "./scoringTypes";

type View = { kind: "history" } | { kind: "new" } | { kind: "detail"; version: number };

export function ScoringAdmin() {
  const [configs, setConfigs] = useState<ScoringConfig[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [view, setView] = useState<View>({ kind: "history" });
  // Imperative refreshes (after create / activate) bump this; the fetch lives
  // inline in the effect below rather than in a memoized function, which is the
  // data-fetching shape react-hooks/set-state-in-effect expects.
  const [reloadKey, setReloadKey] = useState(0);
  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await adminApi.list<ScoringConfig>("scoring");
        if (cancelled) return;
        setConfigs([...rows].sort((a, b) => b.version - a.version));
        setLoadError(null);
      } catch (err) {
        if (cancelled) return;
        setLoadError(err instanceof AdminApiError ? err.message : "Failed to load.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const active = configs?.find((c) => c.isActive) ?? null;

  if (view.kind === "new") {
    return (
      <NewVersionEditor
        activeConfig={active}
        nextVersion={configs ? Math.max(0, ...configs.map((c) => c.version)) + 1 : 1}
        onCancel={() => setView({ kind: "history" })}
        onCreated={(version) => {
          reload();
          setView({ kind: "detail", version });
        }}
      />
    );
  }

  if (view.kind === "detail") {
    const config = configs?.find((c) => c.version === view.version) ?? null;
    return (
      <VersionDetail
        config={config}
        loading={configs === null}
        onBack={() => setView({ kind: "history" })}
        onActivated={async () => reload()}
      />
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-black text-[#0b163f] dark:text-white">Version history</h2>
        <Button onClick={() => setView({ kind: "new" })}>
          <Plus size={16} className="mr-1" />
          New version
        </Button>
      </div>

      {loadError && (
        <p role="alert" className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300">
          {loadError}
        </p>
      )}

      {configs === null && !loadError && (
        <div className="space-y-2">{[0, 1].map((i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-200 dark:bg-white/10" />)}</div>
      )}

      {configs && (
        <div className="overflow-x-auto rounded-xl border border-[#0b163f]/10 dark:border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#0b163f]/10 bg-slate-50 text-left dark:border-white/10 dark:bg-white/5">
                <th scope="col" className="px-3 py-2 font-bold">Version</th>
                <th scope="col" className="px-3 py-2 font-bold">Effective from</th>
                <th scope="col" className="px-3 py-2 font-bold">Status</th>
                <th scope="col" className="px-3 py-2 text-right font-bold">&nbsp;</th>
              </tr>
            </thead>
            <tbody>
              {configs.map((c) => (
                <tr key={c.version} className="border-b border-[#0b163f]/5 last:border-0 dark:border-white/5">
                  <td className="px-3 py-2 font-semibold tabular-nums">v{c.version}</td>
                  <td className="px-3 py-2 text-slate-500">
                    {c.effectiveFrom ? new Date(c.effectiveFrom).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-3 py-2">
                    {c.isActive ? (
                      <Badge className="bg-emerald-600 hover:bg-emerald-600 dark:bg-emerald-500">Active</Badge>
                    ) : (
                      <Badge variant="outline">Draft</Badge>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Button variant="ghost" size="sm" onClick={() => setView({ kind: "detail", version: c.version })}>
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function VersionDetail({
  config,
  loading,
  onBack,
  onActivated,
}: {
  config: ScoringConfig | null;
  loading: boolean;
  onBack: () => void;
  onActivated: () => Promise<void>;
}) {
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [activating, setActivating] = useState(false);

  if (!config) {
    return (
      <div className="mx-auto max-w-3xl">
        <BackLink onBack={onBack} />
        <p className="text-sm text-slate-500">
          {/* config catches up on the next refresh after a create; only truly
              absent once the list has loaded and still lacks it. */}
          {loading ? "Loading version…" : "Version not found."}
        </p>
      </div>
    );
  }

  const runPreview = async () => {
    setPreviewing(true);
    setError(null);
    try {
      setPreview(await adminApi.previewScoring<PreviewResponse>(config.version));
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : "Preview failed.");
    } finally {
      setPreviewing(false);
    }
  };

  const activate = async () => {
    setActivating(true);
    setError(null);
    try {
      await adminApi.activateScoring(config.version);
      await onActivated();
      onBack();
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : "Activation failed.");
    } finally {
      setActivating(false);
      setConfirmOpen(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <BackLink onBack={onBack} />

      <div className="mb-4 flex items-center gap-3">
        <h2 className="text-lg font-black text-[#0b163f] dark:text-white">Version {config.version}</h2>
        {config.isActive ? (
          <Badge className="bg-emerald-600 hover:bg-emerald-600 dark:bg-emerald-500">Active</Badge>
        ) : (
          <Badge variant="outline">Draft</Badge>
        )}
        <div className="ml-auto flex gap-2">
          <Button variant="outline" onClick={runPreview} disabled={previewing}>
            {previewing ? "Scoring…" : "Preview"}
          </Button>
          {!config.isActive && (
            <Button onClick={() => setConfirmOpen(true)}>Activate</Button>
          )}
        </div>
      </div>

      {error && (
        <p role="alert" className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300">
          {error}
        </p>
      )}

      <ConfigSummary config={config} />

      {preview && (
        <div className="mt-6">
          <h3 className="mb-2 text-sm font-black uppercase tracking-wide text-slate-500">Fixture impact</h3>
          <FixtureDiff preview={preview} />
        </div>
      )}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Activate version {config.version}?</DialogTitle>
            <DialogDescription>
              This applies to all new evaluation sessions immediately. Existing sessions keep the version they were
              scored under.
            </DialogDescription>
          </DialogHeader>
          {preview ? (
            <p className="text-sm text-slate-500">
              You previewed the fixture impact above. Activating makes version {config.version} the one new sessions use.
            </p>
          ) : (
            <p className="text-sm text-amber-600 dark:text-amber-400">
              You haven&apos;t previewed this version yet — consider closing this and clicking Preview first to see its
              impact on the golden fixtures.
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={activating}>Cancel</Button>
            <Button onClick={activate} disabled={activating}>{activating ? "Activating…" : "Activate"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ConfigSummary({ config }: { config: ScoringConfig }) {
  return (
    <div className="rounded-xl border border-[#0b163f]/10 p-4 text-sm dark:border-white/10">
      <div className="grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-3">
        {Object.entries(config.categoryBaseWeights ?? {}).map(([cat, w]) => (
          <div key={cat} className="flex justify-between">
            <span className="text-slate-500">{cat}</span>
            <span className="font-semibold tabular-nums">{w}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex justify-between border-t border-[#0b163f]/10 pt-2 dark:border-white/10">
        <span className="text-slate-500">Priority boost</span>
        <span className="font-semibold tabular-nums">{config.priorityBoost}</span>
      </div>
    </div>
  );
}

function BackLink({ onBack }: { onBack: () => void }) {
  return (
    <button onClick={onBack} className="mb-6 inline-flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-[#0b163f] dark:hover:text-white">
      <ArrowLeft size={14} />
      Version history
    </button>
  );
}
