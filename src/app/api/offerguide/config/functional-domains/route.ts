import { NextResponse } from "next/server";
import dbConnect from "@/utils/dbConnect";
import { OgFunctionalDomains } from "@/lib/db/mongo/models/index.js";

export async function GET() {
  await dbConnect();
  const domains = await OgFunctionalDomains.find({ active: true })
    .sort({ sortOrder: 1 })
    .select("domainId name")
    .lean();

  return NextResponse.json(domains);
}
