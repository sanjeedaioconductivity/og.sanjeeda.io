"use client";

import React, { useState } from "react";

type Mode = "login" | "signup";

type ApiResponse = {
  message: string;
  redirectTo?: string;
  user?: {
    id: string;
    fullName: string;
    email: string;
    education: string;
    expertise: string;
    phone: string;
    role: string;
  };
};

export default function MentorAuthPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    education: "",
    expertise: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function callApi(action: string, payload: object) {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/pgp-mentor/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...payload }),
      });

      const data = (await response.json()) as ApiResponse;

      if (!response.ok) {
        setMessage(data.message || "Something went wrong.");
        return;
      }

      if (action === "login" && data.user) {
        localStorage.setItem("mentorUser", JSON.stringify(data.user));
      }

      setMessage(data.message);

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
      education: form.education,
      expertise: form.expertise,
      phone: form.phone,
      password: form.password,
    });
  }

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    callApi("login", {
      email: form.email,
      password: form.password,
    });
  }

  return (
    <main className="min-h-screen bg-[#07111f] p-4 text-slate-900">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-6xl overflow-hidden rounded-[2rem] bg-white dark:bg-[#0b1230] shadow-2xl lg:grid-cols-2">
        <aside className="hidden bg-[#0b2f5b] p-12 text-white lg:block">
          <h1 className="mt-12 text-2xl font-black">PGP Mentor Portal</h1>
          <p className="mt-4 max-w-md text-sm text-blue-100">
            Mentor access for candidate attendance, feedback, training progress
            and evaluation records.
          </p>

          <div className="mt-10 space-y-4 text-sm">
            <Feature title="Candidate Guidance" />
            <Feature title="Attendance & Feedback" />
            <Feature title="Progress Evaluation" />
            <Feature title="Program Monitoring" />
          </div>
        </aside>

        <section className="flex items-center justify-center bg-slate-50 dark:bg-transparent px-5 py-10">
          <div className="w-full max-w-md bg-white dark:bg-transparent p-6">
            <div className="mb-4 flex gap-2">
              <AuthTab label="Sign In" active={mode === "login"} onClick={() => setMode("login")} />
              <AuthTab label="Sign Up" active={mode === "signup"} onClick={() => setMode("signup")} />
            </div>

            {mode === "signup" && (
              <form onSubmit={handleSignup} className="space-y-3">
                <Input label="Full Name" name="fullName" value={form.fullName} onChange={handleChange} />
                <Input label="Email Address" name="email" type="email" value={form.email} onChange={handleChange} />
                <Input label="Education" name="education" value={form.education} onChange={handleChange} />
                <Input label="Expertise / Domain" name="expertise" value={form.expertise} onChange={handleChange} />
                <Input label="Phone" name="phone" value={form.phone} onChange={handleChange} />
                <Input label="Password" name="password" type="password" value={form.password} onChange={handleChange} />
                <Input label="Confirm Password" name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} />
                <SubmitButton loading={loading} text="Create Mentor Account" />
              </form>
            )}

            {mode === "login" && (
              <form onSubmit={handleLogin} className="space-y-3">
                <Input label="Email Address" name="email" type="email" value={form.email} onChange={handleChange} />
                <Input label="Password" name="password" type="password" value={form.password} onChange={handleChange} />
                <SubmitButton loading={loading} text="Sign In" />
              </form>
            )}

            {message && (
              <div className="mt-4 bg-blue-50 p-3 text-xs font-semibold text-blue-900">
                {message}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function Feature({ title }: { title: string }) {
  return <div className="border-l-2 border-cyan-300 pl-3 text-blue-100">{title}</div>;
}

function AuthTab({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 py-3 text-sm font-black ${
        active ? "bg-blue-900 text-white" : "bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-300"
      }`}
    >
      {label}
    </button>
  );
}

function Input({
  label,
  name,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  name: string;
  value: string;
  type?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-300">
        {label}
      </span>
      <input
        required
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        className="w-full border dark:border-white/10 bg-slate-50 dark:bg-white/5 px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-900"
      />
    </label>
  );
}

function SubmitButton({ loading, text }: { loading: boolean; text: string }) {
  return (
    <button
      disabled={loading}
      type="submit"
      className="w-full bg-blue-900 py-3 text-sm font-black text-white disabled:bg-slate-400"
    >
      {loading ? "Processing..." : text}
    </button>
  );
}