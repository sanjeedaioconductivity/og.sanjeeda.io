"use client";

/**
 * The list screen for a config-driven collection (Story 10.5.1): a filterable,
 * sortable table with add / edit / retire / reactivate, plus the create/edit
 * Sheet. Consent Toggles and Functional Domains both render through this; the
 * only thing that varies is the CollectionConfig passed in.
 *
 * Retire is soft: DELETE sets active:false and the row stays, muted, visible
 * under the "All" / "Retired" filter. A 409 from the server (the master consent
 * toggle refusing to retire) shows inline on the row, not as a toast, per the
 * FRS.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { Pencil, Plus, RotateCcw, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { adminApi, AdminApiError } from "../_lib/adminApi";
import type { CollectionConfig } from "../_lib/collectionConfig";
import { AdminCollectionForm, type AdminRecord } from "./AdminCollectionForm";

type Filter = "active" | "retired" | "all";

export function AdminCollectionTable({ config }: { config: CollectionConfig }) {
  const [rows, setRows] = useState<AdminRecord[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("active");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<AdminRecord | null>(null);
  const [creating, setCreating] = useState(false);
  const [rowError, setRowError] = useState<{ id: string; message: string } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      setRows(await adminApi.list<AdminRecord>(config.collection));
    } catch (err) {
      setLoadError(err instanceof AdminApiError ? err.message : "Failed to load.");
    }
  }, [config.collection]);

  useEffect(() => {
    void load();
  }, [load]);

  const tableFields = config.fields.filter((f) => f.inTable);

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
          : tableFields.some((f) => String(r[f.name] ?? "").toLowerCase().includes(q))
      )
      .sort((a, b) => Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0));
  }, [rows, filter, search, tableFields]);

  const keyOf = (r: AdminRecord) => String(r[config.keyField]);

  const retire = async (r: AdminRecord) => {
    setBusyId(keyOf(r));
    setRowError(null);
    try {
      await adminApi.retire(config.collection, keyOf(r));
      await load();
    } catch (err) {
      // The master-toggle 409 lands here — show it on the row.
      setRowError({
        id: keyOf(r),
        message: err instanceof AdminApiError ? err.message : "Couldn't retire this.",
      });
    } finally {
      setBusyId(null);
    }
  };

  const reactivate = async (r: AdminRecord) => {
    setBusyId(keyOf(r));
    setRowError(null);
    try {
      await adminApi.reactivate(config.collection, keyOf(r));
      await load();
    } catch (err) {
      setRowError({
        id: keyOf(r),
        message: err instanceof AdminApiError ? err.message : "Couldn't reactivate this.",
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
          placeholder={`Search ${config.noun}s…`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 max-w-xs"
        />

        <Button className="ml-auto" onClick={() => setCreating(true)}>
          <Plus size={16} className="mr-1" />
          Add {config.noun}
        </Button>
      </div>

      {loadError && (
        <p role="alert" className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300">
          {loadError}
        </p>
      )}

      {rows === null && !loadError && (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-200 dark:bg-white/10" />
          ))}
        </div>
      )}

      {rows !== null && visible.length === 0 && (
        <div className="rounded-2xl border border-dashed border-[#0b163f]/20 p-10 text-center dark:border-white/20">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {search || filter !== "active"
              ? `No ${config.noun}s match this view.`
              : `No ${config.noun}s yet — add the first one.`}
          </p>
          {!search && filter === "active" && (
            <Button className="mt-3" onClick={() => setCreating(true)}>
              <Plus size={16} className="mr-1" />
              Add {config.noun}
            </Button>
          )}
        </div>
      )}

      {rows !== null && visible.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-[#0b163f]/10 dark:border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#0b163f]/10 bg-slate-50 text-left dark:border-white/10 dark:bg-white/5">
                {tableFields.map((f) => (
                  <th key={f.name} scope="col" className="px-3 py-2 font-bold text-[#0b163f] dark:text-white">
                    {f.label}
                  </th>
                ))}
                <th scope="col" className="px-3 py-2 font-bold text-[#0b163f] dark:text-white">Status</th>
                <th scope="col" className="px-3 py-2 text-right font-bold text-[#0b163f] dark:text-white">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => {
                const active = r.active !== false;
                const id = keyOf(r);
                return (
                  <tr
                    key={id}
                    className={cn(
                      "border-b border-[#0b163f]/5 last:border-0 dark:border-white/5",
                      !active && "opacity-55"
                    )}
                  >
                    {tableFields.map((f) => (
                      <td key={f.name} className="px-3 py-2 text-[#0b163f] dark:text-slate-200">
                        {f.kind === "boolean"
                          ? r[f.name]
                            ? "Yes"
                            : "—"
                          : String(r[f.name] ?? "—")}
                      </td>
                    ))}
                    <td className="px-3 py-2">
                      {active ? (
                        <Badge className="bg-emerald-600 hover:bg-emerald-600 dark:bg-emerald-500">Active</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-slate-500">Retired</Badge>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" aria-label={`Edit ${id}`} onClick={() => setEditing(r)}>
                          <Pencil size={15} />
                        </Button>
                        {active ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Retire ${id}`}
                            disabled={busyId === id}
                            onClick={() => retire(r)}
                          >
                            <Archive size={15} />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Reactivate ${id}`}
                            disabled={busyId === id}
                            onClick={() => reactivate(r)}
                          >
                            <RotateCcw size={15} />
                          </Button>
                        )}
                      </div>
                      {rowError?.id === id && (
                        <p role="alert" className="mt-1 text-right text-xs font-semibold text-amber-600 dark:text-amber-400">
                          {rowError.message}
                        </p>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <AdminCollectionForm
        config={config}
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
