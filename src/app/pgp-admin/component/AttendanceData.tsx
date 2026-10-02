"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarCheck, RefreshCw, Eye } from "lucide-react";
import { MentorAvatar } from "@/components/portal/CandidateAvatar";

type ProgramRow = {
  programId: string;
  programName: string;
  mentorName: string;
  mentorEmail: string;
  studentCount: number;
};

export default function AttendanceData() {
  const [programs, setPrograms] = useState<ProgramRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    try {
      const res = await fetch("/api/pgp-management/enrollments");
      const data = await res.json();
      setPrograms(data.programs || []);
    } catch (error) {
      console.error("Attendance load error:", error);
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

  return (
    <div className="text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-2.5 py-1.5 dark:border-white/10">
        <span className="flex items-center gap-1.5 text-lg font-black text-slate-900 dark:text-white">
          <CalendarCheck size={18} className="text-blue-900" />
          Attendance
        </span>
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-semibold text-slate-400">
            {programs.length} program{programs.length === 1 ? "" : "s"}
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

      {loading ? (
        <p className="p-4 text-slate-500 dark:text-slate-400">Loading attendance…</p>
      ) : programs.length === 0 ? (
        <div className="p-10 text-center">
          <CalendarCheck size={26} className="mx-auto text-slate-300" />
          <p className="mt-2 text-sm font-bold text-slate-500">No programs yet</p>
        </div>
      ) : (
        <div className="p-3">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/5">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-[11px]">
                <thead className="bg-[#0b2f5b] text-[9px] uppercase tracking-wider text-white">
                  <tr>
                    <th className="px-2.5 py-1.5 font-bold">Program Name</th>
                    <th className="px-2.5 py-1.5 font-bold">Mentor Name</th>
                    <th className="px-2.5 py-1.5 text-center font-bold">Candidates</th>
                    <th className="px-2.5 py-1.5 text-center font-bold">View</th>
                  </tr>
                </thead>
                <tbody>
                  {programs.map((p) => (
                    <tr
                      key={p.programId}
                      className="border-b border-slate-100 dark:border-white/5"
                    >
                      <td className="px-2.5 py-1.5 font-bold text-slate-900 dark:text-slate-100">
                        {p.programName}
                      </td>
                      <td className="px-2.5 py-1.5 text-slate-600 dark:text-slate-300">
                        <span className="flex items-center gap-2">
                          {p.mentorName && (
                            <MentorAvatar
                              email={p.mentorEmail}
                              name={p.mentorName}
                              size={22}
                            />
                          )}
                          {p.mentorName || "Not assigned"}
                        </span>
                      </td>
                      <td className="px-2.5 py-1.5 text-center font-black tabular-nums text-blue-900 dark:text-sky-300">
                        {p.studentCount}
                      </td>
                      <td className="px-2.5 py-1.5 text-center">
                        <Link
                          href={`/pgp-admin/attendance/${p.programId}`}
                          title="View program attendance"
                          aria-label="View program attendance"
                          className="inline-grid place-items-center text-[#0b2f5b] transition hover:text-blue-950 dark:text-sky-300 dark:hover:text-sky-200"
                        >
                          <Eye size={15} />
                        </Link>
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
