import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/utils/dbConnect";
import { OgGeography } from "@/lib/db/mongo/models/index.js";
import { requireAdmin } from "@/lib/offerguide/adminAuth";
import { badRequest, notFound } from "@/lib/offerguide/errors";

// Cities are embedded in their country document (see OgGeography's header —
// the query pattern is always "cities for this country"), so adding one is a
// sub-resource POST rather than a create against a collection of its own.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ countryCode: string }> }
) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const { countryCode } = await params;
  const body = await req.json();

  if (typeof body.cityId !== "string" || !body.cityId.trim()) {
    return badRequest("cityId (string) is required.");
  }
  if (typeof body.name !== "string" || !body.name.trim()) {
    return badRequest("name (string) is required.");
  }

  await dbConnect();
  const country = await OgGeography.findOne({ countryCode });
  if (!country) return notFound();

  // cityId is only unique within its country, so uniqueness is enforced here
  // rather than by a schema index — a duplicate would make the PATCH sibling
  // ambiguous about which entry it was updating.
  const exists = country.cities?.some(
    (city: { cityId: string }) => city.cityId === body.cityId
  );
  if (exists) {
    return NextResponse.json(
      {
        error: "conflict",
        message: `City "${body.cityId}" already exists in ${countryCode}.`,
      },
      { status: 409 }
    );
  }

  country.cities.push({
    cityId: body.cityId,
    name: body.name,
    active: body.active ?? true,
  });
  await country.save();

  return NextResponse.json(country, { status: 201 });
}
