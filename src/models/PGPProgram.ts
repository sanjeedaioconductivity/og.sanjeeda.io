import mongoose from "mongoose";

/**
 * The PGP program record, with every field the portal writes.
 *
 * Several API routes still register their own, narrower `PGPProgram` schema
 * inline, and Mongoose keeps whichever registered first for the life of the
 * process. A write through a narrow schema silently drops the paths it does
 * not know — so this module, besides defining the full model, adds any path
 * the already-registered model is missing. The admin editor writes through
 * this one; reads elsewhere use `.lean()` and see every stored field anyway.
 */

const definition = {
  programName: { type: String, required: true },
  title: String,
  category: String,
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

  // Dashboard facts the admin may set by hand; blank means "count the rows".
  totalModules: Number,
  capstoneComponents: Number,
  portfolioItems: Number,
  durationWeeks: Number,
  trainingHours: Number,
  progressWeeklyTotal: Number,
  progressCapstoneTotal: Number,
  progressPortfolioTotal: Number,

  assignedMentorId: String,
  assignedMentorName: String,
  assignedMentorEmail: String,

  /**
   * Who is allowed to see this program — the admin's release switches.
   *
   * Creating a program used to publish it. `/api/pgp-candidate/programs`
   * returned EVERY program with no filter, and the mentor list returned any
   * program they were assigned to, so a half-built draft with a mentor attached
   * appeared in that mentor's dashboard and in the candidate portal's Offered
   * Programs the moment it was saved.
   *
   * BOTH DEFAULT TO FALSE, so a new program is private until an admin releases
   * it, deliberately, to one side or the other. The two are independent: a
   * mentor can be given a program to prepare weeks before candidates may see it.
   *
   * `visibleToCandidates` governs the CATALOGUE — what a candidate may browse
   * and join. It does not revoke an enrolment: a candidate already on a program
   * keeps it in My Courses whatever this says, or switching it off mid-cohort
   * would take a program away from people part-way through it.
   */
  visibleToMentor: { type: Boolean, default: false },
  visibleToCandidates: { type: Boolean, default: false },

  weeklySchedule: Array,
  sessionFlow: Array,
  capstoneTimeline: Array,
  portfolioChecklist: Array,
  evaluationPlan: Array,
};

const PGPProgramSchema = new mongoose.Schema(definition, { timestamps: true });

const existing = mongoose.models.PGPProgram;
if (existing) {
  const missing = Object.fromEntries(
    Object.entries(definition).filter(([path]) => !existing.schema.path(path))
  );
  if (Object.keys(missing).length) existing.schema.add(missing);
}

const PGPProgram = existing || mongoose.model("PGPProgram", PGPProgramSchema);

export default PGPProgram;
