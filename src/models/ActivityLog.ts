import mongoose from "mongoose";

/**
 * Immutable audit trail the admin's Monitoring tab reads. One row per change,
 * newest first, so management can see exactly what happened, when, and what
 * it was before.
 *
 * Two kinds of row share this collection:
 *
 *   program item   a mentor marking a weekly session / capstone / portfolio
 *                  item (`section` is the program field name, `programId` set)
 *   account        the mentor account lifecycle — signup lands as Pending,
 *                  the admin moves it to Active (`section: "account"`, no
 *                  program). This is what gives Monitoring the mentor's signup
 *                  date and activation date as two dated rows. A mentor
 *                  signing in lands here too.
 *   enrollment     a candidate signing up, or registering in a program
 *                  (`section: "enrollment"`, the candidate in the candidate
 *                  fields).
 *
 * Defined once, re-registered on every evaluation, for the same reason as
 * MentorUser: the first compiled schema otherwise wins for the whole process.
 */
export const ACCOUNT_SECTION = "account";
/** A candidate signing up, or registering in a program. */
export const ENROLLMENT_SECTION = "enrollment";

const ActivityLogSchema = new mongoose.Schema(
  {
    programId: String,
    programName: String,
    mentorId: String,
    mentorName: String,
    mentorEmail: { type: String, lowercase: true },
    candidateName: String,
    candidateEmail: { type: String, lowercase: true },
    section: String,
    itemLabel: String,
    fromStatus: String,
    toStatus: String,
  },
  { timestamps: true }
);

if (mongoose.models.ActivityLog) {
  mongoose.deleteModel("ActivityLog");
}

const ActivityLog = mongoose.model("ActivityLog", ActivityLogSchema);

export default ActivityLog;
