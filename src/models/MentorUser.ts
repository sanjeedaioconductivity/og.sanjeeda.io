import mongoose from "mongoose";

/**
 * Single source of truth for the MentorUser model.
 *
 * Three routes used to each carry their own copy of this schema, which is how
 * a field added in one of them silently vanished in the others: Mongoose keeps
 * the FIRST compiled model for the life of the process, and strict mode drops
 * any path that model does not know about. Same fix as CandidateApplication —
 * define it once, re-register on every evaluation so hot-reload picks up
 * schema changes.
 *
 * ================== THE APPROVAL FLOW ==================
 *
 * A mentor signup is NOT a mentor login. New mentor accounts land as `Pending`
 * and cannot sign in; the PGP admin reviews them and marks them `Active`, at
 * which point `activatedAt` is stamped. Both dates are what the admin's
 * Mentors table and Monitoring tab show as dd/mm/yy.
 *
 * `Approved` is the legacy value every pre-existing mentor row carries. It is
 * kept in the enum and treated as Active everywhere (see `isMentorActive`)
 * so those accounts keep working without a data migration; new writes always
 * use `Active`.
 */
export const MENTOR_STATUSES = ["Pending", "Active", "Rejected", "Blocked"] as const;
export type MentorStatus = (typeof MENTOR_STATUSES)[number];

/** The stored value that means "may sign in". Legacy rows say Approved. */
export function isMentorActive(status: string | null | undefined): boolean {
  return status === "Active" || status === "Approved";
}

/** What to show and what to compare against — folds the legacy value away. */
export function normalizeMentorStatus(status: string | null | undefined): MentorStatus {
  if (status === "Approved") return "Active";
  return (MENTOR_STATUSES as readonly string[]).includes(status ?? "")
    ? (status as MentorStatus)
    : "Pending";
}

/** The document shape, declared so nullable dates and OTP fields type as nullable. */
export type MentorUserDoc = {
  /** Mr / Mrs / Ms / Miss / Dr, chosen at signup. */
  title?: string;
  fullName?: string;
  email: string;
  education?: string;
  expertise?: string;
  phone?: string;
  password: string;
  role: string;
  status: string;
  activatedAt: Date | null;
  statusUpdatedAt: Date | null;
  resetOtp: string | null;
  resetOtpExpiry: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
};

const MentorUserSchema = new mongoose.Schema<MentorUserDoc>(
  {
    title: { type: String, enum: ["Mr", "Mrs", "Ms", "Miss", "Dr", ""], default: "" },
    fullName: { type: String, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    education: { type: String, trim: true },
    expertise: { type: String, trim: true },
    phone: { type: String, trim: true },
    password: { type: String, required: true },
    role: { type: String, default: "Mentor" },

    status: {
      type: String,
      enum: [...MENTOR_STATUSES, "Approved"],
      default: "Pending",
    },
    /** When the admin first moved this account to Active. Null until then. */
    activatedAt: { type: Date, default: null },
    /** Last time the admin changed `status` at all, whichever direction. */
    statusUpdatedAt: { type: Date, default: null },

    resetOtp: { type: String, default: null },
    resetOtpExpiry: { type: Date, default: null },
  },
  { timestamps: true }
);

// Drop any previously-compiled model so this schema always wins on reload.
if (mongoose.models.MentorUser) {
  mongoose.deleteModel("MentorUser");
}

const MentorUser = mongoose.model("MentorUser", MentorUserSchema);

export default MentorUser;
