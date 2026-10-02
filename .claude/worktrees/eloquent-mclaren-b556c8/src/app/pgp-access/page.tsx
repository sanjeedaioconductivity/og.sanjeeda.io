"use client";
import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ShieldCheck, GraduationCap } from "lucide-react";

export default function Home() {
  const [open, setOpen] = useState(false);

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#0b2f5b] dark:bg-darkBlue p-6">
      
      <div className="w-full max-w-md">
        <div className="p-6">
          <div className="text-center">
            <h1 className="text-2xl font-black text-white">Professional Grooming Program</h1>
            <p className="mt-5 text-sm text-white">Select your portal access</p>
          </div>

          <div className="relative mt-8">
            <button onClick={() => setOpen(!open)}
              className="flex w-full items-center justify-between rounded border border-slate-200 bg-white px-5 py-2 text-left"
            >
              <span className="font-semibold text-slate-700">Choose Portal</span>
              <ChevronDown size={20} className={`transition ${open ? "rotate-180" : ""}`}/>
            </button>

            {open && (
              <div className="absolute mt-1 w-full overflow-hidden rounded border bg-white ">
                <Link href="/management" className="flex items-center gap-4 px-3 py-3 hover:bg-slate-50 border-red-600">
                  <ShieldCheck size={24} className="text-blue-700"/>

                  <div>
                    <h3 className="font-bold text-slate-900">Management Portal</h3>
                    <p className="text-xs text-slate-500">Admin & Management Access</p>
                  </div>
                </Link>

                <Link href="/mentor" className="flex items-center gap-4 px-3 py-3 hover:bg-slate-50 border-red-600">
                  <ShieldCheck size={24} className="text-orange-700"/>

                  <div>
                    <h3 className="font-bold text-slate-900">Mentor Portal</h3>
                    <p className="text-xs text-slate-500">Access of Candidate Evaluation</p>
                  </div>
                </Link>

                <Link href="/candidate" className="flex items-center gap-4 border-t px-3 py-3 hover:bg-slate-50">
                  <GraduationCap size={24} className="text-green-700"/>

                  <div>
                    <h3 className="font-bold text-slate-900">Candidate Portal</h3>
                    <p className="text-xs text-slate-500">Candidate Login & Registration</p>
                  </div>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}