import { NextRequest, NextResponse } from "next/server";
import { OgScoringConfig } from "@/lib/db/mongo/models/index.js";
import { requireAdmin } from "@/lib/offerguide/adminAuth";
import { badRequest, notFound } from "@/lib/offerguide/errors";
import { withMongoTransaction } from "@/lib/offerguide/withMongoTransaction";

// POST /admin/config/scoring/{version}/activate — Sprint 10, Epic 10.2.2.
//
// The ONE deliberate, narrow exception to "no PUT/PATCH/DELETE ever" on this
// collection. It never touches a version's scoring CONTENT — versions stay
// permanently immutable. It moves exactly one field, `isActive`, which is what
// POST /evaluation-sessions reads to decide which config a new session gets.
// Creating a version (a draft, isActive:false since 10.2.1) and choosing to
// activate it are now two separate, deliberate actions.
//
// Atomic by necessity: deactivate every version, then activate the target, in
// one transaction (see withMongoTransaction). A partial run would leave zero or
// two active versions and mis-stamp new sessions. Re-activating the already-
// active version is a no-op that still returns 200, matching the soft-delete
// idempotency pattern elsewhere in adminCrud.
export async function POST(
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

  const activated = await withMongoTransaction(async (session) => {
    const target = await OgScoringConfig.findOne({ version: versionNumber }).session(session);
    if (!target) return null;

    // Turn everything else off, then the target on. Scoped to isActive only —
    // the content is never read or written here.
    await OgScoringConfig.updateMany(
      { version: { $ne: versionNumber }, isActive: true },
      { $set: { isActive: false } },
      { session }
    );
    if (!target.isActive) {
      target.isActive = true;
      await target.save({ session });
    }
    return target;
  });

  if (!activated) return notFound();
  return NextResponse.json(activated);
}
