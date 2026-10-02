"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Eye, GraduationCap, RefreshCw } from "lucide-react";

type WeekRow = { week: string; status: string };

type Summary = {
  present: number;
  absent: number;
  late: number;
  excused: number;
  total: number;
  conducted: number;
  attended: number;
  percent: number;
};

type Course = {
  programId: string;
  programName: string;
  instructorName: string;
  isActive: boolean;
  weeks: WeekRow[];
  summary: Summary;
};

type AttendanceData = {
  enrolled: boolean;
  candidateName: string;
  activeProgramId: string;
  courses: Course[];
};

// The detail table shows a simple Present / Absent column, so every recorded
// mark is folded into one of those two (Late counts as attended, Excused as
// not). Unmarked weeks show a dash.
function simpleStatus(status: string): "Present" | "Absent" | "" {
  if (status === "Present" || status === "Late") return "Present";
  if (status === "Absent" || status === "Excused") return "Absent";
  return "";
}

/** Every cell is ruled, so the columns read as a grid. */
const CELL = "border border-slate-300 px-2.5 py-1.5 dark:border-white/20";

export default function CandidateAttendance() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<AttendanceData | null>(null);
  const [selected, setSelected] = useState<Course | null>(null);

  const load = useCallback(async () => {
    let email = "";
    try {
      email = JSON.parse(localStorage.getItem("candidateUser") || "{}").email || "";
    } catch {
      /* ignore */
    }
    if (!email) return;
    try {
      const res = await fetch(
        `/api/pgp-candidate/attendance?email=${encodeURIComponent(email)}`
      );
      const json = (await res.json()) as AttendanceData;
      setData(json);
    } catch (error) {
      console.error("Candidate attendance load error:", error);
    }
  }, []);

  useEffect(() => {
    void load().finally(() => setLoading(false));
  }, [load]);

  async function refresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  if (loading) {
    return <p className="px-1 py-4 text-sm text-slate-500">Loading your attendance…</p>;
  }

  // Tolerate an unexpected / stale response shape: only ever iterate a real array.
  const courses: Course[] = Array.isArray(data?.courses) ? data.courses : [];

  if (!data || !data.enrolled || courses.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center shadow-sm dark:border-white/10 dark:bg-white/5">
        <GraduationCap size={26} className="mx-auto text-slate-300" />
        <p className="mt-2 text-sm font-semibold text-slate-500">
          Not enrolled in a program yet
        </p>
        <p className="mt-1 text-xs text-slate-400">
          Join a program from Offered Programs and your weekly attendance will
          show here.
        </p>
      </div>
    );
  }

  return (
    <div className="p-3 text-sm dark:bg-white/5 -mt-5">
      <div className="mb-3 rounded-xl bg-red-600 px-5 py-4 text-left text-white">
        <h1 className="text-base font-black sm:text-lg">Attendance</h1>
      </div>

      <div className="w-fit max-w-full overflow-x-auto rounded-xl border border-slate-300 dark:border-white/20">
        <table className="border-collapse text-left text-[11px] leading-snug text-slate-800 dark:text-slate-100">
          <thead>
            <tr>
              <th className={`${CELL} text-center font-bold`}>#</th>
              <th className={`${CELL} font-bold`}>Course</th>
              <th className={`${CELL} font-bold`}>Instructor</th>
              <th className={`${CELL} text-center font-bold`}>Conducted</th>
              <th className={`${CELL} text-center font-bold`}>Attended</th>
              <th className={`${CELL} text-center font-bold`}>Percentage</th>
              <th className={`${CELL} text-center font-bold`}>View</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((c, index) => {
              const sum = c.summary ?? { conducted: 0, attended: 0, percent: 0 };
              return (
                <tr key={c.programId}>
                  <td className={`${CELL} text-center tabular-nums text-xs`}>{index + 1}</td>
                  <td className={`${CELL} max-w-[10rem]`}>
                    {c.programName || "—"}
                    {c.isActive && (
                      <span className="ml-1.5 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-medium uppercase text-emerald-600 ring-1 ring-inset ring-emerald-100">
                        Active
                      </span>
                    )}
                  </td>
                  <td className={CELL}>
                    {c.instructorName || <span className="text-slate-300">Not assigned</span>}
                  </td>
                  <td className={`${CELL} text-center tabular-nums`}>{sum.conducted}</td>
                  <td className={`${CELL} text-center tabular-nums`}>{sum.attended}</td>
                  <td className={`${CELL} text-center tabular-nums`}>
                    <span
                      className={
                        sum.percent >= 75
                          ? "text-emerald-600"
                          : sum.percent >= 50
                          ? "text-amber-600"
                          : "text-rose-600"
                      }
                    >
                      {sum.conducted ? `${sum.percent}%` : "—"}
                    </span>
                  </td>
                  <td className={`${CELL} text-center`}>
                    <button
                      type="button"
                      onClick={() => setSelected(c)}
                      title="View attendance detail"
                      aria-label="View attendance detail"
                      className="inline-grid h-6 w-6 place-items-center rounded text-[#0b2f5b] transition hover:bg-slate-100 dark:text-sky-300 dark:hover:bg-white/10"
                    >
                      <Eye size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Opens beside the table as a side panel, like the sidebar's own mobile
          drawer, rather than replacing the list. */}
      {selected && (
        <AttendanceDetail
          programName={selected.programName}
          candidateName={data.candidateName}
          instructorName={selected.instructorName}
          conducted={selected.summary?.conducted ?? 0}
          attended={selected.summary?.attended ?? 0}
          weeks={selected.weeks ?? []}
          onBack={() => setSelected(null)}
        />
      )}
    </div>
  );
}

function AttendanceDetail({
  programName,
  candidateName,
  instructorName,
  conducted,
  attended,
  weeks,
  onBack,
}: {
  programName: string;
  candidateName: string;
  instructorName: string;
  conducted: number;
  attended: number;
  weeks: WeekRow[];
  onBack: () => void;
}) {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onBack();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onBack]);

  return (
    <div className="fixed inset-0 z-[70]">
      <div className="absolute inset-0 bg-black/30" onClick={onBack} />

      {/* Slides in beside the table rather than replacing it, the way the
          sidebar's own mobile drawer opens over the page. */}
      <aside
        role="dialog"
        aria-label="Attendance detail"
        className="absolute right-0 top-header h-[calc(100vh-var(--header-h))] w-[min(92vw,28rem)] overflow-y-auto rounded-l-2xl bg-white shadow-2xl dark:bg-[#0b1736]"
      >
        <div className="flex items-center gap-2 bg-red-600 px-5 py-4 text-white">
          <button
            type="button"
            onClick={onBack}
            title="Close"
            aria-label="Close"
            className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-white/80 transition hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft size={16} />
          </button>
          <h1 className="text-base font-black sm:text-lg">Attendance</h1>
        </div>

        <div className="space-y-5 p-5">
          <dl className="space-y-1.5">
            <Info label="Course" value={programName || "—"} />
            <Info label="Candidate" value={candidateName || "—"} />
            <Info label="Instructor" value={instructorName || "Not assigned"} />
            <Info label="Conducted" value={String(conducted)} />
            <Info label="Attended" value={String(attended)} />
          </dl>

          <div className="max-w-full overflow-x-auto rounded-xl border border-slate-300 dark:border-white/20">
            <table className="w-full border-collapse text-left text-[11px] leading-snug text-slate-800 dark:text-slate-100">
              <thead>
                <tr>
                  <th className={`${CELL} font-bold`}>Week</th>
                  <th className={`${CELL} font-bold`}>Status</th>
                </tr>
              </thead>
              <tbody>
                {weeks.length === 0 ? (
                  <tr>
                    <td colSpan={2} className={`${CELL} text-center text-slate-400`}>
                      No weekly sessions scheduled yet.
                    </td>
                  </tr>
                ) : (
                  weeks.map((w, i) => {
                    const simple = simpleStatus(w.status);
                    return (
                      <tr key={w.week || i}>
                        <td className={CELL}>{w.week || `Week ${i + 1}`}</td>
                        <td className={CELL}>
                          {simple === "Present" ? (
                            <span className="text-emerald-600">Present</span>
                          ) : simple === "Absent" ? (
                            <span className="text-rose-600">Absent</span>
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
        </div>
      </aside>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-1.5 text-xs">
      <dt className="shrink-0 text-slate-400">{label}:</dt>
      <dd className="truncate text-slate-800 dark:text-slate-100">{value}</dd>
    </div>
  );
}
