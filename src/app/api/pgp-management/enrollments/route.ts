import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/offerguide/adminAuth";
import mongoose from "mongoose";
import dbConnect from "@/utils/dbConnect";
import CandidateApplication from "@/models/CandidateApplication";

const ProgramSchema = new mongoose.Schema(
  {
    programName: String,
    status: String,
    assignedMentorName: String,
    assignedMentorEmail: String,
    weeklySchedule: Array,
  },
  { timestamps: true }
);

const PGPProgram =
  mongoose.models.PGPProgram || mongoose.model("PGPProgram", ProgramSchema);

type Student = {
  fullName: string;
  email: string;
  gender: string;
  contactNumber: string;
  active: boolean;
};

export async function GET(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  try {
    await dbConnect();

    const programs = await PGPProgram.find().sort({ createdAt: -1 }).lean();

    // A candidate can now join several programs (enrolledProgramIds) while one
    // stays "active" (assignedProgramId). Pull anyone with either set.
    const applications = await CandidateApplication.find({
      $or: [
        { assignedProgramId: { $nin: [null, ""] } },
        { enrolledProgramIds: { $exists: true, $ne: [] } },
      ],
    })
      .select("fullName email gender contactNumber assignedProgramId enrolledProgramIds")
      .sort({ fullName: 1 })
      .lean();

    const byProgram = new Map<string, Student[]>();
    const uniquePeople = new Set<string>();

    for (const a of applications) {
      const active = a.assignedProgramId || "";
      const joined: string[] = Array.isArray(a.enrolledProgramIds)
        ? a.enrolledProgramIds
        : [];
      const ids = new Set<string>(
        [...joined, active].filter((id): id is string => Boolean(id))
      );
      if (ids.size === 0) continue;

      uniquePeople.add((a.email || a.fullName || "").toLowerCase());

      for (const id of ids) {
        const list = byProgram.get(id) || [];
        list.push({
          fullName: a.fullName || "",
          email: a.email || "",
          gender: a.gender || "",
          contactNumber: a.contactNumber || "",
          active: id === active,
        });
        byProgram.set(id, list);
      }
    }

    const result = programs.map((p) => {
      const id = String(p._id);
      const students = byProgram.get(id) || [];
      return {
        programId: id,
        programName: p.programName || "Untitled program",
        status: p.status || "Draft",
        mentorName: p.assignedMentorName || "",
        mentorEmail: p.assignedMentorEmail || "",
        weeks: p.weeklySchedule?.length || 0,
        studentCount: students.length,
        students,
      };
    });

    return NextResponse.json({
      // Distinct candidates (a multi-enrolled candidate is one person)…
      totalStudents: uniquePeople.size,
      // …vs. total enrollment rows across every program.
      totalEnrollments: result.reduce((s, p) => s + p.studentCount, 0),
      programs: result,
    });
  } catch (error) {
    console.error("Enrollments Fetch Error:", error);
    return NextResponse.json(
      { message: "Failed to load enrollments." },
      { status: 500 }
    );
  }
}
