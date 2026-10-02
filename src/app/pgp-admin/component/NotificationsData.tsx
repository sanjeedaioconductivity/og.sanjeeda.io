"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, CalendarCheck, GraduationCap, RefreshCw, UserCog } from "lucide-react";

/**
 * Every notification on one page — the same feed as the bell in the header,
 * with room to read it: candidates signing up and registering in programs,
 * mentors signing up and signing in, and mentors moving an item's status on.
 */

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

const KIND_LABEL: Record<Notification["kind"], string> = {
  enrollment: "Candidate",
  mentor: "Mentor",
  progress: "Progress",
};

export default function NotificationsData() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/pgp-management/notifications?limit=100", {
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error("Notifications load error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function refresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  return (
    <div className="text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-3 py-2 dark:border-white/10">
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 text-lg font-black text-slate-900 dark:text-white">
            <Bell size={18} className="text-blue-900" />
            Notifications
          </span>
          <span className="text-slate-400">{notifications.length} recent</span>
        </div>

        <button
          type="button"
          onClick={refresh}
          disabled={refreshing}
          title="Refresh"
          className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 disabled:opacity-60 dark:hover:bg-white/10"
        >
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
        </button>
      </div>

      {loading ? (
        <p className="p-4 text-slate-500">Loading notifications…</p>
      ) : (
        <div className="p-3">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/5">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-[11px]">
                <thead className="bg-[#0b2f5b] text-[9px] uppercase tracking-wider text-white">
                  <tr>
                    <th className="px-2.5 py-1.5 font-bold">What happened</th>
                    <th className="px-2.5 py-1.5 font-bold">Program</th>
                    <th className="px-2.5 py-1.5 font-bold">Kind</th>
                    <th className="px-2.5 py-1.5 font-bold">When</th>
                  </tr>
                </thead>
                <tbody>
                  {notifications.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-3 py-4 text-center text-slate-500">
                        Nothing yet.
                      </td>
                    </tr>
                  ) : (
                    notifications.map((n) => (
                      <tr
                        key={n.id}
                        className="border-b border-slate-100 transition hover:bg-slate-50 dark:border-white/5 dark:hover:bg-white/5"
                      >
                        <td className="px-2.5 py-1.5 font-semibold text-slate-800 dark:text-slate-100">
                          <span className="flex items-center gap-2">
                            <span className="shrink-0 text-[#0b2f5b] dark:text-sky-300">
                              {ICON[n.kind]}
                            </span>
                            {n.text}
                          </span>
                        </td>
                        <td className="px-2.5 py-1.5 text-slate-600 dark:text-slate-300">
                          {n.programName || <span className="text-slate-300">—</span>}
                        </td>
                        <td className="px-2.5 py-1.5 text-slate-500">
                          {KIND_LABEL[n.kind]}
                          {n.sectionLabel ? ` · ${n.sectionLabel}` : ""}
                        </td>
                        <td className="whitespace-nowrap px-2.5 py-1.5 text-slate-500">
                          {n.at ? new Date(n.at).toLocaleString() : "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
