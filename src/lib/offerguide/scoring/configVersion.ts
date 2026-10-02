// OfferGuide — scoring config version loader
// Sprint 5, Epic 5.1 §3.5. Reads OgScoringConfig by the exact version a
// session was pinned to at creation time — never "whatever is currently
// active" — so retuning weights later never silently shifts a candidate's
// already-computed historical scores.

import dbConnect from "@/utils/dbConnect";
import { OgScoringConfig } from "@/lib/db/mongo/models/index.js";
import type { ScoringConfigDoc } from "./weightCalculation";

export class ScoringConfigNotFoundError extends Error {}

export async function loadScoringConfigByVersion(version: number): Promise<ScoringConfigDoc> {
  await dbConnect();
  const config = await OgScoringConfig.findOne({ version }).lean<ScoringConfigDoc | null>();
  if (!config) {
    throw new ScoringConfigNotFoundError(
      `No OgScoringConfig document found for version ${version}.`
    );
  }
  return config;
}
