import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/utils/dbConnect";
import { OgQuestions, OgMarketBenchmarks, OgScoringConfig } from "@/lib/db/mongo/models/index.js";
import { requireAdmin } from "@/lib/offerguide/adminAuth";
import { badRequest, notFound } from "@/lib/offerguide/errors";
import { scoreOffer } from "@/lib/offerguide/scoring/scoreOffer";
import { GOLDEN_FIXTURES, buildAnswers } from "@/lib/offerguide/scoring/goldenFixtures";
import type { ScoringQuestionDoc } from "@/lib/offerguide/scoring/fieldScore";
import type { MarketBenchmark } from "@/lib/offerguide/scoring/salaryScore";
import type { ScoringConfigDoc } from "@/lib/offerguide/scoring/weightCalculation";

// GET /admin/config/scoring/{version}/preview — Sprint 10, Epic 10.2.6.
//
// Scores the five golden fixtures under the CURRENTLY ACTIVE config and under
// the target {version}, side by side, so an admin sees what activating the
// target would do to representative offers before committing. Read-only — it
// never calls persistOfferScore and never writes an OfferScore row, which is
// why it is a GET despite doing real computation (it mirrors GET /score, a pure
// read, not POST /compute-score, a write).
//
// scoreOffer() is a pure function, but the questions, benchmarks and both config
// versions it needs live in Mongo — so this has to be a server endpoint, not a
// client-side computation as the original plan's wording implied.
//
// Works for ANY version, not just drafts: re-activating an older version gets
// the same preview, since there is no separate "rollback" mode (per the FRS).
//
// The endpoint returns both scored results per fixture; the client computes the
// deltas it renders.
//
// FIXTURE SET — a deliberate reading of the plan's "five fixtures A–E".
// GOLDEN_FIXTURES is the four SINGLE-OFFER fixtures (A strong, B weak, C high-
// uncertainty, D minimum-viable). The plan's fifth, E, is MULTI_OFFER_FIXTURE —
// a comparison of two offers that REUSES A and B, exercising winner/tie logic
// rather than any new single-offer scoring. Its per-offer scores under each
// config are therefore already shown as the A and B rows; there is no separate
// number to score for E. Previewing the four single-offer fixtures is the whole
// of the config's scoring impact. (If E's winner/tie outcome ever needs its own
// row, that is a small follow-up on top of these results.)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ version: string }> }
) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const { version } = await params;
  const previewVersion = Number(version);
  if (!Number.isInteger(previewVersion)) {
    return badRequest("version must be an integer.");
  }

  await dbConnect();

  const [previewConfig, activeConfig, questions, benchmarks] = await Promise.all([
    OgScoringConfig.findOne({ version: previewVersion }).lean<ScoringConfigDoc | null>(),
    OgScoringConfig.findOne({ isActive: true }).sort({ version: -1 }).lean<
      (ScoringConfigDoc & { version: number }) | null
    >(),
    OgQuestions.find({ active: true }).lean<ScoringQuestionDoc[]>(),
    // Same filter as persistOfferScore — legacy rows have no `active` flag.
    OgMarketBenchmarks.find({ active: { $ne: false } }).lean<MarketBenchmark[]>(),
  ]);

  // 404 if the target doesn't exist, or if there is no active version to compare
  // against — the latter shouldn't happen once Epic 10.2 ships, but is handled
  // rather than throwing.
  if (!previewConfig) return notFound();
  if (!activeConfig) {
    return notFound();
  }

  const activeVersion = (activeConfig as { version: number }).version;

  const scoreUnder = (config: ScoringConfigDoc, configVersion: number, fixture: (typeof GOLDEN_FIXTURES)[number]) => {
    const result = scoreOffer({
      compensation: fixture.compensation,
      roleTitle: fixture.roleTitle,
      offerCity: fixture.offerCity,
      offerCountry: fixture.offerCountry,
      answerSources: [buildAnswers(fixture.strategy)],
      session: {
        evaluationPriorities: fixture.evaluationPriorities,
        evaluationType: fixture.evaluationType,
      },
      questions,
      config,
      configVersion,
      benchmarks,
    });
    return {
      categoryScores: {
        Salary: result.salaryScore,
        Benefits: result.benefitsScore,
        Stability: result.stabilityScore,
        "Work-Life": result.worklifeScore,
        Growth: result.growthScore,
        Culture: result.cultureScore,
        Purpose: result.purposeScore,
      },
      overallScore: result.overallScore,
      recommendationLabel: result.recommendationLabel,
    };
  };

  const fixtures = GOLDEN_FIXTURES.map((fixture) => ({
    fixtureId: fixture.id,
    label: fixture.purpose,
    active: scoreUnder(activeConfig, activeVersion, fixture),
    preview: scoreUnder(previewConfig, previewVersion, fixture),
  }));

  return NextResponse.json({ activeVersion, previewVersion, fixtures });
}
