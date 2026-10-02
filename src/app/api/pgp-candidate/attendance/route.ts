import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/utils/dbConnect";
import CandidateApplication from "@/models/CandidateApplication";

const ProgramSchema = new mongoose.Schema(
  {
    programName: String,
    assignedMentorName: String,
    weeklySchedule: Array,
    // Declared here as well as in models/PGPProgram.ts. Mongoose keeps whichever
    // schema registered FIRST for the life of the process, and it silently drops
    // query conditions on paths its schema does not know — so without this line
    // the visibility filter below could compile, run, and match everything.
    visibleToCandidates: Boolean,
  },
  { timestamps: true }
);

const AttendanceSchema = new mongoose.Schema(
  {
    programId: String,
    programName: String,
    candidateEmail: { type: String, lowercase: true },
    candidateName: String,
    week: String,
    status: String,
    markedById: String,
    markedByName: String,
  },
  { timestamps: true }
);

const PGPProgram =
  mongoose.models.PGPProgram || mongoose.model("PGPProgram", ProgramSchema);
const Attendance =
  mongoose.models.Attendance || mongoose.model("Attendance", AttendanceSchema);

function weekNo(value: string) {
  const m = /(\d+)/.exec(value || "");
  return m ? Number(m[1]) : Number.MAX_SAFE_INTEGER;
}

type AttRecord = { programId?: string; week?: string; status?: string };

export async function GET(request: Request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email")?.trim().toLowerCase() || "";
    if (!email) {
      return NextResponse.json({ message: "Email is required." }, { status: 400 });
    }

    const application = await CandidateApplication.findOne({ email }).lean();
    const candidateName = application?.fullName || "";
    const activeProgramId = application?.assignedProgramId || "";

    // Every programme the candidate has joined (the list) plus the active one,
    // de-duped and limited to valid ids.
    const rawIds: string[] = [
      ...(Array.isArray(application?.enrolledProgramIds)
        ? application.enrolledProgramIds
        : []),
      ...(activeProgramId ? [activeProgramId] : []),
    ];
    const programIds = Array.from(new Set(rawIds)).filter((id) =>
      mongoose.Types.ObjectId.isValid(id)
    );

    if (programIds.length === 0) {
      return NextResponse.json({
        enrolled: false,
        candidateName,
        activeProgramId: "",
        courses: [],
      });
    }

    const [programs, records] = await Promise.all([
      // Released programs only. A candidate's enrolment rows survive an admin
      // hiding the program, so without this filter the attendance table kept
      // listing a course that had vanished from everywhere else in the portal.
      PGPProgram.find({ _id: { $in: programIds }, visibleToCandidates: true }).lean(),
      Attendance.find({
        candidateEmail: email,
        programId: { $in: programIds },
      })
        .select("programId week status")
        .lean() as unknown as Promise<AttRecord[]>,
    ]);

    const progById = new Map(programs.map((p) => [String(p._id), p]));
    const recsByProgram = new Map<string, AttRecord[]>();
    for (const r of records) {
      const key = String(r.programId || "");
      const list = recsByProgram.get(key) ?? [];
      if (!recsByProgram.has(key)) recsByProgram.set(key, list);
      list.push(r);
    }

    /**
     * Driven by the programs that came back, not by the enrolment ids.
     *
     * It used to map over `programIds`, falling back to the literal string
     * "Programme" when the lookup missed — which was harmless while every
     * program was returned, and became a ghost row the moment the query started
     * filtering: a hidden program still had enrolment ids, so the table showed
     * an untitled course with "Not assigned" and no figures.
     */
    const courses = programIds.filter((id) => progById.has(id)).map((id) => {
      const prog = progById.get(id) as
        | {
            programName?: string;
            assignedMentorName?: string;
            weeklySchedule?: { week?: string }[];
          }
        | undefined;

      const weeks = Array.from(
        new Set(
          (prog?.weeklySchedule || [])
            .map((w) => w.week)
            .filter(Boolean) as string[]
        )
      ).sort((a, b) => weekNo(a) - weekNo(b));

      const recs = recsByProgram.get(id) || [];
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
        programId: id,
        programName:
          prog?.programName ||
          (id === activeProgramId ? application?.assignedProgramName : "") ||
          "Programme",
        instructorName: prog?.assignedMentorName || "",
        isActive: id === activeProgramId,
        weeks: rows,
        summary: {
          present,
          absent,
          late,
          excused,
          total: weeks.length,
          conducted,
          attended,
          percent,
        },
      };
    });

    // Active programme first, then alphabetical.
    courses.sort((a, b) =>
      a.isActive === b.isActive
        ? a.programName.localeCompare(b.programName)
        : a.isActive
        ? -1
        : 1
    );

    return NextResponse.json({
      enrolled: true,
      candidateName,
      activeProgramId,
      courses,
    });
  } catch (error) {
    console.error("Candidate Attendance Error:", error);
    return NextResponse.json(
      { message: "Failed to load attendance." },
      { status: 500 }
    );
  }
}
