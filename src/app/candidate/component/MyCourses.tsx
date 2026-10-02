"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Eye, GraduationCap, LogOut, RefreshCw, Star } from "lucide-react";
import PortalToast from "@/components/portal/PortalToast";

/**
 * "My Courses" — the programs this candidate has already joined, as a plain
 * ruled table (no cards). The catalog to join more lives on "Offered
 * Programs"; this screen is only what is already theirs.
 */

type Program = {
  programId: string;
  programName: string;
  status: string;
  mentorName: string;
  weeks: number;
  portfolioItems: number;
  capstoneItems: number;
};

const STATUS_PILL: Record<string, string> = {
  Active: "bg-emerald-50 text-emerald-600 ring-emerald-100",
  Completed: "bg-blue-50 text-blue-600 ring-blue-100",
  Draft: "bg-slate-50 text-slate-500 ring-slate-200",
  Paused: "bg-amber-50 text-amber-600 ring-amber-100",
};

function StatusPill({ status }: { status?: string }) {
  if (!status) return <span className="text-slate-300">—</span>;
  const style = STATUS_PILL[status] || "bg-slate-50 text-slate-500 ring-slate-200";
  return (
    <span className={`rounded-full px-2 py-0.5 text-[9px] font-medium uppercase ring-1 ring-inset ${style}`}>
      {status}
    </span>
  );
}

/** Every cell is ruled, so the columns read as a grid. */
const CELL = "border border-slate-300 px-2.5 py-1.5 dark:border-white/20";

export default function MyCourses() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [enrolledIds, setEnrolledIds] = useState<string[]>([]);
  const [activeId, setActiveId] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [message, setMessage] = useState("");
  const [user, setUser] = useState<{ email?: string; fullName?: string }>({});

  const load = useCallback(async (email?: string) => {
    const e =
      email ??
      (() => {
        try {
          return JSON.parse(localStorage.getItem("candidateUser") || "{}").email;
        } catch {
          return "";
        }
      })();
    try {
      const res = await fetch(`/api/pgp-candidate/programs?email=${encodeURIComponent(e || "")}`, {
        cache: "no-store",
      });
      const data = await res.json();
      setPrograms(data.programs || []);
      setEnrolledIds(data.enrolledProgramIds || []);
      setActiveId(data.activeProgramId || "");
    } catch (error) {
      console.error("My Courses load error:", error);
    }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("candidateUser");
    const u = saved ? JSON.parse(saved) : {};
    setUser(u);
    void load(u.email).finally(() => setLoading(false));
  }, [load]);

  async function refresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  async function act(program: Program, action: "setActive" | "leave") {
    setBusyId(program.programId);
    try {
      const res = await fetch("/api/pgp-candidate/programs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, fullName: user.fullName, programId: program.programId, action }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.message || "Something went wrong.");
        return;
      }
      setEnrolledIds(data.enrolledProgramIds || []);
      setActiveId(data.activeProgramId || "");
      setMessage(data.message || "");
    } catch {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setBusyId("");
    }
  }

  const myPrograms = programs.filter((p) => enrolledIds.includes(p.programId));

  return (
    <div className="text-sm">
      <div className="mb-3 flex items-center justify-between gap-3 rounded-xl bg-red-600 px-5 py-4 text-white">
        <h2 className="text-base font-black sm:text-lg">My Courses</h2>
        <button
          type="button"
          onClick={refresh}
          disabled={refreshing}
          title="Refresh"
          className="shrink-0 rounded-lg p-2 text-white/80 transition hover:bg-white/10 hover:text-white disabled:opacity-60"
        >
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
        </button>
      </div>

      {loading ? (
        <p className="px-1 py-4 text-slate-500">Loading your courses…</p>
      ) : (
        <div className="max-w-full overflow-x-auto">
          <table className="w-full border-collapse text-left text-[11px] leading-snug text-slate-800 dark:text-slate-100">
            <thead>
              <tr>
                <th className={`${CELL} text-center font-bold`}>#</th>
                <th className={`${CELL} font-bold`}>Program</th>
                <th className={`${CELL} font-bold`}>Mentor</th>
                <th className={`${CELL} text-center font-bold`}>Weeks</th>
                <th className={`${CELL} text-center font-bold`}>Portfolio</th>
                <th className={`${CELL} text-center font-bold`}>Capstone</th>
                <th className={`${CELL} font-bold`}>Status</th>
                <th className={`${CELL} text-center font-bold`}>Active</th>
                <th className={`${CELL} font-bold`}></th>
              </tr>
            </thead>
            <tbody>
              {myPrograms.length === 0 ? (
                <tr>
                  <td colSpan={9} className={`${CELL} text-center text-slate-500`}>
                    <span className="flex flex-col items-center gap-1 py-3">
                      <GraduationCap size={20} className="text-slate-300" />
                      Nothing here yet — join a program from Offered Programs.
                    </span>
                  </td>
                </tr>
              ) : (
                myPrograms.map((p, index) => {
                  const isActive = activeId === p.programId;
                  const busy = busyId === p.programId;
                  return (
                    <tr key={p.programId}>
                      <td className={`${CELL} text-center tabular-nums text-slate-400`}>{index + 1}</td>
                      <td className={`${CELL} max-w-[16rem] font-medium text-slate-900 dark:text-white`}>
                        {p.programName}
                      </td>
                      <td className={`${CELL} whitespace-nowrap`}>{p.mentorName || <span className="text-slate-300">—</span>}</td>
                      <td className={`${CELL} text-center tabular-nums`}>{p.weeks}</td>
                      <td className={`${CELL} text-center tabular-nums`}>{p.portfolioItems}</td>
                      <td className={`${CELL} text-center tabular-nums`}>{p.capstoneItems}</td>
                      <td className={CELL}>
                        <StatusPill status={p.status} />
                      </td>
                      <td className={`${CELL} text-center`}>
                        <button
                          type="button"
                          disabled={busy || isActive}
                          onClick={() => act(p, "setActive")}
                          title={isActive ? "Your active program" : "Make active"}
                          className={`inline-grid h-6 w-6 place-items-center rounded transition ${
                            isActive
                              ? "text-amber-500"
                              : "text-slate-300 hover:bg-slate-100 hover:text-amber-500 dark:hover:bg-white/10"
                          }`}
                        >
                          <Star size={14} className={isActive ? "fill-amber-400" : ""} />
                        </button>
                      </td>
                      <td className={`${CELL} whitespace-nowrap text-right`}>
                        <span className="inline-flex items-center gap-1">
                          <Link
                            href={`/candidate/program/${p.programId}`}
                            title="View full program"
                            className="inline-grid h-6 w-6 place-items-center rounded text-[#0b2f5b] transition hover:bg-slate-100 dark:text-sky-300 dark:hover:bg-white/10"
                          >
                            <Eye size={14} />
                          </Link>
                          {!isActive && (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => act(p, "leave")}
                              title="Leave program"
                              className="inline-grid h-6 w-6 place-items-center rounded text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-60 dark:hover:bg-white/10"
                            >
                              <LogOut size={13} />
                            </button>
                          )}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      <PortalToast message={message} onDismiss={() => setMessage("")} />
    </div>
  );
}
