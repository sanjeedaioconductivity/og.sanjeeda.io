"use client";

import { useEffect, useState } from "react";
import { Users } from "lucide-react";

/**
 * Attendance for one program as management sees it: every enrolled candidate
 * against every scheduled week, read-only. The marks are the mentor's (set on
 * the mentor portal's Attendance tab); this only shows who was there.
 */

type Candidate = {
  fullName: string;
  email: string;
  conducted: number;
  attended: number;
  percent: number;
  weeks: { week: string; status: string }[];
};

/** Every cell is ruled, so the weeks read across as a grid. */
const CELL = "border border-slate-300 px-2 py-1 dark:border-white/20";

export default function ProgramAttendanceGrid({ programId }: { programId: string }) {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [weeks, setWeeks] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const res = await fetch(`/api/pgp-management/attendance/${programId}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (cancelled) return;
      if (!res.ok) {
        setError(data.message || "Failed to load attendance.");
        return;
      }
      const list: Candidate[] = data.candidates || [];
      setCandidates(list);
      // Every candidate carries the same week list; take it from the first.
      setWeeks((list[0]?.weeks || []).map((w) => w.week));
    }

    load()
      .catch(() => {
        if (!cancelled) setError("Failed to load attendance.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [programId]);

  if (loading) {
    return <p className="px-3 py-4 text-sm text-slate-500">Loading attendance…</p>;
  }

  if (error) {
    return (
      <p className="m-3 rounded-lg bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">
        {error}
      </p>
    );
  }

  if (candidates.length === 0) {
    return (
      <div className="p-8 text-center">
        <Users size={26} className="mx-auto text-slate-300" />
        <p className="mt-2 text-sm font-bold text-slate-500">No candidates enrolled</p>
        <p className="mt-1 text-xs text-slate-400">
          Attendance appears once candidates are assigned to this program.
        </p>
      </div>
    );
  }

  return (
    <div className="px-3 py-3">
      {/* Centred, and ruled: one border per cell. */}
      <div className="mx-auto w-fit max-w-full overflow-x-auto">
        <table className="w-auto border-collapse text-left text-[11px] font-normal leading-snug text-slate-800 dark:text-slate-100">
          <thead>
            <tr>
              <th className={`${CELL} text-center font-normal`}>#</th>
              <th className={`${CELL} font-normal`}>Candidate</th>
              {weeks.map((w) => (
                <th key={w} className={`${CELL} whitespace-nowrap text-center font-normal`}>
                  {w}
                </th>
              ))}
              <th className={`${CELL} text-center font-normal`}>Attended</th>
              <th className={`${CELL} text-center font-normal`}>%</th>
            </tr>
          </thead>
          <tbody>
            {candidates.map((c, index) => (
              <tr key={c.email}>
                <td className={`${CELL} text-center tabular-nums text-slate-400`}>{index + 1}</td>
                <td className={`${CELL} whitespace-nowrap text-slate-800 dark:text-slate-100`}>
                  {c.fullName || c.email}
                </td>
                {c.weeks.map((w) => (
                  <td key={w.week} className={`${CELL} whitespace-nowrap text-center`}>
                    {w.status || <span className="text-slate-300">—</span>}
                  </td>
                ))}
                <td className={`${CELL} text-center tabular-nums`}>
                  {c.attended}/{c.conducted}
                </td>
                <td className={`${CELL} text-center tabular-nums`}>
                  {c.conducted ? `${c.percent}%` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
