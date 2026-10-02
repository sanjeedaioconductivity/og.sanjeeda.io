"use client";

/**
 * ADM-003 — Market Benchmarks admin (Epic 10.4).
 *
 * The reference data behind the Salary percentile formula. Three things make it
 * its own screen rather than the shared config table:
 *   - p25 <= p50 <= p75 is a HARD block, checked live as you type and enforced
 *     again by the model hook (a bad order corrupts every Salary score against
 *     the row while it is live).
 *   - a soft, non-blocking warning when sampleSize < 3, since the engine prefers
 *     a broader match below that and an admin would otherwise never know.
 *   - the collection has no business key, so edit/retire carry Mongo `_id`.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Archive, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { adminApi, AdminApiError } from "../_lib/adminApi";

/** The engine prefers a broader match below this many samples (salaryScore.ts). */
const LOW_SAMPLE_THRESHOLD = 3;

type Benchmark = {
  _id: string;
  role: string;
  location: string;
  currency: string;
  p25: number;
  p50: number;
  p75: number;
  sampleSize?: number;
  effectiveFrom?: string;
  active?: boolean;
};

type Filter = "active" | "retired" | "all";

export function MarketBenchmarksAdmin() {
  const [rows, setRows] = useState<Benchmark[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("active");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Benchmark | null>(null);
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<{ id: string; message: string } | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      setRows(await adminApi.list<Benchmark>("market-benchmarks"));
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
          : r.role.toLowerCase().includes(q) || r.location.toLowerCase().includes(q)
      );
  }, [rows, filter, search]);

  const setActive = async (r: Benchmark, active: boolean) => {
    setBusyId(r._id);
    setRowError(null);
    try {
      if (active) await adminApi.reactivate("market-benchmarks", r._id);
      else await adminApi.retire("market-benchmarks", r._id);
      await load();
    } catch (err) {
      setRowError({
        id: r._id,
        message: err instanceof AdminApiError ? err.message : "Couldn't update this benchmark.",
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
          placeholder="Search by role or location…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 max-w-xs"
        />
        <Button className="ml-auto" onClick={() => setCreating(true)}>
          <Plus size={16} className="mr-1" />
          Add benchmark
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
        <div className="rounded-2xl border border-dashed border-[#0b163f]/20 p-10 text-center text-sm text-slate-500 dark:border-white/20 dark:text-slate-400">
          {search || filter !== "active" ? "No benchmarks match this view." : "No benchmarks yet — add the first one."}
        </div>
      )}

      {rows !== null && visible.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-[#0b163f]/10 dark:border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#0b163f]/10 bg-slate-50 text-left dark:border-white/10 dark:bg-white/5">
                {["Role", "Location", "Currency"].map((h) => (
                  <th key={h} scope="col" className="px-3 py-2 font-bold text-[#0b163f] dark:text-white">{h}</th>
                ))}
                {["p25", "p50", "p75", "Samples"].map((h) => (
                  <th key={h} scope="col" className="px-3 py-2 text-right font-bold text-[#0b163f] dark:text-white">{h}</th>
                ))}
                <th scope="col" className="px-3 py-2 font-bold text-[#0b163f] dark:text-white">Status</th>
                <th scope="col" className="px-3 py-2 text-right font-bold text-[#0b163f] dark:text-white">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => {
                const active = r.active !== false;
                const lowSample = (r.sampleSize ?? 0) < LOW_SAMPLE_THRESHOLD;
                return (
                  <tr key={r._id} className={cn("border-b border-[#0b163f]/5 last:border-0 dark:border-white/5", !active && "opacity-55")}>
                    <td className="px-3 py-2 font-medium text-[#0b163f] dark:text-slate-200">{r.role}</td>
                    <td className="px-3 py-2 text-[#0b163f] dark:text-slate-200">{r.location}</td>
                    <td className="px-3 py-2 text-[#0b163f] dark:text-slate-200">{r.currency}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{r.p25.toLocaleString()}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{r.p50.toLocaleString()}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{r.p75.toLocaleString()}</td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      <span className={cn(lowSample && "font-semibold text-amber-600 dark:text-amber-400")} title={lowSample ? "Fewer than 3 samples — the engine prefers a broader match" : undefined}>
                        {r.sampleSize ?? 0}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      {active ? (
                        <Badge className="bg-emerald-600 hover:bg-emerald-600 dark:bg-emerald-500">Active</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-slate-500">Retired</Badge>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" aria-label={`Edit ${r.role} ${r.location}`} onClick={() => setEditing(r)}>
                          <Pencil size={15} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={active ? `Retire ${r.role} ${r.location}` : `Reactivate ${r.role} ${r.location}`}
                          disabled={busyId === r._id}
                          onClick={() => setActive(r, !active)}
                        >
                          {active ? <Archive size={15} /> : <RotateCcw size={15} />}
                        </Button>
                      </div>
                      {rowError?.id === r._id && (
                        <p role="alert" className="mt-1 text-right text-xs font-semibold text-amber-600 dark:text-amber-400">{rowError.message}</p>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <BenchmarkForm
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

const EMPTY = { role: "", location: "", currency: "", p25: "", p50: "", p75: "", sampleSize: "" };

function BenchmarkForm({
  record,
  open,
  onClose,
  onSaved,
}: {
  record: Benchmark | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = record !== null;
  const [values, setValues] = useState<Record<string, string>>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setValues(
      record
        ? {
            role: record.role,
            location: record.location,
            currency: record.currency,
            p25: String(record.p25),
            p50: String(record.p50),
            p75: String(record.p75),
            sampleSize: String(record.sampleSize ?? 0),
          }
        : EMPTY
    );
  }, [open, record]);

  const set = (name: string, value: string) => {
    setValues((v) => ({ ...v, [name]: value }));
    setError(null);
  };

  const p25 = Number(values.p25);
  const p50 = Number(values.p50);
  const p75 = Number(values.p75);
  const allNums = [values.p25, values.p50, values.p75].every((s) => s.trim() !== "" && !Number.isNaN(Number(s)));
  // Live inline ordering check — the hard block, mirrored by the model hook.
  const orderError = allNums && !(p25 <= p50 && p50 <= p75)
    ? "p25, p50 and p75 must be in ascending order."
    : null;
  const lowSample = values.sampleSize.trim() !== "" && Number(values.sampleSize) < LOW_SAMPLE_THRESHOLD;

  const save = async () => {
    for (const [k, label] of [["role", "Role"], ["location", "Location"], ["currency", "Currency"]] as const) {
      if (values[k].trim() === "") return setError(`${label} is required.`);
    }
    if (!allNums) return setError("p25, p50 and p75 are all required numbers.");
    if (orderError) return setError(orderError);

    setSaving(true);
    setError(null);
    const body = {
      role: values.role.trim(),
      location: values.location.trim(),
      currency: values.currency.trim(),
      p25,
      p50,
      p75,
      sampleSize: values.sampleSize.trim() === "" ? 0 : Number(values.sampleSize),
    };
    try {
      if (isEdit) await adminApi.update("market-benchmarks", record!._id, body);
      else await adminApi.create("market-benchmarks", body);
      onSaved();
      onClose();
    } catch (err) {
      if (err instanceof AdminApiError && err.status === 400 && /already exists|ascending/i.test(err.message)) {
        // The duplicate {role, location} case (Story 10.4.3) and the model's
        // own ascending guard both arrive as 400s — surface them cleanly.
        setError(
          /ascending/i.test(err.message)
            ? err.message
            : "A benchmark for this role and location already exists — edit it instead of creating a new one."
        );
      } else {
        setError(err instanceof AdminApiError ? err.message : "Something went wrong.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{isEdit ? "Edit benchmark" : "Add benchmark"}</SheetTitle>
          <SheetDescription>
            {isEdit ? `${record?.role} — ${record?.location}` : "Salary percentiles for a role and location."}
          </SheetDescription>
        </SheetHeader>

        {error && (
          <p role="alert" className="mt-4 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300">
            {error}
          </p>
        )}

        <div className="mt-4 space-y-4">
          <Field id="role" label="Role" value={values.role} onChange={(v) => set("role", v)} required />
          <Field id="location" label="Location" value={values.location} onChange={(v) => set("location", v)} required />
          <Field id="currency" label="Currency" value={values.currency} onChange={(v) => set("currency", v)} required placeholder="PKR" />

          <div>
            <Label>Percentiles <span className="text-red-500">*</span></Label>
            <div className="mt-1.5 grid grid-cols-3 gap-2">
              {(["p25", "p50", "p75"] as const).map((p) => (
                <div key={p}>
                  <Label htmlFor={p} className="text-xs text-slate-500">{p}</Label>
                  <Input
                    id={p}
                    type="number"
                    value={values[p]}
                    onChange={(e) => set(p, e.target.value)}
                    className={cn(orderError && "border-red-400 focus-visible:ring-red-400")}
                  />
                </div>
              ))}
            </div>
            {orderError && <p role="alert" className="mt-1 text-xs font-semibold text-red-500">{orderError}</p>}
          </div>

          <div>
            <Field id="sampleSize" label="Sample size" value={values.sampleSize} onChange={(v) => set("sampleSize", v)} type="number" />
            {lowSample && (
              <p className="mt-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
                Fewer than {LOW_SAMPLE_THRESHOLD} samples — the scoring engine will prefer a broader match until this grows.
              </p>
            )}
          </div>
        </div>

        <SheetFooter className="mt-6 flex-row justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={save} disabled={saving || Boolean(orderError)}>
            {saving ? "Saving…" : isEdit ? "Save changes" : "Add benchmark"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  required,
  type = "text",
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-red-500"> *</span>}
      </Label>
      <Input id={id} type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
