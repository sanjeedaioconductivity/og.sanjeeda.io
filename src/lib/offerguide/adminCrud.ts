// OfferGuide â€” admin config CRUD factory
// Sprint 5, Epic 5.2 Â§4.1. The 5 non-OgScoringConfig admin collections
// (OgQuestions, OgGeography, OgMarketBenchmarks, OgFunctionalDomains,
// OgConsentToggles) all need identical standard CRUD wired behind the same
// admin gate â€” this factory avoids duplicating that boilerplate 5 times.
// OgScoringConfig is deliberately NOT built on this factory: it only
// supports POST (new version) + GET, never PUT/PATCH/DELETE, so it's
// hand-written in its own route file instead of forcing an unused shape
// through here.
//
// Sprint 8 changed two things here, both DoD items:
//   * DELETE is a SOFT delete â€” it sets active: false and leaves the document
//     in the collection. Nothing in /admin/config/* is ever hard-deleted,
//     because a retired question or toggle still has to explain the meaning of
//     evaluations that were scored while it was live.
//   * Item routes are keyed on each collection's own business key (fieldId,
//     countryCode, domainId, toggleId) rather than the Mongo _id, matching the
//     path parameters the contract declares. Every one of those keys is
//     declared unique on its schema.

import { NextRequest, NextResponse } from "next/server";
import type { FilterQuery, Model } from "mongoose";
import dbConnect from "@/utils/dbConnect";
import { requireAdmin } from "./adminAuth";
import { badRequest, notFound } from "./errors";

type AnyDoc = Record<string, unknown>;

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : "Invalid request body.";
}

export function createCollectionHandlers(model: Model<AnyDoc>) {
  // Returns retired (active: false) documents too â€” the admin view is exactly
  // where a soft-deleted document still has to be visible. The public
  // /config/* reads are the ones that filter on active: true.
  async function GET(req: NextRequest) {
    const denied = await requireAdmin(req);
    if (denied) return denied;

    await dbConnect();
    const docs = await model.find({}).sort({ sortOrder: 1 }).lean();
    return NextResponse.json(docs);
  }

  async function POST(req: NextRequest) {
    const denied = await requireAdmin(req);
    if (denied) return denied;

    const body = await req.json();
    await dbConnect();
    try {
      const created = await model.create(body);
      return NextResponse.json(created, { status: 201 });
    } catch (err) {
      return badRequest(errorMessage(err));
    }
  }

  return { GET, POST };
}

type ItemHandlerOptions = {
  /**
   * The collection's own business key, matching the route's path parameter
   * (e.g. "fieldId" for /admin/config/questions/{fieldId}). Omit to key on the
   * Mongo _id â€” only market-benchmarks does that, since it has no single
   * business key (it is identified by role + location together).
   */
  keyField?: string;
  /** Return a Response to block the delete (e.g. 409), or null to allow it. */
  beforeDelete?: (doc: AnyDoc) => NextResponse | null;
};

export function createItemHandlers(model: Model<AnyDoc>, options: ItemHandlerOptions = {}) {
  const { keyField, beforeDelete } = options;

  // The route's dynamic segment is named after the key it carries, so the
  // folder name and the business key are the same string ([fieldId] carries
  // fieldId). Only market-benchmarks keeps the generic [id] on the Mongo _id.
  const paramName = keyField ?? "id";

  type RouteContext = { params: Promise<Record<string, string>> };

  async function idFrom(context: RouteContext): Promise<string> {
    const params = await context.params;
    return params[paramName];
  }

  function filterFor(id: string): FilterQuery<AnyDoc> {
    return keyField ? ({ [keyField]: id } as FilterQuery<AnyDoc>) : ({ _id: id } as FilterQuery<AnyDoc>);
  }

  // findOne with an _id filter throws on a malformed ObjectId rather than
  // returning null, so both lookup styles funnel through the same catch.
  async function load(id: string) {
    return model.findOne(filterFor(id)).lean().catch(() => null);
  }

  async function GET(req: NextRequest, context: RouteContext) {
    const denied = await requireAdmin(req);
    if (denied) return denied;

    const id = await idFrom(context);
    await dbConnect();
    const doc = await load(id);
    if (!doc) return notFound();
    return NextResponse.json(doc);
  }

  // Partial-merge update (matches this codebase's existing PATCH-style offer
  // routes) rather than a strict full-document replace â€” a client only needs
  // to send the fields it's changing.
  async function PUT(req: NextRequest, context: RouteContext) {
    const denied = await requireAdmin(req);
    if (denied) return denied;

    const id = await idFrom(context);
    const body = await req.json();
    await dbConnect();
    try {
      const updated = await model.findOneAndUpdate(filterFor(id), body, {
        new: true,
        runValidators: true,
      });
      if (!updated) return notFound();
      return NextResponse.json(updated);
    } catch (err) {
      return badRequest(errorMessage(err));
    }
  }

  /**
   * Soft delete (Sprint 8 DoD). Sets active: false and returns the retired
   * document, so the caller can see the flag flipped rather than having to
   * trust a bodyless 204 â€” and so it's self-evident from the response that
   * nothing was destroyed. Re-deleting an already-retired document is a no-op
   * that still returns 200.
   */
  async function DELETE(req: NextRequest, context: RouteContext) {
    const denied = await requireAdmin(req);
    if (denied) return denied;

    const id = await idFrom(context);
    await dbConnect();
    const doc = await load(id);
    if (!doc) return notFound();

    const blocked = beforeDelete?.(doc as AnyDoc);
    if (blocked) return blocked;

    const retired = await model.findOneAndUpdate(
      filterFor(id),
      { active: false },
      { new: true }
    );
    return NextResponse.json(retired);
  }

  return { GET, PUT, DELETE };
}
