"use client";

import React, { useEffect, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Send } from "lucide-react";
import DocumentUploader from "@/app/candidate/component/DocumentUploader";

type FormState = {
  email: string;
  fullName: string;
  guardianName: string;
  gender: string;
  nationality: string;
  cnic: string;
  dob: string;
  address: string;
  contactNumber: string;
  qualification: string;
  recentJobTitleYear: string;
  expectations: string;
  laptopAvailable: string;
  internetConnection: string;
  confirmation: boolean;
  termsAgreement: boolean;
};

const EMPTY: FormState = {
  email: "",
  fullName: "",
  guardianName: "",
  gender: "",
  nationality: "",
  cnic: "",
  dob: "",
  address: "",
  contactNumber: "",
  qualification: "",
  recentJobTitleYear: "",
  expectations: "",
  laptopAvailable: "",
  internetConnection: "",
  confirmation: false,
  termsAgreement: false,
};

const STEPS: {
  key: string;
  label: string;
  required: (keyof FormState)[];
}[] = [
  { key: "basic", label: "Basic Info", required: ["gender", "nationality", "cnic", "dob", "contactNumber", "address"] },
  { key: "guardian", label: "Guardian", required: ["guardianName"] },
  { key: "education", label: "Education", required: ["qualification"] },
  { key: "job", label: "Experience", required: ["recentJobTitleYear", "expectations"] },
  { key: "resources", label: "Resources", required: ["laptopAvailable", "internetConnection"] },
  { key: "documents", label: "Documents", required: [] },
  { key: "agreement", label: "Agreement", required: ["confirmation", "termsAgreement"] },
];

function isFilled(value: FormState[keyof FormState]) {
  if (typeof value === "boolean") return value;
  return String(value || "").trim() !== "";
}

export default function CandidateApplicationForm() {
  const [step, setStep] = useState(0);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [form, setForm] = useState<FormState>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("candidateUser");
      if (saved) {
        const c = JSON.parse(saved);
        return { ...EMPTY, email: c.email || "", fullName: c.fullName || "" };
      }
    }
    return EMPTY;
  });

  useEffect(() => {
    async function load() {
      const saved = localStorage.getItem("candidateUser");
      if (!saved) return;
      const user = JSON.parse(saved);
      try {
        const res = await fetch(
          `/api/pgp-candidate/application/${encodeURIComponent(user.email)}`
        );
        const data = await res.json();
        const next: FormState = data.exists
          ? { ...EMPTY, ...data.application }
          : { ...EMPTY, email: user.email, fullName: user.fullName };
        setForm(next);
        // Mark steps already satisfied as complete.
        const done = new Set<number>();
        STEPS.forEach((s, i) => {
          if (s.required.every((f) => isFilled(next[f]))) done.add(i);
        });
        setCompleted(done);
      } catch (err) {
        console.error(err);
      }
    }
    void load();
  }, []);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      setForm({ ...form, [name]: (e.target as HTMLInputElement).checked });
    } else {
      setForm({ ...form, [name]: value });
    }
  }

  function missingOnStep(i: number) {
    return STEPS[i].required.filter((f) => !isFilled(form[f]));
  }

  function goNext() {
    if (missingOnStep(step).length > 0) {
      setMessage({ text: "Please complete all required fields on this step before continuing.", ok: false });
      return;
    }
    setCompleted((prev) => new Set(prev).add(step));
    setMessage(null);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function goBack() {
    setMessage(null);
    setStep((s) => Math.max(s - 1, 0));
  }

  function goTo(i: number) {
    // Allow jumping back to any reached/completed step.
    if (i <= step || completed.has(i)) {
      setMessage(null);
      setStep(i);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.confirmation || !form.termsAgreement) {
      setMessage({ text: "Please confirm your information and accept the terms.", ok: false });
      return;
    }
    try {
      const res = await fetch("/api/pgp-candidate/application", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ text: data.message || "Application save failed.", ok: false });
        return;
      }
      setCompleted((prev) => new Set(prev).add(6));
      setMessage({ text: data.message || "Application submitted successfully.", ok: true });
    } catch {
      setMessage({ text: "Could not submit. Please try again.", ok: false });
    }
  }

  const isLast = step === STEPS.length - 1;

  return (
    <div className="rounded-2xl bg-slate-100 p-3 pt-2 dark:bg-white/5 sm:p-5 sm:pt-3">
    <div className="max-w-4xl overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 shadow-sm">
      {/* Welcome banner */}
      <div className="bg-red-600 px-5 py-4 text-center text-white">
        <h1 className="text-base font-black sm:text-lg">
          Welcome to Professional Grooming Programs
        </h1>
        <p className="mt-0.5 text-xs font-medium text-white/85">
          Tell us about yourself to get started.
        </p>
      </div>

      <div className="flex">
        {/* Stepper — vertical, pinned to the left */}
        <div className="w-28 shrink-0 border-r border-slate-200 px-3 py-4 dark:border-white/10 sm:w-32">
          <ol className="flex flex-col items-start gap-4">
            {STEPS.map((s, i) => {
              const done = completed.has(i);
              const current = i === step;
              const clickable = i <= step || done;
              return (
                <li key={s.key} className="relative flex items-center gap-2">
                  {i > 0 && (
                    <span
                      className={`absolute -top-4 left-[9px] h-4 w-[2px] ${
                        completed.has(i - 1) ? "bg-emerald-500" : "bg-zinc-200 dark:bg-white/15"
                      }`}
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => goTo(i)}
                    disabled={!clickable}
                    className={`relative z-10 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-black transition ${
                      done
                        ? "bg-emerald-600 text-white"
                        : current
                        ? "bg-zinc-500 text-white ring-2 ring-zinc-200 dark:ring-white/10"
                        : "bg-zinc-100 dark:bg-white/10 text-zinc-400"
                    } ${clickable ? "cursor-pointer" : "cursor-not-allowed"}`}
                  >
                    {done ? <Check size={11} /> : i + 1}
                  </button>
                  <span
                    className={`text-[8px] font-bold uppercase leading-tight tracking-wide sm:text-[9px] ${
                      current
                        ? "text-slate-900 dark:text-white"
                        : done
                        ? "text-emerald-600"
                        : "text-slate-400"
                    }`}
                  >
                    {s.label}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="min-w-0 flex-1">
        <div className="min-h-[20px] px-5 py-4 sm:px-6">
          {step === 0 && (
            <Section title="Basic Information">
              <Field label="Email" name="email" value={form.email} onChange={handleChange} readOnly />
              <Field label="Full Name" name="fullName" value={form.fullName} onChange={handleChange} readOnly />
              <SelectField label="Gender" name="gender" value={form.gender} onChange={handleChange} options={["Male", "Female", "Other"]} required />
              <Field label="Nationality" name="nationality" value={form.nationality} onChange={handleChange} required />
              <Field label="CNIC" name="cnic" value={form.cnic} onChange={handleChange} required />
              <Field label="Date of Birth" name="dob" type="date" value={form.dob} onChange={handleChange} required />
              <Field label="Contact Number" name="contactNumber" value={form.contactNumber} onChange={handleChange} required />
              <TextareaField label="Full Address" name="address" value={form.address} onChange={handleChange} required full={false} />
            </Section>
          )}

          {step === 1 && (
            <Section title="Guardian Information">
              <TextareaField
                label="Father / Mother / Spouse / Guardian Name"
                name="guardianName"
                value={form.guardianName}
                onChange={handleChange}
                required
              />
            </Section>
          )}

          {step === 2 && (
            <Section title="Education">
              <SelectField
                label="Highest Qualification"
                name="qualification"
                value={form.qualification}
                onChange={handleChange}
                options={["Matric", "Intermediate", "Bachelor's", "Master's", "PhD", "Other"]}
                required
              />
            </Section>
          )}

          {step === 3 && (
            <Section title="Job / Internship Experience">
              <Field
                label="Recent Job / Internship Title and Year"
                name="recentJobTitleYear"
                value={form.recentJobTitleYear}
                onChange={handleChange}
                required
              />
              <TextareaField
                label="What are your expectations from this program?"
                name="expectations"
                value={form.expectations}
                onChange={handleChange}
                required
              />
            </Section>
          )}

          {step === 4 && (
            <Section title="Resource Availability">
              <SelectField
                label="Do you have your own Laptop / PC at home?"
                name="laptopAvailable"
                value={form.laptopAvailable}
                onChange={handleChange}
                options={["Yes", "No", "Sometimes", "Shared with Others", "Other"]}
                required
              />
              <SelectField
                label="Do you have an active Internet Connection at home?"
                name="internetConnection"
                value={form.internetConnection}
                onChange={handleChange}
                options={["Yes", "No", "Yes but unstable", "Other"]}
                required
              />
            </Section>
          )}

          {step === 5 && (
            <div>
              <h3 className="mb-3 text-sm font-black uppercase tracking-wide text-[#0b2f5b] dark:text-sky-300">
                Document Uploads
              </h3>
              <DocumentUploader />
            </div>
          )}

          {step === 6 && (
            <div className="space-y-4">
              <h3 className="text-sm font-black uppercase tracking-wide text-[#0b2f5b] dark:text-sky-300">
                Confirmation &amp; Agreement
              </h3>
                <p className="mt-1 text-xs">
                  I understand and agree to maintain respectful behaviour throughout the
                  program. Misconduct or violation of rules may result in removal.
                  Registration fees are non-refundable under any circumstances.
                </p>
              <label className="flex items-start gap-3 border border-slate-200 dark:border-white/10
               bg-slate-50 dark:bg-white/5 p-3">
                <input
                  type="checkbox"
                  name="confirmation"
                  checked={form.confirmation}
                  onChange={handleChange}
                  className="mt-0.5"
                />
                <span className="text-xs text-slate-700 dark:text-slate-200">
                  I acknowledge and confirm that all information provided is correct.
                </span>
    
              </label>
              <label className="flex items-start gap-3 border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-3">
                <input
                  type="checkbox"
                  name="termsAgreement"
                  checked={form.termsAgreement}
                  onChange={handleChange}
                  className="mt-0.5"
                />
                <span className="text-xs text-slate-700 dark:text-slate-200">
                  Yes, I agree to these terms.
                </span>
              </label>
            </div>
          )}
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mx-5 mb-2 border px-3 py-2 text-xs font-bold sm:mx-6 ${
              message.ok
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-rose-200 bg-rose-50 text-rose-700"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Footer nav */}
        <div className="flex items-center justify-between gap-3 border-t border-slate-200 dark:border-white/10 px-5 py-3 sm:px-6">
          <button
            type="button"
            onClick={goBack}
            disabled={step === 0}
            className="inline-flex items-center gap-1.5 border border-slate-300 dark:border-white/15 px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 transition hover:bg-slate-100 dark:hover:bg-white/10 disabled:opacity-40"
          >
            <ChevronLeft size={15} />
            Back
          </button>

          <span className="text-[11px] font-semibold text-slate-400">
            Step {step + 1} of {STEPS.length}
          </span>

          {isLast ? (
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 bg-emerald-600 px-5 py-2 text-xs font-black text-white transition hover:bg-emerald-700"
            >
              <Send size={14} />
              Submit Application
            </button>
          ) : (
            <button
              type="button"
              onClick={goNext}
              className="inline-flex items-center gap-1.5 bg-[#0b2f5b] px-5 py-2 text-xs font-black text-white transition hover:bg-blue-950"
            >
              Next
              <ChevronRight size={15} />
            </button>
          )}
        </div>
        </form>
      </div>
    </div>
    </div>
  );
}

/* ------------------------------- Fields ---------------------------------- */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-black uppercase tracking-wide text-[#0b2f5b] dark:text-sky-300">
        {title}
      </h3>
      <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">{children}</div>
    </div>
  );
}

const LABEL =
  "mb-0.5 block text-[10px] font-normal text-slate-500 dark:text-slate-300";
const CONTROL =
  "w-full rounded-md border border-slate-300 dark:border-white/15 bg-white dark:bg-white/5 px-2 py-1 text-[11px] font-normal text-slate-900 dark:text-white outline-none transition focus:border-[#0b2f5b] focus:ring-2 focus:ring-blue-100 dark:focus:ring-white/10 read-only:bg-slate-100 read-only:text-slate-500";

function Field({
  label,
  name,
  value,
  onChange,
  type = "text",
  readOnly = false,
  required = false,
}: {
  label: string;
  name: string;
  value: string;
  type?: string;
  readOnly?: boolean;
  required?: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className="block">
      <span className={LABEL}>
        {label} {required && <span className="text-rose-500">*</span>}
      </span>
      <input
        name={name}
        type={type}
        value={value}
        readOnly={readOnly}
        onChange={onChange}
        className={CONTROL}
      />
    </label>
  );
}

function SelectField({
  label,
  name,
  value,
  options,
  onChange,
  required = false,
}: {
  label: string;
  name: string;
  value: string;
  options: string[];
  required?: boolean;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}) {
  return (
    <label className="block">
      <span className={LABEL}>
        {label} {required && <span className="text-rose-500">*</span>}
      </span>
      <select name={name} value={value} onChange={onChange} className={`${CONTROL} cursor-pointer`}>
        <option value="">Select option</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextareaField({
  label,
  name,
  value,
  onChange,
  required = false,
  full = true,
}: {
  label: string;
  name: string;
  value: string;
  required?: boolean;
  full?: boolean;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}) {
  return (
    <label className={`${full ? "col-span-2" : ""} block`}>
      <span className={LABEL}>
        {label} {required && <span className="text-rose-500">*</span>}
      </span>
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        rows={2}
        className={`${CONTROL} resize-y`}
      />
    </label>
  );
}
