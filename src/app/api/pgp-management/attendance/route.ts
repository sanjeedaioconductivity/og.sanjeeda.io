import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/offerguide/adminAuth";
import mongoose from "mongoose";
import dbConnect from "@/utils/dbConnect";
import CandidateApplication from "@/models/CandidateApplication";

const AttendanceSchema = new mongoose.Schema(
  {
    programId: String,
    candidateEmail: { type: String, lowercase: true },
    week: String,
    status: String,
  },
  { timestamps: true }
);

const ProgramSchema = new mongoose.Schema(
  { programName: String, weeklySchedule: Array },
  { timestamps: true }
);

const Attendance =
  mongoose.models.Attendance || mongoose.model("Attendance", AttendanceSchema);
const PGPProgram =
  mongoose.models.PGPProgram || mongoose.model("PGPProgram", ProgramSchema);

export async function GET(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  try {
    await dbConnect();

    // Only candidates who are enrolled in a program appear in attendance.
    const enrolled = await CandidateApplication.find({
      assignedProgramId: { $nin: [null, ""] },
    })
      .select("fullName email assignedProgramId assignedProgramName")
      .lean();

    const programs = await PGPProgram.find().select("weeklySchedule").lean();
    const weeksByProgram = new Map(
      programs.map((p) => [
        String(p._id),
        new Set(
          (p.weeklySchedule || [])
            .map((w: { week?: string }) => w.week)
            .filter(Boolean)
        ).size,
      ])
    );

    const records = await Attendance.find().select("candidateEmail status").lean();
    const recByEmail = new Map<string, { present: number; late: number; absent: number; excused: number }>();
    for (const r of records) {
      const key = r.candidateEmail || "";
      const cur =
        recByEmail.get(key) || { present: 0, late: 0, absent: 0, excused: 0 };
      if (r.status === "Present") cur.present++;
      else if (r.status === "Late") cur.late++;
      else if (r.status === "Absent") cur.absent++;
      else if (r.status === "Excused") cur.excused++;
      recByEmail.set(key, cur);
    }

    const rows = enrolled.map((c) => {
      const r = recByEmail.get(c.email || "") || {
        present: 0,
        late: 0,
        absent: 0,
        excused: 0,
      };
      const marked = r.present + r.late + r.absent + r.excused;
      const totalWeeks = weeksByProgram.get(c.assignedProgramId || "") || 0;
      const percent = marked
        ? Math.round(((r.present + r.late) / marked) * 100)
        : 0;
      return {
        fullName: c.fullName || "",
        email: c.email || "",
        programName: c.assignedProgramName || "",
        present: r.present,
        late: r.late,
        absent: r.absent,
        excused: r.excused,
        marked,
        totalWeeks,
        percent,
      };
    });

    rows.sort((a, b) => a.percent - b.percent); // lowest attendance first

    return NextResponse.json({ total: rows.length, candidates: rows });
  } catch (error) {
    console.error("Management Attendance Error:", error);
    return NextResponse.json(
      { message: "Failed to load attendance." },
      { status: 500 }
    );
  }
}
