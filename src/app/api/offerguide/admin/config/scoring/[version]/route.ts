import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/utils/dbConnect";
import { OgScoringConfig } from "@/lib/db/mongo/models/index.js";
import { requireAdmin } from "@/lib/offerguide/adminAuth";
import { badRequest, notFound } from "@/lib/offerguide/errors";

// GET only, by design. OgScoringConfig versions are immutable: there is no
// PUT/PATCH/DELETE here and there never will be, because a version that
// produced a stored score has to keep meaning what it meant when it produced
// it. New tuning is a POST to the collection with a new version number.
//
// This is the read path for auditing a score: every offer_scores row records
// the scoringConfigVersion it was computed under, and this resolves that number
// back to the exact weights behind it.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ version: string }> }
) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const { version } = await params;
  const versionNumber = Number(version);
  if (!Number.isInteger(versionNumber)) {
    return badRequest("version must be an integer.");
  }

  await dbConnect();
  const config = await OgScoringConfig.findOne({ version: versionNumber }).lean();
  if (!config) return notFound();

  return NextResponse.json(config);
}
