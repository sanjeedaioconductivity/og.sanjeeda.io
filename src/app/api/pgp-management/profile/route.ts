import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/offerguide/adminAuth";
import dbConnect from "@/utils/dbConnect";
import PgpProfile from "@/models/PgpProfile";

/**
 * The PGP's own profile — its details and the members behind it.
 *
 * GET returns the single document (an empty shell the first time), PATCH
 * replaces the fields it is given. The picture lives in GridFS and is handled
 * by ./profile-image.
 */

const KEY = "pgp";

type Member = {
  fullName?: string;
  role?: string;
  email?: string;
  phone?: string;
  notes?: string;
};

function shape(doc: Record<string, unknown> | null) {
  return {
    name: (doc?.name as string) || "",
    tagline: (doc?.tagline as string) || "",
    about: (doc?.about as string) || "",
    contactEmail: (doc?.contactEmail as string) || "",
    contactPhone: (doc?.contactPhone as string) || "",
    website: (doc?.website as string) || "",
    hasPicture: Boolean(doc?.hasPicture),
    members: ((doc?.members as Member[]) || []).map((m) => ({
      fullName: m.fullName || "",
      role: m.role || "",
      email: m.email || "",
      phone: m.phone || "",
      notes: m.notes || "",
    })),
  };
}

export async function GET(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  try {
    await dbConnect();
    const doc = await PgpProfile.findOne({ key: KEY }).lean();
    return NextResponse.json({ profile: shape(doc as Record<string, unknown> | null) });
  } catch (error) {
    console.error("PGP Profile Fetch Error:", error);
    return NextResponse.json({ message: "Failed to load the profile." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  try {
    await dbConnect();

    const body = await request.json();
    const members: Member[] = Array.isArray(body.members) ? body.members : [];

    const doc = await PgpProfile.findOneAndUpdate(
      { key: KEY },
      {
        $set: {
          key: KEY,
          name: String(body.name || ""),
          tagline: String(body.tagline || ""),
          about: String(body.about || ""),
          contactEmail: String(body.contactEmail || "").toLowerCase(),
          contactPhone: String(body.contactPhone || ""),
          website: String(body.website || ""),
          // A member with nothing in it is a row the admin never filled in.
          members: members
            .filter((m) => (m.fullName || "").trim() || (m.email || "").trim())
            .map((m) => ({
              fullName: String(m.fullName || ""),
              role: String(m.role || ""),
              email: String(m.email || "").toLowerCase(),
              phone: String(m.phone || ""),
              notes: String(m.notes || ""),
            })),
        },
      },
      { new: true, upsert: true }
    ).lean();

    return NextResponse.json({
      message: "Profile saved.",
      profile: shape(doc as Record<string, unknown> | null),
    });
  } catch (error) {
    console.error("PGP Profile Save Error:", error);
    return NextResponse.json({ message: "Failed to save the profile." }, { status: 500 });
  }
}
