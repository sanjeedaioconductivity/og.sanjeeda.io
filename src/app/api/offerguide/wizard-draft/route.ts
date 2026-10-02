import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/utils/dbConnect";
import { WizardDraft } from "@/lib/db/mongo/models/index.js";
import { resolveIdentity } from "@/lib/offerguide/identity";
import { badRequest, notFound } from "@/lib/offerguide/errors";
import { findCandidateProfile } from "@/lib/offerguide/profile";

function draftIdentityFilter(identity: { type: "user" | "guest"; userInfoId?: number; guestToken?: string }) {
  return identity.type === "user"
    ? { userInfoId: identity.userInfoId }
    : { guestToken: identity.guestToken };
}

export async function GET(req: NextRequest) {
  const identity = resolveIdentity(req);
  if (!identity) return notFound();

  await dbConnect();
  const draft = await WizardDraft.findOne(draftIdentityFilter(identity)).lean();
  if (!draft) return notFound();

  return NextResponse.json(draft);
}

export async function PUT(req: NextRequest) {
  const identity = resolveIdentity(req);
  if (!identity) return notFound();

  const body = await req.json();
  if (!body.currentScreen) {
    return badRequest("currentScreen is required.");
  }

  await dbConnect();

  // Best-effort backfill: once a CandidateProfile exists for this identity,
  // stamp its id onto the draft so downstream tooling can join on it. Never
  // required for the draft itself to keep working.
  const profile = await findCandidateProfile(identity);

  const draft = await WizardDraft.findOneAndUpdate(
    draftIdentityFilter(identity),
    {
      ...draftIdentityFilter(identity),
      ...(profile && { candidateProfileId: profile.id }),
      currentScreen: body.currentScreen,
      answers: body.answers ?? {},
      updatedAt: new Date(),
    },
    { upsert: true, new: true }
  ).lean();

  return NextResponse.json(draft);
}

export async function DELETE(req: NextRequest) {
  const identity = resolveIdentity(req);
  if (!identity) return new NextResponse(null, { status: 204 });

  await dbConnect();
  await WizardDraft.deleteOne(draftIdentityFilter(identity));

  return new NextResponse(null, { status: 204 });
}
