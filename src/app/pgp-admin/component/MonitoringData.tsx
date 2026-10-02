"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Activity, Search, ArrowRight, RefreshCw } from "lucide-react";

type Log = {
  id: string;
  programName: string;
  mentorName: string;
  mentorEmail: string;
  section: string;
  itemLabel: string;
  fromStatus: string;
  toStatus: string;
  at: string;
};

const STATUS_STYLE: Record<string, string> = {
  "Not Started": "bg-slate-100 text-slate-600 ring-slate-200",
  "In Progress": "bg-sky-50 text-sky-700 ring-sky-200",
  Completed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Deferred: "bg-amber-50 text-amber-700 ring-amber-200",
  Delayed: "bg-rose-50 text-rose-700 ring-rose-200",
  // Mentor account lifecycle rows (section "Account"): signup and activation.
  Pending: "bg-amber-50 text-amber-700 ring-amber-200",
  Active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Rejected: "bg-rose-50 text-rose-700 ring-rose-200",
  Blocked: "bg-rose-50 text-rose-700 ring-rose-200",
  Deleted: "bg-slate-200 text-slate-700 ring-slate-300",
};

function StatusTag({ status }: { status: string }) {
  const s = STATUS_STYLE[status] || "bg-slate-100 text-slate-600 ring-slate-200";
  return (
    <span
      className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ring-1 ring-inset ${s}`}
    >
      {status || "—"}
    </span>
  );
}

export default function MonitoringData() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState("");

  async function load() {
    try {
      const res = await fetch("/api/pgp-management/activity");
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (error) {
      console.error("Monitoring load error:", error);
    }
  }

  useEffect(() => {
    void load().finally(() => setLoading(false));
  }, []);

  async function refresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return logs;
    return logs.filter((l) =>
      [l.mentorName, l.programName, l.itemLabel, l.section, l.toStatus]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [logs, query]);

  const mentorsActive = new Set(logs.map((l) => l.mentorEmail)).size;

  return (
    <div className="text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-white/10 px-2.5 py-1.5">
        <span className="flex items-center gap-1.5 text-lg font-black text-slate-900 dark:text-white">
          <Activity size={18} className="text-blue-900" />
          Mentor Activity Monitor
        </span>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-slate-400">
            {logs.length} changes · {mentorsActive} mentors
          </span>
          <button
            type="button"
            onClick={refresh}
            disabled={refreshing}
            title="Refresh"
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 disabled:opacity-60 dark:hover:bg-white/10"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      <div className="border-b border-slate-200 dark:border-white/10 px-2.5 py-1.5">
        <div className="flex items-center gap-2 rounded-lg bg-slate-50 dark:bg-white/5 px-3 py-1.5 ring-1 ring-inset ring-slate-200 dark:ring-white/10">
          <Search size={14} className="text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by mentor, program, item, or status…"
            className="w-full bg-transparent text-xs outline-none placeholder:text-slate-400"
          />
        </div>
      </div>

      {loading ? (
        <p className="p-4 text-slate-500 dark:text-slate-400">Loading activity…</p>
      ) : filtered.length === 0 ? (
        <div className="p-10 text-center">
          <Activity size={26} className="mx-auto text-slate-300" />
          <p className="mt-2 text-sm font-bold text-slate-500">
            {logs.length === 0 ? "No mentor activity yet" : "No matches"}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {logs.length === 0
              ? "Mentor signups, approvals and status changes will appear here, newest first."
              : "Try a different search term."}
          </p>
        </div>
      ) : (
        <div className="p-3">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/5">
          <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-[11px]">
            <thead className="bg-[#0b2f5b] text-[9px] uppercase tracking-wider text-white">
              <tr>
                <th className="px-2.5 py-1.5 font-bold">When</th>
                <th className="px-2.5 py-1.5 font-bold">Mentor</th>
                <th className="px-2.5 py-1.5 font-bold">Program</th>
                <th className="px-2.5 py-1.5 font-bold">Item</th>
                <th className="px-2.5 py-1.5 font-bold">Change</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <tr
                  key={l.id}
                  className="border-b border-slate-100 dark:border-white/5"
                >
                  <td className="whitespace-nowrap px-2.5 py-1.5 text-slate-500 dark:text-slate-400">
                    {l.at ? new Date(l.at).toLocaleString() : "—"}
                  </td>
                  <td className="px-2.5 py-1.5">
                    <div className="font-bold text-slate-900 dark:text-slate-100">
                      {l.mentorName || "—"}
                    </div>
                    <div className="text-[10px] text-slate-400">{l.mentorEmail}</div>
                  </td>
                  <td className="px-2.5 py-1.5 text-slate-600 dark:text-slate-300">
                    {l.programName || (l.section === "Account" ? "Mentor account" : "—")}
                  </td>
                  <td className="px-2.5 py-1.5 text-slate-600 dark:text-slate-300">
                    <span className="text-[9px] font-bold uppercase text-slate-400">
                      {l.section}
                    </span>
                    <div className="max-w-[240px] truncate">{l.itemLabel || "—"}</div>
                  </td>
                  <td className="px-2.5 py-1.5">
                    <span className="inline-flex items-center gap-1.5">
                      <StatusTag status={l.fromStatus} />
                      <ArrowRight size={12} className="text-slate-400" />
                      <StatusTag status={l.toStatus} />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </div>
        </div>
      )}
    </div>
  );
}
