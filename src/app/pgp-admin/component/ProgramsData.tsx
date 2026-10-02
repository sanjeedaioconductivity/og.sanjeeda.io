"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, ExternalLink, Plus, RefreshCw, Trash2 } from "lucide-react";
import { MentorAvatar } from "@/components/portal/CandidateAvatar";
import PortalToast from "@/components/portal/PortalToast";
import DeleteProgramDialog from "./DeleteProgramDialog";
import ProgramAccessMenu, { type ProgramAccess } from "./ProgramAccessMenu";
import type { Program } from "./pgpProgram";

/**
 * The Programs tab: the list, and nothing else. Reading, writing and changing
 * a program all happen on its own page (/pgp-admin/program/<id>, see
 * `ProgramEditor`) — a row click opens it here, the arrow opens it in a new
 * browser tab, and "New" opens the editor for a blank program.
 *
 * A program is deleted from here, behind a dialog that makes the admin type
 * its name. Deleting moves it to the recycle bin — General Setting › Recycle
 * Bin — so a program removed by mistake can be put back whole.
 */

export default function ProgramsData() {
  const router = useRouter();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [confirming, setConfirming] = useState<Program | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const listRes = await fetch("/api/pgp-management/programs-pgp", {
        cache: "no-store",
      });
      const data = await listRes.json();
      setPrograms(data.programs || []);
    } catch (error) {
      console.error("Programs loading error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function refresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  /**
   * Writes an access change back into the row. The menu owns the PATCH and calls
   * this twice on a failure — once optimistically, once to roll back — so this
   * only mirrors state and never reloads: a full refetch here would discard the
   * optimistic tick and make every checkbox feel a request behind.
   */
  function applyAccess(target: Program, next: ProgramAccess) {
    setPrograms((rows) =>
      rows.map((row) =>
        row.programId === target.programId ? { ...row, ...next } : row
      )
    );
  }

  /** Resolves to an error message, or "" when the program was deleted. */
  async function deleteProgram(program: Program): Promise<string> {
    try {
      const res = await fetch("/api/pgp-management/programs-pgp", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          programId: program.programId,
          confirmName: program.programName,
        }),
      });
      const data = await res.json();

      if (!res.ok) return data.message || "Delete failed.";

      setConfirming(null);
      setMessage(data.message || "Program moved to the recycle bin.");
      await loadData();
      return "";
    } catch {
      return "Delete failed. Check your connection.";
    }
  }

  const assignedCount = useMemo(
    () => programs.filter((p) => p.assignedMentorId).length,
    [programs]
  );

  return (
    <div className="text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-white/10 px-3 py-2">
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 text-lg font-black text-slate-900 dark:text-white">
            <BookOpen size={18} className="text-blue-900" />
            Programs
          </span>
          <span className="text-slate-400">
            {programs.length} total · {assignedCount} assigned
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.push("/pgp-admin/program/new")}
            className="flex items-center gap-1.5 rounded-lg text-xs font-bold"
          >
            <Plus size={13} />
            New
          </button>
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

      {loading ? (
        <p className="p-4 text-slate-500">Loading programs...</p>
      ) : (
        <div className="p-3">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/5">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-[11px]">
                <thead className="bg-[#0b2f5b] text-[9px] uppercase tracking-wider text-white">
                  <tr>
                    <th className="px-2.5 py-1.5 font-bold">Program</th>
                    <th className="px-2.5 py-1.5 font-bold">Mentor</th>
                    <th className="px-2.5 py-1.5 text-center font-bold">Weeks</th>
                    <th className="px-2.5 py-1.5 text-center font-bold">Portfolio</th>
                    <th className="px-2.5 py-1.5 text-center font-bold">Capstone</th>
                    <th className="px-2.5 py-1.5 font-bold">Status</th>
                    <th className="px-2.5 py-1.5 font-bold">Access</th>
                    <th className="px-2.5 py-1.5 font-bold"></th>
                  </tr>
                </thead>

                <tbody>
                  {programs.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-3 py-4 text-center text-slate-500">
                        No programs created.
                      </td>
                    </tr>
                  ) : (
                    programs.map((program) => (
                      <tr
                        key={program.programId}
                        onClick={() => router.push(`/pgp-admin/program/${program.programId}`)}
                        title="Open program"
                        className="group cursor-pointer border-b border-slate-100 transition hover:bg-slate-50 dark:border-white/5 dark:hover:bg-white/5"
                      >
                        <td className="px-2.5 py-1.5 font-bold text-slate-900 dark:text-slate-100">
                          {program.programName || "Untitled program"}
                        </td>
                        <td className="px-2.5 py-1.5 text-slate-600 dark:text-slate-300">
                          <span className="flex items-center gap-2">
                            {program.assignedMentorName && (
                              <MentorAvatar
                                email={program.assignedMentorEmail}
                                name={program.assignedMentorName}
                                size={22}
                              />
                            )}
                            {program.assignedMentorName || (
                              <span className="text-slate-400">Not assigned</span>
                            )}
                          </span>
                        </td>
                        <td className="px-2.5 py-1.5 text-center text-slate-600 dark:text-slate-300">
                          {program.weeklySchedule?.length || 0}
                        </td>
                        <td className="px-2.5 py-1.5 text-center text-slate-600 dark:text-slate-300">
                          {program.portfolioChecklist?.length || 0}
                        </td>
                        <td className="px-2.5 py-1.5 text-center text-slate-600 dark:text-slate-300">
                          {program.capstoneTimeline?.length || 0}
                        </td>
                        <td className="px-2.5 py-1.5">
                          <ProgramStatusPill status={program.status} />
                        </td>
                        {/* Stops a tick from also opening the program page —
                            the whole row is a link to the editor. */}
                        <td
                          className="px-2.5 py-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ProgramAccessMenu
                            programId={program.programId || ""}
                            programName={program.programName}
                            mentorName={program.assignedMentorName || ""}
                            access={{
                              visibleToMentor: Boolean(program.visibleToMentor),
                              visibleToCandidates: Boolean(
                                program.visibleToCandidates
                              ),
                            }}
                            onChange={(next) => applyAccess(program, next)}
                          />
                        </td>
                        <td className="px-2.5 py-1.5 text-right">
                          {/* Shown on hover, as in a file manager. */}
                          <span className="inline-flex items-center gap-0.5 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
                            {/* The same page, in a new browser tab. */}
                            <a
                              href={`/pgp-admin/program/${program.programId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Open program in a new tab"
                              aria-label={`Open ${program.programName || "program"} in a new tab`}
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex rounded-lg p-1.5 text-slate-400 transition hover:bg-blue-50 hover:text-blue-900 dark:hover:bg-white/10 dark:hover:text-white"
                            >
                              <ExternalLink size={14} />
                            </a>
                            <button
                              type="button"
                              title="Delete program"
                              aria-label={`Delete ${program.programName || "program"}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setMessage("");
                                setConfirming(program);
                              }}
                              className="inline-flex rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-white/10"
                            >
                              <Trash2 size={14} />
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

      {confirming && (
        <DeleteProgramDialog
          programName={confirming.programName || "Untitled program"}
          onCancel={() => setConfirming(null)}
          onConfirm={() => deleteProgram(confirming)}
        />
      )}
    </div>
  );
}

const PROGRAM_STATUS_STYLES: Record<string, string> = {
  Active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Completed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Draft: "bg-slate-100 text-slate-600 ring-slate-200",
  Paused: "bg-amber-50 text-amber-700 ring-amber-200",
};

function ProgramStatusPill({ status }: { status?: string }) {
  if (!status) return null;

  const style =
    PROGRAM_STATUS_STYLES[status] || "bg-slate-100 text-slate-600 ring-slate-200";

  return (
    <span
      className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ring-1 ring-inset ${style}`}
    >
      {status}
    </span>
  );
}
