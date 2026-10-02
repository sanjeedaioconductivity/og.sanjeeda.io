"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Users, GraduationCap, ListChecks, Trophy, CalendarDays, ArrowRight, ChevronDown,} from "lucide-react";
import CandidateAvatar, { MentorAvatar } from "@/components/portal/CandidateAvatar";
import { useTabParam } from "@/lib/portal/useTabParam";
import MentorProfile from "@/app/mentor/component/MentorProfile";
import MentorShell, { MENTOR_NAV_LABELS, MenuButton, useMentorPrograms, type MentorProgram,} from "@/app/mentor/component/MentorShell";

export default function MentorDashboardPage() {
  const router = useRouter();
  const [active, setActive] = useTabParam("mentorTab", MENTOR_NAV_LABELS, "Dashboard");
  const [me, setMe] = useState<{ fullName?: string; email?: string }>({});
  const assigned = useMentorPrograms();

  useEffect(() => {
    const saved = localStorage.getItem("mentorUser");
    if (saved) setMe(JSON.parse(saved));
  }, []);

  return (
    <MentorShell
      sidebar={{
        programs: assigned.programs,
        activeNav: active,
        onNav: setActive,
        onProgramTab: (programId, tab) =>
          router.push(`/mentor/program/${programId}?tab=${tab}`),
      }}
    >
      {(openMenu) => (
        <>
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <MenuButton onClick={openMenu} />
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">
                  {active === "Profile" ? "My Profile" : "Mentor Dashboard"}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {active === "Profile"
                    ? "Your photo and account details."
                    : "Your assigned programs and enrolled students."}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2 rounded-full bg-white px-2 py-1 shadow-sm dark:bg-white/10">
              <MentorAvatar email={me.email} name={me.fullName} size={26} />
              <span className="max-w-[140px] truncate text-xs font-bold text-slate-700 dark:text-slate-200">
                {me.fullName || "Mentor"}
              </span>
            </div>
          </div>

          {active === "Profile" ? <MentorProfile /> : <MentorPrograms {...assigned} />}
        </>
      )}
    </MentorShell>
  );
}

const STATUS_PILL: Record<string, string> = {
  Active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Completed: "bg-blue-50 text-blue-700 ring-blue-200",
  Draft: "bg-slate-100 text-slate-600 ring-slate-200",
  Paused: "bg-amber-50 text-amber-700 ring-amber-200",
};

function MentorPrograms({
  programs,
  totalStudents,
  loading,
  mentorName,
}: {
  programs: MentorProgram[];
  totalStudents: number;
  loading: boolean;
  mentorName: string;
}) {
  const [openStudents, setOpenStudents] = useState("");

  if (loading) {
    return (
      <div className="rounded-xl bg-white dark:bg-white/5 p-5 text-sm text-slate-500 shadow-sm">
        Loading your programs…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary tiles — one compact card, three small stats inside */}
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-2 shadow-sm dark:border-white/10 dark:bg-white/5">
        <div className="grid grid-cols-3 gap-1.5">
          <StatTile
            icon={<GraduationCap size={15} />}
            label="Assigned Programs"
            value={programs.length}
            from="from-blue-500"
            to="to-blue-700"
          />
          <StatTile
            icon={<Users size={15} />}
            label="Total Students"
            value={totalStudents}
            from="from-emerald-500"
            to="to-emerald-700"
          />
          <StatTile
            icon={<CalendarDays size={15} />}
            label="Active Programs"
            value={programs.filter((p) => p.status === "Active").length}
            from="from-violet-500"
            to="to-violet-700"
          />
        </div>
      </div>

      {/* Program cards */}
      {programs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-8 text-center">
          <GraduationCap size={26} className="mx-auto text-slate-300" />
          <p className="mt-2 text-sm font-bold text-slate-500">No program assigned yet</p>
          <p className="mt-1 text-xs text-slate-400">
            {mentorName ? `${mentorName}, once` : "Once"} management assigns you to a
            program, it will appear here with its enrolled students.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {programs.map((p) => {
            const pill =
              STATUS_PILL[p.status] || "bg-slate-100 text-slate-600 ring-slate-200";
            return (
              <Link
                key={p.programId}
                href={`/mentor/program/${p.programId}`}
                className="group block rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-3 shadow-sm transition hover:border-blue-300 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Program
                    </p>
                    <h3 className="truncate text-base font-black text-slate-900 dark:text-white">
                      {p.programName}
                    </h3>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ring-1 ring-inset ${pill}`}
                  >
                    {p.status}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setOpenStudents((v) =>
                      v === p.programId ? "" : p.programId
                    );
                  }}
                  className="mt-3 flex w-full items-center gap-3 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 px-3 py-2 text-left transition hover:bg-emerald-100 dark:hover:bg-emerald-500/20"
                >
                  <Users size={20} className="text-emerald-600 dark:text-emerald-300" />
                  <div className="flex-1">
                    <p className="text-2xl font-black leading-none text-emerald-700 dark:text-emerald-300">
                      {p.studentCount}
                    </p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700/70 dark:text-emerald-300/70">
                      Students Assigned {p.studentCount > 0 && "· view list"}
                    </p>
                  </div>
                  {p.studentCount > 0 && (
                    <ChevronDown
                      size={16}
                      className={`text-emerald-600 dark:text-emerald-300 transition ${
                        openStudents === p.programId ? "rotate-180" : ""
                      }`}
                    />
                  )}
                </button>

                {openStudents === p.programId && p.students.length > 0 && (
                  <ul className="mt-2 max-h-40 divide-y divide-slate-100 overflow-y-auto rounded-lg ring-1 ring-slate-200 dark:divide-white/5 dark:ring-white/10">
                    {p.students.map((s, i) => (
                      <li
                        key={s.email || i}
                        className="flex items-center gap-2 px-3 py-1.5"
                      >
                        <CandidateAvatar
                          email={s.email}
                          name={s.fullName}
                          size={20}
                        />
                        <div className="min-w-0">
                          <p className="truncate text-[11px] font-bold text-slate-900 dark:text-white">
                            {s.fullName || "—"}
                          </p>
                          <p className="truncate text-[10px] text-slate-400">
                            {s.email}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  <span className="inline-flex items-center gap-1" title="Weeks">
                    <CalendarDays size={12} />
                    {p.weeks} weeks
                  </span>
                  <span className="inline-flex items-center gap-1" title="Portfolio items">
                    <ListChecks size={12} />
                    {p.portfolioItems} portfolio
                  </span>
                  <span className="inline-flex items-center gap-1" title="Capstone items">
                    <Trophy size={12} />
                    {p.capstoneItems} capstone
                  </span>
                  <span className="ml-auto inline-flex items-center gap-1 font-bold text-blue-900 dark:text-sky-300">
                    View full program
                    <ArrowRight size={12} className="transition group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatTile({
  icon,
  label,
  value,
  from,
  to,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  from: string;
  to: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-lg bg-gradient-to-br ${from} ${to} p-1.5 text-white shadow-sm`}
    >
      <div className="absolute -right-2 -top-2 h-8 w-8 rounded-full bg-white/10" />
      <div className="relative">
        <div className="text-white/80">{icon}</div>
        <p className="mt-0.5 text-base font-black leading-none">{value}</p>
        <p className="mt-0.5 text-[8px] font-bold uppercase leading-tight tracking-wide text-white/80">
          {label}
        </p>
      </div>
    </div>
  );
}
