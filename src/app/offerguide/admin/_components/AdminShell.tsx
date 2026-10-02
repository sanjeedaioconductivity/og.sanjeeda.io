"use client";

/**
 * The admin area's chrome (Sprint 10, Epic 10.1): a left sidebar of the six
 * resources plus the API contract, a top bar, and a mobile drawer.
 *
 * Echoes the `management` portal's sidebar shell — same widths, same collapse
 * behaviour, same surface colours — because anyone who has used that dashboard
 * should feel at home here. Deliberately shares NO code with it: the two sit on
 * different identity systems (this one on the unified SanjeedaUsers role, that
 * one on a separate Mongo user collection) and coupling their shells would
 * couple the wrong things.
 *
 * Route-based, not tab-based. The management dashboard keeps its pages as
 * in-page tabs; this area's six destinations are real routes under
 * /offerguide/admin/*, so the sidebar uses `<Link>` and `usePathname()` for the
 * active state. That is what lets a page be linked to directly.
 *
 * The permission check here is the REACTIVE one, not the primary one. The
 * server layout has already refused to render this for a non-admin; this hook
 * catches the session ending while an admin is on the page (logout elsewhere,
 * cookie expiry) and sends them out without waiting for a full navigation.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, PanelLeftClose, PanelLeftOpen, ShieldCheck, X } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/lib/portal/AuthProvider";
import { usePermission } from "@/lib/portal/usePermission";
import { cn } from "@/lib/utils";
import {
  ADMIN_BASE,
  ADMIN_DESTINATIONS,
  API_DOCS_LINK,
  adminHref,
} from "../_lib/adminNav";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const { resolved } = useAuth();
  const isAdmin = usePermission("portal.admin.access");

  // Only act once identity has actually resolved: AuthProvider starts every
  // page as a guest and widens, so `!isAdmin` on the very first render is the
  // normal pre-resolution state, not a revoked session.
  useEffect(() => {
    if (resolved && !isAdmin) router.replace("/offerguide");
  }, [resolved, isAdmin, router]);

  const current = ADMIN_DESTINATIONS.find((d) => adminHref(d.segment) === pathname)
    ?? ADMIN_DESTINATIONS.find((d) => d.segment && pathname.startsWith(adminHref(d.segment)));

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-darkBlue">
      <div className="flex min-h-screen">
        <aside
          className={cn(
            "sticky top-header hidden h-[calc(100vh-var(--header-h))] shrink-0 self-start overflow-y-auto border-r border-[#0b163f]/10 bg-[#fbf7f1] shadow-[0_8px_35px_rgba(11,22,63,0.06)] dark:border-white/10 dark:bg-[#003f81] lg:block",
            collapsed ? "w-16" : "w-56"
          )}
        >
          <Sidebar
            collapsed={collapsed}
            onToggle={() => setCollapsed((v) => !v)}
            pathname={pathname}
          />
        </aside>

        {drawerOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              aria-label="Close navigation"
              className="absolute inset-0 bg-black/40"
              onClick={() => setDrawerOpen(false)}
            />
            <aside className="relative h-full w-64 bg-[#fbf7f1] shadow-2xl dark:bg-[#003f81]">
              <button
                type="button"
                aria-label="Close navigation"
                onClick={() => setDrawerOpen(false)}
                className="absolute right-3 top-3 rounded-lg bg-[#0b163f]/5 p-1.5 text-[#0b163f] dark:bg-white/10 dark:text-white"
              >
                <X size={18} />
              </button>
              <Sidebar
                collapsed={false}
                pathname={pathname}
                onNavigate={() => setDrawerOpen(false)}
              />
            </aside>
          </div>
        )}

        <section className="min-w-0 flex-1">
          <header className="sticky top-header z-10 flex h-14 items-center gap-3 border-b border-[#0b163f]/10 bg-white/80 px-4 backdrop-blur dark:border-white/10 dark:bg-[#070d2b]/80 sm:px-6">
            <button
              type="button"
              aria-label="Open navigation"
              onClick={() => setDrawerOpen(true)}
              className="rounded-lg bg-white p-2 text-[#0b163f] shadow-sm dark:bg-white/10 dark:text-white lg:hidden"
            >
              <Menu size={20} />
            </button>

            <div className="flex min-w-0 items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-[#0b163f] px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white dark:bg-white dark:text-[#0b163f]">
                <ShieldCheck size={11} />
                Admin
              </span>
              <h1 className="truncate text-sm font-black text-[#0b163f] dark:text-white sm:text-base">
                {current?.label ?? "Admin"}
              </h1>
              {current?.screenId && (
                <span className="hidden text-xs font-semibold text-slate-400 sm:inline">
                  {current.screenId}
                </span>
              )}
            </div>

            <div className="ml-auto">
              <ThemeToggle />
            </div>
          </header>

          <div className="p-4 sm:p-6">{children}</div>
        </section>
      </div>
    </div>
  );
}

function Sidebar({
  collapsed,
  onToggle,
  pathname,
  onNavigate,
}: {
  collapsed: boolean;
  onToggle?: () => void;
  pathname: string;
  onNavigate?: () => void;
}) {
  const isActive = (segment: string) => {
    const href = adminHref(segment);
    return segment === "" ? pathname === ADMIN_BASE : pathname.startsWith(href);
  };

  const itemClass = (active: boolean) =>
    cn(
      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition",
      collapsed && "justify-center px-2",
      active
        ? "bg-[#0b163f] text-white dark:bg-white dark:text-[#0b163f]"
        : "text-[#0b163f] hover:bg-white dark:text-white dark:hover:bg-white/10"
    );

  return (
    <nav aria-label="Admin navigation" className="flex h-full flex-col gap-1 p-3">
      {onToggle && (
        <button
          type="button"
          onClick={onToggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="mb-2 grid h-9 w-9 place-items-center self-end rounded-lg text-[#0b163f] hover:bg-white dark:text-white dark:hover:bg-white/10"
        >
          {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
      )}

      {ADMIN_DESTINATIONS.map(({ segment, label, icon: Icon }) => (
        <Link
          key={segment || "overview"}
          href={adminHref(segment)}
          onClick={onNavigate}
          aria-current={isActive(segment) ? "page" : undefined}
          title={collapsed ? label : undefined}
          className={itemClass(isActive(segment))}
        >
          <Icon size={18} className="shrink-0" />
          {!collapsed && <span className="truncate">{label}</span>}
        </Link>
      ))}

      <div className="my-2 border-t border-[#0b163f]/10 dark:border-white/10" />

      <Link
        href={API_DOCS_LINK.href}
        onClick={onNavigate}
        title={collapsed ? API_DOCS_LINK.label : undefined}
        className={itemClass(false)}
      >
        <API_DOCS_LINK.icon size={18} className="shrink-0" />
        {!collapsed && <span className="truncate">{API_DOCS_LINK.label}</span>}
      </Link>
    </nav>
  );
}
