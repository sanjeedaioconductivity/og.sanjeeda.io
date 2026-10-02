import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/utils/dbConnect";
import ActivityLog from "@/models/ActivityLog";

const ProgramSchema = new mongoose.Schema(
  {
    programName: String,
    assignedMentorId: String,
    assignedMentorName: String,
    assignedMentorEmail: String,
    weeklySchedule: Array,
    capstoneTimeline: Array,
    portfolioChecklist: Array,
  },
  { timestamps: true }
);

const PGPProgram =
  mongoose.models.PGPProgram || mongoose.model("PGPProgram", ProgramSchema);

const EDITABLE_SECTIONS = [
  "weeklySchedule",
  "capstoneTimeline",
  "portfolioChecklist",
] as const;

type Section = (typeof EDITABLE_SECTIONS)[number];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();

    const { id } = await params;
    const body = await request.json();

    const section = body.section as Section;
    const index = Number(body.index);
    const toStatus = String(body.toStatus || "");

    if (!EDITABLE_SECTIONS.includes(section)) {
      return NextResponse.json({ message: "Invalid section." }, { status: 400 });
    }
    if (!Number.isInteger(index) || index < 0) {
      return NextResponse.json({ message: "Invalid row index." }, { status: 400 });
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Invalid program id." }, { status: 400 });
    }

    const program = await PGPProgram.findById(id);
    if (!program) {
      return NextResponse.json({ message: "Program not found." }, { status: 404 });
    }

    const rows = (program[section] as Record<string, unknown>[]) || [];
    if (index >= rows.length) {
      return NextResponse.json({ message: "Row not found." }, { status: 404 });
    }

    const row = rows[index];
    const fromStatus = String(row.status || "Not Started");
    row.status = toStatus;

    // weeklySchedule/… are Mixed arrays, so Mongoose needs an explicit nudge.
    program.markModified(section);
    await program.save();

    await ActivityLog.create({
      programId: id,
      programName: program.programName || "",
      mentorId: body.mentorId || "",
      mentorName: body.mentorName || "",
      mentorEmail: body.mentorEmail || "",
      section,
      itemLabel: body.itemLabel || "",
      fromStatus,
      toStatus,
    });

    return NextResponse.json({ message: "Status updated.", fromStatus, toStatus });
  } catch (error) {
    console.error("Mentor Status Update Error:", error);
    return NextResponse.json(
      { message: "Failed to update status." },
      { status: 500 }
    );
  }
}
