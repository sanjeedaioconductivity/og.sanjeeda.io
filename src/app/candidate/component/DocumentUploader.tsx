"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Eye, FileText, Loader2, Trash2, UploadCloud } from "lucide-react";

type Doc = {
  id: string;
  filename: string;
  category: string;
  size: number;
  contentType: string;
  uploadedAt: string;
};

const CATEGORIES: { key: string; label: string }[] = [
  { key: "cv", label: "Updated CV" },
  { key: "certificates", label: "Internship / Job Experience Certificates" },
  { key: "cnic", label: "Copy of CNIC" },
  { key: "other", label: "Other Relevant Documents" },
];

const MAX_PER_CATEGORY = 5;
const ACCEPT = ".pdf,.doc,.docx,.jpg,.jpeg,.png";

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** "resume.PDF" -> ".pdf", lowercase to match how it reads in a file picker. */
function formatLabel(filename: string): string {
  const ext = (/\.[^.]+$/.exec(filename)?.[0] || "").toLowerCase();
  return ext || "—";
}

/** Every cell is ruled, so the columns read as a grid. */
const CELL = "border border-slate-300 px-2.5 py-2 align-middle dark:border-white/20";

export default function DocumentUploader() {
  const [email, setEmail] = useState("");
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyCat, setBusyCat] = useState("");
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("candidateUser");
    const e = saved ? JSON.parse(saved).email || "" : "";
    setEmail(e);
    if (e) void refresh(e);
    else setLoading(false);
  }, []);

  async function refresh(e: string) {
    try {
      const res = await fetch(
        `/api/pgp-candidate/documents?email=${encodeURIComponent(e)}`
      );
      const data = await res.json();
      setDocs(data.documents || []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }

  async function upload(category: string, files: FileList) {
    setBusyCat(category);
    setMessage(null);

    const form = new FormData();
    form.append("email", email);
    form.append("category", category);
    Array.from(files).forEach((f) => form.append("files", f));

    try {
      const res = await fetch("/api/pgp-candidate/documents", {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ text: data.message || "Upload failed.", ok: false });
        return;
      }
      setDocs(data.documents || []);
      setMessage({ text: data.message, ok: true });
    } catch {
      setMessage({ text: "Upload failed. Please try again.", ok: false });
    } finally {
      setBusyCat("");
    }
  }

  async function remove(id: string) {
    try {
      const res = await fetch(`/api/pgp-candidate/documents/${id}`, {
        method: "DELETE",
      });
      if (res.ok) setDocs((prev) => prev.filter((d) => d.id !== id));
    } catch {
      setMessage({ text: "Could not remove the file.", ok: false });
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-500">Loading documents…</p>;
  }

  return (
    <div className="space-y-2">
      {message && (
        <div
          className={`rounded-lg px-3 py-2 text-xs font-bold ${
            message.ok
              ? "bg-emerald-50 text-emerald-800"
              : "bg-rose-50 text-rose-700"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="max-w-full overflow-x-auto">
        <table className="w-full border-collapse text-left text-[11px] leading-snug text-slate-800 dark:text-slate-100">
          <thead>
            <tr>
              <th className={`${CELL} text-center font-bold`}>#</th>
              <th className={`${CELL} font-bold`}>Document</th>
              <th className={`${CELL} font-bold`}>File Name</th>
              <th className={`${CELL} text-center font-bold`}>Format</th>
              <th className={`${CELL} text-center font-bold`}>Size</th>
              <th className={`${CELL} w-14 text-center font-bold`}>Upload</th>
            </tr>
          </thead>
          <tbody>
            {CATEGORIES.map((cat, index) => {
              const files = docs.filter((d) => d.category === cat.key);
              const full = files.length >= MAX_PER_CATEGORY;
              return (
                <CategoryRow
                  key={cat.key}
                  index={index + 1}
                  label={cat.label}
                  files={files}
                  full={full}
                  busy={busyCat === cat.key}
                  onPick={(fl) => upload(cat.key, fl)}
                  onRemove={remove}
                />
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="space-y-1 px-1 text-xs text-slate-400">
        <span>Note: Up to {MAX_PER_CATEGORY} files · Max 10 MB each · pdf, .doc, .jpg, .png</span>
      </div>
    </div>
  );
}

function CategoryRow({
  index,
  label,
  files,
  full,
  busy,
  onPick,
  onRemove,
}: {
  index: number;
  label: string;
  files: Doc[];
  full: boolean;
  busy: boolean;
  onPick: (files: FileList) => void;
  onRemove: (id: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const single = files.length === 1 ? files[0] : null;

  return (
    <tr className="group">
      <td className={`${CELL} text-center tabular-nums text-slate-400`}>{index}</td>
      <td className={`${CELL} text-slate-800 dark:text-slate-100`}>{label}</td>

      <td className={`${CELL} max-w-[14rem]`}>
        {files.length === 0 ? (
          <span className="text-slate-300">No file uploaded</span>
        ) : single ? (
          <span className="block truncate">{single.filename}</span>
        ) : (
          <FilesDropdown
            files={files}
            open={dropdownOpen}
            onToggle={() => setDropdownOpen((v) => !v)}
            onClose={() => setDropdownOpen(false)}
            onRemove={onRemove}
          />
        )}
      </td>

      <td className={`${CELL} text-center text-slate-500 dark:text-slate-400`}>
        {single ? formatLabel(single.filename) : files.length > 1 ? "mixed" : "—"}
      </td>

      <td className={`${CELL} text-center tabular-nums`}>
        {single ? formatSize(single.size) : "—"}
      </td>

      <td className={`${CELL} w-24`}>
        <div className="flex items-center justify-center gap-1.5">
          {single && (
            <span className="flex items-center gap-0.5 opacity-0 transition group-hover:opacity-100">
              <a
                href={`/api/pgp-candidate/documents/${single.id}`}
                target="_blank"
                rel="noopener noreferrer"
                title="View"
                className="rounded-md p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-blue-900 dark:hover:bg-white/10"
              >
                <Eye size={18} />
              </a>
              <button
                type="button"
                onClick={() => onRemove(single.id)}
                title="Remove"
                className="rounded-md p-1.5 text-slate-500 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-white/10"
              >
                <Trash2 size={18} />
              </button>
            </span>
          )}

          <input
            ref={inputRef}
            type="file"
            multiple
            accept={ACCEPT}
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length) onPick(e.target.files);
              e.target.value = "";
            }}
          />

          <button
            type="button"
            disabled={full || busy}
            onClick={() => inputRef.current?.click()}
            title={full ? "Maximum files reached" : "Choose file to upload"}
            className={`grid h-7 w-7 place-items-center rounded-lg border border-dashed transition ${
              full
                ? "cursor-not-allowed border-slate-200 text-slate-300"
                : "border-blue-300 text-blue-900 hover:bg-blue-50 dark:border-sky-500/40 dark:text-sky-300 dark:hover:bg-white/10"
            }`}
          >
            {busy ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <UploadCloud size={13} />
            )}
          </button>
        </div>
      </td>
    </tr>
  );
}

/** More than one file in a category collapses into this, rather than stacking rows. */
function FilesDropdown({
  files,
  open,
  onToggle,
  onClose,
  onRemove,
}: {
  files: Doc[];
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={onToggle}
        className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-bold text-slate-700 transition hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-100"
      >
        {files.length} files
        <ChevronDown size={12} className={`transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={onClose} />
          <ul className="absolute left-0 top-full z-20 mt-1 w-56 rounded-lg border border-slate-200 bg-white p-1 shadow-lg dark:border-white/10 dark:bg-[#0b1736]">
            {files.map((f) => (
              <li
                key={f.id}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-white/10"
              >
                <FileText size={13} className="shrink-0 text-slate-400" />
                <span className="min-w-0 flex-1 truncate text-[11px] font-semibold text-slate-700 dark:text-slate-100">
                  {f.filename}
                </span>
                <a
                  href={`/api/pgp-candidate/documents/${f.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="View"
                  className="rounded p-1 text-slate-400 transition hover:bg-white hover:text-blue-900 dark:hover:bg-white/10"
                >
                  <Eye size={12} />
                </a>
                <button
                  type="button"
                  onClick={() => onRemove(f.id)}
                  title="Remove"
                  className="rounded p-1 text-slate-400 transition hover:bg-white hover:text-rose-600 dark:hover:bg-white/10"
                >
                  <Trash2 size={12} />
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
