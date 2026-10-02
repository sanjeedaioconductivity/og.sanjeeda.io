import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/offerguide/adminAuth";
import { readIdentityHeaders } from "@/lib/portal/identityHeaders";
import dbConnect from "@/utils/dbConnect";
import MentorUser, { isMentorActive } from "@/models/MentorUser";
// The full schema lives in the model; a narrower inline copy here dropped any
// field it did not list (see the model's header comment).
import PGPProgram from "@/models/PGPProgram";
import DeletedProgram from "@/models/DeletedProgram";
import ActivityLog from "@/models/ActivityLog";

export async function GET(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  try {
    await dbConnect();

    // `?list=1` is the sidebar's menu: names only. The full response carries
    // every schedule, checklist and timeline of every program, which is a lot
    // of rows to ship for a list of links.
    if (new URL(request.url).searchParams.get("list") === "1") {
      const rows = await PGPProgram.find()
        .select("programName status")
        .sort({ createdAt: -1 })
        .lean();

      return NextResponse.json({
        programs: rows.map((p) => ({
          programId: String(p._id),
          programName: p.programName || "",
          status: p.status || "Draft",
        })),
      });
    }

    const mentors = await MentorUser.find().sort({ createdAt: -1 }).lean();
    const programs = await PGPProgram.find().sort({ createdAt: -1 }).lean();

    return NextResponse.json({
      // Only mentors who can actually sign in are offered for assignment; a
      // Pending signup has to be marked Active on the Mentors tab first.
      mentors: mentors.filter((m) => isMentorActive(m.status)).map((m) => ({
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

export async function POST(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

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

export async function PATCH(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  try {
    await dbConnect();

    const body = await request.json();

    /**
     * The mentor columns are rewritten ONLY when the caller sent a mentor field.
     *
     * They used to be set unconditionally, which was fine while the editor was
     * the only caller — it always posts the whole form. It is not any more: the
     * programs table PATCHes `{ programId, visibleToCandidates }` on its own,
     * and with the old code the absent `assignedMentorId` resolved to no mentor
     * and blanked the program's mentor name, id and email as a side effect of
     * ticking a checkbox. Any partial PATCH would have done the same.
     */
    const changingMentor = "assignedMentorId" in body;
    const mentor = changingMentor && body.assignedMentorId
      ? await MentorUser.findById(body.assignedMentorId)
      : null;

    const program = await PGPProgram.findByIdAndUpdate(
      body.programId,
      {
        $set: {
          ...body,
          ...(changingMentor && {
            assignedMentorId: mentor?._id?.toString() || "",
            assignedMentorName: mentor?.fullName || "",
            assignedMentorEmail: mentor?.email || "",
          }),
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

/**
 * Deletes a program — into the recycle bin, not out of existence.
 *
 * The whole document is moved to `DeletedProgram` and the row removed here, so
 * the program disappears from every other query (mentor, candidate,
 * attendance) at once while staying restorable, id and all. A row is also
 * appended to the audit trail, so Monitoring shows who deleted what and when.
 *
 * The caller must send the program's exact name in `confirmName` — the same
 * thing the dialog makes the admin type. It is checked again here so a stray
 * API call cannot delete a program the admin never named.
 */
export async function DELETE(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  try {
    await dbConnect();

    const { programId, confirmName } = await request.json();

    if (!programId) {
      return NextResponse.json({ message: "Program id is required." }, { status: 400 });
    }

    const program = await PGPProgram.findById(programId);

    if (!program) {
      return NextResponse.json({ message: "Program not found." }, { status: 404 });
    }

    const name = program.programName || "";
    if (String(confirmName || "").trim() !== name.trim()) {
      return NextResponse.json(
        { message: "The name typed does not match this program." },
        { status: 400 }
      );
    }

    const identity = readIdentityHeaders(request);

    await DeletedProgram.create({
      programId: program._id.toString(),
      programName: name,
      assignedMentorName: program.assignedMentorName || "",
      assignedMentorEmail: program.assignedMentorEmail || "",
      document: program.toObject(),
      deletedAt: new Date(),
      deletedByUserId: identity ? String(identity.userInfoId) : "",
      deletedByRole: identity?.role || "",
    });

    await ActivityLog.create({
      programId: program._id.toString(),
      programName: name,
      section: "program",
      itemLabel: `Program deleted: ${name}`,
      fromStatus: program.status || "",
      toStatus: "Deleted",
    });

    await program.deleteOne();

    return NextResponse.json({ message: `"${name}" moved to the recycle bin.` });
  } catch (error) {
    console.error("Program Delete Error:", error);

    return NextResponse.json(
      { message: "Failed to delete program." },
      { status: 500 }
    );
  }
}
