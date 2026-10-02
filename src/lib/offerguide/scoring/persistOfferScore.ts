// OfferGuide — scoring persistence
// Sprint 5, Epic 5.1. Loads everything scoreOffer() needs for one offer,
// runs the engine, and upserts the result into MySQL's offer_scores table.
// This is the only place in Sprint 5 that touches both Mongo (questions,
// scoring config, benchmarks) and MySQL (the offer itself) for scoring.

import { prisma } from "@/lib/db/prisma";
import dbConnect from "@/utils/dbConnect";
import { OgQuestions, OgMarketBenchmarks } from "@/lib/db/mongo/models/index.js";
import { scoreOffer, type OfferScoreResult } from "./scoreOffer";
import { loadScoringConfigByVersion } from "./configVersion";
import { deriveGuidance, type Guidance } from "./deriveGuidance";
import type { ScoringQuestionDoc } from "./fieldScore";
import type { MarketBenchmark } from "./salaryScore";

export class OfferNotFoundError extends Error {}

export async function computeAndPersistOfferScore(
  offerId: number,
): Promise<OfferScoreResult & Guidance> {
  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
    include: {
      evaluationSession: true,
      compensation: true,
      benefitsSecurity: true,
      workLife: true,
      growth: true,
      culture: true,
    },
  });
  if (!offer) throw new OfferNotFoundError(`Offer ${offerId} not found.`);

  // Split the relations off the base row. `offerBaseFields` is every scalar
  // column on `offers` itself, and it is an answer source in its own right —
  // see the note above `scoreOffer()` below.
  const {
    evaluationSession,
    compensation: offerCompensation,
    benefitsSecurity,
    workLife,
    growth,
    culture,
    ...offerBaseFields
  } = offer;

  await dbConnect();
  const [questions, benchmarks, config] = await Promise.all([
    OgQuestions.find({ active: true }).lean<ScoringQuestionDoc[]>(),
    // Excludes retired benchmarks for the same reason questions filter on
    // active — a row soft-deleted via the admin API (Sprint 8) must stop feeding
    // new Salary scores, while staying in the collection to explain old ones.
    // `$ne: false` rather than `active: true`: the flag was added to this
    // collection after the first rows were seeded, and those rows carry no
    // flag at all. `active: true` matched none of them, so EVERY Salary score
    // fell through to the flat no-benchmark fallback (45) whatever salary was
    // entered — QA report B4.
    OgMarketBenchmarks.find({ active: { $ne: false } }).lean<MarketBenchmark[]>(),
    // Reads the exact version this offer's session was pinned to at
    // creation time — never "whatever is currently active" — so retuning
    // weights later never silently shifts an already-computed score.
    loadScoringConfigByVersion(evaluationSession.scoringConfigVersion),
  ]);

  const compensation = offerCompensation
    ? {
        offerBaseSalary: offerCompensation.offerBaseSalary.toNumber(),
        offerPayPeriod: offerCompensation.offerPayPeriod,
        offerNegotiationRoom: offerCompensation.offerNegotiationRoom,
      }
    : null;

  // Sprint 10, Epic 10.7 — the base Offer row is an answer source too.
  //
  // Two scored fields live on `offers` itself rather than on any sub-model:
  // `offer_employment_type` and `offer_probation`, both Stability. Verified
  // exhaustively — they are the only 2 of the seed's 48 scored fieldIds that do.
  // Until this was added, `flattenAnswers()` never saw them, so both always fell
  // through to `nullScore` (45) and every candidate's Stability score ignored
  // what they actually answered on SCR-003.
  //
  // `offerBaseFields` rather than `offer` whole: `flattenAnswers` spreads every
  // own key, so passing the relations too would inject `evaluation_session`,
  // `compensation` and friends as object-valued "answers". Nothing reads those
  // today, but only because no fieldId happens to collide with a relation name.
  //
  // Order matters. The base row goes FIRST so the four sub-models still win any
  // key collision — this can only add fields that were previously invisible,
  // never change one that already resolved.
  const result = scoreOffer({
    compensation,
    roleTitle: offerBaseFields.roleTitle,
    offerCity: offerBaseFields.offerCity,
    offerCountry: offerBaseFields.offerCountry,
    answerSources: [offerBaseFields, benefitsSecurity, workLife, growth, culture],
    session: {
      evaluationPriorities: (evaluationSession.evaluationPriorities as string[] | null) ?? [],
      evaluationType: evaluationSession.evaluationType,
    },
    questions,
    config,
    configVersion: evaluationSession.scoringConfigVersion,
    benchmarks,
  });

  // SCR-010's three guidance panels. Derived here, server-side, from the scores
  // just computed plus the offer's raw answers — never on the client (Sprint 7
  // §5). Reads only fields already loaded above, so no extra queries.
  const guidance = deriveGuidance(
    {
      salaryScore: result.salaryScore,
      benefitsScore: result.benefitsScore,
      stabilityScore: result.stabilityScore,
      worklifeScore: result.worklifeScore,
      growthScore: result.growthScore,
      cultureScore: result.cultureScore,
      purposeScore: result.purposeScore,
    },
    {
      offerAnnualBonusType: offerCompensation?.offerAnnualBonusType ?? null,
      offerAnnualBonus: offerCompensation?.offerAnnualBonus?.toNumber() ?? null,
      offerNegotiationRoom: offerCompensation?.offerNegotiationRoom ?? null,
      offerOvertimeCompensation: workLife?.offerOvertimeCompensation ?? null,
      offerRestrictiveClause: benefitsSecurity?.offerRestrictiveClause ?? null,
      offerRedFlags: culture?.offerRedFlags ?? null,
    },
  );

  const scoreFields = {
    salaryScore: result.salaryScore,
    benefitsScore: result.benefitsScore,
    stabilityScore: result.stabilityScore,
    worklifeScore: result.worklifeScore,
    growthScore: result.growthScore,
    cultureScore: result.cultureScore,
    purposeScore: result.purposeScore,
    overallScore: result.overallScore,
    recommendationLabel: result.recommendationLabel,
    // Round-tripped through JSON to strip `undefined` field values (an
    // unanswered question) before hitting Prisma's Json column, which only
    // accepts valid JSON values.
    scoreBreakdown: JSON.parse(JSON.stringify(result.scoreBreakdown)),
    strengths: guidance.strengths,
    watchOuts: guidance.watchOuts,
    nextSteps: guidance.nextSteps,
    scoringConfigVersion: result.scoringConfigVersion,
    fieldScoringRulesVersion: result.fieldScoringRulesVersion,
  };

  await prisma.offerScore.upsert({
    where: { offerId },
    create: { offerId, ...scoreFields },
    update: scoreFields,
  });

  // Returned alongside the raw engine result so the /score route hands SCR-010
  // everything it renders in one response.
  return { ...result, ...guidance };
}
