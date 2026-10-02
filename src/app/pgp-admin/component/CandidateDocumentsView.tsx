"use client";

import React, { useEffect, useState } from "react";
import { FileText, Eye, Download, FolderOpen } from "lucide-react";

type Doc = {
  id: string;
  filename: string;
  category: string;
  categoryLabel: string;
  size: number;
  contentType: string;
  uploadedAt: string;
};

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

const ORDER = ["cv", "certificates", "cnic", "other"];

export default function CandidateDocumentsView({ email }: { email: string }) {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!email) {
      setLoading(false);
      return;
    }
    async function load() {
      try {
        const res = await fetch(
          `/api/pgp-candidate/documents?email=${encodeURIComponent(email)}`
        );
        const data = await res.json();
        setDocs(data.documents || []);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [email]);

  if (loading) {
    return <p className="text-[11px] text-slate-400">Loading documents…</p>;
  }

  if (docs.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-3 text-[11px] text-slate-400">
        <FolderOpen size={14} />
        No documents uploaded by this candidate.
      </div>
    );
  }

  const groups = ORDER.map((key) => ({
    key,
    label: docs.find((d) => d.category === key)?.categoryLabel || key,
    files: docs.filter((d) => d.category === key),
  })).filter((g) => g.files.length > 0);

  return (
    <div className="space-y-2">
      {groups.map((g) => (
        <div key={g.key}>
          <p className="-mb-2 text-[9px] font-bold uppercase tracking-wider text-blue-600">
            {g.label}
          </p>
          <ul className="-space-y-1">
            {g.files.map((f) => (
              <li
                key={f.id}
                className="flex items-center gap-2"
              >
                <FileText size={13} className="shrink-0 text-slate-400" />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px]  text-black">
                    {f.filename}
                  </p>
                 </div>
                
                <p className="text-[9px] text-black">{formatSize(f.size)}</p>
                <a
                  href={`/api/pgp-candidate/documents/${f.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="View"
                  className="rounded-md p-1.5 text-red-500 transition hover:bg-white hover:text-blue-900"
                >
                  <Eye size={13} />
                </a>
                <a
                  href={`/api/pgp-candidate/documents/${f.id}?download=1`}
                  title="Download"
                  className="rounded-md p-1.5 text-green-700 transition hover:bg-white hover:text-blue-900"
                >
                  <Download size={13} />
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
