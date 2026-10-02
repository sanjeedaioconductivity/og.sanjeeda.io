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
  {
    programName: String,
    assignedMentorName: String,
    assignedMentorEmail: String,
    weeklySchedule: Array,
  },
  { timestamps: true }
);

const Attendance =
  mongoose.models.Attendance || mongoose.model("Attendance", AttendanceSchema);
const PGPProgram =
  mongoose.models.PGPProgram || mongoose.model("PGPProgram", ProgramSchema);

function weekNo(value: string) {
  const m = /(\d+)/.exec(value || "");
  return m ? Number(m[1]) : Number.MAX_SAFE_INTEGER;
}

type Rec = { candidateEmail?: string; week?: string; status?: string };

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ programId: string }> }
) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  try {
    await dbConnect();
    const { programId } = await params;

    if (!mongoose.Types.ObjectId.isValid(programId)) {
      return NextResponse.json({ message: "Invalid program id." }, { status: 400 });
    }

    const program = (await PGPProgram.findById(programId).lean()) as
      | {
          _id: unknown;
          programName?: string;
          assignedMentorName?: string;
          assignedMentorEmail?: string;
          weeklySchedule?: { week?: string }[];
        }
      | null;

    if (!program) {
      return NextResponse.json({ message: "Program not found." }, { status: 404 });
    }

    const weeks = Array.from(
      new Set(
        (program.weeklySchedule || [])
          .map((w) => w.week)
          .filter(Boolean) as string[]
      )
    ).sort((a, b) => weekNo(a) - weekNo(b));

    const [enrolled, records] = await Promise.all([
      CandidateApplication.find({
        $or: [
          { assignedProgramId: programId },
          { enrolledProgramIds: programId },
        ],
      })
        .select("fullName email")
        .sort({ fullName: 1 })
        .lean(),
      Attendance.find({ programId })
        .select("candidateEmail week status")
        .lean() as unknown as Promise<Rec[]>,
    ]);

    const byEmail = new Map<string, Rec[]>();
    for (const r of records) {
      const key = (r.candidateEmail || "").toLowerCase();
      const list = byEmail.get(key) ?? [];
      if (!byEmail.has(key)) byEmail.set(key, list);
      list.push(r);
    }

    const candidates = enrolled.map((c) => {
      const email = (c.email || "").toLowerCase();
      const recs = byEmail.get(email) || [];
      const byWeek = new Map(recs.map((r) => [r.week, r.status]));
      const rows = weeks.map((w) => ({ week: w, status: byWeek.get(w) || "" }));

      const count = (s: string) => recs.filter((r) => r.status === s).length;
      const present = count("Present");
      const late = count("Late");
      const absent = count("Absent");
      const excused = count("Excused");
      const conducted = present + late + absent + excused;
      const attended = present + late;
      const percent = conducted ? Math.round((attended / conducted) * 100) : 0;

      return {
        fullName: c.fullName || "",
        email: c.email || "",
        present,
        late,
        absent,
        excused,
        conducted,
        attended,
        percent,
        weeks: rows,
      };
    });

    return NextResponse.json({
      program: {
        programId: String(program._id),
        programName: program.programName || "Untitled program",
        mentorName: program.assignedMentorName || "",
        mentorEmail: program.assignedMentorEmail || "",
        totalWeeks: weeks.length,
      },
      candidates,
    });
  } catch (error) {
    console.error("Management Program Attendance Error:", error);
    return NextResponse.json(
      { message: "Failed to load program attendance." },
      { status: 500 }
    );
  }
}
