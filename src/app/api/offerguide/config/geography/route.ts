import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/utils/dbConnect";
import { OgGeography } from "@/lib/db/mongo/models/index.js";

export async function GET(req: NextRequest) {
  const countryCode = req.nextUrl.searchParams.get("countryCode");

  await dbConnect();

  if (countryCode) {
    const country = await OgGeography.findOne({ countryCode, active: true }).lean();
    if (!country) return NextResponse.json({ cities: [] });

    type CityDoc = { cityId: string; name: string; active?: boolean };
    const cities = ((country as { cities?: CityDoc[] }).cities ?? []).filter(
      (c) => c.active !== false
    );
    return NextResponse.json(cities);
  }

  const countries = await OgGeography.find({ active: true })
    .select("countryCode countryName")
    .sort({ countryName: 1 })
    .lean();

  return NextResponse.json(countries);
}
