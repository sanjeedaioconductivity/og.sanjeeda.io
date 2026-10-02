"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import type { ChartData, ChartOptions } from "chart.js";
import {
  Users,
  UserCheck,
  UserCog,
  GraduationCap,
  Activity,
  Percent,
  ListChecks,
  Trophy,
  CalendarDays,
} from "lucide-react";
import type { Program } from "./pgpProgram";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

type Candidate = { applicationStatus?: string; status?: string };
type Mentor = { status?: string };

const PROGRESS = {
  "Not Started": "#94a3b8",
  "In Progress": "#0ea5e9",
  Completed: "#10b981",
  Deferred: "#f59e0b",
};

function normalizeStatus(status?: string): keyof typeof PROGRESS {
  const value = (status || "").trim();
  if (!value) return "Not Started";
  if (value === "Delayed") return "Deferred";
  if (value in PROGRESS) return value as keyof typeof PROGRESS;
  return "Not Started";
}

function count<T extends { status?: string }>(items: T[], status: string) {
  return items.filter((i) => normalizeStatus(i.status) === status).length;
}

export default function DashboardOverview() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
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
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const stats = useMemo(() => {
    const submitted = candidates.filter((c) => c.applicationStatus === "Submitted").length;
    const pending = candidates.length - submitted;
    const approvedMentors = mentors.filter((m) => m.status === "Approved").length;
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
      approvedMentors,
      activePrograms,
      avgCompletion,
      programStatus,
    };
  }, [candidates, mentors, programs]);

  if (loading) {
    return (
      <div className="rounded-xl bg-white dark:bg-white/5 p-6 text-sm text-slate-500 shadow-sm">
        Loading dashboard…
      </div>
    );
  }

  const barOptions: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (ctx) => ` ${ctx.parsed.y}` } },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: "#64748b", font: { size: 11, weight: "bold" } },
      },
      y: {
        beginAtZero: true,
        grid: { color: "rgba(148,163,184,0.15)" },
        ticks: { color: "#64748b", precision: 0, stepSize: 1, font: { size: 11 } },
      },
    },
  };

  const programStatusData: ChartData<"bar"> = {
    labels: ["Draft", "Active", "Completed", "Paused"],
    datasets: [
      {
        label: "Programs",
        data: [
          stats.programStatus.Draft,
          stats.programStatus.Active,
          stats.programStatus.Completed,
          stats.programStatus.Paused,
        ],
        backgroundColor: ["#94a3b8", "#10b981", "#3b82f6", "#f59e0b"],
        borderRadius: 6,
        maxBarThickness: 54,
      },
    ],
  };

  const mentorData: ChartData<"bar"> = {
    labels: ["Approved", "Other"],
    datasets: [
      {
        label: "Mentors",
        data: [stats.approvedMentors, mentors.length - stats.approvedMentors],
        backgroundColor: ["#8b5cf6", "#cbd5e1"],
        borderRadius: 6,
        maxBarThickness: 54,
      },
    ],
  };

  return (
    <div className="space-y-4">
      {/* KPI tiles */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-2 xl:grid-cols-6 mt-28 w-50 h-42">
        <Kpi icon={<Users size={40} />} label="Candidates" value={candidates.length} from="from-blue-500" to="to-blue-700" />
         <Kpi icon={<UserCog size={40} />} label="Mentors" value={mentors.length} sub={`${stats.approvedMentors} approved`} from="from-violet-500" to="to-violet-700" />
        <Kpi icon={<GraduationCap size={40} />} label="Programs" value={programs.length} from="from-amber-500" to="to-amber-600" />
        <Kpi icon={<Activity size={40} />} label="Active" value={stats.activePrograms} from="from-cyan-500" to="to-cyan-700" />
      </div>

      {/* Doughnut charts */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3  ">
        
        <ChartCard title="Program Status" icon={<GraduationCap size={14} />}>
          <div className="h-[190px]">
            <Bar data={programStatusData} options={barOptions} />
          </div>
        </ChartCard>
        <ChartCard title="Mentors" icon={<UserCog size={14} />}>
          <div className="h-[190px]">
            <Bar data={mentorData} options={barOptions} />
          </div>
        </ChartCard>

        <ChartCard title="Programs" icon={<ListChecks size={14} />}>
          <ProgramsList programs={programs} />
        </ChartCard>

      </div>
    </div>
  );
}

function Kpi({
  icon,
  label,
  value,
  sub,
  from,
  to,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  sub?: string;
  from: string;
  to: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${from} ${to} p-3 text-white shadow-sm`}
    >
      <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-white/10" />
      <div className="relative">
        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-white/80">
          {icon}
          {label}
        </div>
        <p className="mt-1 text-2xl font-black leading-none">{value}</p>
        {sub && <p className="mt-1 text-[10px] font-semibold text-white/75">{sub}</p>}
      </div>
    </div>
  );
}

function ChartCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-3 shadow-sm">
      <div className="mb-2 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-[#0b2f5b] dark:text-sky-300">
        <span className="text-blue-900 dark:text-sky-300">{icon}</span>
        {title}
      </div>
      {children}
    </div>
  );
}

const PROGRAM_PILL: Record<string, string> = {
  Active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Completed: "bg-blue-50 text-blue-700 ring-blue-200",
  Draft: "bg-slate-100 text-slate-600 ring-slate-200",
  Paused: "bg-amber-50 text-amber-700 ring-amber-200",
};

function ProgramsList({ programs }: { programs: Program[] }) {
  if (!programs.length) {
    return <p className="py-6 text-center text-xs text-slate-400">No programs yet.</p>;
  }

  return (
    <div className="h-[190px] space-y-2 overflow-y-auto pr-1">
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
        const pill =
          PROGRAM_PILL[p.status] || "bg-slate-100 text-slate-600 ring-slate-200";

        return (
          <div
            key={p.programId}
            className="rounded-lg border border-slate-100 dark:border-white/10 p-2"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-[11px] font-bold text-slate-900 dark:text-white">
                {p.programName || "Untitled"}
              </span>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ring-1 ring-inset ${pill}`}
              >
                {p.status}
              </span>
            </div>

            <div className="mt-1.5 flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-900 to-cyan-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="shrink-0 text-[10px] font-black text-slate-500">
                {pct}%
              </span>
            </div>

            <div className="mt-1.5 flex flex-wrap gap-x-3 text-[9px] font-semibold text-slate-400">
              <span className="inline-flex items-center gap-0.5">
                <CalendarDays size={10} />
                {p.weeklySchedule?.length || 0}w
              </span>
              <span className="inline-flex items-center gap-0.5">
                <ListChecks size={10} />
                {p.portfolioChecklist?.length || 0}
              </span>
              <span className="inline-flex items-center gap-0.5">
                <Trophy size={10} />
                {p.capstoneTimeline?.length || 0}
              </span>
              <span className="inline-flex items-center gap-0.5">
                <UserCog size={10} />
                {p.assignedMentorName || "Unassigned"}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
