"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, LogIn, LogOut } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/lib/portal/AuthProvider";
import { usePermissionFilter } from "@/lib/portal/usePermission";
import { NAV_SECTIONS, navEntriesInGroup } from "@/lib/portal/navSections";

/**
 * The "New" sticker a nav entry can declare (`NavEntry.badge`). Rendered by
 * every surface an entry appears on — desktop pill, both dropdowns, the mobile
 * drawer — so a declared badge cannot show in one menu and not another.
 * Brand red so it reads as a callout against the navy/blue links, and
 * `uppercase` + tight tracking so a one-word sticker stays sticker-sized.
 */
function NavBadge({ children }: { children: string }) {
  return (
    <span className="ml-1.5 inline-flex items-center rounded-full bg-brand-accent px-1.5 py-0.5 text-[9px] font-black uppercase leading-none tracking-[0.12em] text-white shadow-[0_1px_4px_rgb(var(--brand-accent)/0.4)]">
      {children}
    </span>
  );
}

/**
 * Sprint 9: the two hardcoded arrays that used to live here (`mainLinks` and
 * `serviceLinks`) moved to `lib/portal/navSections.ts`, where each entry names
 * the permission it needs. This component now renders whatever survives
 * filtering — no `if (role === ...)`, and the desktop bar and mobile drawer
 * read the same filtered list instead of two arrays that could drift apart.
 */
export default function ModernHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const { authenticated, logout } = useAuth();

  // OfferGuide paints its own near-black surface (see offerguide/layout.tsx). This
  // header is shared by every page, so the colour is swapped per route rather than by
  // editing the `darkBlue` alias — that alias is also read by ~15 other pages, and
  // moving it would restyle the whole portal to fix one strip.
  const pathname = usePathname();
  // Routes that paint the night-blue surface. Keep this list in sync with the
  // pages themselves: a page listed here but still on `darkBlue` (or vice versa)
  // is exactly what produces the mismatched navy band this was added to remove.
  const NIGHT_SURFACE_ROUTES = ["/offerguide", "/khudiassessment"];
  const isNightSurface = NIGHT_SURFACE_ROUTES.some((r) => pathname?.startsWith(r));
  // Whole literal class strings: Tailwind scans source text, so a class assembled
  // from fragments at runtime never gets a rule generated for it.
  const darkDrawerBg = isNightSurface ? "dark:bg-nightBlue" : "dark:bg-[#003f81]";

  // The PGP mentor and candidate portals (and the sign-in page that leads to
  // them) authenticate against their OWN collections, with their own logout in
  // the dashboard sidebar. The portal account here — the Account dropdown and
  // Log in / Log out — belongs to the `sanjeedausers` session from /auth, and
  // a mentor with no such session has no business seeing it. It DID show up:
  // an admin who signed in at /auth and then signed in as a mentor in the same
  // browser still carried the portal cookie, so the header kept offering
  // "Account" on /mentor/dashboard. Hidden on these routes regardless.
  const PGP_PORTAL_ROUTES = ["/mentor", "/candidate", "/pgp-access"];
  const isPgpPortal = PGP_PORTAL_ROUTES.some((r) => pathname?.startsWith(r));

  // One filter, both render passes. Starts as the public tier and widens once
  // identity resolves — never the reverse, so a guest cannot glimpse a
  // higher-tier link. See AuthProvider's header comment.
  const visible = usePermissionFilter(NAV_SECTIONS);
  const mainLinks = navEntriesInGroup(visible, "explore");
  const serviceLinks = navEntriesInGroup(visible, "services");
  const accountLinks = isPgpPortal ? [] : navEntriesInGroup(visible, "account");

  return (
    <>
      <header className={`fixed inset-x-0 top-0 z-50 border-b border-brand-ink/10
       bg-white/90 
       dark:bg-gradient-to-r from-[#4d76c1] to-[#ec284f]
        bg-opacity-20 
        playful:border-brand-accent/10
      playful:bg-[#fff3f9]/90 shadow-[0_8px_35px_rgba(11,22,63,0.06)] 
         backdrop-blur-xl dark:border-white/10
      `}>
        <div className="mx-auto flex h-header max-w-[1300px] items-center justify-between px-5 sm:px-8 lg:px-12">
          <div className="flex min-w-0 items-center gap-3 lg:gap-4">
            <Link href="/" aria-label="Sanjeeda home" className="shrink-0">
              {/* Was `hidden sm:block`, which left the mobile bar with nothing but
                  the hamburger. The mark is ~193px wide at h-10, so it fits a 375px
                  header beside the toggle. */}
              <span className="block">
                {/* Both marks are cropped to the same ink-to-canvas ratio (~83% of
                    height), so identical h-* classes give identical cap heights and the
                    sizes no longer need hand-compensating per theme. The uncropped
                    `sanjeeda logo1.png` is only 45% ink — at h-10 its wordmark rendered
                    18px tall against the dark asset’s 33px. It is still used by the
                    legacy Header.tsx, so it was left in place rather than replaced. */}
                <Image
                  src="/sanjeeda-logo-light.png"
                  alt="Sanjeeda"
                  width={621}
                  height={129}
                  priority
                  className="h-10 w-auto lg:h-10 dark:hidden"
                />
                <Image
                  src="/sanjeeda-logo-dark.png"
                  alt="Sanjeeda"
                  width={466}
                  height={95}
                  priority
                  className="hidden h-10 w-auto lg:h-10 dark:block"
                />
              </span>
            </Link>
          </div>

          <nav aria-label="Primary navigation" className="hidden items-center gap-1 lg:flex">
            <div className="relative">
              <button
                type="button"
                onClick={() => setServicesOpen((open) => !open)}
                aria-expanded={servicesOpen}
                className="inline-flex h-11 items-center gap-1.5 rounded-full px-4 text-sm font-bold text-brand-ink transition hover:bg-brand-ink/5 playful:hover:bg-brand-accent-soft dark:text-white dark:hover:bg-white/10"
              >
                Services
                <ChevronDown
                  size={15}
                  className={`transition ${servicesOpen ? "rotate-180" : ""}`}
                />
              </button>

              {servicesOpen && (
                <div className="absolute left-0 top-[calc(100%+12px)] w-72 overflow-hidden rounded-2xl border border-brand-ink/10 bg-white p-2 shadow-[0_24px_60px_rgba(11,22,63,0.16)] dark:border-white/10 dark:bg-[#101a3f]">
                  {serviceLinks.map(({ label, href, icon: Icon, badge }) => (
                    <Link
                      key={label}
                      href={href}
                      onClick={() => setServicesOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold text-brand-ink transition hover:bg-brand-ink/5 playful:hover:bg-brand-accent-soft dark:text-white dark:hover:bg-white/10"
                    >
                      <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-blue-soft text-brand-blue dark:bg-white/10 dark:text-brand-blue-bright">
                        <Icon size={17} />
                      </span>
                      {label}
                      {badge && <NavBadge>{badge}</NavBadge>}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {mainLinks.map(({ label, href, badge }) => (
              <Link
                key={label}
                href={href}
                className="inline-flex h-11 items-center rounded-full px-4 text-sm font-bold text-brand-ink transition hover:bg-brand-ink/5 playful:hover:bg-brand-accent-soft dark:text-white dark:hover:bg-white/10"
              >
                {label}
                {badge && <NavBadge>{badge}</NavBadge>}
              </Link>
            ))}

            {/* The account tier folds into one dropdown, mirroring Services.
                Laid out inline it pushed the desktop bar to ~750px at the `lg`
                breakpoint once an admin held three entries, and the nav rendered
                over the logo. A guest has nothing in this group, so for them the
                bar is exactly as it was. */}
            {accountLinks.length > 0 && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setAccountOpen((open) => !open)}
                  aria-expanded={accountOpen}
                  className="inline-flex h-11 items-center gap-1.5 rounded-full px-4 text-sm font-bold text-brand-ink transition hover:bg-brand-ink/5 playful:hover:bg-brand-accent-soft dark:text-white dark:hover:bg-white/10"
                >
                  Account
                  <ChevronDown
                    size={15}
                    className={`transition ${accountOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {accountOpen && (
                  <div className="absolute right-0 top-[calc(100%+12px)] w-64 overflow-hidden rounded-2xl border border-brand-ink/10 bg-white p-2 shadow-[0_24px_60px_rgba(11,22,63,0.16)] dark:border-white/10 dark:bg-[#101a3f]">
                    {accountLinks.map(({ label, href, icon: Icon, badge }) => (
                      <Link
                        key={label}
                        href={href}
                        onClick={() => setAccountOpen(false)}
                        className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold text-brand-ink transition hover:bg-brand-ink/5 playful:hover:bg-brand-accent-soft dark:text-white dark:hover:bg-white/10"
                      >
                        <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#e8f6ee] text-[#0f8a4d] dark:bg-white/10 dark:text-[#6ee7a8]">
                          <Icon size={17} />
                        </span>
                        {label}
                        {badge && <NavBadge>{badge}</NavBadge>}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </nav>

          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 sm:flex">
              <ThemeToggle />
            </div>
            {/* Sign in / out use the same borderless treatment as the theme
                toggle beside it — one quiet cluster, no
                filled pill competing with the nav. The word stays: a bare icon
                for sign-in is not discoverable. Same in the drawer below. */}
            {isPgpPortal ? null : authenticated ? (
              <button
                type="button"
                onClick={() => void logout()}
                className="hidden h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 text-sm font-bold text-brand-ink transition hover:bg-brand-ink/5 playful:hover:bg-brand-accent-soft dark:text-white dark:hover:bg-white/10 sm:inline-flex"
              >
                <LogOut size={16} />
                Log out
              </button>
            ) : (
              <Link
                href="/auth"
                className="hidden h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 text-sm font-bold text-brand-ink transition hover:bg-brand-ink/5 playful:hover:bg-brand-accent-soft dark:text-white dark:hover:bg-white/10 sm:inline-flex"
              >
                <LogIn size={16} />
                Log in
              </Link>
            )}
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Open navigation"
              className="grid h-11 w-11 place-items-center rounded-full border border-brand-ink/10 text-brand-ink transition hover:bg-brand-ink/5 playful:hover:bg-brand-accent-soft dark:border-white/10 dark:text-white dark:hover:bg-white/10 lg:hidden"
            >
              <span className="text-2xl font-black leading-none" aria-hidden="true">☰</span>
            </button>
          </div>
        </div>
      </header>

      {/* Pushes page content below the fixed bar; same token, so they cannot drift. */}
      <div className="h-header" aria-hidden="true" />

      <button
        type="button"
        aria-label="Close navigation overlay"
        onClick={() => setMenuOpen(false)}
        className={`fixed inset-0 z-[60] bg-[#050b20]/55 backdrop-blur-sm transition lg:hidden ${
          menuOpen ? "visible opacity-100" : "invisible opacity-0"
        }`}
      />

      <aside
        aria-label="Mobile navigation"
        className={`fixed right-0 top-0 z-[70] flex h-full w-[min(90vw,380px)] flex-col bg-[#fbf7f1] p-5 shadow-2xl transition duration-300 ${darkDrawerBg} lg:hidden ${
          menuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-brand-ink/10 pb-5 dark:border-white/10">
          <span className="text-2xl font-black tracking-[-0.04em] text-[#1559bd] dark:text-white">
            Sanjeed<span className="text-[#ef3340] dark:text-[#ff7b86]">a!</span>
          </span>
          <button
            type="button"
            onClick={() => setMenuOpen(false)}
            aria-label="Close navigation"
            className="grid h-10 w-10 place-items-center rounded-full bg-[#ece7df] text-brand-ink dark:bg-white/10 dark:text-white"
          >
            <span className="text-2xl font-medium leading-none" aria-hidden="true">×</span>
          </button>
        </div>

        <nav className="mt-5 flex flex-col gap-1 overflow-y-auto" aria-label="Mobile primary navigation">
          <p className="px-3 pb-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            Explore
          </p>
          {mainLinks.map(({ label, href, icon: Icon, badge }) => (
            <Link
              key={label}
              href={href}
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 rounded-2xl px-3 py-3.5 text-sm font-black text-brand-ink transition hover:bg-white dark:text-white dark:hover:bg-white/10"
            >
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-blue-soft text-brand-blue dark:bg-white/10 dark:text-brand-blue-bright">
                <Icon size={17} />
              </span>
              {label}
              {badge && <NavBadge>{badge}</NavBadge>}
            </Link>
          ))}

          <p className="mt-5 px-3 pb-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            Services
          </p>
          {serviceLinks.map(({ label, href, icon: Icon, badge }) => (
            <Link
              key={label}
              href={href}
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 rounded-2xl px-3 py-3.5 text-sm font-black text-brand-ink transition hover:bg-white dark:text-white dark:hover:bg-white/10"
            >
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-accent-soft text-brand-accent dark:bg-white/10 dark:text-brand-accent-bright">
                <Icon size={17} />
              </span>
              {label}
              {badge && <NavBadge>{badge}</NavBadge>}
            </Link>
          ))}

          {/* Rendered only when the caller holds a permission that puts
              something in this group, so a guest gets no empty heading. */}
          {accountLinks.length > 0 && (
            <>
              <p className="mt-5 px-3 pb-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                Your account
              </p>
              {accountLinks.map(({ label, href, icon: Icon, badge }) => (
                <Link
                  key={label}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 rounded-2xl px-3 py-3.5 text-sm font-black text-brand-ink transition hover:bg-white dark:text-white dark:hover:bg-white/10"
                >
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#e8f6ee] text-[#0f8a4d] dark:bg-white/10 dark:text-[#6ee7a8]">
                    <Icon size={17} />
                  </span>
                  {label}
                  {badge && <NavBadge>{badge}</NavBadge>}
                </Link>
              ))}
            </>
          )}
        </nav>

        <div className="mt-auto space-y-4 border-t border-brand-ink/10 pt-5 dark:border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-white/50">Appearance</span>
            <div className="flex items-center gap-2">
              <ThemeToggle />
            </div>
          </div>
          {isPgpPortal ? null : authenticated ? (
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                void logout();
              }}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-full text-sm font-bold text-brand-ink transition hover:bg-brand-ink/5 playful:hover:bg-brand-accent-soft dark:text-white dark:hover:bg-white/10"
            >
              <LogOut size={17} />
              Log out
            </button>
          ) : (
            <Link
              href="/auth"
              onClick={() => setMenuOpen(false)}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-full text-sm font-bold text-brand-ink transition hover:bg-brand-ink/5 playful:hover:bg-brand-accent-soft dark:text-white dark:hover:bg-white/10"
            >
              <LogIn size={17} />
              Log in
            </Link>
          )}
          <div className="flex items-center justify-center gap-2 pt-1">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-200">Powered by</span>
            <span className="inline-flex items-center rounded-xl -mx-2 -my-1 px-2 py-1 transition-colors dark:bg-white dark:shadow-[0_1px_6px_rgba(0,0,0,0.35)]">
              <Image
                src="/conductivitylogo.png"
                alt="Conductivity"
                width={1000}
                height={220}
                className="h-auto w-24"
              />
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
