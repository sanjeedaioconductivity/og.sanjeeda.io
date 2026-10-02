"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Download,
  Edit2,
  Save,
  X,
  UserCog,
  User,
  Mail,
  Phone,
  GraduationCap,
  Award,
  BadgeCheck,
  CalendarDays,
  Hash,
} from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

type ViewMode = "all" | "approved" | "pending";

type Mentor = {
  mentorId: string;
  fullName: string;
  email: string;
  education: string;
  expertise: string;
  phone: string;
  role: string;
  status: string;
  createdAt: string;
};

export default function MentorsData() {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [selected, setSelected] = useState<Mentor | null>(null);
  const [editData, setEditData] = useState<Mentor | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("all");
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const printRef = useRef<HTMLDivElement>(null);

  async function loadMentors() {
    try {
      const response = await fetch("/api/pgp-management/mentors-pgp");
      const data = await response.json();
      setMentors(data.mentors || []);
    } catch (error) {
      console.error("Mentors loading error:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMentors();
  }, []);

  const approvedCount = mentors.filter((m) => m.status === "Approved").length;
  const pendingCount = mentors.filter((m) => m.status === "Pending").length;

  const visibleMentors = mentors.filter((mentor) => {
    if (viewMode === "approved") return mentor.status === "Approved";
    if (viewMode === "pending") return mentor.status === "Pending";
    return true;
  });

  function openMentor(mentor: Mentor) {
    setSelected(mentor);
    setEditData(mentor);
    setEditing(false);
    setMessage("");
  }

  function closeDrawer() {
    setSelected(null);
    setEditData(null);
    setEditing(false);
    setMessage("");
  }

  function startEdit() {
    if (!selected) return;
    setEditData({ ...selected });
    setEditing(true);
    setMessage("");
  }

  function cancelEdit() {
    setEditData(selected);
    setEditing(false);
    setMessage("");
  }

  function handleEditChange(name: keyof Mentor, value: string) {
    if (!editData) return;
    setEditData({ ...editData, [name]: value });
  }

  async function saveEdit() {
    if (!editData) return;

    const response = await fetch("/api/pgp-management/mentors-pgp", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editData),
    });

    const data = await response.json();

    if (!response.ok) {
      setMessage(data.message || "Update failed.");
      return;
    }

    setMessage(data.message);
    setSelected(editData);
    setEditing(false);
    await loadMentors();
  }

  async function downloadPDF() {
    if (!printRef.current || !selected) return;

    const canvas = await html2canvas(printRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
    });

    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = 210;
    const pageHeight = 297;

    const margin = 10;
    const imgWidth = pageWidth - margin * 2;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(
      imgData,
      "PNG",
      margin,
      margin,
      imgWidth,
      Math.min(imgHeight, pageHeight - margin * 2)
    );

    const safeName = (selected.fullName || "Mentor")
      .replace(/[^a-zA-Z0-9]/g, "_")
      .replace(/_+/g, "_");

    pdf.save(`${safeName}_Mentor_Profile.pdf`);
  }

  return (
    <div className="mt-24 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-white/10 px-3 py-2">
        <span className="flex items-center gap-1.5 text-lg font-black text-slate-900 dark:text-white">
          <UserCog size={18} className="text-blue-900" />
          Mentors
        </span>

        <div className="flex gap-1">
          <FilterChip
            label="All"
            count={mentors.length}
            active={viewMode === "all"}
            onClick={() => setViewMode("all")}
          />
          <FilterChip
            label="Approved"
            count={approvedCount}
            active={viewMode === "approved"}
            onClick={() => setViewMode("approved")}
          />
          <FilterChip
            label="Pending"
            count={pendingCount}
            active={viewMode === "pending"}
            onClick={() => setViewMode("pending")}
          />
        </div>
      </div>

      {loading ? (
        <p className="p-4 text-slate-500 dark:text-slate-400">Loading mentors...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead className="border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-[10px] uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-3 py-2 font-bold">#</th>
                <th className="px-3 py-2 font-bold">Name</th>
                <th className="px-3 py-2 font-bold">Email</th>
                <th className="px-3 py-2 font-bold">Expertise</th>
                <th className="px-3 py-2 font-bold">Phone</th>
                <th className="px-3 py-2 font-bold">Status</th>
              </tr>
            </thead>

            <tbody>
              {visibleMentors.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-4 text-center text-slate-500">
                    No mentors found.
                  </td>
                </tr>
              ) : (
                visibleMentors.map((mentor, index) => (
                  <tr
                    key={mentor.mentorId}
                    onClick={() => openMentor(mentor)}
                    className={`cursor-pointer border-b border-slate-100 dark:border-white/5 transition hover:bg-blue-50 dark:hover:bg-white/5 ${
                      selected?.mentorId === mentor.mentorId ? "bg-blue-50 dark:bg-white/10" : ""
                    }`}
                  >
                    <td className="px-3 py-2 text-slate-400">{index + 1}</td>
                    <td className="px-3 py-2 font-bold text-slate-900 dark:text-slate-100">
                      {mentor.fullName || "-"}
                    </td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{mentor.email || "-"}</td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-300">
                      {mentor.expertise || "-"}
                    </td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{mentor.phone || "-"}</td>
                    <td className="px-3 py-2">
                      <StatusPill status={mentor.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <MentorDrawer
          selected={selected}
          editData={editData}
          editing={editing}
          message={message}
          printRef={printRef}
          onClose={closeDrawer}
          onStartEdit={startEdit}
          onCancelEdit={cancelEdit}
          onSave={saveEdit}
          onDownload={downloadPDF}
          onChange={handleEditChange}
        />
      )}
    </div>
  );
}

/* -------------------------------- Drawer --------------------------------- */

function MentorDrawer({
  selected,
  editData,
  editing,
  message,
  printRef,
  onClose,
  onStartEdit,
  onCancelEdit,
  onSave,
  onDownload,
  onChange,
}: {
  selected: Mentor;
  editData: Mentor | null;
  editing: boolean;
  message: string;
  printRef: React.RefObject<HTMLDivElement | null>;
  onClose: () => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: () => void;
  onDownload: () => void;
  onChange: (name: keyof Mentor, value: string) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <aside className="relative flex h-full w-full max-w-xl flex-col bg-white shadow-2xl">
        <header className="flex items-center justify-between gap-3 border-b border-slate-200 bg-[#0b2f5b] px-4 py-3 text-white">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-base font-black">
                {selected.fullName || "Mentor"}
              </h2>
              <StatusPill status={selected.status} dark />
            </div>
            <p className="truncate text-[11px] text-blue-100">{selected.email}</p>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            {!editing ? (
              <>
                <IconBtn onClick={onStartEdit} title="Edit">
                  <Edit2 size={14} />
                </IconBtn>
                <IconBtn onClick={onDownload} title="Download PDF">
                  <Download size={14} />
                </IconBtn>
              </>
            ) : (
              <>
                <IconBtn onClick={onSave} title="Save" tone="save">
                  <Save size={14} />
                </IconBtn>
                <IconBtn onClick={onCancelEdit} title="Cancel edit">
                  <X size={14} />
                </IconBtn>
              </>
            )}

            <span className="mx-1 h-5 w-px bg-white/20" />

            <IconBtn onClick={onClose} title="Close">
              <X size={16} />
            </IconBtn>
          </div>
        </header>

        {message && (
          <div className="border-b border-emerald-100 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-800">
            {message}
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          <div ref={printRef} className="bg-white p-4 text-black">
            {editing && editData ? (
              <EditForm data={editData} onChange={onChange} />
            ) : (
              <ReadView mentor={selected} />
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}

/* ------------------------------- Read view ------------------------------- */

function ReadView({ mentor }: { mentor: Mentor }) {
  return (
    <div className="space-y-4">
      <Section title="Mentor Profile">
        <Field icon={<User size={13} />} label="Full Name" value={mentor.fullName} />
        <Field icon={<Mail size={13} />} label="Email" value={mentor.email} />
        <Field icon={<Phone size={13} />} label="Phone" value={mentor.phone} />
        <Field icon={<BadgeCheck size={13} />} label="Role" value={mentor.role} />
        <Field
          icon={<GraduationCap size={13} />}
          label="Education"
          value={mentor.education}
        />
        <Field
          icon={<Award size={13} />}
          label="Expertise / Domain"
          value={mentor.expertise}
        />
      </Section>

      <Section title="Account">
        <Field icon={<BadgeCheck size={13} />} label="Status" value={mentor.status} />
        <Field
          icon={<CalendarDays size={13} />}
          label="Registered"
          value={
            mentor.createdAt ? new Date(mentor.createdAt).toLocaleString() : "-"
          }
        />
        <Field icon={<Hash size={13} />} label="Mentor ID" value={mentor.mentorId} wide />
      </Section>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="mb-2 border-b border-slate-200 pb-1 text-[10px] font-black uppercase tracking-wider text-[#0b2f5b]">
        {title}
      </h3>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">{children}</div>
    </div>
  );
}

function Field({
  icon,
  label,
  value,
  wide = false,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
  wide?: boolean;
}) {
  return (
    <div className={`flex gap-2 ${wide ? "col-span-2" : ""}`}>
      <span className="mt-0.5 shrink-0 text-slate-400">{icon}</span>
      <div className="min-w-0">
        <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
          {label}
        </p>
        <p className="break-words text-xs font-semibold text-slate-800">
          {value || <span className="font-normal text-slate-300">—</span>}
        </p>
      </div>
    </div>
  );
}

/* ------------------------------- Edit form ------------------------------- */

function EditForm({
  data,
  onChange,
}: {
  data: Mentor;
  onChange: (name: keyof Mentor, value: string) => void;
}) {
  return (
    <div className="space-y-4">
      <Section title="Mentor Profile">
        <InputField
          label="Full Name"
          value={data.fullName}
          onChange={(v) => onChange("fullName", v)}
        />
        <ReadField label="Email" value={data.email} />
        <InputField
          label="Phone"
          value={data.phone}
          onChange={(v) => onChange("phone", v)}
        />
        <ReadField label="Role" value={data.role} />
        <InputField
          label="Education"
          value={data.education}
          onChange={(v) => onChange("education", v)}
        />
        <InputField
          label="Expertise / Domain"
          value={data.expertise}
          onChange={(v) => onChange("expertise", v)}
        />
      </Section>

      <Section title="Account">
        <SelectField
          label="Status"
          value={data.status}
          options={["Pending", "Approved", "Rejected", "Blocked"]}
          onChange={(v) => onChange("status", v)}
        />
      </Section>
    </div>
  );
}

function ReadField({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="mb-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <div className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-500">
        {value || "—"}
      </div>
    </div>
  );
}

const FIELD =
  "w-full rounded-lg border-0 bg-white px-2.5 py-1.5 text-xs text-slate-800 shadow-sm ring-1 ring-inset ring-slate-200 outline-none transition focus:ring-2 focus:ring-blue-900";

function InputField({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[9px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </span>
      <input
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className={FIELD}
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value?: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[9px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </span>
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className={`${FIELD} cursor-pointer`}
      >
        <option value="">Select</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

/* ------------------------------ Small parts ------------------------------ */

function FilterChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
        active
          ? "bg-[#0b2f5b] text-white"
          : "text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white"
      }`}
    >
      {label}{" "}
      <span className={active ? "text-blue-200" : "text-slate-400"}>{count}</span>
    </button>
  );
}

function IconBtn({
  children,
  title,
  onClick,
  tone = "default",
}: {
  children: React.ReactNode;
  title: string;
  onClick: () => void;
  tone?: "default" | "save";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`rounded-lg p-2 transition ${
        tone === "save"
          ? "bg-emerald-500 text-white hover:bg-emerald-600"
          : "text-white hover:bg-white/15"
      }`}
    >
      {children}
    </button>
  );
}

const MENTOR_STATUS_STYLES: Record<string, string> = {
  Approved: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Pending: "bg-amber-50 text-amber-700 ring-amber-200",
  Rejected: "bg-rose-50 text-rose-700 ring-rose-200",
  Blocked: "bg-rose-50 text-rose-700 ring-rose-200",
};

function StatusPill({ status, dark = false }: { status?: string; dark?: boolean }) {
  if (!status) return <span className="text-slate-300">—</span>;

  if (dark) {
    return (
      <span className="shrink-0 rounded-full bg-white/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
        {status}
      </span>
    );
  }

  const style =
    MENTOR_STATUS_STYLES[status] || "bg-slate-100 text-slate-600 ring-slate-200";

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ring-1 ring-inset ${style}`}
    >
      {status}
    </span>
  );
}
