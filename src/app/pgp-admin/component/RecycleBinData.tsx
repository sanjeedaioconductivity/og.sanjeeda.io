"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw, Trash2, Trash, Undo2 } from "lucide-react";
import PortalToast from "@/components/portal/PortalToast";
import DeleteProgramDialog from "./DeleteProgramDialog";

/**
 * The programs recycle bin: what was deleted, putting one back, or emptying
 * it out of the system for good.
 *
 * Restoring re-creates the program under its original id, so the mentor
 * assignment, the candidates' enrolments and the attendance records all point
 * at it again. Deleting permanently is the one thing here with no undo, so it
 * asks for the program's name twice.
 */

type DeletedProgram = {
  id: string;
  programId: string;
  programName: string;
  assignedMentorName: string;
  assignedMentorEmail: string;
  deletedAt: string | null;
};

const ENDPOINT = "/api/pgp-management/programs-pgp/recycle-bin";

export default function RecycleBinData() {
  const [rows, setRows] = useState<DeletedProgram[]>([]);
  const [purging, setPurging] = useState<DeletedProgram | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(ENDPOINT, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setRows(data.programs || []);
      }
    } catch (error) {
      console.error("Recycle bin load error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function refresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  async function restore(row: DeletedProgram) {
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: row.id }),
      });
      const data = await res.json();
      setMessage(data.message || (res.ok ? "Program restored." : "Restore failed."));
      await load();
    } catch {
      setMessage("Restore failed. Check your connection.");
    }
  }

  /** Resolves to an error message, or "" when the record was destroyed. */
  async function purge(row: DeletedProgram): Promise<string> {
    try {
      const res = await fetch(ENDPOINT, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: row.id, confirmName: row.programName }),
      });
      const data = await res.json();

      if (!res.ok) return data.message || "Delete failed.";

      setPurging(null);
      setMessage(data.message || "Program permanently deleted.");
      await load();
      return "";
    } catch {
      return "Delete failed. Check your connection.";
    }
  }

  return (
    <div className="text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-3 py-2 dark:border-white/10">
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 text-lg font-black text-slate-900 dark:text-white">
            <Trash2 size={18} className="text-blue-900" />
            Recycle Bin
          </span>
          <span className="text-slate-400">
            {rows.length} deleted program{rows.length === 1 ? "" : "s"}
          </span>
        </div>

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

      {loading ? (
        <p className="p-4 text-slate-500">Loading the recycle bin…</p>
      ) : (
        <div className="p-3">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/5">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-[11px]">
                <thead className="bg-[#0b2f5b] text-[9px] uppercase tracking-wider text-white">
                  <tr>
                    <th className="px-2.5 py-1.5 font-bold">Program</th>
                    <th className="px-2.5 py-1.5 font-bold">Mentor</th>
                    <th className="px-2.5 py-1.5 font-bold">Deleted</th>
                    <th className="px-2.5 py-1.5 font-bold"></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-3 py-4 text-center text-slate-500">
                        The recycle bin is empty.
                      </td>
                    </tr>
                  ) : (
                    rows.map((row) => (
                      <tr
                        key={row.id}
                        className="group border-b border-slate-100 transition hover:bg-slate-50 dark:border-white/5 dark:hover:bg-white/5"
                      >
                        <td className="px-2.5 py-1.5 font-bold text-slate-900 dark:text-slate-100">
                          {row.programName}
                        </td>
                        <td className="px-2.5 py-1.5 text-slate-600 dark:text-slate-300">
                          {row.assignedMentorName || (
                            <span className="text-slate-400">Not assigned</span>
                          )}
                        </td>
                        <td className="px-2.5 py-1.5 text-slate-500">
                          {row.deletedAt ? new Date(row.deletedAt).toLocaleString() : "—"}
                        </td>
                        <td className="px-2.5 py-1.5 text-right">
                          {/* Shown on hover, as on the programs list. */}
                          <span className="inline-flex items-center gap-0.5 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
                            <button
                              type="button"
                              onClick={() => restore(row)}
                              title="Restore this program"
                              aria-label={`Restore ${row.programName}`}
                              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold text-blue-900 transition hover:bg-blue-50 dark:text-sky-300 dark:hover:bg-white/10"
                            >
                              <Undo2 size={13} />
                              Restore
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setMessage("");
                                setPurging(row);
                              }}
                              title="Delete permanently"
                              aria-label={`Delete ${row.programName} permanently`}
                              className="inline-flex rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-white/10"
                            >
                              <Trash size={14} />
                            </button>
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <PortalToast message={message} onDismiss={() => setMessage("")} />

      {purging && (
        <DeleteProgramDialog
          programName={purging.programName}
          permanent
          onCancel={() => setPurging(null)}
          onConfirm={() => purge(purging)}
        />
      )}
    </div>
  );
}
