"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { GraduationCap, ShieldCheck, Clock } from "lucide-react";

/**
 * The PGP entry point: ONE sign-in / sign-up form for both portals.
 *
 * The form asks "Candidate or Mentor?" first and posts to that role's auth
 * route — two routes, because the two roles have different data and, more
 * importantly, different rules:
 *
 *   candidate  self-serve. Sign up, sign in, straight to the dashboard.
 *   mentor     GATED. Sign up creates a Pending account that cannot sign in.
 *              The PGP admin reviews it on /pgp-admin (Mentors tab) and marks
 *              it Active; only then does sign-in succeed. The form says so at
 *              signup and again if a pending mentor tries to sign in.
 *
 * `?role=mentor|candidate` pre-selects the role (the old /mentor and /candidate
 * URLs redirect here with it) and `?mode=signup` opens on the signup tab.
 *
 * Deliberately outside the light/dark theme: a glossy blue backdrop with a
 * frosted-glass card, the same in either theme.
 */

type Portal = "candidate" | "mentor";
type Mode = "login" | "signup" | "forgot" | "reset";

type ApiResponse = {
  message: string;
  redirectTo?: string;
  pendingApproval?: boolean;
  status?: string;
  user?: Record<string, unknown>;
};

const ROLE_META: Record<
  Portal,
  { label: string; blurb: string; api: string; storageKey: string; icon: React.ReactNode }
> = {
  candidate: {
    label: "Candidate",
    blurb: "Apply, join a program and track your progress.",
    api: "/api/pgp-candidate/auth",
    storageKey: "candidateUser",
    icon: <GraduationCap size={16} />,
  },
  mentor: {
    label: "Mentor",
    blurb: "Run programs, mark attendance and evaluate candidates.",
    api: "/api/pgp-mentor/auth",
    storageKey: "mentorUser",
    icon: <ShieldCheck size={16} />,
  },
};

const EMPTY_FORM = {
  title: "",
  fullName: "",
  email: "",
  education: "",
  expertise: "",
  phone: "",
  password: "",
  confirmPassword: "",
  otp: "",
  newPassword: "",
};

export default function PgpAccessPage() {
  return (
    <Suspense fallback={null}>
      <PgpAccess />
    </Suspense>
  );
}

function PgpAccess() {
  const params = useSearchParams();
  const [portal, setPortal] = useState<Portal>("candidate");
  const [mode, setMode] = useState<Mode>("login");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  // Honour ?role= and ?mode= once, on arrival.
  useEffect(() => {
    const r = params.get("role");
    if (r === "mentor" || r === "candidate") setPortal(r);
    // `forgot` as well as `signup`: the candidate portal's Change Password row
    // links straight here, and landing on the login tab would leave a signed-in
    // candidate hunting for the "Forgot password" link.
    const m = params.get("mode");
    if (m === "signup" || m === "forgot") setMode(m);
  }, [params]);

  const meta = ROLE_META[portal];

  function pickPortal(next: Portal) {
    setPortal(next);
    setMessage("");
    setPending(false);
  }

  function switchMode(next: Mode) {
    setMode(next);
    setMessage("");
    setPending(false);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function callApi(action: string, payload: object) {
    setLoading(true);
    setMessage("");
    setPending(false);

    try {
      const response = await fetch(meta.api, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...payload }),
      });

      const data = (await response.json()) as ApiResponse;

      if (!response.ok) {
        setMessage(data.message || "Something went wrong.");
        // A mentor whose account exists but is not yet Active.
        if (response.status === 403 && data.status === "Pending") setPending(true);
        return;
      }

      if (action === "login" && data.user) {
        localStorage.setItem(meta.storageKey, JSON.stringify(data.user));
      }

      setMessage(data.message);

      if (action === "signup") {
        // Mentor signups wait for the admin; candidates can sign in at once.
        setPending(Boolean(data.pendingApproval));
        setMode("login");
        setForm({ ...EMPTY_FORM, email: form.email });
      }

      if (action === "forgot-password") setMode("reset");

      if (data.redirectTo) {
        window.location.href = data.redirectTo;
      }
    } catch {
      setMessage("Server connection failed.");
    } finally {
      setLoading(false);
    }
  }

  function handleSignup(e: React.FormEvent) {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      setMessage("Password and confirm password do not match.");
      return;
    }

    callApi("signup", {
      fullName: form.fullName,
      email: form.email,
      password: form.password,
      ...(portal === "mentor"
        ? { title: form.title, education: form.education, expertise: form.expertise, phone: form.phone }
        : {}),
    });
  }

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    callApi("login", { email: form.email, password: form.password });
  }

  function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    callApi("forgot-password", { email: form.email });
  }

  function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    callApi("reset-password", {
      email: form.email,
      otp: form.otp,
      newPassword: form.newPassword,
    });
  }

  const heading =
    mode === "signup" ? "Sign up" : mode === "forgot" ? "Forgot password" : mode === "reset" ? "Reset password" : "Login";

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0a54d6] p-4">
      {/* Glossy blue backdrop: gradient plus soft 3D-ish ribbons and blobs. */}
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(120%_90%_at_20%_10%,#2f7cf0_0%,#0a54d6_45%,#0538a8_100%)]" />
      <div aria-hidden className="absolute -left-20 top-16 h-40 w-[26rem] -rotate-[28deg] rounded-full bg-gradient-to-r from-[#8ec1ff] via-[#3d8cf5] to-transparent opacity-80 blur-[2px] shadow-[0_30px_60px_rgba(0,20,80,0.35)]" />
      <div aria-hidden className="absolute -right-24 bottom-10 h-44 w-[30rem] rotate-[22deg] rounded-full bg-gradient-to-l from-[#9ccaff] via-[#2f7cf0] to-transparent opacity-80 blur-[2px] shadow-[0_30px_60px_rgba(0,20,80,0.35)]" />
      <div aria-hidden className="absolute left-1/2 top-1/2 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full border-[3.5rem] border-[#5fa3ff]/35 blur-[1px]" />
      <div aria-hidden className="absolute -bottom-16 left-10 h-56 w-56 rounded-full bg-[#7fb6ff]/40 blur-3xl" />
      <div aria-hidden className="absolute -top-10 right-24 h-48 w-48 rounded-full bg-[#bfe0ff]/30 blur-3xl" />

      {/* The glass card. */}
      <div className="relative w-full max-w-[450px] rounded-2xl border border-white/25 bg-white/10 p-6 shadow-[0_20px_60px_rgba(0,20,80,0.45)] backdrop-blur-xl">
        <p className="text-center text-[10px] font-bold uppercase tracking-[0.18em] text-white/70">
          Professional Grooming Program
        </p>

        {/* Who are you? Icon-only; the name pops up on hover / focus. */}
        <div className="mt-3 -mb-5 flex items-center justify-center gap-2.5" role="radiogroup" aria-label="Portal">
          {(Object.keys(ROLE_META) as Portal[]).map((r) => (
            <RoleIcon
              key={r}
              portal={r}
              active={portal === r}
              onClick={() => pickPortal(r)}
            />
          ))}
        </div>

        <h1 className="mt-2 text-xl font-black text-white">{heading}</h1>
        <p className="text-[10px] text-white/70">as {meta.label}</p>

        {/* Sign in / Sign up */}
        {(mode === "login" || mode === "signup") && (
          <div className="mt-1 flex rounded-md bg-white/10 p-0.5 ring-1 ring-inset ring-white/20">
            <AuthTab label="Sign In" active={mode === "login"} onClick={() => switchMode("login")} />
            <AuthTab label="Sign Up" active={mode === "signup"} onClick={() => switchMode("signup")} />
          </div>
        )}

        <div className="mt-3">
          {mode === "signup" && (
            <form onSubmit={handleSignup} className="space-y-2">
              {portal === "mentor" ? (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <Input label="Full name" name="fullName" placeholder="Your full name" value={form.fullName} onChange={handleChange} />
                    <TitleSelect value={form.title} onChange={handleChange} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input label="Email" name="email" type="email" placeholder="username@gmail.com" value={form.email} onChange={handleChange} />
                    <Input label="Phone" name="phone" placeholder="03xx xxxxxxx" value={form.phone} onChange={handleChange} />
                  </div>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Input label="Full name" name="fullName" placeholder="Your full name" value={form.fullName} onChange={handleChange} />
                  <Input label="Email" name="email" type="email" placeholder="username@gmail.com" value={form.email} onChange={handleChange} />
                </div>
              )}
              {portal === "mentor" && (
                <div className="grid grid-cols-2 gap-2">
                  <Input label="Education" name="education" placeholder="e.g. MBA (HR)" value={form.education} onChange={handleChange} />
                  <Input label="Expertise" name="expertise" placeholder="e.g. Talent acquisition" value={form.expertise} onChange={handleChange} />
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <Input label="Password" name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} />
                <Input label="Confirm password" name="confirmPassword" type="password" placeholder="Repeat password" value={form.confirmPassword} onChange={handleChange} />
              </div>

              {portal === "mentor" && (
                <p className="flex items-start gap-1.5 rounded-md bg-white/10 px-2.5 py-1.5 text-[10px] leading-snug text-white/85 ring-1 ring-inset ring-white/15">
                  <Clock size={12} className="mt-0.5 shrink-0" />
                  Mentor accounts are reviewed by the PGP admin. You can sign in once your account is
                  marked Active.
                </p>
              )}

              <SubmitButton loading={loading} text="Create account" />
              <FooterLink text="Already have an account?" action="Sign in" onClick={() => switchMode("login")} />
            </form>
          )}

          {mode === "login" && (
            <form onSubmit={handleLogin} className="space-y-2">
              <Input label="Email" name="email" type="email" placeholder="username@gmail.com" value={form.email} onChange={handleChange} />
              <Input label="Password" name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} />
              <button
                type="button"
                onClick={() => switchMode("forgot")}
                className="text-[10px] font-medium text-white/80 hover:text-white"
              >
                Forgot Password?
              </button>
              <SubmitButton loading={loading} text="Sign in" />
              <FooterLink text="Don't have an account yet?" action="Register for free" onClick={() => switchMode("signup")} />
            </form>
          )}

          {mode === "forgot" && (
            <form onSubmit={handleForgotPassword} className="space-y-2">
              <Input label="Registered email" name="email" type="email" placeholder="username@gmail.com" value={form.email} onChange={handleChange} />
              <SubmitButton loading={loading} text="Send OTP" />
              <FooterLink text="Remembered it?" action="Back to sign in" onClick={() => switchMode("login")} />
            </form>
          )}

          {mode === "reset" && (
            <form onSubmit={handleResetPassword} className="space-y-2">
              <Input label="Email" name="email" type="email" placeholder="username@gmail.com" value={form.email} onChange={handleChange} />
              <Input label="OTP code" name="otp" placeholder="6-digit code" value={form.otp} onChange={handleChange} />
              <Input label="New password" name="newPassword" type="password" placeholder="New password" value={form.newPassword} onChange={handleChange} />
              <SubmitButton loading={loading} text="Reset password" />
              <FooterLink text="Remembered it?" action="Back to sign in" onClick={() => switchMode("login")} />
            </form>
          )}
        </div>

        {message && (
          <div
            role="status"
            className={`mt-3 flex items-start gap-1.5 rounded-md px-2.5 py-2 text-[11px] font-semibold leading-snug ring-1 ring-inset ${
              pending
                ? "bg-amber-300/20 text-amber-50 ring-amber-200/40"
                : "bg-white/15 text-white ring-white/25"
            }`}
          >
            {pending && <Clock size={13} className="mt-0.5 shrink-0" />}
            <span>{message}</span>
          </div>
        )}
      </div>
    </main>
  );
}

/* ------------------------------------------------------------------------ */

/**
 * The portal picker, icon only. The name is a tooltip that appears on hover
 * and on keyboard focus (so it is never hover-only); `title` covers a
 * long-press on touch devices.
 */
function RoleIcon({ portal, active, onClick }: { portal: Portal; active: boolean; onClick: () => void }) {
  const meta = ROLE_META[portal];
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      aria-label={meta.label}
      title={meta.label}
      onClick={onClick}
      className={`group relative grid h-9 w-9 place-items-center rounded-full ring-1 ring-inset transition ${
        active
          ? "bg-white text-[#0b1f4d] ring-white shadow-lg"
          : "bg-white/10 text-white ring-white/30 hover:bg-white/20"
      }`}
    >
      {meta.icon}
      <span
        role="tooltip"
        className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#0b1f4d] px-2 py-0.5 text-[10px] font-bold text-white opacity-0 shadow transition group-hover:opacity-100 group-focus-visible:opacity-100"
      >
        {meta.label}
      </span>
    </button>
  );
}

function AuthTab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded py-1 text-[11px] font-black transition ${
        active ? "bg-white text-[#0b1f4d] shadow-sm" : "text-white/75 hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}

function FooterLink({ text, action, onClick }: { text: string; action: string; onClick: () => void }) {
  return (
    <p className="pt-1 text-center text-[10px] text-white/75">
      {text}{" "}
      <button type="button" onClick={onClick} className="font-bold text-white hover:underline">
        {action}
      </button>
    </p>
  );
}

/** Mr / Mrs / Ms / Miss / Dr — styled to sit beside the text inputs. */function TitleSelect({  value,  onChange,}: {  value: string;  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;}) {  return (    <label className="block">      <span className="mb-1 block text-[11px] font-semibold text-white">Title</span>      <select        required        name="title"        value={value}        onChange={onChange}        className={`h-8 w-full rounded-md bg-white px-2.5 text-xs font-medium outline-none transition focus:ring-2 focus:ring-white/60 ${value ? "text-slate-900" : "text-slate-400"}`}      >        <option value="" disabled>Select</option>        <option value="Mr">Mr</option>        <option value="Mrs">Mrs</option>        <option value="Ms">Ms</option>
        <option value="Miss">Miss</option>
        <option value="Dr">Dr</option>      </select>    </label>  );}
function Input({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  name: string;
  value: string;
  placeholder?: string;
  type?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold text-white">{label}</span>
      <input
        required
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={type === "password" ? "current-password" : name === "email" ? "email" : undefined}
        className="h-8 w-full rounded-md bg-white px-3 text-xs font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-white/60"
      />
    </label>
  );
}

function SubmitButton({ loading, text }: { loading: boolean; text: string }) {
  return (
    <button
      disabled={loading}
      type="submit"
      className="h-9 w-full rounded-md bg-[#0b1f4d] text-xs font-black text-white shadow-lg shadow-[#0b1f4d]/40 transition hover:bg-[#071633] disabled:cursor-not-allowed disabled:bg-slate-500"
    >
      {loading ? "Processing..." : text}
    </button>
  );
}
