import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/utils/dbConnect";
import { OgGeography } from "@/lib/db/mongo/models/index.js";
import { requireAdmin } from "@/lib/offerguide/adminAuth";
import { notFound } from "@/lib/offerguide/errors";

type EmbeddedCity = { cityId: string; name: string; active: boolean };

// PATCH rather than PUT/DELETE, matching the contract: an embedded city is
// renamed or retired (active: false), never removed from its country document
// — the same soft-delete rule the rest of /admin/config/* follows, which is why
// there is no DELETE sibling here at all.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ countryCode: string; cityId: string }> }
) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const { countryCode, cityId } = await params;
  const body = await req.json();

  await dbConnect();
  const country = await OgGeography.findOne({ countryCode });
  if (!country) return notFound();

  const city = country.cities?.find((c: EmbeddedCity) => c.cityId === cityId);
  if (!city) return notFound();

  if (typeof body.name === "string") city.name = body.name;
  if (typeof body.active === "boolean") city.active = body.active;
  await country.save();

  return NextResponse.json(country);
}
