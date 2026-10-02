// Sprint 10, Epic 10.2.3 — the activate endpoint's invariant.
//
// The behaviour that matters is atomic single-active: after activating any
// version, exactly one document has isActive:true. This tests the handler's
// logic against an in-memory stand-in for OgScoringConfig and a fake
// transaction, so it runs in CI with no Mongo — the transaction's real
// guarantee (that a crash mid-way can't leave two active) is Atlas's to keep;
// what is testable here is that the handler issues deactivate-all-then-activate
// and is idempotent and 404-correct.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ---- in-memory OgScoringConfig ------------------------------------------------
type Doc = { version: number; isActive: boolean; save: () => Promise<void> };
let store: Doc[] = [];

const OgScoringConfig = {
  findOne(filter: { version: number }) {
    return {
      session() {
        return Promise.resolve(store.find((d) => d.version === filter.version) ?? null);
      },
    };
  },
  async updateMany(filter: { version: { $ne: number }; isActive: boolean }, update: { $set: { isActive: boolean } }) {
    for (const d of store) {
      if (d.version !== filter.version.$ne && d.isActive) d.isActive = update.$set.isActive;
    }
  },
};

vi.mock("@/lib/db/mongo/models/index.js", () => ({ OgScoringConfig }));
vi.mock("@/lib/offerguide/adminAuth", () => ({ requireAdmin: async () => null }));
// The helper just runs the callback — the transaction wrapper itself is Atlas's
// concern, not this unit's.
vi.mock("@/lib/offerguide/withMongoTransaction", () => ({
  withMongoTransaction: (work: (s: unknown) => Promise<unknown>) => work({}),
}));

const { POST } = await import("./route");

const req = () => new NextRequest("http://localhost/api/offerguide/admin/config/scoring/x/activate", { method: "POST" });
const ctx = (version: string) => ({ params: Promise.resolve({ version }) });
const activeVersions = () => store.filter((d) => d.isActive).map((d) => d.version);

beforeEach(() => {
  store = [1, 2, 3].map((version) => ({
    version,
    isActive: version === 2,
    save: vi.fn(async function (this: Doc) {}),
  }));
});

describe("POST activate", () => {
  it("leaves exactly one active version after activating another", async () => {
    const res = await POST(req(), ctx("3"));
    expect(res.status).toBe(200);
    expect(activeVersions()).toEqual([3]);
  });

  it("deactivates the previously-active version", async () => {
    await POST(req(), ctx("1"));
    expect(activeVersions()).toEqual([1]);
  });

  it("is a no-op that still returns 200 when the version is already active", async () => {
    const res = await POST(req(), ctx("2"));
    expect(res.status).toBe(200);
    expect(activeVersions()).toEqual([2]);
  });

  it("404s for a version that does not exist, changing nothing", async () => {
    const res = await POST(req(), ctx("99"));
    expect(res.status).toBe(404);
    expect(activeVersions()).toEqual([2]); // untouched
  });

  it("400s for a non-integer version", async () => {
    const res = await POST(req(), ctx("abc"));
    expect(res.status).toBe(400);
  });

  it("returns the newly-active config document", async () => {
    const res = await POST(req(), ctx("3"));
    const body = await res.json();
    expect(body.version).toBe(3);
    expect(body.isActive).toBe(true);
  });
});
