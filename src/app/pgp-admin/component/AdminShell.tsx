"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  Bell,
  ChevronDown,
  ChevronRight,
  GraduationCap,
  LayoutDashboard,
  Settings,
  Trash2,
  UserCog,
  UserRound,
  Users,
} from "lucide-react";
import { useAuth } from "@/lib/portal/AuthProvider";
import PortalShell, {
  LogoutButton,
  type PortalNavItem,
} from "@/components/portal/PortalShell";
import type { Program } from "./pgpProgram";

/**
 * The PGP admin area's frame. The dashboard (/pgp-admin) switches its
 * sections in place; every other admin page shows the same sidebar and sends
 * a pick back to the dashboard's matching section.
 *
 * The "Programs" entry is a group, like the mentor portal's: it lists every
 * program, and each program opens to that program page's tabs — so any tab of
 * any program is one click away from anywhere in the area. Attendance and the
 * enrolled candidates live in there, per program, rather than as sections of
 * their own.
 *
 * Logout is not in the panel: it sits beside the bell in the page header
 * (`AdminLogoutButton`). Identity is the PORTAL account, so it ends the
 * portal session — the same one the site header's sign-out ends.
 */

export type AdminPage =
  | "dashboard"
  | "candidates"
  | "programs"
  | "mentors"
  | "monitoring"
  | "settings"
  | "recycle-bin"
  | "notifications"
  | "profile";

export const ADMIN_NAV: (PortalNavItem & { key: AdminPage })[] = [
  { key: "settings", label: "General Setting", icon: <Settings size={17} /> },
  { key: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={17} /> },
  { key: "programs", label: "Programs", icon: <GraduationCap size={17} /> },
  { key: "mentors", label: "Mentors", icon: <UserCog size={17} /> },
  { key: "candidates", label: "Candidates", icon: <Users size={17} /> },
];

/** What the General Setting group opens to. */
export const ADMIN_SETTINGS: { key: AdminPage; label: string; icon: React.ReactNode }[] = [
  { key: "monitoring", label: "Monitoring", icon: <Activity size={13} /> },
  { key: "recycle-bin", label: "Recycle Bin", icon: <Trash2 size={13} /> },
  { key: "notifications", label: "Notification", icon: <Bell size={13} /> },
  { key: "profile", label: "Profile", icon: <UserRound size={13} /> },
];

// "settings" is a group, not a page, so it is not a tab one can land on.
export const ADMIN_NAV_KEYS = [
  ...ADMIN_NAV.filter((n) => n.key !== "settings").map((n) => n.key),
  ...ADMIN_SETTINGS.map((n) => n.key),
];

/** A program page's tabs, in display order. The key is what goes in `?tab=`. */
export const ADMIN_PROGRAM_TABS = [
  { key: "dashboard", label: "Dashboard" },
  { key: "progress", label: "Update Progress" },
  { key: "attendance", label: "Attendance" },
  { key: "schedule", label: "Weekly Schedule" },
  { key: "flow", label: "Session Flow" },
  { key: "capstone", label: "Capstone Timeline" },
  { key: "portfolio", label: "Portfolio Checklist" },
  { key: "students", label: "Students" },
] as const;
export type AdminProgramTab = (typeof ADMIN_PROGRAM_TABS)[number]["key"];
export const ADMIN_PROGRAM_TAB_KEYS: readonly AdminProgramTab[] = ADMIN_PROGRAM_TABS.map(
  (t) => t.key
);

export { MenuButton } from "@/components/portal/PortalShell";

/** Logout as an icon, for the header beside the bell. */
export function AdminLogoutButton() {
  const router = useRouter();
  const { logout } = useAuth();

  return (
    <LogoutButton
      onClick={async () => {
        await logout();
        router.replace("/pgp-access");
      }}
    />
  );
}

type ProgramRow = { programId: string; programName: string };

/**
 * Kept for the life of the tab: the menu is the same on every admin page, and
 * refetching it on each navigation is what made the group appear late.
 */
let cachedPrograms: ProgramRow[] = [];

/** Every program, for the sidebar's Programs group. */
function usePrograms() {
  const [programs, setPrograms] = useState<ProgramRow[]>(cachedPrograms);

  useEffect(() => {
    let cancelled = false;

    // Names only — see the API's `list=1` branch.
    fetch("/api/pgp-management/programs-pgp?list=1")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        cachedPrograms = (data.programs || []).map((p: Program) => ({
          programId: p.programId || "",
          programName: p.programName || "Untitled program",
        }));
        setPrograms(cachedPrograms);
      })
      .catch((error) => console.error("Admin programs load error:", error));

    return () => {
      cancelled = true;
    };
  }, []);

  return programs;
}

export default function AdminShell({
  active,
  onNav,
  currentProgramId,
  currentTab,
  onProgramTab,
  children,
}: {
  /** The section this page belongs to. */
  active: AdminPage;
  /** Dashboard only: switch section in place. Elsewhere, the pick opens the dashboard. */
  onNav?: (page: AdminPage) => void;
  /** Program page: the program and tab on screen. */
  currentProgramId?: string;
  currentTab?: string;
  /** Program page: switch tab in place rather than navigating to the same page. */
  onProgramTab?: (tab: AdminProgramTab) => void;
  children: (openMenu: () => void) => React.ReactNode;
}) {
  const router = useRouter();
  const programs = usePrograms();

  // Until the admin touches them, the group and the program on screen are
  // open, so a program page always shows where it is.
  const [groupChoice, setGroupChoice] = useState<boolean | null>(null);
  const [programChoice, setProgramChoice] = useState<string | null>(null);
  const groupOpen = groupChoice ?? Boolean(currentProgramId);
  const openProgram = programChoice ?? currentProgramId ?? "";

  const settingsKeys = ADMIN_SETTINGS.map((s) => s.key);
  const [settingsChoice, setSettingsChoice] = useState<boolean | null>(null);
  const settingsOpen = settingsChoice ?? settingsKeys.includes(active);

  const nav = ADMIN_NAV.map((item) => {
    if (item.key === "settings") {
      return {
        ...item,
        // The group itself is never "the page" — one of its entries is.
        key: "settings",
        trailing: (
          <ChevronDown size={14} className={`transition ${settingsOpen ? "rotate-180" : ""}`} />
        ),
        onOpenCollapsed: () => setSettingsChoice(true),
        content: settingsOpen ? (
          <ul className="ml-5 border-l border-[#0b163f]/10 pl-2 dark:border-white/10">
            {ADMIN_SETTINGS.map((entry) => (
              <li key={entry.key}>
                <button
                  type="button"
                  onClick={() =>
                    onNav ? onNav(entry.key) : router.push(`/pgp-admin?tab=${entry.key}`)
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

    return item.key === "programs"
      ? {
          ...item,
          trailing: (
            <ChevronDown size={14} className={`transition ${groupOpen ? "rotate-180" : ""}`} />
          ),
          onOpenCollapsed: () => setGroupChoice(true),
          content: groupOpen ? (
            <ul className="ml-5 border-l border-[#0b163f]/10 pl-2 dark:border-white/10">
              {programs.length === 0 && (
                <li className="px-2 py-1.5 text-[11px] font-semibold text-slate-400">
                  No program yet
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
                        {ADMIN_PROGRAM_TABS.map((t) => (
                          <li key={t.key}>
                            <button
                              type="button"
                              // On the program already open, switching tab is a
                              // state change; only another program navigates.
                              onMouseEnter={() => {
                                if (!isCurrent) {
                                  router.prefetch(`/pgp-admin/program/${p.programId}?tab=${t.key}`);
                                }
                              }}
                              onClick={() => {
                                if (isCurrent && onProgramTab) {
                                  onProgramTab(t.key);
                                  return;
                                }
                                router.push(`/pgp-admin/program/${p.programId}?tab=${t.key}`);
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
        if (key === "settings") {
          // The group opens instead of navigating; there is no settings page
          // of its own, only the three inside it.
          setSettingsChoice(!settingsOpen);
          return;
        }
        if (key === "programs") {
          // The group opens instead of navigating; a second click on an open
          // group still takes you to the list.
          if (!groupOpen) {
            setGroupChoice(true);
            return;
          }
          setGroupChoice(false);
        }
        if (onNav) onNav(key as AdminPage);
        else router.push(`/pgp-admin?tab=${key}`);
      }}
    >
      {children}
    </PortalShell>
  );
}
