import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/offerguide/adminAuth";
import dbConnect from "@/utils/dbConnect";
import ActivityLog, { ACCOUNT_SECTION, ENROLLMENT_SECTION } from "@/models/ActivityLog";

/**
 * What the admin's bell shows: the newest things that happened in the portal,
 * read from the same audit trail Monitoring uses.
 *
 * Three kinds, as one list, newest first:
 *   a candidate signing up or registering in a program,
 *   a mentor signing up, being activated or signing in,
 *   a mentor moving a program item's status on.
 *
 * Read state is the client's: the bell remembers the last row it showed and
 * counts anything newer. Nothing is written here.
 */

const KIND: Record<string, "enrollment" | "mentor" | "progress"> = {
  [ENROLLMENT_SECTION]: "enrollment",
  [ACCOUNT_SECTION]: "mentor",
};

const SECTION_LABEL: Record<string, string> = {
  weeklySchedule: "Weekly Session",
  capstoneTimeline: "Capstone",
  portfolioChecklist: "Portfolio",
  program: "Program",
};

export async function GET(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  try {
    await dbConnect();

    const limit = Math.min(
      Number(new URL(request.url).searchParams.get("limit")) || 30,
      100
    );

    const rows = await ActivityLog.find().sort({ createdAt: -1 }).limit(limit).lean();

    return NextResponse.json({
      notifications: rows.map((row) => {
        const section = row.section || "";
        const who = row.candidateName || row.mentorName || "";
        const kind = KIND[section] || "progress";

        // The enrollment and account rows already read as sentences; a status
        // change is assembled from its parts.
        const text =
          kind === "progress"
            ? `${who || "A mentor"} marked ${row.itemLabel || "an item"} as ${
                row.toStatus || "updated"
              }`
            : row.itemLabel || "Activity";

        return {
          id: String(row._id),
          kind,
          text,
          programName: row.programName || "",
          sectionLabel: SECTION_LABEL[section] || "",
          at: row.createdAt,
        };
      }),
    });
  } catch (error) {
    console.error("Notifications Fetch Error:", error);

    return NextResponse.json(
      { message: "Failed to load notifications." },
      { status: 500 }
    );
  }
}
