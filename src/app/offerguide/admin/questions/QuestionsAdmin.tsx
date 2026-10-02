"use client";

/**
 * ADM-001 — Questions admin (Epic 10.3).
 *
 * List grouped by screen then category, Active/Retired filter, and an editor
 * whose body changes with scoreType (enum options table / rating multiplier /
 * numeric bands). Two guard rails from the FRS:
 *   - fieldId is the business key: editable only on create, read-only after
 *     (Story 10.3.5). scoreType is likewise create-only — changing it on a field
 *     with historical scores would retroactively change what those scores meant.
 *   - category is a locked dropdown of the six live categories, never free text.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Archive, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { adminApi, AdminApiError } from "../_lib/adminApi";
import { QuestionEditor } from "./QuestionEditor";
import type { Question } from "./questionTypes";

type Filter = "active" | "retired" | "all";

export function QuestionsAdmin() {
  const [rows, setRows] = useState<Question[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("active");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Question | null>(null);
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<{ id: string; message: string } | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      setRows(await adminApi.list<Question>("questions"));
    } catch (err) {
      setLoadError(err instanceof AdminApiError ? err.message : "Failed to load.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = useMemo(() => {
    if (!rows) return [];
    const q = search.trim().toLowerCase();
    return rows
      .filter((r) => {
        const active = r.active !== false;
        if (filter === "active" && !active) return false;
        if (filter === "retired" && active) return false;
        return true;
      })
      .filter((r) =>
        q === ""
          ? true
          : [r.fieldId, r.label, r.screen, r.category].some((v) =>
              String(v ?? "").toLowerCase().includes(q)
            )
      );
  }, [rows, filter, search]);

  // Group by screen, then category, matching the list layout the FRS specifies.
  const grouped = useMemo(() => {
    const byScreen = new Map<string, Map<string, Question[]>>();
    for (const q of [...visible].sort((a, b) => Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0))) {
      const screen = q.screen || "—";
      if (!byScreen.has(screen)) byScreen.set(screen, new Map());
      const byCat = byScreen.get(screen)!;
      if (!byCat.has(q.category)) byCat.set(q.category, []);
      byCat.get(q.category)!.push(q);
    }
    return [...byScreen.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [visible]);

  const setActive = async (q: Question, active: boolean) => {
    setBusyId(q.fieldId);
    setRowError(null);
    try {
      if (active) await adminApi.reactivate("questions", q.fieldId);
      else await adminApi.retire("questions", q.fieldId);
      await load();
    } catch (err) {
      setRowError({
        id: q.fieldId,
        message: err instanceof AdminApiError ? err.message : "Couldn't update this question.",
      });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
          <TabsList>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="retired">Retired</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
        </Tabs>
        <Input
          placeholder="Search by field, label, screen…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 max-w-xs"
        />
        <Button className="ml-auto" onClick={() => setCreating(true)}>
          <Plus size={16} className="mr-1" />
          Add question
        </Button>
      </div>

      {loadError && (
        <p role="alert" className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300">
          {loadError}
        </p>
      )}

      {rows === null && !loadError && (
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-200 dark:bg-white/10" />
          ))}
        </div>
      )}

      {rows !== null && visible.length === 0 && (
        <div className="rounded-2xl border border-dashed border-[#0b163f]/20 p-10 text-center text-sm text-slate-500 dark:border-white/20 dark:text-slate-400">
          {search || filter !== "active" ? "No questions match this view." : "No questions yet — add the first one."}
        </div>
      )}

      <div className="space-y-6">
        {grouped.map(([screen, byCategory]) => (
          <section key={screen}>
            <h3 className="mb-2 text-xs font-black uppercase tracking-[0.15em] text-slate-400">{screen}</h3>
            <div className="space-y-3">
              {[...byCategory.entries()].map(([category, questions]) => (
                <div key={category} className="overflow-hidden rounded-xl border border-[#0b163f]/10 dark:border-white/10">
                  <div className="border-b border-[#0b163f]/10 bg-slate-50 px-3 py-1.5 text-xs font-bold text-[#0b163f] dark:border-white/10 dark:bg-white/5 dark:text-white">
                    {category}
                  </div>
                  <ul className="divide-y divide-[#0b163f]/5 dark:divide-white/5">
                    {questions.map((q) => {
                      const active = q.active !== false;
                      return (
                        <li key={q.fieldId} className={cn("flex items-center gap-3 px-3 py-2", !active && "opacity-55")}>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="truncate font-medium text-[#0b163f] dark:text-slate-100">{q.label}</span>
                              <Badge variant="outline" className="shrink-0 text-[10px] uppercase">{q.scoreType}</Badge>
                            </div>
                            <span className="text-xs text-slate-400">{q.fieldId}</span>
                          </div>
                          {!active && <span className="text-xs font-semibold text-slate-400">Retired</span>}
                          <Button variant="ghost" size="icon" aria-label={`Edit ${q.fieldId}`} onClick={() => setEditing(q)}>
                            <Pencil size={15} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={active ? `Retire ${q.fieldId}` : `Reactivate ${q.fieldId}`}
                            disabled={busyId === q.fieldId}
                            onClick={() => setActive(q, !active)}
                          >
                            {active ? <Archive size={15} /> : <RotateCcw size={15} />}
                          </Button>
                          {rowError?.id === q.fieldId && (
                            <p role="alert" className="w-full text-right text-xs font-semibold text-amber-600 dark:text-amber-400">{rowError.message}</p>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <QuestionEditor
        record={editing}
        open={editing !== null || creating}
        onClose={() => {
          setEditing(null);
          setCreating(false);
        }}
        onSaved={load}
      />
    </div>
  );
}
