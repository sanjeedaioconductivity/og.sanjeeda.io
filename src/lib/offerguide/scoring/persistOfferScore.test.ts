// Sprint 10, Epic 10.7 — persistOfferScore's answer wiring.
//
// WHY THIS FILE EXISTS. `persistOfferScore.ts` had zero test coverage, and that
// is exactly how a live scoring bug survived: its `answerSources` array listed
// the four sub-models and never the base `Offer` row, so `offer_employment_type`
// and `offer_probation` — both Stability, both on `offers` itself — were
// structurally invisible to `flattenAnswers()` and always fell through to
// `nullScore`. Every candidate's Stability score ignored what they answered.
//
// `scoreOffer.test.ts` and `categoryScore.test.ts` did not catch it because they
// hand-build their answer objects and happen to include those two fields
// directly, which bypasses the wiring under test here.
//
// So these tests mock the two DATABASES but run the REAL
// `computeAndPersistOfferScore`, using the real seed questions and the real
// active scoring config. Delete `offerBaseFields` from `answerSources` and this
// file goes red — that is its entire job.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { activeScoringConfig, seedQuestions, seedBenchmarks } from "./goldenFixtures";

const findUnique = vi.hoisted(() => vi.fn());
// Declares the single argument Prisma's upsert receives. Without it vi.fn infers
// a zero-argument signature, `mock.calls[0]` types as an empty tuple, and the
// assertion below cannot read `[0]` off it.
const upsert = vi.hoisted(() => vi.fn(async (_args: unknown) => ({})));

vi.mock("@/lib/db/prisma", () => ({
  prisma: { offer: { findUnique }, offerScore: { upsert } },
}));
vi.mock("@/utils/dbConnect", () => ({ default: async () => undefined }));
vi.mock("@/lib/db/mongo/models/index.js", () => ({
  OgQuestions: { find: () => ({ lean: async () => seedQuestions }) },
  OgMarketBenchmarks: { find: () => ({ lean: async () => seedBenchmarks }) },
}));
vi.mock("./configVersion", () => ({
  loadScoringConfigByVersion: async () => activeScoringConfig,
}));

const { computeAndPersistOfferScore, OfferNotFoundError } = await import("./persistOfferScore");

/**
 * A minimal Offer row as Prisma returns it, with the four scored sub-models
 * deliberately null so nothing but the base row supplies real answers — which
 * isolates exactly what this epic fixed.
 */
function offerRow(base: { offerEmploymentType: string; offerProbation: string }) {
  return {
    id: 1,
    evaluationSessionId: 1,
    label: "Offer A",
    companyName: "Regression Co",
    roleTitle: "Software Engineer",
    offerFunctionalDomain: null,
    offerReceivedDate: new Date("2026-09-01"),
    offerCountry: "PK",
    offerCity: "Karachi",
    offerWorkArrangement: "Hybrid",
    offerContractDuration: null,
    reportingLevel: null,
    offerContractDurationOtherText: null,
    offerProbationOtherText: null,
    reportingLevelOtherText: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...base,

    evaluationSession: {
      scoringConfigVersion: 2,
      evaluationPriorities: [],
      evaluationType: "New job offer",
    },
    compensation: {
      offerBaseSalary: { toNumber: () => 250000 },
      offerPayPeriod: "Monthly",
      offerNegotiationRoom: "Not sure",
      offerAnnualBonusType: null,
      offerAnnualBonus: null,
    },
    benefitsSecurity: null,
    workLife: null,
    growth: null,
    culture: null,
  };
}

async function scoreWith(base: { offerEmploymentType: string; offerProbation: string }) {
  findUnique.mockResolvedValue(offerRow(base));
  return computeAndPersistOfferScore(1);
}

/** Seed values, read from seed-offerguide.js — both fields are `enum`/Stability. */
const BEST = { offerEmploymentType: "Full-time", offerProbation: "No probation" };
const WORST = { offerEmploymentType: "Internship", offerProbation: "6 months" };

beforeEach(() => {
  findUnique.mockReset();
  upsert.mockClear();
});

describe("the base Offer row reaches the scoring engine", () => {
  it("scores offer_employment_type from the offer row, not nullScore", async () => {
    const result = await scoreWith(BEST);

    const field = result.scoreBreakdown.fields.find(
      (f) => f.fieldId === "offer_employment_type"
    );
    expect(field, "offer_employment_type never reached the engine").toBeDefined();
    expect(field!.value).toBe("Full-time");
  });

  it("scores offer_probation from the offer row, not nullScore", async () => {
    const result = await scoreWith(BEST);

    const field = result.scoreBreakdown.fields.find((f) => f.fieldId === "offer_probation");
    expect(field, "offer_probation never reached the engine").toBeDefined();
    expect(field!.value).toBe("No probation");
  });

  // The headline regression. Before the fix both runs produced an identical
  // Stability score, because both fields resolved to the same blank default
  // regardless of what the candidate answered.
  it("a better employment type and probation produce a better Stability score", async () => {
    const best = await scoreWith(BEST);
    const worst = await scoreWith(WORST);

    expect(best.stabilityScore).toBeGreaterThan(worst.stabilityScore);
  });

  it("the two fields are scored under Stability, as the seed declares", async () => {
    const result = await scoreWith(BEST);

    for (const fieldId of ["offer_employment_type", "offer_probation"]) {
      const field = result.scoreBreakdown.fields.find((f) => f.fieldId === fieldId);
      expect(field!.category).toBe("Stability");
    }
  });
});

describe("the relations are not injected as answers", () => {
  // `flattenAnswers` spreads every own key of each source. Passing the Prisma
  // row whole would add `evaluation_session`, `compensation` and friends as
  // object-valued "answers" — harmless only for as long as no fieldId collides
  // with a relation name. This pins the narrower choice.
  it("no scored field resolves to an object", async () => {
    const result = await scoreWith(BEST);

    const objectValued = result.scoreBreakdown.fields.filter(
      (f) => f.value !== null && typeof f.value === "object" && !Array.isArray(f.value)
    );
    expect(objectValued.map((f) => f.fieldId)).toEqual([]);
  });
});

describe("sub-models still win a key collision", () => {
  // The base row is listed FIRST in `answerSources` precisely so this epic can
  // only make previously-invisible fields visible, never change one that already
  // resolved. If the order is ever flipped, a sub-model value would start losing
  // to a same-named column on `offers`.
  it("a sub-model value overrides a same-named base-row key", async () => {
    findUnique.mockResolvedValue({
      ...offerRow(BEST),
      // `offers` has no such column in reality — this is a deliberate probe of
      // precedence, using a real scored fieldId that lives on a sub-model.
      offerJobSecurity: "No",
      benefitsSecurity: { offerId: 1, offerJobSecurity: "Yes" },
    });

    const result = await computeAndPersistOfferScore(1);
    const field = result.scoreBreakdown.fields.find((f) => f.fieldId === "offer_job_security");

    expect(field?.value).toBe("Yes");
  });
});

describe("persistence", () => {
  it("upserts the computed score against the offer id", async () => {
    await scoreWith(BEST);

    expect(upsert).toHaveBeenCalledTimes(1);
    const call = upsert.mock.calls[0][0] as {
      where: { offerId: number };
      create: { stabilityScore: number };
    };
    expect(call.where).toEqual({ offerId: 1 });
    expect(typeof call.create.stabilityScore).toBe("number");
  });

  it("throws OfferNotFoundError for an offer that does not exist", async () => {
    findUnique.mockResolvedValue(null);
    await expect(computeAndPersistOfferScore(999)).rejects.toBeInstanceOf(OfferNotFoundError);
  });
});
