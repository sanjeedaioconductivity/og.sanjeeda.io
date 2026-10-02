import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/utils/dbConnect";

/**
 * Read-only view of one program for an enrolled candidate. Mirrors
 * /api/pgp-mentor/program/[id] but returns no student roster — a candidate has
 * no business seeing who else is on the programme.
 */

interface IPGPProgram {
  programName?: string;
  title?: string;
  category?: string;
  recommendedDuration?: string;
  frequency?: string;
  sessionDuration?: string;
  totalHours?: number;
  trainingStyle?: string;
  finalOutput?: string;
  programPromise?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  assignedMentorId?: string;
  assignedMentorName?: string;
  assignedMentorEmail?: string;
  weeklySchedule?: unknown[];
  sessionFlow?: unknown[];
  capstoneTimeline?: unknown[];
  portfolioChecklist?: unknown[];
  evaluationPlan?: unknown[];
  /** Admin release switch — see models/PGPProgram.ts. */
  visibleToCandidates?: boolean;
}

const ProgramSchema = new mongoose.Schema<IPGPProgram>(
  {
    programName: String,
    title: String,
    category: String,
    recommendedDuration: String,
    frequency: String,
    sessionDuration: String,
    totalHours: Number,
    trainingStyle: String,
    finalOutput: String,
    programPromise: String,
    startDate: String,
    endDate: String,
    status: String,
    assignedMentorId: String,
    assignedMentorName: String,
    assignedMentorEmail: String,
    weeklySchedule: Array,
    sessionFlow: Array,
    capstoneTimeline: Array,
    portfolioChecklist: Array,
    evaluationPlan: Array,
    // Declared here as well as in models/PGPProgram.ts: Mongoose keeps whichever
    // schema registered FIRST, so a path missing here can be missing on the
    // shared model too.
    visibleToCandidates: Boolean,
  },
  { timestamps: true }
);

const PGPProgram: mongoose.Model<IPGPProgram> =
  (mongoose.models.PGPProgram as mongoose.Model<IPGPProgram>) ||
  mongoose.model<IPGPProgram>("PGPProgram", ProgramSchema);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Invalid program id." }, { status: 400 });
    }

    const program = await PGPProgram.findById(id).lean().exec();
    if (!program) {
      return NextResponse.json({ message: "Program not found." }, { status: 404 });
    }

    /**
     * The gate that matters. Everything else a candidate sees is a list they are
     * given, but THIS is fetched by id straight from the URL — so hiding a
     * program from every list while leaving this open would mean a bookmarked
     * or shared link still served the whole program: schedule, session flow,
     * capstone, portfolio, evaluation plan.
     *
     * Answered as 404, not 403: to a candidate who may not see it, a program
     * they cannot have does not exist, and a "forbidden" would confirm the id
     * is real.
     */
    if (program.visibleToCandidates !== true) {
      return NextResponse.json({ message: "Program not found." }, { status: 404 });
    }

    return NextResponse.json({
      program: { ...program, programId: String(program._id) },
    });
  } catch (error) {
    console.error("Candidate Single Program Fetch Error:", error);
    return NextResponse.json(
      { message: "Failed to fetch program." },
      { status: 500 }
    );
  }
}
