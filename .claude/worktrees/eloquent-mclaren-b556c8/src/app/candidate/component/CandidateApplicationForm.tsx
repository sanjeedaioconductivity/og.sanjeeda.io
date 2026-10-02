"use client";

import React, { useState } from "react";
import { useEffect } from "react";
import {
  User,
  Users,
  GraduationCap,
  Briefcase,
  Laptop,
  FileText,
  CheckCircle,
} from "lucide-react";

type Tab =
  | "basic"
  | "guardian"
  | "education"
  | "job"
  | "resources"
  | "documents"
  | "agreement";

export default function CandidateDashboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>("basic");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState(() => {
  if (typeof window !== "undefined") {
    const savedCandidate = localStorage.getItem("candidateUser");

    if (savedCandidate) {
      const candidate = JSON.parse(savedCandidate);

      return {
        email: candidate.email || "",
        fullName: candidate.fullName || "",
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
    }
  }

  return {
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
});
  
  useEffect(() => {
  async function loadApplication() {
    const savedUser = localStorage.getItem("candidateUser");

    if (!savedUser) return;

    const user = JSON.parse(savedUser);

    try {
      const response = await fetch(
        `/api/pgp-candidate/application/${encodeURIComponent(user.email)}`
      );

      const data = await response.json();

      if (data.exists) {
        setForm({
          ...data.application,
        });
      } else {
        setForm((prev) => ({
          ...prev,
          email: user.email,
          fullName: user.fullName,
        }));
      }
    } catch (err) {
      console.error(err);
    }
  }

  loadApplication();
}, []);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setForm({ ...form, [name]: checked });
      return;
    }

    setForm({ ...form, [name]: value });
  }

async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();

  if (!form.confirmation || !form.termsAgreement) {
    setMessage("Please confirm information and accept terms.");
    return;
  }

  const response = await fetch("/api/pgp-candidate/application", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(form),
  });

  const data = await response.json();

  if (!response.ok) {
    setMessage(data.message || "Application save failed.");
    return;
  }

  setMessage(data.message);
  setForm((prev) => ({
  ...prev,
}));
}
  return (
    <main className="min-h-screen bg-slate-100 dark:bg-transparent">
      <div className="min-h-screen">

        <section className="p-3 sm:p-5 lg:p-8">
          <div className="mb-3 overflow-x-auto p-2 shadow-sm">
            <div className="flex w-max min-w-full gap-2">
              <TopTab icon={<User size={16} />} label="Basic Info" active={activeTab === "basic"} onClick={() => setActiveTab("basic")} />
              <TopTab icon={<Users size={16} />} label="Guardian" active={activeTab === "guardian"} onClick={() => setActiveTab("guardian")} />
              <TopTab icon={<GraduationCap size={16} />} label="Education" active={activeTab === "education"} onClick={() => setActiveTab("education")} />
              <TopTab icon={<Briefcase size={16} />} label="Job" active={activeTab === "job"} onClick={() => setActiveTab("job")} />
              <TopTab icon={<Laptop size={16} />} label="Resources" active={activeTab === "resources"} onClick={() => setActiveTab("resources")} />
              <TopTab icon={<FileText size={16} />} label="Documents" active={activeTab === "documents"} onClick={() => setActiveTab("documents")} />
              <TopTab icon={<CheckCircle size={16} />} label="Agreement" active={activeTab === "agreement"} onClick={() => setActiveTab("agreement")} />
            </div>
          </div>

<form onSubmit={handleSubmit} className="w-full rounded-xl bg-white dark:bg-white/5 dark:text-slate-100 p-4 shadow-sm sm:p-6 lg:w-3/4">
{activeTab === "basic" && (
    <FormSection title="">
    <Input label="Email" name="email" value={form.email} onChange={handleChange} readOnly />
    <Input label="Full Name" name="fullName" value={form.fullName} onChange={handleChange} readOnly />
    <Select label="Gender" name="gender" value={form.gender} onChange={handleChange} options={["Male", "Female", "Other"]} />
    <Input label="Nationality" name="nationality" value={form.nationality} onChange={handleChange}/>
    <Input label="CNIC" name="cnic" value={form.cnic} onChange={handleChange} />
    <Input label="Date of Birth" name="dob" type="date" value={form.dob} onChange={handleChange} />
    <Input label="Contact Number" name="contactNumber" value={form.contactNumber} onChange={handleChange} />
    <Textarea label="Full Address" name="address" value={form.address} onChange={handleChange} />
    </FormSection>
  )}

            {activeTab === "guardian" && (
              <FormSection title="Guardian Information">
                <Input
                  label="Father / Mother / Spouse / Guardian Name"
                  name="guardianName"
                  value={form.guardianName}
                  onChange={handleChange}
                />
              </FormSection>
            )}

            {activeTab === "education" && (
              <FormSection title="Education Information">
                <Select
                  label="Qualification"
                  name="qualification"
                  value={form.qualification}
                  onChange={handleChange}
                  options={["Matric", "Intermediate", "Bachelor's", "Master's", "PhD", "Other"]}
                />
              </FormSection>
            )}

            {activeTab === "job" && (
              <FormSection title="Job / Internship Information">
                <Input
                  label="Recent Job / Internship Title and Year"
                  name="recentJobTitleYear"
                  value={form.recentJobTitleYear}
                  onChange={handleChange}
                />

                <Textarea
                  label="What are your expectations with this program?"
                  name="expectations"
                  value={form.expectations}
                  onChange={handleChange}
                />
              </FormSection>
            )}

            {activeTab === "resources" && (
              <FormSection title="Resource Availability">
                <Select
                  label="Do you have your own Laptop / PC available at home?"
                  name="laptopAvailable"
                  value={form.laptopAvailable}
                  onChange={handleChange}
                  options={["Yes", "No", "Sometimes", "Shared with Others", "Other"]}
                />

                <Select
                  label="Do you have an active Internet Connection at home?"
                  name="internetConnection"
                  value={form.internetConnection}
                  onChange={handleChange}
                  options={["Yes", "No", "Yes but unstable", "Other"]}
                />
              </FormSection>
            )}

            {activeTab === "documents" && (
              <FormSection title="Document Uploads">
                <FileInput label="Updated CV" />
                <FileInput label="Internship / Job Experience Certificates" />
                <FileInput label="Copy of CNIC" />
                <FileInput label="Other Relevant Documents" />
              </FormSection>
            )}

            {activeTab === "agreement" && (
              <FormSection title="Confirmation & Agreement">
                <Checkbox
                  name="confirmation"
                  checked={form.confirmation}
                  onChange={handleChange}
                  label="I acknowledge and confirm that all information provided is correct."
                />

                <div className=" bg-slate-50 dark:bg-white/5 p-4 text-sm text-slate-600 dark:text-slate-300">
                  <p className="font-bold text-slate-900 dark:text-white">Terms & Agreement</p>
                  <p className="mt-2 text-xs">
                    I understand and agree to maintain respectful behavior throughout the program.
                    Misconduct or violation of rules may result in removal from the program.
                    Registration fees are non-refundable under any circumstances.
                  </p>
                </div>

                <Checkbox
                  name="termsAgreement"
                  checked={form.termsAgreement}
                  onChange={handleChange}
                  label="Yes, I agree to these terms."
                />

                <button
                  type="submit"
                  className=" rounded-2xl bg-blue-900 py-3.5 text-sm font-black text-white hover:bg-blue-950"
                >
                  Submit Application
                </button>
              </FormSection>
            )}

            {message && (
              <div className="mt-5 rounded-2xl bg-blue-50 p-4 text-sm font-semibold text-blue-900">
                {message}
              </div>
            )}
          </form>
          
        </section>
      </div>
    </main>
  );
}

function TopTab({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-[11px] font-bold transition sm:px-4 sm:py-3 sm:text-xs ${
  active
    ? "bg-blue-900 text-white shadow"
    : "bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-white/10 hover:text-blue-900 dark:hover:text-white"
}`}
    >
      {icon}
      {label}
    </button>
  );
}

function FormSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="mb-5 text-xl font-black text-slate-900 dark:text-white">{title}</h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{children}</div>
    </div>
  );
}

function Input({
  label,
  name,
  value,
  onChange,
  type = "text",
  readOnly = false,
}: {
  label: string;
  name: string;
  value: string;
  type?: string;
  readOnly?: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400 dark:text-slate-300">
        {label}
      </span>

      <input
        required
        readOnly={readOnly}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        className="w-full border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3 py-2.5 sm:px-4 text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-blue-800 focus:bg-white dark:focus:bg-white/10 focus:ring-4 focus:ring-blue-100"
      />
    </label>
  );
}

function Select({
  label,
  name,
  value,
  options,
  onChange,
}: {
  label: string;
  name: string;
  value: string;
  options: string[];
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400 dark:text-slate-300">
        {label}
      </span>

      <select
        required
        name={name}
        value={value}
        onChange={onChange}
        className="w-full border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3 py-2.5 sm:px-4 text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-blue-800 focus:bg-white dark:focus:bg-white/10"
      >
        <option value="">Select option</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function Textarea({
  label,
  name,
  value,
  onChange,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}) {
  return (
    <label className="block md:col-span-2">
      <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400 dark:text-slate-300">
        {label}
      </span>

      <textarea
        required name={name} value={value} onChange={onChange}
        rows={4}
        className="w-full border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3 py-2.5 sm:px-4 text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-blue-800 focus:bg-white dark:focus:bg-white/10"
      />
    </label>
  );
}

function FileInput({ label }: { label: string }) {
  return (
    <label className="block md:col-span-2">
      <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400 dark:text-slate-300">
        {label}
      </span>

      <input
        type="file"
        multiple accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
        className="w-full rounded border border-dashed border-slate-300 bg-slate-50 px-4 py-2 text-sm"
      />

      <p className="mt-1 text-xs text-slate-400">
        Upload up to 5 files. Max 10 MB per file.
      </p>
    </label>
  );
}

function Checkbox({
  name,
  checked,
  label,
  onChange,
}: {
  name: string;
  checked: boolean;
  label: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className="flex items-start gap-3 bg-slate-50 dark:bg-white/5 p-4 md:col-span-2">
      <input required type="checkbox" name={name} checked={checked} onChange={onChange} className="mt-1"/>
      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</span>
    </label>
  );
}