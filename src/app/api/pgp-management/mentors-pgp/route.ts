import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/offerguide/adminAuth";
import dbConnect from "@/utils/dbConnect";
import MentorUser, {
  MENTOR_STATUSES,
  isMentorActive,
  normalizeMentorStatus,
} from "@/models/MentorUser";
import ActivityLog, { ACCOUNT_SECTION } from "@/models/ActivityLog";

export async function GET(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  try {
    await dbConnect();

    const mentors = await MentorUser.find()
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      totalMentors: mentors.length,
      mentors: mentors.map((mentor) => ({
        mentorId: String(mentor._id),
        fullName: mentor.fullName || "",
        email: mentor.email || "",
        education: mentor.education || "",
        expertise: mentor.expertise || "",
        phone: mentor.phone || "",
        role: mentor.role || "Mentor",
        status: normalizeMentorStatus(mentor.status),
        // Signup date, and the date the admin first marked the account Active.
        createdAt: mentor.createdAt,
        activatedAt: mentor.activatedAt ?? null,
        statusUpdatedAt: mentor.statusUpdatedAt ?? null,
      })),
    });
  } catch (error) {
    console.error("Mentors Fetch Error:", error);

    return NextResponse.json(
      { message: "Failed to fetch mentor records." },
      { status: 500 }
    );
  }
}

/**
 * Edits a mentor's profile and, crucially, their status. Moving an account to
 * Active is what lets a mentor sign in; the first such move stamps
 * `activatedAt`, and every status change is appended to the activity log so
 * Monitoring shows when it happened.
 */
export async function PATCH(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  try {
    await dbConnect();

    const body = await request.json();

    if (!body.email) {
      return NextResponse.json(
        { message: "Mentor email is required." },
        { status: 400 }
      );
    }

    const email = String(body.email).toLowerCase();
    const mentor = await MentorUser.findOne({ email });

    if (!mentor) {
      return NextResponse.json(
        { message: "Mentor not found." },
        { status: 404 }
      );
    }

    if (body.status !== undefined && !(MENTOR_STATUSES as readonly string[]).includes(body.status)) {
      return NextResponse.json(
        { message: `Status must be one of: ${MENTOR_STATUSES.join(", ")}.` },
        { status: 400 }
      );
    }

    mentor.fullName = body.fullName || "";
    mentor.education = body.education || "";
    mentor.expertise = body.expertise || "";
    mentor.phone = body.phone || "";

    const fromStatus = normalizeMentorStatus(mentor.status);
    const toStatus = body.status ? normalizeMentorStatus(body.status) : fromStatus;

    if (toStatus !== fromStatus) {
      const now = new Date();
      mentor.status = toStatus;
      mentor.statusUpdatedAt = now;
      if (isMentorActive(toStatus) && !mentor.activatedAt) {
        mentor.activatedAt = now;
      }

      await ActivityLog.create({
        mentorId: mentor._id.toString(),
        mentorName: mentor.fullName,
        mentorEmail: mentor.email,
        section: ACCOUNT_SECTION,
        itemLabel: "Mentor account status",
        fromStatus,
        toStatus,
      });
    }

    await mentor.save();

    return NextResponse.json({
      message:
        toStatus !== fromStatus
          ? `Mentor marked ${toStatus}.`
          : "Mentor information updated successfully.",
      mentor: {
        mentorId: mentor._id.toString(),
        status: normalizeMentorStatus(mentor.status),
        activatedAt: mentor.activatedAt ?? null,
        statusUpdatedAt: mentor.statusUpdatedAt ?? null,
      },
    });
  } catch (error) {
    console.error("Mentor Update Error:", error);

    return NextResponse.json(
      { message: "Failed to update mentor information." },
      { status: 500 }
    );
  }
}

/**
 * Removes a mentor account outright. The audit trail is kept — a final
 * "Deleted" row is appended so Monitoring still shows what happened to a
 * signup the admin turned away — but the account itself, and with it the
 * ability to sign in, is gone.
 */
export async function DELETE(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  try {
    await dbConnect();

    const { mentorId } = await request.json();

    if (!mentorId) {
      return NextResponse.json({ message: "Mentor id is required." }, { status: 400 });
    }

    const mentor = await MentorUser.findById(mentorId);

    if (!mentor) {
      return NextResponse.json({ message: "Mentor not found." }, { status: 404 });
    }

    await ActivityLog.create({
      mentorId: mentor._id.toString(),
      mentorName: mentor.fullName,
      mentorEmail: mentor.email,
      section: ACCOUNT_SECTION,
      itemLabel: "Mentor account deleted",
      fromStatus: normalizeMentorStatus(mentor.status),
      toStatus: "Deleted",
    });

    await mentor.deleteOne();

    return NextResponse.json({ message: `Mentor ${mentor.fullName || mentor.email} deleted.` });
  } catch (error) {
    console.error("Mentor Delete Error:", error);

    return NextResponse.json(
      { message: "Failed to delete mentor." },
      { status: 500 }
    );
  }
}
