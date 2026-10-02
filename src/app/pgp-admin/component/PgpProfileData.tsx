"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ImageIcon, Plus, Save, Trash2, UserRound } from "lucide-react";
import PortalToast from "@/components/portal/PortalToast";

/**
 * The PGP's own profile: what the programme is, its picture, and the members
 * behind it. One form — fill it in and save; the picture uploads on its own
 * as soon as one is chosen.
 */

type Member = {
  fullName: string;
  role: string;
  email: string;
  phone: string;
  notes: string;
};

type Profile = {
  name: string;
  tagline: string;
  about: string;
  contactEmail: string;
  contactPhone: string;
  website: string;
  hasPicture: boolean;
  members: Member[];
};

const EMPTY: Profile = {
  name: "",
  tagline: "",
  about: "",
  contactEmail: "",
  contactPhone: "",
  website: "",
  hasPicture: false,
  members: [],
};

const EMPTY_MEMBER: Member = { fullName: "", role: "", email: "", phone: "", notes: "" };

const FIELD =
  "w-full rounded-lg border-0 bg-white px-2.5 py-1.5 text-[11px] text-slate-800 shadow-sm ring-1 ring-inset ring-slate-200 outline-none transition placeholder:text-slate-300 focus:ring-2 focus:ring-blue-900 dark:bg-white/5 dark:text-slate-100 dark:ring-white/10";
const LABEL =
  "mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-300";

export default function PgpProfileData() {
  const [profile, setProfile] = useState<Profile>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  // Bumped after an upload so the browser fetches the new picture.
  const [pictureKey, setPictureKey] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/pgp-management/profile", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setProfile({ ...EMPTY, ...data.profile });
      }
    } catch (error) {
      console.error("Profile load error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function set<K extends keyof Profile>(key: K, value: Profile[K]) {
    setProfile((prev) => ({ ...prev, [key]: value }));
  }

  function setMember(index: number, key: keyof Member, value: string) {
    setProfile((prev) => {
      const members = [...prev.members];
      members[index] = { ...members[index], [key]: value };
      return { ...prev, members };
    });
  }

  async function save() {
    if (saving) return;
    setSaving(true);
    try {
      const res = await fetch("/api/pgp-management/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      const data = await res.json();
      setMessage(data.message || (res.ok ? "Profile saved." : "Save failed."));
      if (res.ok && data.profile) setProfile({ ...EMPTY, ...data.profile });
    } catch {
      setMessage("Save failed. Check your connection.");
    } finally {
      setSaving(false);
    }
  }

  async function uploadPicture(file: File) {
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await fetch("/api/pgp-management/profile-image", {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      setMessage(data.message || (res.ok ? "Picture updated." : "Upload failed."));
      if (res.ok) {
        set("hasPicture", true);
        setPictureKey((k) => k + 1);
      }
    } catch {
      setMessage("Upload failed. Check your connection.");
    }
  }

  async function removePicture() {
    try {
      const res = await fetch("/api/pgp-management/profile-image", { method: "DELETE" });
      const data = await res.json();
      setMessage(data.message || (res.ok ? "Picture removed." : "Remove failed."));
      if (res.ok) {
        set("hasPicture", false);
        setPictureKey((k) => k + 1);
      }
    } catch {
      setMessage("Remove failed. Check your connection.");
    }
  }

  if (loading) {
    return <p className="p-4 text-sm text-slate-500">Loading the profile…</p>;
  }

  return (
    <div className="text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-3 py-2 dark:border-white/10">
        <span className="flex items-center gap-1.5 text-lg font-black text-slate-900 dark:text-white">
          <UserRound size={18} className="text-blue-900" />
          Profile
        </span>

        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60"
        >
          <Save size={13} />
          {saving ? "Saving…" : "Save"}
        </button>
      </div>

      <div className="mx-auto max-w-4xl p-3">
        {/* Picture + the programme's details */}
        <section>
          <div className="mb-3 flex items-center gap-2">
            <ImageIcon size={15} className="text-blue-900" />
            <h3 className="text-sm font-black tracking-tight text-slate-900 dark:text-white">
              PGP
            </h3>
          </div>

          <div className="flex flex-wrap items-start gap-4">
            <div className="shrink-0 text-center">
              <div className="grid h-24 w-24 place-items-center overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-slate-200 dark:bg-white/5 dark:ring-white/10">
                {profile.hasPicture ? (
                  <Image
                    key={pictureKey}
                    src={`/api/pgp-management/profile-image?v=${pictureKey}`}
                    alt="PGP picture"
                    width={96}
                    height={96}
                    unoptimized
                    className="h-24 w-24 object-cover"
                  />
                ) : (
                  <ImageIcon size={22} className="text-slate-300" />
                )}
              </div>

              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void uploadPicture(file);
                  e.target.value = "";
                }}
              />

              <div className="mt-1.5 flex justify-center gap-1">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="rounded-lg px-2 py-1 text-[10px] font-bold text-blue-900 transition hover:bg-blue-50 dark:text-sky-300 dark:hover:bg-white/10"
                >
                  {profile.hasPicture ? "Change" : "Upload"}
                </button>
                {profile.hasPicture && (
                  <button
                    type="button"
                    onClick={removePicture}
                    className="rounded-lg px-2 py-1 text-[10px] font-bold text-slate-500 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-white/10"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>

            <div className="grid min-w-[16rem] flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block">
                <span className={LABEL}>Name</span>
                <input
                  value={profile.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="Professional Growth Program"
                  className={FIELD}
                />
              </label>
              <label className="block">
                <span className={LABEL}>Tagline</span>
                <input
                  value={profile.tagline}
                  onChange={(e) => set("tagline", e.target.value)}
                  className={FIELD}
                />
              </label>
              <label className="block">
                <span className={LABEL}>Contact Email</span>
                <input
                  type="email"
                  value={profile.contactEmail}
                  onChange={(e) => set("contactEmail", e.target.value)}
                  className={FIELD}
                />
              </label>
              <label className="block">
                <span className={LABEL}>Contact Phone</span>
                <input
                  value={profile.contactPhone}
                  onChange={(e) => set("contactPhone", e.target.value)}
                  className={FIELD}
                />
              </label>
              <label className="block sm:col-span-2">
                <span className={LABEL}>Website</span>
                <input
                  value={profile.website}
                  onChange={(e) => set("website", e.target.value)}
                  className={FIELD}
                />
              </label>
              <label className="block sm:col-span-2">
                <span className={LABEL}>About</span>
                <textarea
                  rows={3}
                  value={profile.about}
                  onChange={(e) => set("about", e.target.value)}
                  className={`${FIELD} resize-y leading-relaxed`}
                />
              </label>
            </div>
          </div>
        </section>

        {/* Members */}
        <section className="mt-6 border-t border-slate-200 pt-5 dark:border-white/10">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <UserRound size={15} className="text-blue-900" />
            <h3 className="text-sm font-black tracking-tight text-slate-900 dark:text-white">
              Members
            </h3>
            <span className="text-[11px] font-semibold text-slate-400">
              {profile.members.length} listed
            </span>

            <button
              type="button"
              onClick={() => set("members", [...profile.members, { ...EMPTY_MEMBER }])}
              className="ml-auto flex items-center gap-1.5 rounded-lg bg-[#0b2f5b] px-2.5 py-1.5 text-[11px] font-bold text-white shadow-sm transition hover:bg-[#0b2f5b]/90"
            >
              <Plus size={12} />
              Add Member
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-[11px]">
              <thead>
                <tr className="border-b-2 border-slate-300 dark:border-white/20">
                  <th className="px-2 py-1 font-bold">Name</th>
                  <th className="px-2 py-1 font-bold">Role</th>
                  <th className="px-2 py-1 font-bold">Email</th>
                  <th className="px-2 py-1 font-bold">Phone</th>
                  <th className="px-2 py-1 font-bold">Details</th>
                  <th className="w-8 px-1 py-1"></th>
                </tr>
              </thead>
              <tbody>
                {profile.members.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-2 py-4 text-center text-slate-400">
                      No members yet — add the people behind the programme.
                    </td>
                  </tr>
                ) : (
                  profile.members.map((member, index) => (
                    <tr
                      key={index}
                      className="group border-b border-slate-200 dark:border-white/10"
                    >
                      <td className="px-2 py-1">
                        <input
                          value={member.fullName}
                          onChange={(e) => setMember(index, "fullName", e.target.value)}
                          className={FIELD}
                        />
                      </td>
                      <td className="px-2 py-1">
                        <input
                          value={member.role}
                          onChange={(e) => setMember(index, "role", e.target.value)}
                          className={FIELD}
                        />
                      </td>
                      <td className="px-2 py-1">
                        <input
                          type="email"
                          value={member.email}
                          onChange={(e) => setMember(index, "email", e.target.value)}
                          className={FIELD}
                        />
                      </td>
                      <td className="px-2 py-1">
                        <input
                          value={member.phone}
                          onChange={(e) => setMember(index, "phone", e.target.value)}
                          className={FIELD}
                        />
                      </td>
                      <td className="px-2 py-1">
                        <input
                          value={member.notes}
                          onChange={(e) => setMember(index, "notes", e.target.value)}
                          className={FIELD}
                        />
                      </td>
                      <td className="px-1 py-1 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            set(
                              "members",
                              profile.members.filter((_, i) => i !== index)
                            )
                          }
                          title="Remove member"
                          aria-label={`Remove ${member.fullName || "member"}`}
                          className="rounded-lg p-1.5 text-slate-400 opacity-0 transition hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100 focus:opacity-100 dark:hover:bg-white/10"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <PortalToast message={message} onDismiss={() => setMessage("")} />
    </div>
  );
}
