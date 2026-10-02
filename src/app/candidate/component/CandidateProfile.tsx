"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Camera, Loader2, LogOut, Mail, Trash2 } from "lucide-react";
import CandidateAvatar from "@/components/portal/CandidateAvatar";
import { candidateLogout } from "@/app/candidate/component/CandidateShell";

type StoredUser = { email?: string; fullName?: string };

/** Opens as a side panel next to whatever screen is behind it — same drawer
 *  the Attendance detail uses — rather than a tab of its own. */
export default function CandidateProfile({ onClose }: { onClose: () => void }) {
  const [user, setUser] = useState<StoredUser>({});
  const [busy, setBusy] = useState(false);
  const [avatarVersion, setAvatarVersion] = useState(0);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("candidateUser");
    setUser(saved ? JSON.parse(saved) : {});
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function upload(file: File) {
    if (!user.email) return;
    setBusy(true);
    setMessage(null);

    const form = new FormData();
    form.append("email", user.email);
    form.append("file", file);

    try {
      const res = await fetch("/api/pgp-candidate/profile-image", {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ text: data.message || "Upload failed.", ok: false });
        return;
      }
      setAvatarVersion((v) => v + 1);
      setMessage({ text: data.message || "Profile photo updated.", ok: true });
    } catch {
      setMessage({ text: "Upload failed. Please try again.", ok: false });
    } finally {
      setBusy(false);
    }
  }

  async function removePhoto() {
    if (!user.email) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(
        `/api/pgp-candidate/profile-image?email=${encodeURIComponent(user.email)}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!res.ok) {
        setMessage({ text: data.message || "Could not remove the photo.", ok: false });
        return;
      }
      setAvatarVersion((v) => v + 1);
      setMessage({ text: data.message || "Profile photo removed.", ok: true });
    } catch {
      setMessage({ text: "Could not remove the photo.", ok: false });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[70]">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      {/* Slides in beside the page behind it, the same drawer the Attendance
          detail uses, rather than a tab of its own. */}
      <aside
        role="dialog"
        aria-label="Profile"
        className="absolute right-0 top-header h-[calc(100vh-var(--header-h))] w-[min(92vw,28rem)] overflow-y-auto rounded-l-2xl bg-white shadow-2xl dark:bg-[#0b1736]"
      >
        {/* Sits over the cover strip rather than its own banner — the cover
            already reads as this panel's header. */}
        <button
          type="button"
          onClick={onClose}
          title="Close"
          aria-label="Close"
          className="absolute left-4 top-4 z-10 grid h-8 w-8 place-items-center rounded-lg bg-black/20 text-white transition hover:bg-black/30"
        >
          <ArrowLeft size={16} />
        </button>

        <button
          type="button"
          onClick={candidateLogout}
          title="Sign out"
          aria-label="Sign out"
          className="absolute right-4 top-4 z-10 grid h-8 w-8 place-items-center rounded-lg bg-black/20 text-white transition hover:bg-black/30"
        >
          <LogOut size={16} />
        </button>

        {/* Cover strip — flush with the panel's own edges, no card border or
            gap around it, so it reads as one surface with the panel. */}
        <div className="h-20 bg-gradient-to-r from-[#0b2f5b] to-blue-700 sm:h-24" />

        <div className="px-5 pb-5">
          <div className="-mt-10 flex items-end gap-4 sm:-mt-12">
            <div className="relative shrink-0">
              <CandidateAvatar
                email={user.email}
                name={user.fullName}
                size={88}
                version={avatarVersion}
                className="ring-4 ring-white shadow-md dark:ring-[#0b1736]"
              />
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={busy}
                title="Change photo"
                className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full bg-[#0b2f5b] text-white shadow-md transition hover:bg-blue-950 disabled:opacity-60"
              >
                {busy ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Camera size={13} />
                )}
              </button>
            </div>

            <div className="min-w-0 pb-1">
              <p className="truncate text-base font-black text-slate-900 dark:text-white">
                {user.fullName || "Candidate"}
              </p>
              <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-slate-500 dark:text-slate-400">
                <Mail size={12} className="shrink-0 text-slate-400" />
                {user.email || "—"}
              </p>
            </div>
          </div>

          {message && (
            <div
              className={`mt-3 rounded-lg px-3 py-2 text-xs font-bold ${
                message.ok
                  ? "bg-emerald-50 text-emerald-800"
                  : "bg-rose-50 text-rose-700"
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
              className="rounded-lg bg-slate-100 px-3 py-1.5 text-[11px] font-bold text-slate-700 transition hover:bg-slate-200 disabled:opacity-60 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/15"
            >
              Upload photo
            </button>
            <button
              type="button"
              onClick={removePhoto}
              disabled={busy}
              className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-[11px] font-bold text-slate-500 transition hover:bg-slate-100 hover:text-rose-600 disabled:opacity-60 dark:hover:bg-white/10"
            >
              <Trash2 size={12} />
              Remove
            </button>
          </div>

          <p className="mt-5 border-t border-slate-100 pt-4 text-[11px] text-slate-400 dark:border-white/10">
            JPG, PNG, WEBP or GIF · Max 5 MB. Your photo is shown to your mentor and
            the program team.
          </p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void upload(f);
            e.target.value = "";
          }}
        />
      </aside>
    </div>
  );
}
