"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  CalendarDays,
  Loader2,
  Mail,
  Pencil,
  Phone,
  RefreshCw,
  UserCog,
} from "lucide-react";
import { MentorAvatar } from "@/components/portal/CandidateAvatar";
import StudentsTable, { type Student } from "@/components/portal/StudentsTable";
import PortalToast from "@/components/portal/PortalToast";
import { useTabParam } from "@/lib/portal/useTabParam";
import AdminNotifications from "../../component/AdminNotifications";
import AdminShell, {
  ADMIN_PROGRAM_TABS,
  AdminLogoutButton,
  ADMIN_PROGRAM_TAB_KEYS,
  MenuButton,
  type AdminProgramTab,
} from "../../component/AdminShell";
import ProgramView from "../../component/ProgramView";
import ProgramEditor from "../../component/ProgramEditor";
import ProgramAttendanceGrid from "../../component/ProgramAttendanceGrid";
import { emptyProgram, type Mentor, type Program } from "../../component/pgpProgram";

/**
 * A program on its own page: /pgp-admin/program/<id>, or /new to create one.
 *
 * This is where a program is written and changed — the Programs tab only
 * lists, and opens a row here. Read-only, it shows the same tabs the mentor
 * has (Dashboard … Students), so management can follow delivery: the mentor's
 * progress statuses and who was present each week. The pencil opens the
 * editor (details and the five row tables) in place; Save writes through the
 * programs API and reloads.
 *
 * Sits under /pgp-admin, so the layout's server-side admin gate applies, and
 * inside the admin shell, so the sidebar is the way back to the list.
 */

type MentorDetails = Mentor & { phone?: string; expertise?: string };

export default function ProgramDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id || "");
  const isNew = id === "new";

  const [program, setProgram] = useState<Program | null>(null);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [mentor, setMentor] = useState<MentorDetails | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [tab, setTab] = useTabParam<AdminProgramTab>(
    `adminProgramTab:${id}`,
    ADMIN_PROGRAM_TAB_KEYS,
    "dashboard"
  );
  const [editing, setEditing] = useState(isNew);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      // The programs list is the one endpoint the admin has for programs; it
      // also carries the assignable (Active) mentors for the editor. The
      // mentor directory adds contact details, and the candidate directory
      // gives the students enrolled here.
      const [programsRes, mentorsRes, candidatesRes] = await Promise.all([
        fetch("/api/pgp-management/programs-pgp", { cache: "no-store" }),
        fetch("/api/pgp-management/mentors-pgp"),
        fetch("/api/pgp-management/candidates-pgp", { cache: "no-store" }),
      ]);
      const programsData = await programsRes.json();

      if (!programsRes.ok) {
        setError(programsData.message || "Failed to load program.");
        return;
      }

      setMentors(programsData.mentors || []);

      if (isNew) {
        setError("");
        return;
      }

      const found = (programsData.programs || []).find(
        (p: Program) => p.programId === id
      );

      if (!found) {
        setError("Program not found.");
        return;
      }

      setProgram(found);
      setError("");

      if (mentorsRes.ok) {
        const mentorsData = await mentorsRes.json();
        // Enrich (phone, expertise) only when the record really is the
        // mentor the program names — programs carry a denormalised copy of
        // the mentor's name/email, and a stale id must not swap the person.
        const assigned = (mentorsData.mentors || []).find(
          (m: MentorDetails) =>
            m.mentorId === found.assignedMentorId &&
            m.email === (found.assignedMentorEmail || "").toLowerCase()
        );
        setMentor(assigned || null);
      }

      if (candidatesRes.ok) {
        const candidatesData = await candidatesRes.json();
        setStudents(
          (candidatesData.candidates || [])
            .filter((c: { assignedProgramId?: string }) => c.assignedProgramId === id)
            .map((c: Student) => ({
              fullName: c.fullName || "",
              email: c.email || "",
              gender: c.gender || "",
              qualification: c.qualification || "",
              contactNumber: c.contactNumber || "",
            }))
        );
      }
    } catch {
      setError("Failed to load program.");
    } finally {
      setLoading(false);
    }
  }, [id, isNew]);

  useEffect(() => {
    void load();
  }, [load]);

  async function refresh() {
    if (refreshing) return;
    setRefreshing(true);
    setRefreshKey((k) => k + 1);
    await load();
    setRefreshing(false);
  }

  async function handleSaved(text: string, saved: { _id?: string }) {
    setMessage(text);
    setEditing(false);
    if (isNew && saved._id) {
      // A new program has an id now: open it at its own address. The id
      // change refetches; show the spinner rather than "not found" meanwhile.
      setLoading(true);
      router.replace(`/pgp-admin/program/${saved._id}`);
      return;
    }
    await load();
  }

  // The program's own record is the source of truth for who is assigned; the
  // mentor lookup only adds contact details.
  const mentorName = program?.assignedMentorName || mentor?.fullName || "";
  const mentorEmail = program?.assignedMentorEmail || mentor?.email || "";

  return (
    <AdminShell active="programs" currentProgramId={id} currentTab={tab} onProgramTab={setTab}>
      {(openMenu) => (
      <div className="w-full">
        <div className="mb-3 lg:hidden">
          <MenuButton onClick={openMenu} />
        </div>

        <PortalToast message={message} onDismiss={() => setMessage("")} />

        {loading ? (
          <div className="grid place-items-center rounded-xl bg-white p-10 text-slate-400 shadow-sm dark:bg-white/5">
            <Loader2 size={20} className="animate-spin" />
          </div>
        ) : error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-sm font-semibold text-rose-700">
            {error}
          </div>
        ) : editing ? (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/5">
            <div className="bg-[#0b2f5b] px-5 py-3 text-white">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-200">
                {isNew ? "New program" : "Editing"}
              </p>
              <h1 className="mt-0.5 text-lg font-black">
                {program?.programName || (isNew ? "Untitled program" : "")}
              </h1>
            </div>
            <ProgramEditor
              program={program || emptyProgram}
              mentors={mentors}
              onSaved={handleSaved}
              onCancel={() => (isNew ? router.push("/pgp-admin?tab=programs") : setEditing(false))}
            />
          </div>
        ) : !program ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-sm font-semibold text-rose-700">
            Program not found.
          </div>
        ) : (
          // One surface, tall enough to reach the bottom of the screen.
          <div className="min-h-[calc(100vh-var(--header-h)-2rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/5">
            {/* Mentor strip: the photo is the point of this page's header. */}
            <div className="flex flex-wrap items-center gap-4 border-b border-slate-200 px-4 py-3 dark:border-white/10">
              {mentorName ? (
                <>
                  <MentorAvatar email={mentorEmail} name={mentorName} size={56} />
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                      Assigned mentor
                    </p>
                    <p className="flex items-center gap-1.5 text-sm font-black text-slate-900 dark:text-white">
                      <UserCog size={14} className="text-blue-900 dark:text-cyan-200" />
                      {mentorName}
                    </p>
                    <div className="mt-0.5 flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] text-slate-500 dark:text-slate-300">
                      {mentorEmail && (
                        <span className="inline-flex items-center gap-1">
                          <Mail size={11} />
                          {mentorEmail}
                        </span>
                      )}
                      {mentor?.phone && (
                        <span className="inline-flex items-center gap-1">
                          <Phone size={11} />
                          {mentor.phone}
                        </span>
                      )}
                      {mentor?.expertise && <span>{mentor.expertise}</span>}
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-xs font-semibold text-slate-400">No mentor assigned yet.</p>
              )}

              <div className="ml-auto text-right text-[11px] text-slate-500 dark:text-slate-300">
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Program</p>
                <p className="text-sm font-black text-slate-900 dark:text-white">
                  {program.programName || "Untitled program"}
                </p>
                {(program.startDate || program.endDate) && (
                  <p className="inline-flex items-center gap-1">
                    <CalendarDays size={11} />
                    {[program.startDate, program.endDate].filter(Boolean).join(" → ")}
                  </p>
                )}
              </div>
            </div>

            {/* The tabs live in the sidebar's Programs group; this strip names
                the one on screen, and edits or refreshes it. */}
            <div className="flex items-center gap-2 border-b border-slate-200 px-3 py-1.5 dark:border-white/10">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#0b2f5b] dark:text-sky-300">
                {ADMIN_PROGRAM_TABS.find((t) => t.key === tab)?.label ?? ""}
              </span>

              <div className="ml-auto flex items-center gap-0.5">
                <AdminNotifications />
                <AdminLogoutButton />
                <button
                  type="button"
                  onClick={() => {
                    setMessage("");
                    setEditing(true);
                  }}
                  title="Edit program"
                  aria-label="Edit program"
                  className="grid h-7 w-7 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-[#0b2f5b] dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
                >
                  <Pencil size={14} />
                </button>
                <button
                  type="button"
                  onClick={refresh}
                  disabled={refreshing}
                  title="Refresh — pull the latest rows, statuses and attendance"
                  aria-label="Refresh program"
                  className="grid h-7 w-7 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-[#0b2f5b] disabled:opacity-60 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
                >
                  <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
                </button>
              </div>
            </div>

            {tab === "attendance" ? (
              <ProgramAttendanceGrid key={refreshKey} programId={id} />
            ) : tab === "students" ? (
              <StudentsTable students={students} />
            ) : (
              <ProgramView program={program} tab={tab} />
            )}
          </div>
        )}
      </div>
      )}
    </AdminShell>
  );
}
