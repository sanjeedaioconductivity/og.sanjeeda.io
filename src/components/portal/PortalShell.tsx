"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, LogOut, Menu, X } from "lucide-react";

/**
 * The frame every portal page sits in: a sidebar (collapsible on desktop, a
 * drawer on phones) and the content column. The admin and candidate shells are
 * thin wrappers that supply their own nav; the mentor's has a richer sidebar
 * of its own in the same shape.
 *
 * The sidebar is the navigation, so pages inside it carry no "back" links.
 * Its collapse control sits ON the sidebar's border rather than above the
 * nav, so the entries start at the top of the panel.
 */

export type PortalNavItem = {
  key: string;
  label: string;
  icon: React.ReactNode;
  /** Shown at the item's right edge — a chevron for a group that opens. */
  trailing?: React.ReactNode;
  /** Rendered under the item when it is a group that is open. */
  content?: React.ReactNode;
  /** A group opens instead of navigating; the shell folds the sidebar out first. */
  onOpenCollapsed?: () => void;
};

/** Off-white, so the panel reads as a surface rather than a block of colour. */
const PANEL = "bg-[#f8f9fa] dark:bg-[#003f81]";

/** The page behind it, in the panel's off-white so the screen reads as one. */
const PAGE = "bg-[#f8f9fa] dark:bg-darkBlue";

export default function PortalShell({
  nav,
  activeKey,
  onNav,
  onLogout,
  bg = PAGE,
  children,
}: {
  nav: PortalNavItem[];
  /** The nav entry this page belongs to. */
  activeKey?: string;
  onNav: (key: string) => void;
  /** Adds Logout at the foot of the sidebar. Omit where the page has its own. */
  onLogout?: () => void;
  bg?: string;
  /** Receives the opener for the mobile drawer, for a `MenuButton` in the page header. */
  children: (openMenu: () => void) => React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <main className={`min-h-screen ${bg}`}>
      <div className="flex min-h-screen">
        {/* The panel and its border toggle travel together down the page. */}
        <div
          className={`sticky top-header hidden h-[calc(100vh-var(--header-h))] shrink-0 self-start lg:block ${
            collapsed ? "w-16" : "w-52"
          }`}
        >
          <aside
            className={`h-full overflow-y-auto border-r border-[#0b163f]/10 shadow-[0_8px_35px_rgba(11,22,63,0.06)] dark:border-white/10 ${PANEL}`}
          >
            <Sidebar
              nav={nav}
              activeKey={activeKey}
              collapsed={collapsed}
              onNav={onNav}
              onLogout={onLogout}
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

            <aside className={`relative h-full w-60 overflow-y-auto shadow-2xl ${PANEL}`}>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="absolute right-3 top-3 rounded-lg bg-[#0b163f]/5 p-1.5 text-[#0b163f] dark:bg-white/10 dark:text-white"
              >
                <X size={18} />
              </button>

              <Sidebar
                nav={nav}
                activeKey={activeKey}
                collapsed={false}
                onNav={(key) => {
                  onNav(key);
                  setMobileMenuOpen(false);
                }}
                onLogout={onLogout}
              />
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

/** Logout as an icon, for a page header. */
export function LogoutButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title="Logout"
      aria-label="Logout"
      className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-[#0b163f] dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
    >
      <LogOut size={17} strokeWidth={1.5} />
    </button>
  );
}

function Sidebar({
  nav,
  activeKey,
  collapsed,
  onNav,
  onLogout,
}: {
  nav: PortalNavItem[];
  activeKey?: string;
  collapsed: boolean;
  onNav: (key: string) => void;
  onLogout?: () => void;
}) {
  return (
    <div className="flex h-full flex-col p-2 pt-3">
      {/* Brand heading — sits where a logo would, above the nav; collapses to
          just the initialism so the panel still reads as a menu bar when closed. */}
      <div
        className={`mb-2 border-b border-[#0b163f]/10 pb-3 dark:border-white/10 ${
          collapsed ? "px-0 text-center" : "px-1"
        }`}
      >
        {collapsed ? (
          <span className="text-xs font-black text-[#0b163f] dark:text-white">PGP</span>
        ) : (
          <span className="block text-sm font-black leading-tight text-[#0b163f] dark:text-white">
            Professional Grooming Program
          </span>
        )}
      </div>

      {/* Light icon strokes throughout, so the panel reads quietly. */}
      <nav className="flex flex-1 flex-col gap-0.5 [&_svg]:[stroke-width:1.5]">
        {nav.map((item) => (
          <div key={item.key} className="contents">
            <button
              type="button"
              onClick={() => onNav(item.key)}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-2.5 rounded-xl py-2 text-[12px] transition ${
                collapsed ? "justify-center px-0" : "px-2.5"
              } ${
                activeKey === item.key
                  ? "bg-white font-semibold text-[#1746b5] shadow-sm dark:bg-white/10 dark:text-white"
                  : "font-normal text-[#0b163f] hover:bg-white dark:text-white dark:hover:bg-white/10"
              }`}
            >
              {item.icon}
              {!collapsed && <span className="flex-1 text-left">{item.label}</span>}
              {!collapsed && item.trailing}
            </button>
            {!collapsed && item.content}
          </div>
        ))}

        {onLogout && (
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
        )}
      </nav>
    </div>
  );
}
