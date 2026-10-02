import mongoose from "mongoose";

/**
 * The programs recycle bin.
 *
 * Deleting a program MOVES its whole document here rather than dropping it:
 * the row leaves `PGPProgram`, so every other query — the mentor's programs,
 * the candidate's, attendance — stops seeing it at once, while the record
 * itself is kept whole and can be put back exactly as it was.
 *
 * `document` holds the original, `_id` included, so a restore re-creates the
 * program under the same id: the mentor assignment, the candidates' saved
 * `assignedProgramId`, and the attendance records all point at it again.
 */

const DeletedProgramSchema = new mongoose.Schema(
  {
    // The program's original _id, as a string, so a restore can find it.
    programId: { type: String, index: true },
    programName: String,
    assignedMentorName: String,
    assignedMentorEmail: String,
    /** The whole program document as it was. */
    document: { type: mongoose.Schema.Types.Mixed, required: true },
    deletedAt: { type: Date, default: Date.now },
    /** The admin who deleted it — the portal account id and role we can verify. */
    deletedByUserId: String,
    deletedByRole: String,
  },
  { timestamps: true }
);

const DeletedProgram =
  mongoose.models.DeletedProgram ||
  mongoose.model("DeletedProgram", DeletedProgramSchema);

export default DeletedProgram;
