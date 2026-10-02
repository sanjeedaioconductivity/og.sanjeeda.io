"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2, RefreshCw } from "lucide-react";
import { MentorAvatar } from "@/components/portal/CandidateAvatar";
import AdminShell, { MenuButton } from "../../component/AdminShell";

type Student = {
  fullName: string;
  email: string;
  gender: string;
  contactNumber: string;
  active?: boolean;
};

type Prog = {
  programId: string;
  programName: string;
  status: string;
  mentorName: string;
  mentorEmail: string;
  studentCount: number;
  students: Student[];
};

export default function EnrollmentDetailPage() {
  const params = useParams();
  const id = String(params.id || "");

  const [prog, setProg] = useState<Prog | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/pgp-management/enrollments");
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Failed to load enrollments.");
        return;
      }
      const found = (data.programs || []).find(
        (p: Prog) => p.programId === id
      );
      if (!found) {
        setError("Program not found.");
        return;
      }
      setProg(found);
      setError("");
    } catch {
      setError("Failed to load enrollments.");
    }
  }, [id]);

  useEffect(() => {
    void load().finally(() => setLoading(false));
  }, [load]);

  async function refresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  return (
    <AdminShell active="programs">
      {(openMenu) => (
      <div className="mx-auto max-w-4xl">
        <div className="mb-2 flex items-center justify-between">
          <MenuButton onClick={openMenu} />
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
          <div className="grid place-items-center rounded-xl bg-white p-10 text-slate-400 shadow-sm dark:bg-white/5">
            <Loader2 size={20} className="animate-spin" />
          </div>
        ) : error || !prog ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-sm font-semibold text-rose-700">
            {error || "Program not found."}
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-start">
            <dl className="grid grid-cols-1 gap-y-2.5 px-10 py-8 sm:max-w-md">
              <Info label="Program" value={prog.programName || "—"} />
              <div className="flex items-baseline gap-1">
                <dt className="shrink-0 font-serif text-base font-bold text-slate-800 dark:text-white">
                  Mentor Name:
                </dt>
                <dd className="flex items-center gap-1.5 font-serif text-base font-bold text-slate-800 dark:text-slate-100">
                  {prog.mentorName && (
                    <MentorAvatar
                      email={prog.mentorEmail}
                      name={prog.mentorName}
                      size={22}
                    />
                  )}
                  <span className="truncate">
                    {prog.mentorName || "Not assigned"}
                  </span>
                </dd>
              </div>
              <Info
                label="Enrolled Candidates"
                value={String(prog.studentCount)}
              />
            </dl>

            <div className="ml-20 w-full max-w-xl overflow-hidden rounded-xl border border-slate-200 dark:border-white">
              <table className="w-full border-collapse text-left text-xs">
                <thead className="bg-[#0b2f5b] text-[10px] uppercase tracking-wider text-white">
                  <tr>
                    <th className="px-3 py-2 font-serif font-bold">#</th>
                    <th className="px-3 py-2 font-serif font-bold">Name</th>
                    <th className="px-3 py-2 font-serif font-bold">Email</th>
                    <th className="px-3 py-2 font-serif font-bold">Contact</th>
                  </tr>
                </thead>
                <tbody>
                  {prog.students.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-3 py-4 text-center font-serif text-slate-400"
                      >
                        No candidates enrolled yet.
                      </td>
                    </tr>
                  ) : (
                    prog.students.map((s, i) => (
                      <tr
                        key={s.email || i}
                        className="border-b border-slate-100 bg-slate-300 dark:border-white/5 dark:bg-slate-200"
                      >
                        <td className="px-3 py-2 font-normal text-slate-700 dark:bg-slate-200 dark:text-slate-700">
                          {i + 1}
                        </td>
                        <td className="px-3 py-2 font-normal text-slate-700 dark:bg-slate-200 dark:text-slate-700">
                          <span className="inline-flex items-center gap-1.5">
                            {s.fullName || "—"}
                            {s.active && (
                              <span className="rounded bg-emerald-100 px-1 py-0.5 text-[8px] font-black uppercase text-emerald-700">
                                Active
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="px-3 py-2 font-normal text-slate-700 dark:bg-slate-200 dark:text-slate-700">
                          {s.email || "—"}
                        </td>
                        <td className="px-3 py-2 font-normal text-slate-700 dark:bg-slate-200 dark:text-slate-700">
                          {s.contactNumber || "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      )}
    </AdminShell>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-1">
      <dt className="shrink-0 font-serif text-base font-bold text-slate-800 dark:text-white">
        {label}:
      </dt>
      <dd className="truncate font-serif text-base font-bold text-slate-800 dark:text-slate-100">
        {value}
      </dd>
    </div>
  );
}
