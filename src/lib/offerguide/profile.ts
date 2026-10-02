import { prisma } from "@/lib/db/prisma";
import type { Identity } from "@/lib/offerguide/identity";

export function identityWhereClause(identity: Identity) {
  return identity.type === "user"
    ? { userInfoId: identity.userInfoId }
    : { guestToken: identity.guestToken };
}

export function findCandidateProfile(identity: Identity) {
  return prisma.candidateProfile.findFirst({
    where: identityWhereClause(identity),
  });
}

/** Ownership-checked lookup: 404s (via null) when the session isn't the caller's. */
export function findOwnedSession(sessionId: number, candidateProfileId: number) {
  return prisma.evaluationSession.findFirst({
    where: { id: sessionId, candidateProfileId },
  });
}

/** Ownership-checked lookup: 404s (via null) when the offer isn't the caller's. */
export function findOwnedOffer(offerId: number, candidateProfileId: number) {
  return prisma.offer.findFirst({
    where: {
      id: offerId,
      evaluationSession: { candidateProfileId },
    },
  });
}
