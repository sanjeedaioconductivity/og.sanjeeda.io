"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Download,
  Edit2,
  Save,
  X,
  Users,
  User,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  Globe,
  CreditCard,
  CalendarDays,
  Briefcase,
  Laptop,
  Wifi,
  MessageSquare,
  CheckCircle2,
} from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

type ViewMode = "candidates" | "submitted" | "pending";

type Candidate = {
  candidateId: string;
  fullName: string;
  email: string;
  status: string;
  applicationStatus: string;
  gender: string;
  nationality: string;
  cnic: string;
  dob: string;
  contactNumber: string;
  address: string;
  guardianName: string;
  qualification: string;
  recentJobTitleYear: string;
  expectations: string;
  laptopAvailable: string;
  internetConnection: string;
  confirmation: boolean;
  createdAt: string;
};

export default function CandidatesData() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selected, setSelected] = useState<Candidate | null>(null);
  const [editData, setEditData] = useState<Candidate | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("candidates");
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const printRef = useRef<HTMLDivElement>(null);

  async function loadCandidates() {
    try {
      const response = await fetch("/api/pgp-management/candidates-pgp");
      const data = await response.json();
      setCandidates(data.candidates || []);
    } catch (error) {
      console.error("Candidates loading error:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCandidates();
  }, []);

  const submittedCount = candidates.filter(
    (c) => c.applicationStatus === "Submitted"
  ).length;
  const pendingCount = candidates.filter(
    (c) => c.applicationStatus === "Pending"
  ).length;

  const visibleCandidates = candidates.filter((candidate) => {
    if (viewMode === "submitted") return candidate.applicationStatus === "Submitted";
    if (viewMode === "pending") return candidate.applicationStatus === "Pending";
    return true;
  });

  function openCandidate(candidate: Candidate) {
    setSelected(candidate);
    setEditData(candidate);
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

  function handleEditChange(name: keyof Candidate, value: string | boolean) {
    if (!editData) return;
    setEditData({ ...editData, [name]: value });
  }

  async function saveEdit() {
    if (!editData) return;

    const response = await fetch("/api/pgp-management/candidates-pgp", {
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
    await loadCandidates();
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

    const safeName = (selected.fullName || "Candidate")
      .replace(/[^a-zA-Z0-9]/g, "_")
      .replace(/_+/g, "_");

    pdf.save(`${safeName}_Profile.pdf`);
  }

  return (
    <div className="text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-white/10 px-3 py-2 mt-24
      ">
        <span className="flex items-center gap-1.5 text-lg
        font-black text-slate-900 dark:text-white">
          <Users size={18} className="text-blue-900" />
          Candidates
        </span>

        <div className="flex gap-1">
          <FilterChip
            label="All"
            count={candidates.length}
            active={viewMode === "candidates"}
            onClick={() => setViewMode("candidates")}
          />
          <FilterChip
            label="Submitted"
            count={submittedCount}
            active={viewMode === "submitted"}
            onClick={() => setViewMode("submitted")}
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
        <p className="p-4 text-slate-500 dark:text-slate-400">Loading candidates...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead className="border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-[10px] uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-3 py-2 font-bold">#</th>
                <th className="px-3 py-2 font-bold">Name</th>
                <th className="px-3 py-2 font-bold">Email</th>
                <th className="px-3 py-2 font-bold">Gender</th>
                <th className="px-3 py-2 font-bold">Qualification</th>
                <th className="px-3 py-2 font-bold">Contact</th>
                <th className="px-3 py-2 font-bold">Status</th>
              </tr>
            </thead>

            <tbody>
              {visibleCandidates.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-4 text-center text-slate-500">
                    No candidates found.
                  </td>
                </tr>
              ) : (
                visibleCandidates.map((candidate, index) => (
                  <tr
                    key={candidate.candidateId}
                    onClick={() => openCandidate(candidate)}
                    className={`cursor-pointer border-b border-slate-100 dark:border-white/5 transition hover:bg-blue-50 dark:hover:bg-white/5 ${
                      selected?.candidateId === candidate.candidateId
                        ? "bg-blue-50 dark:bg-white/10"
                        : ""
                    }`}
                  >
                    <td className="px-3 py-2 text-slate-400">{index + 1}</td>
                    <td className="px-3 py-2 font-bold text-slate-900 dark:text-slate-100">
                      {candidate.fullName || "-"}
                    </td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-300">
                      {candidate.email || "-"}
                    </td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-300">
                      {candidate.gender || "-"}
                    </td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-300">
                      {candidate.qualification || "-"}
                    </td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-300">
                      {candidate.contactNumber || "-"}
                    </td>
                    <td className="px-3 py-2">
                      <StatusPill status={candidate.applicationStatus} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <CandidateDrawer
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

function CandidateDrawer({
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
  selected: Candidate;
  editData: Candidate | null;
  editing: boolean;
  message: string;
  printRef: React.RefObject<HTMLDivElement | null>;
  onClose: () => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: () => void;
  onDownload: () => void;
  onChange: (name: keyof Candidate, value: string | boolean) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <aside className="relative flex h-full w-full max-w-xl flex-col bg-white shadow-2xl">
        <header className="flex items-center justify-between gap-3 border-b border-slate-200 bg-[#0b2f5b] px-4 py-3 text-white">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-base font-black">
                {selected.fullName || "Candidate"}
              </h2>
              <StatusPill status={selected.applicationStatus} dark />
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
              <ReadView candidate={selected} />
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}

/* ------------------------------- Read view ------------------------------- */

function ReadView({ candidate }: { candidate: Candidate }) {
  return (
    <div className="space-y-4">
      <Section title="Basic Information">
        <Field icon={<User size={13} />} label="Full Name" value={candidate.fullName} />
        <Field icon={<Mail size={13} />} label="Email" value={candidate.email} />
        <Field icon={<User size={13} />} label="Gender" value={candidate.gender} />
        <Field icon={<Globe size={13} />} label="Nationality" value={candidate.nationality} />
        <Field icon={<CreditCard size={13} />} label="CNIC" value={candidate.cnic} />
        <Field icon={<CalendarDays size={13} />} label="Date of Birth" value={candidate.dob} />
        <Field icon={<Phone size={13} />} label="Contact" value={candidate.contactNumber} />
        <Field icon={<User size={13} />} label="Guardian" value={candidate.guardianName} />
        <Field
          icon={<MapPin size={13} />}
          label="Address"
          value={candidate.address}
          wide
        />
      </Section>

      <Section title="Education & Experience">
        <Field
          icon={<GraduationCap size={13} />}
          label="Qualification"
          value={candidate.qualification}
        />
        <Field
          icon={<Briefcase size={13} />}
          label="Recent Job / Internship"
          value={candidate.recentJobTitleYear}
        />
        <Field
          icon={<MessageSquare size={13} />}
          label="Expectations"
          value={candidate.expectations}
          wide
        />
      </Section>

      <Section title="Resources & Status">
        <Field icon={<Laptop size={13} />} label="Laptop / PC" value={candidate.laptopAvailable} />
        <Field icon={<Wifi size={13} />} label="Internet" value={candidate.internetConnection} />
        <Field
          icon={<CheckCircle2 size={13} />}
          label="Confirmed"
          value={candidate.confirmation ? "Yes" : "No"}
        />
        <Field
          icon={<CalendarDays size={13} />}
          label="Registered"
          value={
            candidate.createdAt
              ? new Date(candidate.createdAt).toLocaleString()
              : "-"
          }
        />
        <Field icon={<CreditCard size={13} />} label="Candidate ID" value={candidate.candidateId} wide />
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
  data: Candidate;
  onChange: (name: keyof Candidate, value: string | boolean) => void;
}) {
  return (
    <div className="space-y-4">
      <Section title="Basic Information">
        <ReadField label="Full Name" value={data.fullName} />
        <ReadField label="Email" value={data.email} />
        <SelectField
          label="Gender"
          value={data.gender}
          options={["Male", "Female", "Other"]}
          onChange={(v) => onChange("gender", v)}
        />
        <InputField
          label="Nationality"
          value={data.nationality}
          onChange={(v) => onChange("nationality", v)}
        />
        <InputField
          label="CNIC"
          value={data.cnic}
          onChange={(v) => onChange("cnic", v)}
        />
        <InputField
          label="Date of Birth"
          type="date"
          value={data.dob}
          onChange={(v) => onChange("dob", v)}
        />
        <InputField
          label="Contact"
          value={data.contactNumber}
          onChange={(v) => onChange("contactNumber", v)}
        />
        <InputField
          label="Guardian"
          value={data.guardianName}
          onChange={(v) => onChange("guardianName", v)}
        />
        <InputField
          label="Address"
          value={data.address}
          onChange={(v) => onChange("address", v)}
          wide
        />
      </Section>

      <Section title="Education & Experience">
        <SelectField
          label="Qualification"
          value={data.qualification}
          options={["Matric", "Intermediate", "Bachelor's", "Master's", "PhD", "Other"]}
          onChange={(v) => onChange("qualification", v)}
        />
        <InputField
          label="Recent Job / Internship"
          value={data.recentJobTitleYear}
          onChange={(v) => onChange("recentJobTitleYear", v)}
        />
        <InputField
          label="Expectations"
          value={data.expectations}
          onChange={(v) => onChange("expectations", v)}
          wide
        />
      </Section>

      <Section title="Resources">
        <SelectField
          label="Laptop / PC"
          value={data.laptopAvailable}
          options={["Yes", "No", "Sometimes", "Shared with Others", "Other"]}
          onChange={(v) => onChange("laptopAvailable", v)}
        />
        <SelectField
          label="Internet"
          value={data.internetConnection}
          options={["Yes", "No", "Yes but unstable", "Other"]}
          onChange={(v) => onChange("internetConnection", v)}
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
  type = "text",
  wide = false,
}: {
  label: string;
  value?: string;
  onChange: (value: string) => void;
  type?: string;
  wide?: boolean;
}) {
  return (
    <label className={`block ${wide ? "col-span-2" : ""}`}>
      <span className="mb-1 block text-[9px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </span>
      <input
        type={type}
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
      {label} <span className={active ? "text-blue-200" : "text-slate-400"}>{count}</span>
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

const CANDIDATE_STATUS_STYLES: Record<string, string> = {
  Submitted: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Pending: "bg-amber-50 text-amber-700 ring-amber-200",
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
    CANDIDATE_STATUS_STYLES[status] || "bg-slate-100 text-slate-600 ring-slate-200";

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ring-1 ring-inset ${style}`}
    >
      {status}
    </span>
  );
}
