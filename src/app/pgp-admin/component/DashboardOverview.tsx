"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Users,
  UserCog,
  GraduationCap,
  Percent,
  ListChecks,
} from "lucide-react";
import { MentorAvatar } from "@/components/portal/CandidateAvatar";
import type { Program } from "./pgpProgram";

/**
 * What management sees first: the four figures, then the same plain tables the
 * rest of the admin area uses — the programs, their statuses, and the mentors.
 *
 * Refreshing is the page header's (beside the bell): it remounts this, which
 * refetches everything here.
 */

type Candidate = { applicationStatus?: string; status?: string };
type Mentor = {
  mentorId?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  status?: string;
};

const PROGRESS_STATUSES = ["Not Started", "In Progress", "Completed", "Deferred"] as const;

function normalizeStatus(status?: string): (typeof PROGRESS_STATUSES)[number] {
  const value = (status || "").trim();
  if (value === "Delayed") return "Deferred";
  return (PROGRESS_STATUSES as readonly string[]).includes(value)
    ? (value as (typeof PROGRESS_STATUSES)[number])
    : "Not Started";
}

function count<T extends { status?: string }>(items: T[], status: string) {
  return items.filter((i) => normalizeStatus(i.status) === status).length;
}

export default function DashboardOverview() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [cRes, mRes, pRes] = await Promise.all([
        fetch("/api/pgp-management/candidates-pgp"),
        fetch("/api/pgp-management/mentors-pgp"),
        fetch("/api/pgp-management/programs-pgp"),
      ]);
      const [c, m, p] = await Promise.all([cRes.json(), mRes.json(), pRes.json()]);
      setCandidates(c.candidates || []);
      setMentors(m.mentors || []);
      setPrograms(p.programs || []);
    } catch (error) {
      console.error("Dashboard overview load error:", error);
    }
  }, []);

  useEffect(() => {
    void load().finally(() => setLoading(false));
  }, [load]);

  const stats = useMemo(() => {
    const submitted = candidates.filter((c) => c.applicationStatus === "Submitted").length;
    const pending = candidates.length - submitted;
    const activeMentors = mentors.filter((m) => m.status === "Active").length;
    const pendingMentors = mentors.filter((m) => m.status === "Pending").length;
    const activePrograms = programs.filter((p) => p.status === "Active").length;

    let totalItems = 0;
    let completedItems = 0;

    for (const p of programs) {
      totalItems +=
        (p.weeklySchedule?.length || 0) +
        (p.portfolioChecklist?.length || 0) +
        (p.capstoneTimeline?.length || 0);
      completedItems +=
        count(p.weeklySchedule || [], "Completed") +
        count(p.portfolioChecklist || [], "Completed") +
        count(p.capstoneTimeline || [], "Completed");
    }

    const avgCompletion = totalItems
      ? Math.round((completedItems / totalItems) * 100)
      : 0;

    const programStatus = {
      Draft: programs.filter((p) => p.status === "Draft").length,
      Active: activePrograms,
      Completed: programs.filter((p) => p.status === "Completed").length,
      Paused: programs.filter((p) => p.status === "Paused").length,
    };

    return {
      submitted,
      pending,
      activeMentors,
      pendingMentors,
      activePrograms,
      avgCompletion,
      programStatus,
    };
  }, [candidates, mentors, programs]);

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500 dark:border-white/10 dark:bg-white/5">
        Loading dashboard…
      </div>
    );
  }


  return (
    // Light strokes everywhere: the numbers carry the page, not the icons.
    <div className="space-y-4 text-sm [&_svg]:[stroke-width:1.5]">
      {/* The four figures, plainly */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi
          icon={<Users size={16} />}
          label="Candidates"
          value={candidates.length}
          sub={`${stats.submitted} applied · ${stats.pending} pending`}
          tint="bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300"
        />
        <Kpi
          icon={<UserCog size={16} />}
          label="Mentors"
          value={mentors.length}
          sub={
            stats.pendingMentors > 0
              ? `${stats.activeMentors} active · ${stats.pendingMentors} awaiting approval`
              : `${stats.activeMentors} active`
          }
          tint="bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300"
        />
        <Kpi
          icon={<GraduationCap size={16} />}
          label="Programs"
          value={programs.length}
          sub={`${stats.activePrograms} active`}
          tint="bg-amber-50 text-amber-600 dark:bg-amber-400/10 dark:text-amber-300"
        />
        <Kpi
          icon={<Percent size={16} />}
          label="Completion"
          value={`${stats.avgCompletion}%`}
          sub="Across all program items"
          tint="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300"
        />
      </div>

      {/* All three side by side: equal columns, so they read as one row */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Each program as its own block of label/value rows, like the two
            tables beside it — a new program adds a block in this same space. */}
        <TableCard icon={<ListChecks size={14} />} title="Programs">
          {programs.length === 0 ? (
            <p className="px-3 py-4 text-center text-[11px] text-slate-500">No programs yet.</p>
          ) : (
            <div className="space-y-2 p-2 pt-0">
              {programs.map((p) => {
                const total =
                  (p.weeklySchedule?.length || 0) +
                  (p.portfolioChecklist?.length || 0) +
                  (p.capstoneTimeline?.length || 0);
                const done =
                  count(p.weeklySchedule || [], "Completed") +
                  count(p.portfolioChecklist || [], "Completed") +
                  count(p.capstoneTimeline || [], "Completed");
                const pct = total ? Math.round((done / total) * 100) : 0;

                const rows: { label: string; value: React.ReactNode }[] = [
                  {
                    label: "Mentor",
                    value: p.assignedMentorName || (
                      <span className="text-slate-400">Not assigned</span>
                    ),
                  },
                  { label: "Weeks", value: p.weeklySchedule?.length || 0 },
                  { label: "Portfolio", value: p.portfolioChecklist?.length || 0 },
                  { label: "Capstone", value: p.capstoneTimeline?.length || 0 },
                  { label: "Progress", value: `${pct}%` },
                  { label: "Status", value: <ProgramStatusPill status={p.status} /> },
                ];

                return (
                  <table
                    key={p.programId}
                    className="w-full border-collapse text-left text-[11px]"
                  >
                    <thead className="bg-[#0b2f5b] text-[9px] uppercase tracking-wider text-white">
                      <tr>
                        <th colSpan={2} className="px-2.5 py-1.5 font-bold">
                          {p.programName || "Untitled program"}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => (
                        <tr
                          key={row.label}
                          className="border-b border-slate-100 dark:border-white/5"
                        >
                          <td className="px-2.5 py-1.5 text-slate-500 dark:text-slate-400">
                            {row.label}
                          </td>
                          <td className="px-2.5 py-1.5 text-right tabular-nums text-slate-800 dark:text-slate-100">
                            {row.value}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                );
              })}
            </div>
          )}
        </TableCard>

        <TableCard icon={<GraduationCap size={14} />} title="Program Status">
          <table className="w-full border-collapse text-left text-[11px]">
            <thead className="bg-[#0b2f5b] text-[9px] uppercase tracking-wider text-white">
              <tr>
                <th className="px-2.5 py-1.5 font-bold">Status</th>
                <th className="px-2.5 py-1.5 text-right font-bold">Programs</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(stats.programStatus).map(([label, value]) => (
                <tr key={label} className="border-b border-slate-100 dark:border-white/5">
                  <td className="px-2.5 py-1.5 text-slate-600 dark:text-slate-300">{label}</td>
                  <td
                    className={`px-2.5 py-1.5 text-right tabular-nums ${
                      value ? "text-slate-800 dark:text-slate-100" : "text-slate-300"
                    }`}
                  >
                    {value}
                  </td>
                </tr>
              ))}
              <tr className="bg-slate-50 dark:bg-white/5">
                <td className="px-2.5 py-1.5 text-[10px] uppercase tracking-wider text-slate-400">
                  Total
                </td>
                <td className="px-2.5 py-1.5 text-right font-semibold tabular-nums text-slate-800 dark:text-slate-100">
                  {programs.length}
                </td>
              </tr>
            </tbody>
          </table>
        </TableCard>

        {/* One block per mentor — the name across the top, then its rows,
            the same shape as the programs beside it. */}
        <TableCard icon={<UserCog size={14} />} title="Mentors">
          {mentors.length === 0 ? (
            <p className="px-3 py-4 text-center text-[11px] text-slate-500">No mentors yet.</p>
          ) : (
            <div className="space-y-2 p-2 pt-0">
              {mentors.map((m, index) => (
                <table
                  key={m.mentorId || m.email || index}
                  className="w-full border-collapse text-left text-[11px]"
                >
                  <thead className="bg-[#0b2f5b] text-[9px] uppercase tracking-wider text-white">
                    <tr>
                      <th className="px-2.5 py-1.5 font-bold">
                        <span className="flex items-center gap-2">
                          <MentorAvatar email={m.email} name={m.fullName} size={20} />
                          <span className="truncate normal-case">{m.fullName || "Mentor"}</span>
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-100 dark:border-white/5">
                      <td className="max-w-[13rem] truncate px-2.5 py-1.5 text-slate-700 dark:text-slate-200">
                        {m.email || "—"}
                      </td>
                    </tr>
                    <tr className="border-b border-slate-100 dark:border-white/5">
                      <td className="px-2.5 py-1.5 tabular-nums text-slate-700 dark:text-slate-200">
                        {m.phone || <span className="text-slate-300">—</span>}
                      </td>
                    </tr>
                  </tbody>
                </table>
              ))}
            </div>
          )}
        </TableCard>
      </div>
    </div>
  );
}

function Kpi({
  icon,
  label,
  value,
  sub,
  tint,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  sub?: string;
  /** The icon's soft background — the only colour on the card. */
  tint: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-white/5">
      <div className="flex items-center gap-2">
        <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg ${tint}`}>
          {icon}
        </span>
        <span className="truncate text-[11px] text-slate-500 dark:text-slate-400">{label}</span>
      </div>
      <p className="mt-2 text-xl font-semibold leading-none text-slate-800 dark:text-white">
        {value}
      </p>
      {sub && <p className="mt-1 truncate text-[10px] text-slate-400">{sub}</p>}
    </div>
  );
}

/**
 * A titled white card wrapping one table — the Programs tab's frame, sized to
 * its own content so several fit across one row.
 */
function TableCard({
  icon,
  title,
  className = "",
  children,
}: {
  icon: React.ReactNode;
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`flex h-full max-w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 ${className}`}
    >
      <div className="flex items-center gap-1.5 px-3 py-2 text-[11px] font-medium text-slate-500 dark:text-slate-300">
        <span className="text-slate-400">{icon}</span>
        {title}
      </div>
      <div className="max-h-[22rem] flex-1 overflow-auto">{children}</div>
    </div>
  );
}

const PROGRAM_PILL: Record<string, string> = {
  Active: "bg-emerald-50 text-emerald-600 ring-emerald-100",
  Completed: "bg-blue-50 text-blue-600 ring-blue-100",
  Draft: "bg-slate-50 text-slate-500 ring-slate-200",
  Paused: "bg-amber-50 text-amber-600 ring-amber-100",
};

function ProgramStatusPill({ status }: { status?: string }) {
  if (!status) return <span className="text-slate-300">—</span>;

  const pill = PROGRAM_PILL[status] || "bg-slate-50 text-slate-500 ring-slate-200";

  return (
    <span
      className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-medium uppercase ring-1 ring-inset ${pill}`}
    >
      {status}
    </span>
  );
}
