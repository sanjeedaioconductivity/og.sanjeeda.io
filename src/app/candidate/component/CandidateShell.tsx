"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  CalendarCheck,
  ChevronDown,
  ChevronRight,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Settings,
} from "lucide-react";
import PortalShell, { LogoutButton, type PortalNavItem } from "@/components/portal/PortalShell";

/**
 * The candidate portal's frame. The dashboard switches its sections in place;
 * a program page shows the same sidebar and sends a pick back to the
 * dashboard's matching section.
 *
 * "General" is a group with no page of its own — it opens to two flat
 * screens, Attendance and Application Form, the way the admin's "General
 * Setting" opens to Recycle Bin, Notification and Profile.
 *
 * "My Courses" is a group like the mentor portal's: "Offered Programs" (the
 * catalog) sits at its top, then the programs this candidate has joined, each
 * opening to that program page's tabs. Update Progress and Students are the
 * mentor's, so they are not here.
 */

export const CANDIDATE_NAV: PortalNavItem[] = [
  { key: "Dashboard", label: "Dashboard", icon: <LayoutDashboard size={17} /> },
  { key: "General", label: "General", icon: <Settings size={17} /> },
  { key: "My Courses", label: "My Courses", icon: <GraduationCap size={17} /> },
];

/** What the General group opens to — two flat screens, not per-item nested. */
export const CANDIDATE_GENERAL: { key: string; label: string; icon: React.ReactNode }[] = [
  { key: "Attendance", label: "Attendance", icon: <CalendarCheck size={13} /> },
  { key: "Application Form", label: "Application Form", icon: <FileText size={13} /> },
];

/** Every section a candidate can land on — top-level items plus what the two groups open to.
 *  Profile is not here: it opens as a side panel from the Dashboard, not a tab. */
export const CANDIDATE_NAV_LABELS = [
  "Dashboard",
  ...CANDIDATE_GENERAL.map((n) => n.label),
  "My Courses",
  "Offered Programs",
];

/** A program page's tabs, in display order. The key is what goes in `?tab=`. */
export const CANDIDATE_PROGRAM_TABS = [
  { key: "dashboard", label: "Dashboard" },
  { key: "schedule", label: "Weekly Schedule" },
  { key: "flow", label: "Session Flow" },
  { key: "capstone", label: "Capstone Timeline" },
  { key: "portfolio", label: "Portfolio Checklist" },
] as const;
export type CandidateProgramTab = (typeof CANDIDATE_PROGRAM_TABS)[number]["key"];
export const CANDIDATE_PROGRAM_TAB_KEYS: readonly CandidateProgramTab[] =
  CANDIDATE_PROGRAM_TABS.map((t) => t.key);

/** Mirrors where a page sits in the sidebar, e.g. My Courses > Offered Programs. */
export function CandidateBreadcrumb({
  items,
  className = "mb-2",
}: {
  items: string[];
  className?: string;
}) {
  return (
    <nav
      className={`flex min-w-0 flex-wrap items-center gap-1 text-xs font-semibold text-[#0b2f5b] dark:text-sky-300 ${className}`}
    >
      {items.map((item, i) => (
        <span key={i} className="flex min-w-0 items-center gap-1">
          {i > 0 && <ChevronRight size={12} className="shrink-0 text-[#0b2f5b]/50 dark:text-sky-300/50" />}
          <span className="truncate">{item}</span>
        </span>
      ))}
    </nav>
  );
}

export { MenuButton } from "@/components/portal/PortalShell";

type ProgramRow = { programId: string; programName: string };

/**
 * Kept for the life of the tab: the menu is the same on every candidate page,
 * so it does not need refetching on each navigation.
 */
let cachedPrograms: ProgramRow[] = [];

/** The programs this candidate has joined, for the sidebar's My Courses group. */
function usePrograms() {
  const [programs, setPrograms] = useState<ProgramRow[]>(cachedPrograms);

  useEffect(() => {
    let cancelled = false;
    let email = "";
    try {
      email = JSON.parse(localStorage.getItem("candidateUser") || "{}").email || "";
    } catch {
      /* a signed-out page simply shows none */
    }
    if (!email) return;

    fetch(`/api/pgp-candidate/programs?email=${encodeURIComponent(email)}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        const enrolledIds: string[] = data.enrolledProgramIds || [];
        cachedPrograms = (data.programs || [])
          .filter((p: { programId?: string }) => enrolledIds.includes(p.programId || ""))
          .map((p: { programId?: string; programName?: string }) => ({
            programId: p.programId || "",
            programName: p.programName || "Untitled program",
          }));
        setPrograms(cachedPrograms);
      })
      .catch((error) => console.error("Candidate programs load error:", error));

    return () => {
      cancelled = true;
    };
  }, []);

  return programs;
}

/** Exported so the profile drawer's Sign Out runs the same sequence as the header's. */
export async function candidateLogout() {
  try {
    await fetch("/api/pgp-candidate/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logout" }),
    });
  } catch (err) {
    console.error(err);
  }

  localStorage.removeItem("candidateUser");
  window.location.href = "/pgp-access?role=candidate";
}

/** Logout as a standalone icon button, for a header that already has its own profile chip. */
export function CandidateLogoutButton() {
  return <LogoutButton onClick={candidateLogout} />;
}

export default function CandidateShell({
  active,
  onNav,
  currentProgramId,
  currentTab,
  onProgramTab,
  children,
}: {
  /** The section this page belongs to. */
  active: string;
  /** Dashboard only: switch section in place. Elsewhere, the pick opens the dashboard. */
  onNav?: (label: string) => void;
  /** Program page: the program and tab on screen. */
  currentProgramId?: string;
  currentTab?: string;
  /** Program page: switch tab in place rather than navigating to the same page. */
  onProgramTab?: (tab: CandidateProgramTab) => void;
  children: (openMenu: () => void) => React.ReactNode;
}) {
  const router = useRouter();
  const programs = usePrograms();

  // Until the candidate touches them, the group and the program on screen are
  // open, so a program page always shows where it is.
  const [groupChoice, setGroupChoice] = useState<boolean | null>(null);
  const [programChoice, setProgramChoice] = useState<string | null>(null);
  const groupOpen = groupChoice ?? Boolean(currentProgramId);
  const openProgram = programChoice ?? currentProgramId ?? "";

  const generalKeys = CANDIDATE_GENERAL.map((g) => g.key);
  const [generalChoice, setGeneralChoice] = useState<boolean | null>(null);
  const generalOpen = generalChoice ?? generalKeys.includes(active);

  const nav = CANDIDATE_NAV.map((item) => {
    if (item.key === "General") {
      return {
        ...item,
        trailing: (
          <ChevronDown size={14} className={`transition ${generalOpen ? "rotate-180" : ""}`} />
        ),
        onOpenCollapsed: () => setGeneralChoice(true),
        content: generalOpen ? (
          <ul className="ml-5 border-l border-[#0b163f]/10 pl-2 dark:border-white/10">
            {CANDIDATE_GENERAL.map((entry) => (
              <li key={entry.key}>
                <button
                  type="button"
                  onClick={() =>
                    onNav
                      ? onNav(entry.key)
                      : router.push(`/candidate/dashboard?tab=${encodeURIComponent(entry.key)}`)
                  }
                  className={`flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-left text-[11px] transition ${
                    active === entry.key
                      ? "bg-white font-semibold text-[#1746b5] shadow-sm dark:bg-white/10 dark:text-white"
                      : "font-normal text-[#0b163f] hover:bg-white dark:text-white dark:hover:bg-white/10"
                  }`}
                >
                  <span className="shrink-0 text-slate-400">{entry.icon}</span>
                  {entry.label}
                </button>
              </li>
            ))}
          </ul>
        ) : null,
      };
    }

    return item.key === "My Courses"
      ? {
          ...item,
          trailing: (
            <ChevronDown size={14} className={`transition ${groupOpen ? "rotate-180" : ""}`} />
          ),
          onOpenCollapsed: () => setGroupChoice(true),
          content: groupOpen ? (
            <ul className="ml-5 border-l border-[#0b163f]/10 pl-2 dark:border-white/10">
              <li>
                <button
                  type="button"
                  onClick={() =>
                    onNav
                      ? onNav("Offered Programs")
                      : router.push("/candidate/dashboard?tab=Offered+Programs")
                  }
                  className={`flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-left text-[11px] transition ${
                    active === "Offered Programs"
                      ? "bg-white font-semibold text-[#1746b5] shadow-sm dark:bg-white/10 dark:text-white"
                      : "font-normal text-[#0b163f] hover:bg-white dark:text-white dark:hover:bg-white/10"
                  }`}
                >
                  <BookOpen size={13} className="shrink-0 text-slate-400" />
                  Offered Programs
                </button>
              </li>

              {programs.length === 0 && (
                <li className="px-2 py-1.5 text-[11px] font-semibold text-slate-400">
                  No program joined yet
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
                        {CANDIDATE_PROGRAM_TABS.map((t) => (
                          <li key={t.key}>
                            <button
                              type="button"
                              // On the program already open, switching tab is a
                              // state change; only another program navigates.
                              onMouseEnter={() => {
                                if (!isCurrent) {
                                  router.prefetch(`/candidate/program/${p.programId}?tab=${t.key}`);
                                }
                              }}
                              onClick={() => {
                                if (isCurrent && onProgramTab) {
                                  onProgramTab(t.key);
                                  return;
                                }
                                router.push(`/candidate/program/${p.programId}?tab=${t.key}`);
                              }}
                              className={`block w-full rounded-md px-2 py-1 text-left text-[11px] transition ${
                                isCurrent && currentTab === t.key
                                  ? "bg-white font-semibold text-[#1746b5] shadow-sm dark:bg-white/10 dark:text-white"
                                  : "font-normal text-slate-600 hover:bg-white hover:text-[#0b163f] dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
                              }`}
                            >
                              {t.label}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : null,
        }
      : item;
  });

  return (
    <PortalShell
      nav={nav}
      activeKey={active}
      onNav={(key) => {
        if (key === "General") {
          // The group opens instead of navigating; it has no page of its own.
          setGeneralChoice(!generalOpen);
          return;
        }
        if (key === "My Courses") {
          // The group opens instead of navigating; a second click on an open
          // group still takes you to the list.
          if (!groupOpen) {
            setGroupChoice(true);
            return;
          }
          setGroupChoice(false);
        }
        if (onNav) onNav(key);
        else router.push(`/candidate/dashboard?tab=${encodeURIComponent(key)}`);
      }}
      onLogout={candidateLogout}
      bg="bg-white dark:bg-darkBlue"
    >
      {children}
    </PortalShell>
  );
}
