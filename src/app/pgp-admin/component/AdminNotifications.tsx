"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, CalendarCheck, GraduationCap, UserCog } from "lucide-react";

/**
 * The admin's bell: candidates signing up and registering in programs, mentors
 * signing up and signing in, and mentors moving a program item's status on.
 *
 * Read state lives in this browser (the newest row the admin has seen), so the
 * badge counts what has arrived since they last opened the list. The list
 * refreshes on open and every couple of minutes while the page is up.
 */

const SEEN_KEY = "pgpAdminNotificationsSeenAt";
const POLL_MS = 120000;

type Notification = {
  id: string;
  kind: "enrollment" | "mentor" | "progress";
  text: string;
  programName: string;
  sectionLabel: string;
  at: string | null;
};

const ICON: Record<Notification["kind"], React.ReactNode> = {
  enrollment: <GraduationCap size={14} />,
  mentor: <UserCog size={14} />,
  progress: <CalendarCheck size={14} />,
};

function readSeenAt(): number {
  try {
    return Number(localStorage.getItem(SEEN_KEY)) || 0;
  } catch {
    return 0;
  }
}

/** "2 min ago", "3 h ago", "5 d ago" — enough to place an event. */
function ago(at: string | null): string {
  if (!at) return "";
  const ms = Date.now() - new Date(at).getTime();
  if (!Number.isFinite(ms) || ms < 0) return "";
  const min = Math.floor(ms / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min} min ago`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `${hours} h ago`;
  return `${Math.floor(hours / 24)} d ago`;
}

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  // Read lazily rather than in an effect: it is 0 on the server and during
  // the first render either way, and nothing is drawn from it until the
  // notifications themselves arrive, so there is nothing to mismatch.
  const [seenAt, setSeenAt] = useState(readSeenAt);
  const wrapRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/pgp-management/notifications", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications || []);
    } catch {
      /* a failed poll is not worth surfacing */
    }
  }, []);

  useEffect(() => {
    // The list is fetched, so every setState here lands after an await — the
    // cascading render the rule guards against cannot happen.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
    const timer = setInterval(() => void load(), POLL_MS);
    return () => clearInterval(timer);
  }, [load]);

  // Click elsewhere, or Escape, closes the list.
  useEffect(() => {
    if (!open) return;

    function onDown(event: MouseEvent) {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const unread = notifications.filter(
    (n) => n.at && new Date(n.at).getTime() > seenAt
  ).length;

  function toggle() {
    const next = !open;
    setOpen(next);

    if (next) {
      void load();
      // Opening the list is what marks it read.
      const newest = notifications[0]?.at ? new Date(notifications[0].at).getTime() : Date.now();
      const stamp = Math.max(newest, Date.now());
      setSeenAt(stamp);
      try {
        localStorage.setItem(SEEN_KEY, String(stamp));
      } catch {
        /* a private window just keeps counting */
      }
    }
  }

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-label={unread ? `Notifications, ${unread} new` : "Notifications"}
        aria-expanded={open}
        title="Notifications"
        className="relative grid h-8 w-8 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-[#0b163f] dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
      >
        <Bell size={17} />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-rose-600 px-1 text-[9px] font-black text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-50 w-80 overflow-hidden rounded-xl bg-white shadow-xl ring-1 ring-slate-200 dark:bg-[#0b1736] dark:ring-white/10">
          <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2 dark:border-white/10">
            <span className="text-[11px] font-black uppercase tracking-wider text-[#0b2f5b] dark:text-sky-300">
              Notifications
            </span>
            <span className="text-[10px] font-semibold text-slate-400">
              {notifications.length} recent
            </span>
          </div>

          <ul className="max-h-80 divide-y divide-slate-100 overflow-y-auto dark:divide-white/5">
            {notifications.length === 0 ? (
              <li className="px-3 py-6 text-center text-[11px] text-slate-400">
                Nothing yet.
              </li>
            ) : (
              notifications.map((n) => (
                <li key={n.id} className="flex gap-2 px-3 py-2">
                  <span className="mt-0.5 shrink-0 text-[#0b2f5b] dark:text-sky-300">
                    {ICON[n.kind]}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold leading-snug text-slate-800 dark:text-slate-100">
                      {n.text}
                    </p>
                    <p className="mt-0.5 flex flex-wrap gap-x-2 text-[10px] text-slate-400">
                      {n.programName && <span>{n.programName}</span>}
                      {n.sectionLabel && <span>{n.sectionLabel}</span>}
                      <span>{ago(n.at)}</span>
                    </p>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
