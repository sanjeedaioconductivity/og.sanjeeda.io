"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Eye, Loader2, RefreshCw } from "lucide-react";
import CandidateAvatar, {
  MentorAvatar,
} from "@/components/portal/CandidateAvatar";
import AdminShell, { MenuButton } from "../../component/AdminShell";

type WeekRow = { week: string; status: string };

type Candidate = {
  fullName: string;
  email: string;
  present: number;
  late: number;
  absent: number;
  excused: number;
  conducted: number;
  attended: number;
  percent: number;
  weeks: WeekRow[];
};

type Program = {
  programId: string;
  programName: string;
  mentorName: string;
  mentorEmail: string;
  totalWeeks: number;
};

// Fold every recorded mark into Present / Absent for the weekly breakdown.
function simpleStatus(status: string): "Present" | "Absent" | "" {
  if (status === "Present" || status === "Late") return "Present";
  if (status === "Absent" || status === "Excused") return "Absent";
  return "";
}

export default function ProgramAttendancePage() {
  const params = useParams();
  const id = String(params.programId || "");

  const [program, setProgram] = useState<Program | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [openEmail, setOpenEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const selected = candidates.find((c) => c.email === openEmail) || null;

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/pgp-management/attendance/${id}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Failed to load attendance.");
        return;
      }
      setProgram(data.program);
      setCandidates(data.candidates || []);
      setError("");
    } catch {
      setError("Failed to load attendance.");
    }
  }, [id]);

  useEffect(() => {
    void load().finally(() => setLoading(false));
  }, [load]);

  async function refresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  return (
    <AdminShell active="programs">
      {(openMenu) => (
      <div className="max-w-5xl">
        <div className="mb-1 flex items-center justify-between">
          <MenuButton onClick={openMenu} />
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
          <div className="grid place-items-center rounded-xl bg-white p-10 text-slate-400 shadow-sm dark:bg-white/5">
            <Loader2 size={20} className="animate-spin" />
          </div>
        ) : error || !program ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-sm font-semibold text-rose-700">
            {error || "Program not found."}
          </div>
        ) : (
          <>
            <dl className="mb-2 grid grid-cols-1 gap-y-0.5">
              <div className="flex items-baseline gap-1">
                <dt className="shrink-0 font-serif text-base font-bold text-slate-800 dark:text-white">
                  Program:
                </dt>
                <dd className="truncate font-serif text-base font-bold text-slate-800 dark:text-slate-100">
                  {program.programName}
                </dd>
              </div>
              <div className="flex items-baseline gap-1">
                <dt className="shrink-0 font-serif text-base font-bold text-slate-800 dark:text-white">
                  Mentor Name:
                </dt>
                <dd className="flex items-center gap-1.5 font-serif text-base font-bold text-slate-800 dark:text-slate-100">
                  {program.mentorName && (
                    <MentorAvatar
                      email={program.mentorEmail}
                      name={program.mentorName}
                      size={22}
                    />
                  )}
                  <span className="truncate">
                    {program.mentorName || "Not assigned"}
                  </span>
                </dd>
              </div>
              <div className="flex items-baseline gap-1">
                <dt className="shrink-0 font-serif text-base font-bold text-slate-800 dark:text-white">
                  Candidates:
                </dt>
                <dd className="font-serif text-base font-bold text-slate-800 dark:text-slate-100">
                  {candidates.length}
                </dd>
              </div>
            </dl>

            <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
              {/* Left — candidate attendance summary */}
              <div className="min-w-0 shrink-0 overflow-hidden rounded-xl border border-slate-200 dark:border-white/10">
                <table className="w-full border-collapse text-left text-xs">
                  <thead className="bg-[#0b2f5b] text-[10px] uppercase tracking-wider text-white">
                    <tr>
                      <th className="px-3 py-2 font-bold">#</th>
                      <th className="px-3 py-2 font-bold">Candidate</th>
                      <th className="px-3 py-2 text-center font-bold">Conducted</th>
                      <th className="px-3 py-2 text-center font-bold">Attended</th>
                      <th className="px-3 py-2 text-center font-bold">%</th>
                      <th className="px-3 py-2 text-center font-bold">View</th>
                    </tr>
                  </thead>
                  <tbody>
                    {candidates.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-2 py-4 text-center text-slate-400"
                        >
                          No candidates enrolled in this program yet.
                        </td>
                      </tr>
                    ) : (
                      candidates.map((c, i) => {
                        const open = openEmail === c.email;
                        return (
                          <tr
                            key={c.email || i}
                            className={`border-b border-slate-100 dark:border-white/5 ${
                              open ? "bg-blue-50 dark:bg-white/10" : ""
                            }`}
                          >
                            <td className="px-3 py-2 text-slate-400">{i + 1}</td>
                            <td className="px-3 py-2 font-bold text-slate-900 dark:text-slate-100">
                              <span className="flex items-center gap-2">
                                <CandidateAvatar
                                  email={c.email}
                                  name={c.fullName}
                                  size={24}
                                />
                                {c.fullName || "—"}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-center font-bold tabular-nums text-slate-700 dark:text-slate-200">
                              {c.conducted}
                            </td>
                            <td className="px-3 py-2 text-center font-bold tabular-nums text-emerald-600">
                              {c.attended}
                            </td>
                            <td className="px-3 py-2 text-center">
                              <span
                                className={`font-black tabular-nums ${
                                  c.percent >= 75
                                    ? "text-emerald-600"
                                    : c.percent >= 50
                                    ? "text-amber-600"
                                    : "text-rose-600"
                                }`}
                              >
                                {c.conducted ? `${c.percent}%` : "—"}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-center">
                              <button
                                type="button"
                                onClick={() => setOpenEmail(open ? "" : c.email)}
                                title="View weekly attendance"
                                aria-label="View weekly attendance"
                                aria-expanded={open}
                                className="inline-grid place-items-center text-[#0b2f5b] transition hover:text-blue-950 dark:text-sky-300 dark:hover:text-sky-200"
                              >
                                <Eye size={16} />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div> 

              {/* Left — weekly attendance for the selected candidate,
                  styled like the candidate portal's attendance detail table */}
              {selected && (
                <div className="w-full shrink-0 overflow-hidden rounded-xl border border-slate-200 dark:border-white lg:w-[32rem]">
                  <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 dark:bg-white/5">
                    <CandidateAvatar
                      email={selected.email}
                      name={selected.fullName}
                      size={22}
                    />
                    <div className="min-w-0">
                      <p className="truncate font-serif text-sm font-bold text-slate-900 dark:text-white">
                        {selected.fullName || "—"}
                      </p>
                      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                        Weekly attendance
                      </p>
                    </div>
                  </div>
                  <table className="w-full border-collapse text-left text-xs">
                    <thead className="bg-[#0b2f5b] text-[10px] uppercase tracking-wider text-white">
                      <tr>
                        <th className="px-3 py-1.5 font-serif font-bold">No of Week</th>
                        <th className="px-3 py-1.5 font-serif font-bold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selected.weeks.length === 0 ? (
                        <tr>
                          <td
                            colSpan={2}
                            className="px-3 py-3 text-center font-serif text-slate-400"
                          >
                            No weekly sessions scheduled yet.
                          </td>
                        </tr>
                      ) : (
                        selected.weeks.map((w, k) => {
                          const s = simpleStatus(w.status);
                          return (
                            <tr
                              key={w.week || k}
                              className="border-b border-slate-100 bg-slate-300 dark:border-white/5 dark:bg-slate-200"
                            >
                              <td className="px-3 py-1 font-normal text-slate-700 dark:bg-slate-200 dark:text-slate-700">
                                {w.week || `Week ${k + 1}`}
                              </td>
                              <td className="px-3 py-1">
                                {s === "Present" ? (
                                  <span className="font-normal text-emerald-600">
                                    Present
                                  </span>
                                ) : s === "Absent" ? (
                                  <span className="font-normal text-rose-600">
                                    Absent
                                  </span>
                                ) : (
                                  <span className="text-slate-300">—</span>
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



            </div>
          </>
        )}
      </div>
      )}
    </AdminShell>
  );
}
