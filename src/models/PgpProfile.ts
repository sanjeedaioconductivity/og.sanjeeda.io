import mongoose from "mongoose";

/**
 * The PGP's own profile: what the programme is, its picture, and the people
 * behind it. One document for the whole portal — `key` is always "pgp", which
 * is what makes it a singleton rather than a collection of drafts.
 *
 * The picture is stored in GridFS (see /api/pgp-management/profile-image) and
 * only its presence is recorded here, the same way mentor and candidate
 * avatars work.
 */

const MemberSchema = new mongoose.Schema(
  {
    fullName: String,
    role: String,
    email: { type: String, lowercase: true },
    phone: String,
    notes: String,
  },
  { _id: false }
);

const PgpProfileSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true, default: "pgp" },
    name: String,
    tagline: String,
    about: String,
    contactEmail: { type: String, lowercase: true },
    contactPhone: String,
    website: String,
    /** Set once a picture has been uploaded, so the client knows to ask for it. */
    hasPicture: { type: Boolean, default: false },
    members: { type: [MemberSchema], default: [] },
  },
  { timestamps: true }
);

const PgpProfile =
  mongoose.models.PgpProfile || mongoose.model("PgpProfile", PgpProfileSchema);

export default PgpProfile;
