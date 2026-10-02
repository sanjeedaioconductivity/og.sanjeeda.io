import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/offerguide/adminAuth";
import dbConnect from "@/utils/dbConnect";
import PGPProgram from "@/models/PGPProgram";
import DeletedProgram from "@/models/DeletedProgram";
import ActivityLog from "@/models/ActivityLog";

/**
 * The programs recycle bin: what has been deleted, and putting it back.
 *
 * GET  — the deleted programs, newest first.
 * POST — restores one by its recycle-bin id.
 *
 * A restore re-creates the program under its ORIGINAL id, so everything that
 * referenced it (the mentor assignment, each candidate's assignedProgramId,
 * the attendance records) points at it again, exactly as before.
 */

export async function GET(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  try {
    await dbConnect();

    const rows = await DeletedProgram.find().sort({ deletedAt: -1 }).lean();

    return NextResponse.json({
      programs: rows.map((row) => ({
        id: String(row._id),
        programId: row.programId || "",
        programName: row.programName || "Untitled program",
        assignedMentorName: row.assignedMentorName || "",
        assignedMentorEmail: row.assignedMentorEmail || "",
        deletedAt: row.deletedAt || row.createdAt || null,
        deletedByUserId: row.deletedByUserId || "",
        deletedByRole: row.deletedByRole || "",
      })),
    });
  } catch (error) {
    console.error("Recycle Bin Fetch Error:", error);

    return NextResponse.json(
      { message: "Failed to load the recycle bin." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  try {
    await dbConnect();

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ message: "Recycle bin id is required." }, { status: 400 });
    }

    const row = await DeletedProgram.findById(id);

    if (!row) {
      return NextResponse.json({ message: "Not in the recycle bin." }, { status: 404 });
    }

    const document = (row.document || {}) as Record<string, unknown>;
    const name = String(document.programName || row.programName || "Untitled program");

    // A program may have been re-created under the same name meanwhile; the id
    // is what must be free, since that is what everything else points at.
    const clash = await PGPProgram.findById(row.programId);
    if (clash) {
      return NextResponse.json(
        { message: `"${name}" is already back — nothing to restore.` },
        { status: 409 }
      );
    }

    await PGPProgram.create(document);

    await ActivityLog.create({
      programId: row.programId || "",
      programName: name,
      section: "program",
      itemLabel: `Program restored: ${name}`,
      fromStatus: "Deleted",
      toStatus: String(document.status || "Draft"),
    });

    await row.deleteOne();

    return NextResponse.json({ message: `"${name}" restored.` });
  } catch (error) {
    console.error("Program Restore Error:", error);

    return NextResponse.json(
      { message: "Failed to restore the program." },
      { status: 500 }
    );
  }
}

/**
 * Empties one program out of the bin for good.
 *
 * Irreversible, so the caller must send the program's exact name in
 * `confirmName` — the same thing the dialog makes the admin type, twice. The
 * check is repeated here so a stray API call cannot destroy a record nobody
 * named.
 */
export async function DELETE(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  try {
    await dbConnect();

    const { id, confirmName } = await request.json();

    if (!id) {
      return NextResponse.json({ message: "Recycle bin id is required." }, { status: 400 });
    }

    const row = await DeletedProgram.findById(id);

    if (!row) {
      return NextResponse.json({ message: "Not in the recycle bin." }, { status: 404 });
    }

    const name = row.programName || "";
    if (String(confirmName || "").trim() !== name.trim()) {
      return NextResponse.json(
        { message: "The name typed does not match this program." },
        { status: 400 }
      );
    }

    await ActivityLog.create({
      programId: row.programId || "",
      programName: name,
      section: "program",
      itemLabel: `Program permanently deleted: ${name}`,
      fromStatus: "Deleted",
      toStatus: "Purged",
    });

    await row.deleteOne();

    return NextResponse.json({ message: `"${name}" permanently deleted.` });
  } catch (error) {
    console.error("Program Purge Error:", error);

    return NextResponse.json(
      { message: "Failed to delete the program permanently." },
      { status: 500 }
    );
  }
}
