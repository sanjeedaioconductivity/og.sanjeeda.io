"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, LayoutDashboard, LogOut, Menu, User, X,} from "lucide-react";

/**
 * The mentor portal's frame: the sidebar (desktop, collapsible; mobile, a
 * drawer), logout, and the content column. Both the dashboard and a program
 * page sit inside it so the sidebar is the same everywhere.
 *
 * The sidebar's "Program" entry lists every program management has assigned
 * to this mentor; each program opens to that program page's tabs, so any tab
 * of any program is one click away from anywhere in the portal.
 */

export type MentorProgram = {
  programId: string;
  programName: string;
  status: string;
  recommendedDuration: string;
  weeks: number;
  portfolioItems: number;
  capstoneItems: number;
  studentCount: number;
  students: { fullName: string; email: string }[];
};

export const MENTOR_NAV: { label: string; icon: React.ReactNode }[] = [
  { label: "Dashboard", icon: <LayoutDashboard size={17} /> },
  { label: "Profile", icon: <User size={17} /> },
];
export const MENTOR_NAV_LABELS = MENTOR_NAV.map((n) => n.label);

/** A program page's tabs, in display order. The key is what goes in `?tab=`. */
export const PROGRAM_TABS = [
  { key: "dashboard", label: "Dashboard" },
  { key: "progress", label: "Update Progress" },
  { key: "attendance", label: "Attendance" },
  { key: "schedule", label: "Weekly Schedule" },
  { key: "flow", label: "Session Flow" },
  { key: "capstone", label: "Capstone Timeline" },
  { key: "portfolio", label: "Portfolio Checklist" },
  { key: "students", label: "Students" },
] as const;

// export const PROGRAM_TABS = [
//   { key: "dashboard", label: "Dashboard" },
//   { key: "schedule", label: "Weekly Schedule" },
//   { key: "flow", label: "Session Flow" },
//   { key: "capstone", label: "Capstone Timeline" },
//   { key: "portfolio", label: "Portfolio Checklist" },
//   { key: "students", label: "Students" },
//   { key: "attendance", label: "Attendance" },
//   { key: "progress", label: "Update Progress" },

// ] as const;



export type ProgramTab = (typeof PROGRAM_TABS)[number]["key"];
export const PROGRAM_TAB_KEYS: readonly ProgramTab[] = PROGRAM_TABS.map((t) => t.key);

function readMentorUser(): { id?: string; fullName?: string; email?: string } | null {
  try {
    const saved = localStorage.getItem("mentorUser");
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

/** The programs assigned to the signed-in mentor, with their students. */
export function useMentorPrograms() {
  const [programs, setPrograms] = useState<MentorProgram[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [mentorName, setMentorName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const mentor = readMentorUser();
      if (!mentor) return;

      const params = new URLSearchParams();
      if (mentor.id) params.set("mentorId", mentor.id);
      if (mentor.email) params.set("email", mentor.email);

      const res = await fetch(`/api/pgp-mentor/programs?${params.toString()}`);
      const data = await res.json();
      if (cancelled) return;
      setMentorName(mentor.fullName || "");
      setPrograms(data.programs || []);
      setTotalStudents(data.totalStudents || 0);
    }

    load()
      .catch((error) => console.error("Mentor programs load error:", error))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { programs, totalStudents, mentorName, loading };
}

async function logout() {
  try {
    await fetch("/api/pgp-mentor/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logout" }),
    });
  } catch {}

  localStorage.removeItem("mentorUser");
  window.location.href = "/pgp-access?role=mentor";
}

export type MentorSidebarProps = {
  programs: MentorProgram[];
  /** Dashboard page: the section on screen. */
  activeNav?: string;
  onNav: (label: string) => void;
  /** Program page: the program and tab on screen. */
  currentProgramId?: string;
  currentTab?: string;
  onProgramTab: (programId: string, tab: ProgramTab) => void;
};

export default function MentorShell({
  sidebar,
  children,
}: {
  sidebar: MentorSidebarProps;
  /** Receives the opener for the mobile drawer, for a `MenuButton` in the page header. */
  children: (openMenu: () => void) => React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // The drawer closes itself after any pick.
  const drawer: MentorSidebarProps = {
    ...sidebar,
    onNav: (label) => {
      sidebar.onNav(label);
      setMobileMenuOpen(false);
    },
    onProgramTab: (programId, tab) => {
      sidebar.onProgramTab(programId, tab);
      setMobileMenuOpen(false);
    },
  };

  return (
    <main className="min-h-screen bg-[#f8f9fa] dark:bg-darkBlue">
      <div className="flex min-h-screen">
        <div
          className={`sticky top-header hidden h-[calc(100vh-var(--header-h))] shrink-0 self-start lg:block ${
            collapsed ? "w-16" : "w-56"
          }`}
        >
          <aside className="h-full overflow-y-auto border-r border-[#0b163f]/10 bg-[#f8f9fa] shadow-[0_8px_35px_rgba(11,22,63,0.06)] dark:border-white/10 dark:bg-[#003f81]">
            <MentorSidebar
              collapsed={collapsed}
              onToggle={() => setCollapsed((v) => !v)}
              onLogout={logout}
              {...sidebar}
            />
          </aside>

          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="absolute -right-2.5 top-4 z-20 grid h-5 w-5 place-items-center rounded-full border border-[#0b163f]/10 bg-white text-[#0b163f] shadow-sm transition hover:bg-slate-50 dark:border-white/10 dark:bg-[#003f81] dark:text-white"
          >
            {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/40" onClick={() => setMobileMenuOpen(false)} />

            <aside className="relative h-full w-64 overflow-y-auto bg-[#f8f9fa] shadow-2xl dark:bg-[#003f81]">
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="absolute right-3 top-3 rounded-lg bg-[#0b163f]/5 p-1.5 text-[#0b163f] dark:bg-white/10 dark:text-white"
              >
                <X size={18} />
              </button>

              <MentorSidebar collapsed={false} onLogout={logout} {...drawer} />
            </aside>
          </div>
        )}

        <section className="min-w-0 flex-1 p-3 sm:p-4">
          {children(() => setMobileMenuOpen(true))}
        </section>
      </div>
    </main>
  );
}

/** Opens the mobile drawer; hidden where the sidebar is already on screen. */
export function MenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Open menu"
      className="rounded-lg bg-white p-2 text-blue-900 shadow-sm dark:bg-white/10 dark:text-white lg:hidden"
    >
      <Menu size={20} />
    </button>
  );
}

/* -------------------------------- Sidebar -------------------------------- */

function MentorSidebar({
  collapsed,
  onToggle,
  onLogout,
  programs,
  activeNav,
  onNav,
  currentProgramId,
  currentTab,
  onProgramTab,
}: MentorSidebarProps & {
  collapsed: boolean;
  onToggle?: () => void;
  onLogout: () => void;
}) {
  // Until the mentor touches them, the Program group and the program on
  // screen are open, so a program page always shows where it is.
  const [groupChoice, setGroupChoice] = useState<boolean | null>(null);
  const [programChoice, setProgramChoice] = useState<string | null>(null);
  const groupOpen = groupChoice ?? Boolean(currentProgramId);
  const openProgram = programChoice ?? currentProgramId ?? "";

  return (
    <div className="flex h-full flex-col p-2 pt-3">
      {/* Light icon strokes throughout, so the panel reads quietly. */}
      <nav className="flex flex-1 flex-col gap-0.5 [&_svg]:[stroke-width:1.5]">
        {MENTOR_NAV.map((item) => (
          <MenuItem
            key={item.label}
            icon={item.icon}
            label={item.label}
            collapsed={collapsed}
            active={activeNav === item.label}
            onClick={() => onNav(item.label)}
          />
        ))}

        {/* Program group: every assigned program, each opening to its tabs. */}
        <MenuItem
          
          label="Program"
          collapsed={collapsed}
          active={Boolean(currentProgramId)}
          trailing={
            <ChevronDown
              size={14}
              className={`transition ${groupOpen ? "rotate-180" : ""}`}
            />
          }
          onClick={() => {
            if (collapsed) {
              // Folded away, the list has nowhere to go: open the sidebar.
              setGroupChoice(true);
              onToggle?.();
              return;
            }
            setGroupChoice(!groupOpen);
          }}
        />

        {!collapsed && groupOpen && (
          <ul className="ml-5 border-l border-[#0b163f]/10 pl-2 dark:border-white/10">
            {programs.length === 0 && (
              <li className="px-2 py-1.5 text-[11px] font-semibold text-slate-400">
                No program assigned yet
              </li>
            )}

            {programs.map((p) => {
              const isCurrent = p.programId === currentProgramId;
              const isOpen = openProgram === p.programId;
              return (
                <li key={p.programId}>
                  <button
                    type="button"
                    title={p.programName}
                    aria-expanded={isOpen}
                    onClick={() => setProgramChoice(isOpen ? "" : p.programId)}
                    className={`flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-left text-[11px] transition ${
                      isCurrent
                        ? "font-semibold text-[#1746b5] dark:text-sky-300"
                        : "font-normal text-[#0b163f] hover:bg-white dark:text-white dark:hover:bg-white/10"
                    }`}
                  >
                    <span className="min-w-0 flex-1 truncate">{p.programName}</span>
                    <ChevronRight
                      size={13}
                      className={`shrink-0 text-slate-400 transition ${isOpen ? "rotate-90" : ""}`}
                    />
                  </button>

                  {isOpen && (
                    <ul className="mb-1 ml-2 border-l border-[#0b163f]/10 pl-2 dark:border-white/10">
                      {PROGRAM_TABS.map((t) => {
                        const active = isCurrent && currentTab === t.key;
                        return (
                          <li key={t.key}>
                            <button
                              type="button"
                              onClick={() => onProgramTab(p.programId, t.key)}
                              className={`block w-full rounded-md px-2 py-1 text-left text-[11px] transition ${
                                active
                                  ? "bg-white font-semibold text-[#1746b5] shadow-sm dark:bg-white/10 dark:text-white"
                                  : "font-normal text-slate-600 hover:bg-white hover:text-[#0b163f] dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
                              }`}
                            >
                              {t.label}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        <button
          type="button"
          onClick={onLogout}
          title="Logout"
          className={`mt-1 flex items-center gap-2.5 rounded-xl py-2 text-[12px] font-normal text-[#0b163f] transition hover:bg-white dark:text-white dark:hover:bg-white/10 ${
            collapsed ? "justify-center px-0" : "px-2.5"
          }`}
        >
          <LogOut size={17} />
          {!collapsed && "Logout"}
        </button>
      </nav>
    </div>
  );
}

function MenuItem({
  icon,
  label,
  active = false,
  collapsed,
  trailing,
  onClick,
}: {
  /** Optional; an item without one shows its initial when the sidebar is folded. */
  icon?: React.ReactNode;
  label: string;
  active?: boolean;
  collapsed: boolean;
  trailing?: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={`flex items-center gap-2.5 rounded-xl py-2 text-[12px] transition ${
        collapsed ? "justify-center px-0" : "px-2.5"
      } ${active ? "bg-white font-semibold text-[#1746b5] shadow-sm dark:bg-white/10 dark:text-white" : "font-normal text-[#0b163f] hover:bg-white dark:text-white dark:hover:bg-white/10"}`}
    >
      {icon ?? (collapsed && <span aria-hidden="true">{label.charAt(0)}</span>)}
      {!collapsed && <span className="flex-1 text-left">{label}</span>}
      {!collapsed && trailing}
    </button>
  );
}
