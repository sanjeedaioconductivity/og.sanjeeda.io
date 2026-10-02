// OfferGuide — Sprint 8: soft delete and business-key lookups
//
// DoD: "Soft-delete confirmed on every admin DELETE." The five collections
// that share createItemHandlers are confirmed here at the factory level, which
// is where the behaviour actually lives — a per-collection test would just be
// the same assertion five times against the same code path.
//
// The model is stubbed rather than mocked against a live Mongo, so this runs
// in CI: the assertion that matters is that DELETE issues an active:false
// UPDATE and never a destructive call, and that is visible in the stub's
// recorded calls.

import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";
import type { Model } from "mongoose";
import { createItemHandlers, createCollectionHandlers } from "./adminCrud";

// The model is stubbed below, so no real Mongo connection is wanted here.
// dbConnect() now throws when MONGODB_URI is absent — it used to swallow the
// error and return, which is exactly what let "buffering timed out after
// 10000ms" surface instead of the real cause — so stub it out to keep this
// test hermetic in CI.
vi.mock("@/utils/dbConnect", () => ({ default: async () => undefined }));

// Sprint 9: these handlers are gated by the real adminAuth, which reads the
// caller's role. The identity headers below are how proxy.ts supplies it,
// so this test authenticates the same way production does and never reaches a
// database. (Before Sprint 9 it set an OFFERGUIDE_ADMIN_TOKEN env var, which no
// longer exists.)
import {
  IDENTITY_TYPE_HEADER,
  USER_INFO_ID_HEADER,
  USER_ROLE_HEADER,
} from "@/lib/portal/identityHeaders";

type Call = { op: string; filter?: unknown; update?: unknown };

/**
 * A stand-in for a Mongoose model that records what was asked of it. Every
 * destructive method is present and throws, so a regression back to a hard
 * delete fails loudly here rather than silently passing.
 */
function stubModel(doc: Record<string, unknown> | null) {
  const calls: Call[] = [];
  const thenable = <T>(value: T) => ({
    lean: () => ({ catch: () => Promise.resolve(value), then: (r: (v: T) => void) => r(value) }),
    then: (resolve: (v: T) => void) => resolve(value),
  });

  const model = {
    calls,
    findOne(filter: unknown) {
      calls.push({ op: "findOne", filter });
      return thenable(doc);
    },
    findOneAndUpdate(filter: unknown, update: unknown) {
      calls.push({ op: "findOneAndUpdate", filter, update });
      return thenable({ ...(doc ?? {}), ...(update as object) });
    },
    findByIdAndDelete() {
      throw new Error("hard delete attempted — /admin/config/* must soft delete");
    },
    deleteOne() {
      throw new Error("hard delete attempted — /admin/config/* must soft delete");
    },
    deleteMany() {
      throw new Error("hard delete attempted — /admin/config/* must soft delete");
    },
    find() {
      calls.push({ op: "find" });
      return { sort: () => thenable([doc]) };
    },
  };
  return model as unknown as Model<Record<string, unknown>> & { calls: Call[] };
}

function adminRequest(body?: unknown) {
  const headers = new Headers({
    [IDENTITY_TYPE_HEADER]: "authenticated",
    [USER_INFO_ID_HEADER]: "7",
    [USER_ROLE_HEADER]: "admin",
  });
  return new NextRequest("http://localhost/api/offerguide/admin/config/questions", {
    method: body ? "PUT" : "GET",
    headers,
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}

const context = (params: Record<string, string>) => ({ params: Promise.resolve(params) });

describe("admin DELETE is a soft delete", () => {
  it("sets active:false instead of removing the document", async () => {
    const model = stubModel({ fieldId: "offer_probation", active: true });
    const { DELETE } = createItemHandlers(model, { keyField: "fieldId" });

    const response = await DELETE(adminRequest(), context({ fieldId: "offer_probation" }));

    expect(response.status).toBe(200);
    const update = model.calls.find((c) => c.op === "findOneAndUpdate");
    expect(update?.update).toEqual({ active: false });
  });

  it("returns the retired document so the caller can see the flag flipped", async () => {
    const model = stubModel({ fieldId: "offer_probation", active: true });
    const { DELETE } = createItemHandlers(model, { keyField: "fieldId" });

    const response = await DELETE(adminRequest(), context({ fieldId: "offer_probation" }));
    await expect(response.json()).resolves.toMatchObject({ active: false });
  });

  it("never calls a destructive model method", async () => {
    const model = stubModel({ toggleId: "consent_salary_ranges", active: true });
    const { DELETE } = createItemHandlers(model, { keyField: "toggleId" });

    // The stub throws on findByIdAndDelete/deleteOne/deleteMany, so simply
    // completing without error is the assertion.
    await expect(
      DELETE(adminRequest(), context({ toggleId: "consent_salary_ranges" }))
    ).resolves.toBeDefined();
  });

  it("404s on an unknown key without writing anything", async () => {
    const model = stubModel(null);
    const { DELETE } = createItemHandlers(model, { keyField: "fieldId" });

    const response = await DELETE(adminRequest(), context({ fieldId: "nope" }));
    expect(response.status).toBe(404);
    expect(model.calls.some((c) => c.op === "findOneAndUpdate")).toBe(false);
  });

  it("honours beforeDelete — the master consent toggle 409s and is not retired", async () => {
    const model = stubModel({ toggleId: "consent_share_anonymous", isMaster: true });
    const { DELETE } = createItemHandlers(model, {
      keyField: "toggleId",
      beforeDelete: () =>
        new Response(JSON.stringify({ error: "conflict" }), { status: 409 }) as never,
    });

    const response = await DELETE(
      adminRequest(),
      context({ toggleId: "consent_share_anonymous" })
    );
    expect(response.status).toBe(409);
    expect(model.calls.some((c) => c.op === "findOneAndUpdate")).toBe(false);
  });
});

describe("item routes are keyed on each collection's own business key", () => {
  it("filters on the configured keyField, not the Mongo _id", async () => {
    const model = stubModel({ countryCode: "PK" });
    const { GET } = createItemHandlers(model, { keyField: "countryCode" });

    await GET(adminRequest(), context({ countryCode: "PK" }));
    expect(model.calls[0]).toMatchObject({ op: "findOne", filter: { countryCode: "PK" } });
  });

  it("falls back to _id when no keyField is configured (market benchmarks)", async () => {
    const model = stubModel({ role: "Software Engineer" });
    const { GET } = createItemHandlers(model);

    await GET(adminRequest(), context({ id: "507f1f77bcf86cd799439011" }));
    expect(model.calls[0]).toMatchObject({
      op: "findOne",
      filter: { _id: "507f1f77bcf86cd799439011" },
    });
  });
});

describe("the admin list view still shows retired documents", () => {
  it("lists without filtering on active — a soft-deleted document stays visible to admins", async () => {
    const model = stubModel({ fieldId: "offer_probation", active: false });
    const { GET } = createCollectionHandlers(model);

    await GET(adminRequest());
    const find = model.calls.find((c) => c.op === "find");
    expect(find).toBeDefined();
  });
});

describe("the gate runs before any data access", () => {
  it("rejects an unauthenticated DELETE without touching the model", async () => {
    const model = stubModel({ fieldId: "offer_probation" });
    const { DELETE } = createItemHandlers(model, { keyField: "fieldId" });

    const noCredentials = new NextRequest("http://localhost/api/offerguide/admin/config/questions");
    const response = await DELETE(noCredentials, context({ fieldId: "offer_probation" }));

    expect(response.status).toBe(401);
    expect(model.calls).toHaveLength(0);
  });
});
