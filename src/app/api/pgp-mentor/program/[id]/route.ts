import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/utils/dbConnect";
import CandidateApplication from "@/models/CandidateApplication";

interface IPGPProgram {
  programName?: string;
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
}

const ProgramSchema = new mongoose.Schema<IPGPProgram>(
  {
    programName: String,
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
      return NextResponse.json(
        { message: "Invalid program id." },
        { status: 400 }
      );
    }

    const program = await PGPProgram.findById(id)
      .lean()
      .exec();

    if (!program) {
      return NextResponse.json(
        { message: "Program not found." },
        { status: 404 }
      );
    }

    const students = await CandidateApplication.find({
      assignedProgramId: id,
    })
      .select("fullName email gender qualification contactNumber")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      program: {
        ...program,
        programId: String(program._id),
      },

      students: students.map((s) => ({
        fullName: s.fullName || "",
        email: s.email || "",
        gender: s.gender || "",
        qualification: s.qualification || "",
        contactNumber: s.contactNumber || "",
      })),
    });
  } catch (error) {
    console.error("Mentor Single Program Fetch Error:", error);

    return NextResponse.json(
      { message: "Failed to fetch program." },
      { status: 500 }
    );
  }
}