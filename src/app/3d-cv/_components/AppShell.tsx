'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { FileText, HeartPulse, LayoutDashboard, MoreHorizontal, UserRound } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { useCv3d } from '../_lib/store';

/**
 * Page frame for every 3D CV screen: a centred, phone-width column (the designs
 * are mobile-first; on desktop the same column sits in the middle of the page).
 *
 * `tabs` adds the bottom tab bar the mockups show from the dashboard onward. It
 * is `sticky`, not `fixed`, so it rides the bottom of the viewport while the
 * module scrolls and then stops above the site footer instead of covering it.
 */
export default function AppShell({
  children,
  tabs = false,
  wide = false,
}: {
  children: React.ReactNode;
  tabs?: boolean;
  wide?: boolean;
}) {
  return (
    <div className={cn('mx-auto flex min-h-[calc(100vh-var(--header-h))] w-full flex-col px-4', wide ? 'max-w-2xl' : 'max-w-xl')}>
      <main className="flex-1 py-8 sm:py-10">{children}</main>
      {tabs && <BottomTabs />}
    </div>
  );
}

type Tab = {
  label: string;
  href?: string;
  icon: typeof LayoutDashboard;
  /** Paths (prefixes) that light this tab up. */
  match: string[];
};

const TABS: Tab[] = [
  { label: 'Dashboard', href: '/3d-cv/dashboard', icon: LayoutDashboard, match: ['/3d-cv/dashboard'] },
  {
    label: 'Profile',
    href: '/3d-cv/basic-profile',
    icon: UserRound,
    match: ['/3d-cv/basic-profile', '/3d-cv/profile'],
  },
  { label: 'CVs', href: '/3d-cv/downloads', icon: FileText, match: ['/3d-cv/cv/', '/3d-cv/downloads', '/3d-cv/job', '/3d-cv/strategy'] },
  { label: 'Readiness', href: '/3d-cv/readiness', icon: HeartPulse, match: ['/3d-cv/readiness'] },
];

function BottomTabs() {
  const pathname = usePathname() ?? '';
  return (
    <nav
      aria-label="3D CV sections"
      className="sticky bottom-0 z-20 -mx-4 border-t border-border bg-card/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:mx-0 sm:mb-4 sm:rounded-2xl sm:border sm:shadow-lg"
    >
      <ul className="grid grid-cols-5">
        {TABS.map((tab) => {
          const active = tab.match.some((m) => pathname.startsWith(m));
          const Icon = tab.icon;
          const inner = (
            <>
              <Icon className="h-5 w-5" aria-hidden />
              <span className="text-[11px] font-medium">{tab.label}</span>
            </>
          );
          const cls = cn(
            'flex flex-col items-center gap-1 rounded-lg py-2.5',
            active ? 'text-[hsl(var(--cv-primary-ink))]' : 'text-muted-foreground',
          );
          return (
            <li key={tab.label}>
              {tab.href ? (
                <Link href={tab.href} className={cn(cls, 'hover:text-foreground')} aria-current={active ? 'page' : undefined}>
                  {inner}
                </Link>
              ) : (
                <span className={cn(cls, 'cursor-not-allowed opacity-50')} title="Coming soon" aria-disabled>
                  {inner}
                </span>
              )}
            </li>
          );
        })}
        <li>
          <MoreMenu />
        </li>
      </ul>
    </nav>
  );
}

function MoreMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { requestMentor, reset } = useCv3d();

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !ref.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', close);
    };
  }, [open]);

  const item = 'block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-muted';

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex w-full flex-col items-center gap-1 rounded-lg py-2.5 text-muted-foreground hover:text-foreground"
      >
        <MoreHorizontal className="h-5 w-5" aria-hidden />
        <span className="text-[11px] font-medium">More</span>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute bottom-full right-0 mb-2 w-56 rounded-xl border border-border bg-card p-1.5 shadow-xl"
        >
          <Link role="menuitem" href="/3d-cv/upload" className={item} onClick={() => setOpen(false)}>
            Upload another CV
          </Link>
          <Link role="menuitem" href="/3d-cv/start" className={item} onClick={() => setOpen(false)}>
            Change start method
          </Link>
          <button
            role="menuitem"
            type="button"
            className={item}
            onClick={() => {
              requestMentor();
              toast.success('Mentor support requested. A Sanjeeda mentor will contact you.');
              setOpen(false);
            }}
          >
            Request mentor support
          </button>
          <button
            role="menuitem"
            type="button"
            className={cn(item, 'text-rose-600 dark:text-rose-300')}
            onClick={() => {
              reset();
              setOpen(false);
              router.push('/3d-cv');
            }}
          >
            Reset prototype data
          </button>
        </div>
      )}
    </div>
  );
}
