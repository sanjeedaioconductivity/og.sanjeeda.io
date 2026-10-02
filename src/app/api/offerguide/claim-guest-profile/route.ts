// Before registering (guest):
// The guest already has one row in candidate_profiles with all their info:
// id	guest_token	userinfo_id	career_stage	current_city	...
// 5	abc-123	NULL	Mid-Level	Karachi	...
// All their answers are already saved here. The only thing "missing" is a real account — userinfo_id is empty (NULL).

// After registering + claim-guest-profile:
// The same row 5 — only userinfo_id gets filled in:

// id	guest_token	userinfo_id	career_stage	current_city	...
// 5	abc-123	9001	Mid-Level	Karachi	...
// What that means
// ✅ Yes — after they register, the profile is now tied to their account (userinfo_id = 9001).
// ❌ But the other columns (career_stage, current_city, etc.) are not re-saved or copied. They were already in that row from when the person was a guest. They just stay put.
// The update touches exactly one column: userinfo_id, from NULL → the account ID


import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { GUEST_COOKIE_NAME, resolveAuthedUser } from "@/lib/offerguide/identity";
import { unauthorized } from "@/lib/offerguide/errors";

export async function POST(req: NextRequest) {
  const userInfoId = resolveAuthedUser(req);
  if (userInfoId === null || Number.isNaN(userInfoId)) return unauthorized();

  const guestToken = req.cookies.get(GUEST_COOKIE_NAME)?.value;
  if (!guestToken) {
    return NextResponse.json({ message: "No guest profile to link." });
  }

  const guestProfile = await prisma.candidateProfile.findUnique({
    where: { guestToken },
  });
  if (!guestProfile) {
    return NextResponse.json({ message: "No guest profile to link." });
  }

  try {
    await prisma.candidateProfile.update({
      where: { id: guestProfile.id },
      data: { userInfoId },
    });
  } catch {
    // Unique constraint: this user already has a profile of their own — leave both as-is.
    return NextResponse.json({ message: "Account already has a profile; guest profile left unlinked." });
  }

  return NextResponse.json({ message: "Guest profile linked." });
}
