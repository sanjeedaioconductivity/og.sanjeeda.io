import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/utils/dbConnect";
import CandidateApplication from "@/models/CandidateApplication";
import ActivityLog, { ENROLLMENT_SECTION } from "@/models/ActivityLog";

const ProgramSchema = new mongoose.Schema(
  {
    programName: String,
    status: String,
    recommendedDuration: String,
    assignedMentorName: String,
    weeklySchedule: Array,
    portfolioChecklist: Array,
    capstoneTimeline: Array,
    // Declared here as well as in models/PGPProgram.ts. Mongoose keeps whichever
    // schema registered FIRST for the life of the process, so a path missing
    // here can be missing on the shared model too.
    visibleToCandidates: Boolean,
  },
  { timestamps: true }
);

const PGPProgram =
  mongoose.models.PGPProgram || mongoose.model("PGPProgram", ProgramSchema);

export async function GET(request: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email")?.trim().toLowerCase() || "";

    const programs = await PGPProgram.find().sort({ createdAt: -1 }).lean();
    const application = email
      ? await CandidateApplication.findOne({ email }).lean()
      : null;

    // Back-fill: a candidate enrolled before the multi-select field existed
    // still has assignedProgramId but an empty list.
    const activeId = application?.assignedProgramId || "";
    const enrolledIds: string[] = Array.isArray(application?.enrolledProgramIds)
      ? application.enrolledProgramIds
      : [];
    const allEnrolled = Array.from(
      new Set([...enrolledIds, ...(activeId ? [activeId] : [])])
    );

    /**
     * Only programs an admin has released to candidates. Nothing else, enrolled
     * or not.
     *
     * This first shipped with an exception that kept an enrolled candidate's own
     * programs in the list whatever the flag said, so that unticking could not
     * take a program away from someone part-way through it. That was wrong for
     * this product: the same response feeds the Offered Programs CATALOGUE as
     * well as My Courses, so an enrolled program stayed on display in the
     * browse-and-join table too, and unticking visibly did nothing. Hidden means
     * hidden — confirmed after seeing both behaviours.
     *
     * THE CONSEQUENCE IS DELIBERATE: unticking Candidates on a running program
     * removes it from every candidate's portal, mid-cohort, including the people
     * on it. Their enrolment is untouched in the database and comes back the
     * moment it is ticked again — but while it is off they cannot reach it.
     */
    const visible = programs.filter((p) => p.visibleToCandidates === true);

    return NextResponse.json({
      activeProgramId: activeId,
      enrolledProgramIds: allEnrolled,
      programs: visible.map((p) => ({
        programId: String(p._id),
        programName: p.programName || "Untitled program",
        status: p.status || "Draft",
        mentorName: p.assignedMentorName || "",
        recommendedDuration: p.recommendedDuration || "",
        weeks: p.weeklySchedule?.length || 0,
        portfolioItems: p.portfolioChecklist?.length || 0,
        capstoneItems: p.capstoneTimeline?.length || 0,
      })),
    });
  } catch (error) {
    console.error("Candidate Programs Fetch Error:", error);
    return NextResponse.json(
      { message: "Failed to load programs." },
      { status: 500 }
    );
  }
}

/**
 * action:
 *   "join"      (default) — add the program to enrolledProgramIds and make it active
 *   "setActive"           — point the single active field at an already-joined program
 *   "leave"               — remove the program; if it was active, promote another
 */
export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    const email = String(body.email || "").toLowerCase();
    const programId = String(body.programId || "");
    const action = String(body.action || "join");

    if (!email || !programId) {
      return NextResponse.json(
        { message: "Email and program are required." },
        { status: 400 }
      );
    }
    if (!mongoose.Types.ObjectId.isValid(programId)) {
      return NextResponse.json({ message: "Invalid program." }, { status: 400 });
    }

    const program = await PGPProgram.findById(programId)
      .select("programName")
      .lean();
    if (!program) {
      return NextResponse.json({ message: "Program not found." }, { status: 404 });
    }
    const programName = (program as { programName?: string }).programName || "";

    const application = await CandidateApplication.findOne({ email }).lean();
    const currentList: string[] = Array.isArray(application?.enrolledProgramIds)
      ? application.enrolledProgramIds
      : [];
    const currentActive = application?.assignedProgramId || "";

    if (action === "leave") {
      const nextList = currentList.filter((id) => id !== programId);
      const stillActive = currentActive === programId ? "" : currentActive;
      const promotedId = stillActive || nextList[0] || "";
      let promotedName = "";
      if (promotedId && promotedId !== currentActive) {
        const p = await PGPProgram.findById(promotedId).select("programName").lean();
        promotedName = (p as { programName?: string })?.programName || "";
      } else if (promotedId === currentActive) {
        promotedName = application?.assignedProgramName || "";
      }

      await CandidateApplication.findOneAndUpdate(
        { email },
        {
          $set: {
            enrolledProgramIds: nextList,
            assignedProgramId: promotedId,
            assignedProgramName: promotedName,
          },
        },
        { upsert: true }
      );

      return NextResponse.json({
        message: `Left ${programName}.`,
        activeProgramId: promotedId,
        enrolledProgramIds: nextList,
      });
    }

    if (action === "setActive") {
      if (!currentList.includes(programId)) {
        return NextResponse.json(
          { message: "Join this program before making it active." },
          { status: 400 }
        );
      }
      await CandidateApplication.findOneAndUpdate(
        { email },
        { $set: { assignedProgramId: programId, assignedProgramName: programName } },
        { upsert: true }
      );
      return NextResponse.json({
        message: `${programName} is now your active program.`,
        activeProgramId: programId,
        enrolledProgramIds: currentList,
      });
    }

    // action === "join"
    await CandidateApplication.findOneAndUpdate(
      { email },
      {
        $set: {
          email,
          fullName: body.fullName || application?.fullName || "",
          assignedProgramId: programId,
          assignedProgramName: programName,
        },
        $addToSet: { enrolledProgramIds: programId },
      },
      { upsert: true, new: true }
    );

    // Already enrolled? Then this is a re-pick, not news for the admin.
    if (!currentList.includes(programId)) {
      const candidateName = body.fullName || application?.fullName || "";
      await ActivityLog.create({
        programId,
        programName,
        candidateName,
        candidateEmail: email,
        section: ENROLLMENT_SECTION,
        itemLabel: `${candidateName || email} registered in ${programName}`,
        fromStatus: "",
        toStatus: "Enrolled",
      });
    }

    return NextResponse.json({
      message: `Enrolled in ${programName}.`,
      activeProgramId: programId,
      enrolledProgramIds: Array.from(new Set([...currentList, programId])),
    });
  } catch (error) {
    console.error("Candidate Enroll Error:", error);
    return NextResponse.json({ message: "Failed to enroll." }, { status: 500 });
  }
}
