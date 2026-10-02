"use client";

import { useState } from "react";
import { useTabParam } from "@/lib/portal/useTabParam";
import { Activity, RefreshCw, ShieldCheck } from "lucide-react";
import AdminShell, {
  ADMIN_NAV,
  AdminLogoutButton,
  ADMIN_NAV_KEYS,
  ADMIN_SETTINGS,
  MenuButton,
  type AdminPage,
} from "./component/AdminShell";
import AdminNotifications from "./component/AdminNotifications";
import CandidatesData from "./component/CandidatesData";
import NotificationsData from "./component/NotificationsData";
import PgpProfileData from "./component/PgpProfileData";
import RecycleBinData from "./component/RecycleBinData";
import MentorsData from "./component/MentorsData";
import ProgramsData from "./component/ProgramsData";
import DashboardOverview from "./component/DashboardOverview";
import MonitoringData from "./component/MonitoringData";

/**
 * The PGP admin dashboard (formerly the Management Portal dashboard).
 *
 * Identity is the PORTAL account, not a separate management login: the layout
 * above has already confirmed `portal.admin.access` server-side, and logout
 * (in the shell) ends the portal session — the same one the header's
 * sign-out ends. The page keeps its in-page tabs (`?tab=`) so deep links to a
 * section keep working.
 *
 * Attendance and enrollment are no longer sections here: both are per program,
 * and live on the program's own page (its Attendance and Students tabs), which
 * the sidebar's Programs group opens directly.
 */
export default function PgpAdminDashboardPage() {
  const [activePage, setActivePage, tabReady] = useTabParam<AdminPage>(
    "managementTab",
    ADMIN_NAV_KEYS,
    "dashboard"
  );
  // Bumped by the header's refresh: the section remounts and refetches.
  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  function refresh() {
    setRefreshKey((k) => k + 1);
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  }

  return (
    <AdminShell active={activePage} onNav={setActivePage}>
      {(openMenu) => (
        <>
          <div className="mb-3 flex items-center gap-2">
            <MenuButton onClick={openMenu} />
            <span className="inline-flex items-center gap-1 rounded-full bg-[#0b163f] px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white dark:bg-white dark:text-[#0b163f]">
              <ShieldCheck size={11} />
              Admin
            </span>
            <h1 className="truncate text-sm font-black text-[#0b163f] dark:text-white sm:text-base">
              PGP{" "}
              {ADMIN_NAV.find((n) => n.key === activePage)?.label ??
                ADMIN_SETTINGS.find((n) => n.key === activePage)?.label ??
                "Admin"}
            </h1>

            <div className="ml-auto flex items-center gap-0.5">
              <button
                type="button"
                onClick={refresh}
                title="Refresh"
                aria-label="Refresh"
                className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-[#0b163f] dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
              >
                <RefreshCw size={16} strokeWidth={1.5} className={refreshing ? "animate-spin" : ""} />
              </button>
              <AdminNotifications />
              <AdminLogoutButton />
            </div>
          </div>
          {!tabReady ? (
            <div className="grid place-items-center p-16 text-slate-300 dark:text-slate-600">
              <Activity size={22} className="animate-pulse" />
            </div>
          ) : (
            <div key={refreshKey}>
              {activePage === "dashboard" && <DashboardOverview />}
              {activePage === "candidates" && <CandidatesData />}
              {activePage === "mentors" && <MentorsData />}
              {activePage === "programs" && <ProgramsData />}
              {activePage === "monitoring" && <MonitoringData />}
              {activePage === "recycle-bin" && <RecycleBinData />}
              {activePage === "notifications" && <NotificationsData />}
              {activePage === "profile" && <PgpProfileData />}
            </div>
          )}
        </>
      )}
    </AdminShell>
  );
}
