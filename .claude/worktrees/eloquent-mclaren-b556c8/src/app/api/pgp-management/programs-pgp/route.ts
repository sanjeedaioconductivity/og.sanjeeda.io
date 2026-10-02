import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/utils/dbConnect";

const MentorUserSchema = new mongoose.Schema(
  {
    fullName: String,
    email: { type: String, lowercase: true },
    education: String,
    expertise: String,
    phone: String,
    // Kept in sync with the mentor auth route's schema so login queries keep
    // `password` regardless of which route registers the model first.
    password: String,
    role: String,
    status: String,
  },
  { timestamps: true }
);

const ProgramSchema = new mongoose.Schema(
  {
    programName: { type: String, required: true },
    recommendedDuration: String,
    frequency: String,
    sessionDuration: String,
    totalHours: Number,
    trainingStyle: String,
    finalOutput: String,
    programPromise: String,
    startDate: String,
    endDate: String,
    status: {
      type: String,
      enum: ["Draft", "Active", "Completed", "Paused"],
      default: "Draft",
    },

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

const MentorUser =
  mongoose.models.MentorUser || mongoose.model("MentorUser", MentorUserSchema);

const PGPProgram =
  mongoose.models.PGPProgram || mongoose.model("PGPProgram", ProgramSchema);

export async function GET() {
  try {
    await dbConnect();

    const mentors = await MentorUser.find().sort({ createdAt: -1 }).lean();
    const programs = await PGPProgram.find().sort({ createdAt: -1 }).lean();

    return NextResponse.json({
      mentors: mentors.map((m) => ({
        mentorId: String(m._id),
        fullName: m.fullName || "",
        email: m.email || "",
      })),
      programs: programs.map((p) => ({
        programId: String(p._id),
        ...p,
      })),
    });
  } catch (error) {
    console.error("Programs Fetch Error:", error);

    return NextResponse.json(
      { message: "Failed to fetch programs." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();

    const body = await request.json();
    const mentor = body.assignedMentorId
      ? await MentorUser.findById(body.assignedMentorId)
      : null;

    const program = await PGPProgram.create({
      ...body,
      assignedMentorId: mentor?._id?.toString() || "",
      assignedMentorName: mentor?.fullName || "",
      assignedMentorEmail: mentor?.email || "",
    });

    return NextResponse.json({
      message: "Program created successfully.",
      program,
    });
  } catch (error) {
    console.error("Program Create Error:", error);

    return NextResponse.json(
      { message: "Failed to create program." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    await dbConnect();

    const body = await request.json();

    const mentor = body.assignedMentorId
      ? await MentorUser.findById(body.assignedMentorId)
      : null;

    const program = await PGPProgram.findByIdAndUpdate(
      body.programId,
      {
        $set: {
          ...body,
          assignedMentorId: mentor?._id?.toString() || "",
          assignedMentorName: mentor?.fullName || "",
          assignedMentorEmail: mentor?.email || "",
        },
      },
      { new: true }
    );

    return NextResponse.json({
      message: "Program updated successfully.",
      program,
    });
  } catch (error) {
    console.error("Program Update Error:", error);

    return NextResponse.json(
      { message: "Failed to update program." },
      { status: 500 }
    );
  }
}