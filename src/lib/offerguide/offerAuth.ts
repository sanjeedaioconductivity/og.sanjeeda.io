import { NextRequest } from "next/server";
import { resolveIdentity } from "@/lib/offerguide/identity";
import { notFound } from "@/lib/offerguide/errors";
import { findCandidateProfile, findOwnedOffer } from "@/lib/offerguide/profile";

/** Resolves identity, profile, and ownership in one shot for offer sub-resource routes. */
export async function loadOwnedOffer(req: NextRequest, offerId: number) {
  const identity = resolveIdentity(req);
  if (!identity) return { error: notFound() } as const;

  const profile = await findCandidateProfile(identity);
  if (!profile) return { error: notFound() } as const;

  const offer = await findOwnedOffer(offerId, profile.id);
  if (!offer) return { error: notFound() } as const;

  return { offer } as const;
}
