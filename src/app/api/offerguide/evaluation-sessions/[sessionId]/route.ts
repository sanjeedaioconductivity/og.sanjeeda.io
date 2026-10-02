import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { resolveIdentity } from "@/lib/offerguide/identity";
import { notFound } from "@/lib/offerguide/errors";
import { findCandidateProfile, findOwnedSession } from "@/lib/offerguide/profile";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const identity = resolveIdentity(req);
  if (!identity) return notFound();

  const profile = await findCandidateProfile(identity);
  if (!profile) return notFound();

  const { sessionId } = await params;
  const session = await findOwnedSession(Number(sessionId), profile.id);
  if (!session) return notFound();

  const offers = await prisma.offer.findMany({
    where: { evaluationSessionId: session.id },
  });

  return NextResponse.json({ ...session, offers });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const identity = resolveIdentity(req);
  if (!identity) return notFound();

  const profile = await findCandidateProfile(identity);
  if (!profile) return notFound();

  const { sessionId } = await params;
  const existing = await findOwnedSession(Number(sessionId), profile.id);
  if (!existing) return notFound();

  const body = await req.json();
  const { evaluationType, evaluationOfferCount, evaluationPriorities, evaluationPriorityOtherText } = body;

  const session = await prisma.evaluationSession.update({
    where: { id: existing.id },
    data: {
      ...(evaluationType !== undefined && { evaluationType }),
      ...(evaluationOfferCount !== undefined && { evaluationOfferCount }),
      ...(evaluationPriorities !== undefined && { evaluationPriorities }),
      ...(evaluationPriorityOtherText !== undefined && { evaluationPriorityOtherText }),
    },
  });

  return NextResponse.json(session);
}
