import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { resolveIdentity } from "@/lib/offerguide/identity";
import { badRequest, notFound } from "@/lib/offerguide/errors";
import { findCandidateProfile } from "@/lib/offerguide/profile";
import { validateConsentSelections } from "@/lib/offerguide/questions";

export async function PATCH(req: NextRequest) {
  const identity = resolveIdentity(req);
  if (!identity) return notFound();

  const existing = await findCandidateProfile(identity);
  if (!existing) return notFound();

  const body = await req.json();
  const { shareAnonymous, selections } = body ?? {};

  if (selections && typeof selections === "object") {
    const result = await validateConsentSelections(selections);
    if (!result.ok) return badRequest(result.message);
  }

  const currentSettings =
    (existing.consentSettings as { shareAnonymous?: boolean; selections?: Record<string, boolean> } | null) ?? {};

  const updatedSettings = {
    shareAnonymous: shareAnonymous ?? currentSettings.shareAnonymous ?? false,
    selections: { ...(currentSettings.selections ?? {}), ...(selections ?? {}) },
  };

  const profile = await prisma.candidateProfile.update({
    where: { id: existing.id },
    data: { consentSettings: updatedSettings },
  });

  return NextResponse.json(profile.consentSettings);
}
