"use client";

import { useCallback, useEffect, useState } from "react";
import { BookOpen, Check, Loader2, Plus, RefreshCw } from "lucide-react";
import PortalToast from "@/components/portal/PortalToast";
import { CandidateBreadcrumb } from "@/app/candidate/component/CandidateShell";

/**
 * "Offered Programs" — every program PGP admin has created, whether or not
 * this candidate has joined it. A plain ruled table with one action per row:
 * Join. Programs already joined show as such — managing them (viewing,
 * leaving, setting active) is My Courses' job, not this catalog's.
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

export default function OfferedPrograms() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [enrolledIds, setEnrolledIds] = useState<string[]>([]);
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
    } catch (error) {
      console.error("Offered Programs load error:", error);
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

  async function join(program: Program) {
    setBusyId(program.programId);
    try {
      const res = await fetch("/api/pgp-candidate/programs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          fullName: user.fullName,
          programId: program.programId,
          action: "join",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.message || "Something went wrong.");
        return;
      }
      setEnrolledIds(data.enrolledProgramIds || []);
      setMessage(data.message || "");
    } catch {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setBusyId("");
    }
  }

  return (
    <div className="text-sm">
      <CandidateBreadcrumb items={["My Courses", "Offered Programs"]} />

      <div className="mb-3 flex items-start justify-between gap-3 rounded-xl bg-red-600 px-5 py-4 text-white">
        <div>
          <h2 className="text-base font-black sm:text-lg">About PGP Programs</h2>
          <p className="mt-0.5 text-sm text-white/85">
            Browse the training programs mentors are currently running and
            enroll in the one that matches your goals.
          </p>
        </div>
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
        <p className="px-1 py-4 text-slate-500">Loading offered programs…</p>
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
                <th className={`${CELL} font-bold`}></th>
              </tr>
            </thead>
            <tbody>
              {programs.length === 0 ? (
                <tr>
                  <td colSpan={8} className={`${CELL} text-center text-slate-500`}>
                    <span className="flex flex-col items-center gap-1 py-3">
                      <BookOpen size={20} className="text-slate-300" />
                      No programs offered yet.
                    </span>
                  </td>
                </tr>
              ) : (
                programs.map((p, index) => {
                  const enrolled = enrolledIds.includes(p.programId);
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
                      <td className={`${CELL} whitespace-nowrap text-right`}>
                        {enrolled ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600">
                            <Check size={13} />
                            Joined
                          </span>
                        ) : (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => join(p)}
                            title="Join this program"
                            className="inline-flex items-center gap-1 rounded-lg bg-[#0b2f5b] px-2 py-1 text-[10px] font-bold text-white transition hover:bg-[#0b2f5b]/90 disabled:opacity-60"
                          >
                            {busy ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                            Join
                          </button>
                        )}
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
