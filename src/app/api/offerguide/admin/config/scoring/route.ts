import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/utils/dbConnect";
import { OgScoringConfig } from "@/lib/db/mongo/models/index.js";
import { requireAdmin } from "@/lib/offerguide/adminAuth";
import { badRequest } from "@/lib/offerguide/errors";

// OgScoringConfig supports POST (new version) and GET only — no PUT/PATCH
// route exists for this collection anywhere in the API (§3.5/§4.1). There is
// deliberately no [id]/route.ts sibling: editing an existing version isn't a
// route that can exist, not a route that happens to reject requests.

export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  await dbConnect();
  const configs = await OgScoringConfig.find({}).sort({ version: 1 }).lean();
  return NextResponse.json(configs);
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const body = await req.json();
  if (typeof body.version !== "number") {
    return badRequest("version (number) is required.");
  }

  await dbConnect();
  const existing = await OgScoringConfig.findOne({ version: body.version }).lean();
  if (existing) {
    return badRequest(
      `Version ${body.version} already exists — OgScoringConfig versions are immutable, create a new version instead.`
    );
  }

  try {
    const created = await OgScoringConfig.create(body);
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    return badRequest(err instanceof Error ? err.message : "Invalid request body.");
  }
}
