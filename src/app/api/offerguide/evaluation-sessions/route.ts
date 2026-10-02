import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { resolveIdentity } from "@/lib/offerguide/identity";
import { badRequest, notFound } from "@/lib/offerguide/errors";
import { findCandidateProfile } from "@/lib/offerguide/profile";
import dbConnect from "@/utils/dbConnect";
import { OgScoringConfig } from "@/lib/db/mongo/models/index.js";

export async function GET(req: NextRequest) {
  const identity = resolveIdentity(req);
  if (!identity) return NextResponse.json([]);

  const profile = await findCandidateProfile(identity);
  if (!profile) return NextResponse.json([]);

  const sessions = await prisma.evaluationSession.findMany({
    where: { candidateProfileId: profile.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(sessions);
}

export async function POST(req: NextRequest) {
  const identity = resolveIdentity(req);
  if (!identity) return notFound();

  const profile = await findCandidateProfile(identity);
  if (!profile) {
    return badRequest("No candidate profile exists yet — submit /candidate-profile first.");
  }

  const body = await req.json();
  if (!body.evaluationOfferCount) {
    return badRequest("evaluationOfferCount is required.");
  }

  await dbConnect();
  const activeConfig = await OgScoringConfig.findOne({ isActive: true })
    .sort({ version: -1 })
    .lean<{ version: number } | null>();
  if (!activeConfig) {
    return badRequest("No active scoring configuration is available.");
  }

  const session = await prisma.evaluationSession.create({
    data: {
      candidateProfileId: profile.id,
      evaluationType: body.evaluationType ?? "New job offer",
      evaluationOfferCount: body.evaluationOfferCount,
      evaluationPriorities: body.evaluationPriorities ?? [],
      evaluationPriorityOtherText: body.evaluationPriorityOtherText ?? null,
      scoringConfigVersion: activeConfig.version,
    },
  });

  return NextResponse.json(session, { status: 201 });
}
