import { NextResponse } from "next/server";
import dbConnect from "@/utils/dbConnect";
import { OgConsentToggles } from "@/lib/db/mongo/models/index.js";

export async function GET() {
  await dbConnect();
  // Master toggle first, per contract.
  const toggles = await OgConsentToggles.find({ active: true })
    .sort({ isMaster: -1, sortOrder: 1 })
    .select("toggleId label helpText sourceScreen isMaster")
    .lean();

  return NextResponse.json(toggles);
}
