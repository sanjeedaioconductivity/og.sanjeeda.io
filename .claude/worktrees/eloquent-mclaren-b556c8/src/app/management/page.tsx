"use client";
import React, { useState } from "react";
import { Users, UserCog, CalendarCheck, MessageSquareText, GraduationCap, FolderKanban, FileBarChart2,} from "lucide-react";
type Mode = "login" | "signup" | "forgot" | "reset";

type ApiResponse = {
  message: string;
  redirectTo?: string;
};

function FeatureItem({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 ">
      <div className="text-cyan-300">{icon}</div>
      <div>
        <h4 className="text-sm font-bold text-white">{title}</h4>
        <p className="mt-1 text-xs text-blue-100">{description}</p>
      </div>

    </div>
  );
}

export default function ManagementAuthPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    department: "",
    password: "",
    confirmPassword: "",
    otp: "",
    newPassword: "",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function callApi(action: string, payload: object) {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/pgp-management/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...payload }),
      });

      const data = (await response.json()) as ApiResponse;

      if (!response.ok) {
        setMessage(data.message || "Something went wrong.");
        return;
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
      phone: form.phone,
      department: form.department,
      password: form.password,
    });
  }

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    callApi("login", { 
      email: form.email, 
      password: form.password 
    });
  }

  function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    callApi("forgot-password", { 
      email: form.email 
    });
    setMode("reset");
  }

  function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    callApi("reset-password", {
      email: form.email,
      otp: form.otp,
      newPassword: form.newPassword,
    });
  }

  return (
    <main className="min-h-screen bg-[#07111f] p-4 text-slate-900">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-7xl overflow-hidden rounded-[2rem] bg-white dark:bg-[#0b1230] shadow-2xl lg:grid-cols-[1.05fr_0.95fr]">
        
        <aside className="relative hidden overflow-hidden bg-[#0b2f5b] p-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
          <div className="absolute bottom-10 right-10 h-80 w-80 rounded-full bg-blue-300/20 blur-3xl" />

          <div className="relative">

            <h2 className="max-w-xl mt-14 text-xl font-black leading-tight">
              Professional Grooming Program Management System
            </h2>
            
            <div className="mt-8 grid grid-cols-1 gap-4">
              <FeatureItem
                icon={<Users size={22} />}
                title="Candidates"
                description="Track progress and readiness."
              />
              <FeatureItem
                icon={<UserCog size={22} />}
                title="Mentors"
                description="Monitor mentor engagement."
              />
              <FeatureItem
                icon={<CalendarCheck size={22} />}
                title="Attendance"
                description="Manage attendance records."
              />
              <FeatureItem
                icon={<MessageSquareText size={22} />}
                title="Feedback"
                description="Review follow-ups and remarks."
                />
              <FeatureItem
                icon={<GraduationCap size={22} />}
                title="Trainings"
                description="Track learning and certifications."
              />
              <FeatureItem
                icon={<FolderKanban size={22} />}
                title="Projects"
                description="Monitor project completion."
              />
              <FeatureItem
                icon={<FileBarChart2 size={22} />}
                title="Reports"
                description="Generate readiness analytics."
                />
            </div>
          </div>

        </aside>

        <section className="flex items-center justify-center bg-slate-50 dark:bg-transparent px-5 py-10 sm:px-10">
          <div className="w-full max-w-md">


            <div className="rounded-3xl bg-white dark:bg-transparent p-6 mt-14">

           <div className="mb-3 flex bg-white dark:bg-transparent p-1.5">
              <AuthTab label="Sign In" active={mode === "login"} onClick={() => setMode("login")} />
              <AuthTab label="Sign Up" active={mode === "signup"} onClick={() => setMode("signup")} />
            </div>

              {mode === "signup" && (
                <form onSubmit={handleSignup} className="space-y-2 text-xs">
                  <Input  label="Full Name" name="fullName" value={form.fullName} onChange={handleChange} />
                  <Input label="Email Address" name="email" type="email" value={form.email} onChange={handleChange} />
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Input label="Phone" name="phone" value={form.phone} onChange={handleChange} />
                    <Input label="Department" name="department" value={form.department} onChange={handleChange} />
                  </div>
                  <Input label="Password" name="password" type="password" value={form.password} onChange={handleChange} />
                  <Input label="Confirm Password" name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} />
                  <SubmitButton loading={loading} text="Create Account" />
                  
                  <p className="text-center text-xs text-slate-500 dark:text-slate-300">
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setMode("login")}
                      className="font-semibold text-blue-800 transition hover:text-blue-950"
                    >
                     Sign In
                    </button>
                  </p>

                </form>
              )}

              {mode === "login" && (
                <form onSubmit={handleLogin} className="space-y-3">
                  <Input label="Email Address" name="email" type="email" value={form.email} onChange={handleChange} />
                  <Input label="Password" name="password" type="password" value={form.password} onChange={handleChange} />

                  <SubmitButton loading={loading} text="Sign In" />
                  <div className="flex items-center justify-between">
                    
                    <button type="button" onClick={() => setMode("forgot")}
                      className="text-xs font-medium text-slate-500 dark:text-slate-300 hover:text-blue-700"
                    >
                      Forgot Password?
                    </button>
                  </div>
                </form>
              )}

              {mode === "forgot" && (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <Input label="Registered Email" name="email" type="email" value={form.email} onChange={handleChange} />
                  <SubmitButton loading={loading} text="Send OTP" />

                  <button
                    type="button"
                    onClick={() => setMode("login")}
                    className="w-full text-sm font-bold text-slate-500 dark:text-slate-300 hover:text-blue-800"
                  >
                    Back to sign in
                  </button>
                </form>
              )}

              {mode === "reset" && (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <Input label="Email Address" name="email" type="email" value={form.email} onChange={handleChange} />
                  <Input label="OTP Code" name="otp" value={form.otp} onChange={handleChange} />
                  <Input label="New Password" name="newPassword" type="password" value={form.newPassword} onChange={handleChange} />
                  <SubmitButton loading={loading} text="Reset Password" />
                </form>
              )}

              {message && (
                <div className="mt-5 rounded-2xl bg-blue-50 p-4 text-sm font-semibold text-blue-900 ring-1 ring-blue-100">
                  {message}
                </div>
              )}
            </div>

            <p className="mt-8 text-center text-xs font-medium text-slate-400">
              Secure access for authorized Sanjeeda.io management users only.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
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
      className={`flex-1 rounded-xl py-3 text-sm font-black transition ${
        active
          ? "bg-blue-900 text-white shadow"
          : "text-slate-500 dark:text-slate-300 hover:text-blue-900"
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
<span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400 dark:text-slate-300">
  {label}
</span>
      <input
        required
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        className="w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-4 py-3 text-sm font-medium text-slate-900 dark:text-white outline-none transition focus:border-blue-800 focus:bg-white dark:focus:bg-white/10 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-500/20"
      />
    </label>
  );
}

function SubmitButton({
  loading,
  text,
}: {
  loading: boolean;
  text: string;
}) {
  return (
    <button
      disabled={loading}
      type="submit"
      className="w-full rounded-2xl bg-blue-900 py-3.5 text-sm font-black text-white shadow-lg shadow-blue-200 transition hover:bg-blue-950 disabled:cursor-not-allowed disabled:bg-slate-400"
    >
      {loading ? "Processing..." : text}
    </button>
  );
}