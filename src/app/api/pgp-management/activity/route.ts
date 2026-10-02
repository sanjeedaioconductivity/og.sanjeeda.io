import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/offerguide/adminAuth";
import dbConnect from "@/utils/dbConnect";
import ActivityLog, { ACCOUNT_SECTION } from "@/models/ActivityLog";

const SECTION_LABEL: Record<string, string> = {
  weeklySchedule: "Weekly Session",
  capstoneTimeline: "Capstone",
  portfolioChecklist: "Portfolio",
  // Deleting or restoring a whole program (see programs-pgp's DELETE).
  program: "Program",
  [ACCOUNT_SECTION]: "Account",
};

export async function GET(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const programId = searchParams.get("programId")?.trim() || "";
    const mentorId = searchParams.get("mentorId")?.trim() || "";

    const query: Record<string, string> = {};
    if (programId) query.programId = programId;
    if (mentorId) query.mentorId = mentorId;

    const logs = await ActivityLog.find(query)
      .sort({ createdAt: -1 })
      .limit(300)
      .lean();

    return NextResponse.json({
      total: logs.length,
      logs: logs.map((l) => ({
        id: String(l._id),
        programName: l.programName || "",
        mentorName: l.mentorName || "",
        mentorEmail: l.mentorEmail || "",
        section: SECTION_LABEL[l.section || ""] || l.section || "",
        itemLabel: l.itemLabel || "",
        fromStatus: l.fromStatus || "",
        toStatus: l.toStatus || "",
        at: l.createdAt,
      })),
    });
  } catch (error) {
    console.error("Activity Log Fetch Error:", error);
    return NextResponse.json(
      { message: "Failed to fetch activity." },
      { status: 500 }
    );
  }
}
