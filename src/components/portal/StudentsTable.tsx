"use client";

import { Mail, Phone, Users } from "lucide-react";
import CandidateAvatar from "@/components/portal/CandidateAvatar";

/** One enrolled student, as the portal APIs return them. */
export type Student = {
  fullName: string;
  email: string;
  gender: string;
  qualification: string;
  contactNumber: string;
};

/** The enrolled students of a program — the same table on the mentor and admin program pages. */
export default function StudentsTable({ students }: { students: Student[] }) {
  if (!students.length) {
    return (
      <div className="p-8 text-center">
        <Users size={26} className="mx-auto text-slate-300" />
        <p className="mt-2 text-sm font-bold text-slate-500">No students enrolled yet</p>
        <p className="mt-1 text-xs text-slate-400">
          Students assigned to this program by management will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto px-3 py-2">
      <table className="w-full border-collapse text-left text-xs">
        <thead className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400 dark:border-white/10 dark:bg-white/5">
          <tr>
            <th className="px-3 py-2 font-bold">#</th>
            <th className="px-3 py-2 font-bold">Name</th>
            <th className="px-3 py-2 font-bold">Email</th>
            <th className="px-3 py-2 font-bold">Gender</th>
            <th className="px-3 py-2 font-bold">Qualification</th>
            <th className="px-3 py-2 font-bold">Contact</th>
          </tr>
        </thead>
        <tbody>
          {students.map((s, i) => (
            <tr
              key={`${s.email}-${i}`}
              className="border-b border-slate-100 dark:border-white/5"
            >
              <td className="px-3 py-2 text-slate-400">{i + 1}</td>
              <td className="px-3 py-2 font-bold text-slate-900 dark:text-slate-100">
                <span className="flex items-center gap-2">
                  <CandidateAvatar email={s.email} name={s.fullName} size={26} />
                  {s.fullName || "-"}
                </span>
              </td>
              <td className="px-3 py-2 text-slate-600 dark:text-slate-300">
                <span className="inline-flex items-center gap-1">
                  <Mail size={11} className="text-slate-400" />
                  {s.email || "-"}
                </span>
              </td>
              <td className="px-3 py-2 text-slate-600 dark:text-slate-300">
                {s.gender || "-"}
              </td>
              <td className="px-3 py-2 text-slate-600 dark:text-slate-300">
                {s.qualification || "-"}
              </td>
              <td className="px-3 py-2 text-slate-600 dark:text-slate-300">
                <span className="inline-flex items-center gap-1">
                  <Phone size={11} className="text-slate-400" />
                  {s.contactNumber || "-"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
