"use client";

import React, { useEffect, useRef, useState } from "react";
import { Camera, Loader2, Mail, User, Trash2 } from "lucide-react";
import { MentorAvatar } from "@/components/portal/CandidateAvatar";

type StoredUser = { email?: string; fullName?: string };

export default function MentorProfile() {
  const [user, setUser] = useState<StoredUser>({});
  const [busy, setBusy] = useState(false);
  const [avatarVersion, setAvatarVersion] = useState(0);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(
    null
  );
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("mentorUser");
    setUser(saved ? JSON.parse(saved) : {});
  }, []);

  async function upload(file: File) {
    if (!user.email) return;
    setBusy(true);
    setMessage(null);

    const form = new FormData();
    form.append("email", user.email);
    form.append("file", file);

    try {
      const res = await fetch("/api/pgp-mentor/profile-image", {
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
        `/api/pgp-mentor/profile-image?email=${encodeURIComponent(user.email)}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!res.ok) {
        setMessage({
          text: data.message || "Could not remove the photo.",
          ok: false,
        });
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
    <div className="mx-auto max-w-2xl">
      {message && (
        <div
          className={`mb-3 rounded-lg px-3 py-2 text-xs font-bold ${
            message.ok
              ? "bg-emerald-50 text-emerald-800"
              : "bg-rose-50 text-rose-700"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
        <div className="flex items-center gap-4">
          <div className="relative">
            <MentorAvatar
              email={user.email}
              name={user.fullName}
              size={80}
              version={avatarVersion}
              className="ring-2 ring-white shadow dark:ring-white/10"
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

          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-sm font-black text-slate-900 dark:text-white">
              <User size={13} className="text-slate-400" />
              {user.fullName || "Mentor"}
            </p>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <Mail size={12} className="text-slate-400" />
              {user.email || "—"}
            </p>
            <div className="mt-2 flex gap-2">
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
          </div>
        </div>

        <p className="mt-4 text-[11px] text-slate-400">
          JPG, PNG, WEBP or GIF · Max 5 MB. Your photo is shown to management on
          the mentors, programs and enrollment lists.
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
    </div>
  );
}
