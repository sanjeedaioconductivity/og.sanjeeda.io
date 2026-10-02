"use client";

import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  FileText,
  GraduationCap,
  UserCog,
  LogOut,
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import CandidatesData from "../component/CandidatesData";
import MentorsData from "../component/MentorsData";
import ProgramsData from "../component/ProgramsData";
import DashboardOverview from "../component/DashboardOverview";

type Page =
  | "dashboard"
  | "candidates"
  | "applications"
  | "programs"
  | "mentors";

const NAV: { key: Page; label: string; icon: React.ReactNode }[] = [
  { key: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
  { key: "mentors", label: "Mentors", icon: <UserCog size={18} /> },
  { key: "candidates", label: "Candidates", icon: <Users size={18} /> },
  { key: "programs", label: "Programs", icon: <GraduationCap size={18} /> },
];

export default function ManagementDashboardPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [activePage, setActivePage] = useState<Page>("dashboard");

  const handleLogout = async () => {
    try {
      await fetch("/api/pgp-management/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "logout" }),
      });
    } catch {}

    localStorage.removeItem("managementUser");
    window.location.href = "/management";
  };

  return (
    <main className="min-h-screen bg-slate-100 dark:bg-darkBlue">
      <div className="flex min-h-screen">
        <aside
          className={`hidden min-w-0 shrink-0 mt-20 overflow-hidden bg-zinc-300 dark:bg-[#0b1230] lg:block ${
            collapsed ? "w-16" : "w-52"
          }`}
        >
          <SidebarContent
            collapsed={collapsed}
            onToggle={() => setCollapsed((v) => !v)}
            onLogout={handleLogout}
            activePage={activePage}
            setActivePage={setActivePage}
          />
        </aside>

        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setMobileMenuOpen(false)}
            />

            <aside className="relative h-full w-60 bg-[#0b2f5b] text-white shadow-2xl">
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="absolute right-3 top-3 rounded-lg bg-white/10 p-1.5"
              >
                <X size={18} />
              </button>

              <SidebarContent
                collapsed={false}
                onLogout={handleLogout}
                activePage={activePage}
                setActivePage={(page) => {
                  setActivePage(page);
                  setMobileMenuOpen(false);
                }}
              />
            </aside>
          </div>
        )}

        <section className="min-w-0 flex-1 p-3 sm:p-4">
          <div className="mb-3 flex items-center gap-2 lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-lg bg-white dark:bg-white/10 p-2 text-blue-900 dark:text-white shadow-sm"
            >
              <Menu size={20} />
            </button>
          </div>
          {activePage === "dashboard" && <DashboardOverview />}
          {activePage === "candidates" && <CandidatesData />}
          {activePage === "mentors" && <MentorsData />}
          {activePage === "programs" && <ProgramsData />}
        </section>
      </div>
    </main>
  );
}

function SidebarContent({
  collapsed,
  onToggle,
  activePage,
  setActivePage,
  onLogout,
}: {
  collapsed: boolean;
  onToggle?: () => void;
  activePage: Page;
  setActivePage: (page: Page) => void;
  onLogout: () => void;
}) {
  return (
    <div className="flex h-full flex-col p-2">
      <div
        className={`mb-2 flex items-center ${
          collapsed ? "justify-center" : "justify-between"
        }`}
      >
        {/* {!collapsed && (
          <span className="pl-2 text-[11px] font-bold uppercase tracking-wider text-blue-200">
            Management
          </span>
        )} */}

        {onToggle && (
          <button type="button" onClick={onToggle} title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="rounded-lg p-2 mt-3 text-zinc-500 transition hover:bg-white/10"
          >
            {collapsed ? (
              <PanelLeftOpen size={18} />
            ) : (
              <PanelLeftClose size={18} />
            )}
          </button>
        )}
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV.map((item) => (
          <MenuItem
            key={item.key}
            icon={item.icon}
            label={item.label}
            collapsed={collapsed}
            active={activePage === item.key}
            onClick={() => setActivePage(item.key)}
          />
        ))}

        <button
          type="button"
          onClick={onLogout}
          title="Logout"
          className={`-mt-2 flex items-center gap-3 py-2 px-1 text-sm font-bold text-zinc-500 hover:text-white ${
            collapsed ? "justify-center px-0" : "px-3"
          }`}
        >
          <LogOut size={18} />
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
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  collapsed: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={`flex items-center gap-3 rounded-lg py-2.5 text-sm font-bold transition ${
        collapsed ? "justify-center px-0" : "px-3"
      } ${active ? "bg-zinc-400 dark:bg-blue-900 text-white" : "text-blue-900 dark:text-slate-200 hover:bg-white/10"}`}
    >
      {icon}
      {!collapsed && label}
    </button>
  );
}
