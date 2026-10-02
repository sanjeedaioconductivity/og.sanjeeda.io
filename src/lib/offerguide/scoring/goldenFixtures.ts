// OfferGuide — golden scoring fixtures
// Sprint 8, Story 8.2.2.
//
// These five fixtures are the permanent regression suite for the scoring
// engine. Any future change to weights, bands, option scores or the engine
// itself either reproduces the committed numbers in goldenFixtures.test.ts or
// is a deliberate, reviewed change to them.
//
// WHAT THE BASELINE IS. The prototype's scoreOffer() is obsolete and is NOT a
// baseline: it used the retired yesScore() string-guessing helper, scored
// offer_restrictive_clause under Benefits, double-counted company reputation,
// derived Purpose from several fields, and had no equivalent for
// offer_employer_treatment_signal or offer_leadership_style. Every one of those
// was corrected deliberately in Sprints 3 and 5. The baseline is
// OgQuestions + OgScoringConfig under the active default version — which is
// exactly what this file imports, rather than a hand-copied snapshot that
// could silently drift from the seed.
//
// Answers are DERIVED from each question's own option/band data rather than
// hand-listed, so "every field at its best-scoring value" stays true when a
// question's options change — the fixture follows the config, which is the
// point of a config-driven engine.

import {
  ogQuestionsData,
  ogMarketBenchmarksData,
} from "@/lib/db/mongo/seed-offerguide.js";
import type { ScoringQuestionDoc, ScoreableAnswer, NumericBand } from "./fieldScore";
import type { MarketBenchmark } from "./salaryScore";
import type { ScoringConfigDoc } from "./weightCalculation";

export const seedQuestions = ogQuestionsData as ScoringQuestionDoc[];
export const seedBenchmarks = ogMarketBenchmarksData as MarketBenchmark[];

/**
 * The active default scoring config, version 2.
 *
 * The seed's `ogScoringConfigsData` entry for v2 only carries its
 * `importanceWeighting` overrides — everything else comes from
 * OgScoringConfigSchema's field defaults, which Mongoose applies on save but a
 * plain imported object does not have. This is the effective document as it
 * exists in Mongo after seeding, written out so the fixtures score against
 * what production actually reads.
 *
 * `priorityCategoryMap` is reproduced from the schema default and matches
 * SCR-010 §7 exactly — including Security → Stability and
 * Flexibility / Commute → Work-Life.
 */
export const activeScoringConfig: ScoringConfigDoc = {
  categoryBaseWeights: {
    Salary: 1,
    Benefits: 1,
    Stability: 1,
    "Work-Life": 1,
    Growth: 1,
    Culture: 1,
    Purpose: 1,
  },
  priorityBoost: 1.2,
  priorityCategoryMap: {
    Salary: "Salary",
    Growth: "Growth",
    Stability: "Stability",
    "Flexibility / Commute": "Work-Life",
    Benefits: "Benefits",
    Culture: "Culture",
    Purpose: "Purpose",
    Security: "Stability",
  },
  importanceWeighting: {
    offer_worklife_importance: { Low: -0.4, Medium: 0, High: 0.4 },
    offer_growth_importance: { perPointIncrement: 0.2 },
    offer_culture_importance: { perPointIncrement: 0.2 },
  },
  evaluationTypeBonus: {},
};

export const ACTIVE_CONFIG_VERSION = 2;

// ---------------------------------------------------------------- answers

export type AnswerStrategy = "best" | "worst" | "unclear" | "blank";

/** Option values that mean "I don't know", in the terminology standard's own wording. */
const UNCERTAIN_VALUES = ["Not clear", "Not sure", "Not applicable"];

function activeOptions(question: ScoringQuestionDoc) {
  return (question.options ?? []).filter((opt) => opt.active !== false);
}

/**
 * A value guaranteed to land in `band`, given that scoreNumeric returns the
 * first band whose `upTo` the value doesn't exceed. Hitting band i means
 * being above band i-1's ceiling and at or below band i's.
 */
function valueInBand(bands: NumericBand[], index: number): number {
  const band = bands[index];
  if (band.upTo !== undefined) return band.upTo;
  const previous = bands[index - 1];
  return (previous?.upTo ?? 0) + 1;
}

function extremeBandValue(bands: NumericBand[], pick: "max" | "min"): number | null {
  if (bands.length === 0) return null;
  let bestIndex = 0;
  bands.forEach((band, index) => {
    const better =
      pick === "max" ? band.score > bands[bestIndex].score : band.score < bands[bestIndex].score;
    if (better) bestIndex = index;
  });
  return valueInBand(bands, bestIndex);
}

/** The answer this strategy gives for one question, read off the question itself. */
export function answerFor(
  question: ScoringQuestionDoc,
  strategy: AnswerStrategy
): ScoreableAnswer {
  if (strategy === "blank") return null;

  switch (question.scoreType) {
    case "enum": {
      const options = activeOptions(question);
      if (options.length === 0) return null;
      if (strategy === "unclear") {
        // Falls through to null when a field has no uncertainty option at all,
        // which is itself the "left blank" half of fixture C.
        return options.find((opt) => UNCERTAIN_VALUES.includes(opt.value))?.value ?? null;
      }
      const compare = (a: typeof options[number], b: typeof options[number]) =>
        strategy === "best" ? b.score - a.score : a.score - b.score;
      return [...options].sort(compare)[0].value;
    }

    case "rating":
      if (strategy === "unclear") return null;
      return strategy === "best" ? 5 : 1;

    case "numeric": {
      if (strategy === "unclear") return null;
      return extremeBandValue(question.numericBands ?? [], strategy === "best" ? "max" : "min");
    }

    default:
      return null;
  }
}

/**
 * One flat answer object covering every seeded question, keyed by fieldId.
 * scoreCategories reads answers by fieldId, so this is passed straight through
 * as a single "answer source" — no camelCase round-trip needed.
 */
export function buildAnswers(strategy: AnswerStrategy): Record<string, ScoreableAnswer> {
  const answers: Record<string, ScoreableAnswer> = {};
  for (const question of seedQuestions) {
    answers[question.fieldId] = answerFor(question, strategy);
  }
  return answers;
}

// --------------------------------------------------------------- fixtures

export type GoldenFixture = {
  id: string;
  purpose: string;
  strategy: AnswerStrategy;
  compensation: {
    offerBaseSalary: number | null;
    offerPayPeriod: string | null;
    offerNegotiationRoom: string | null;
  } | null;
  roleTitle: string | null;
  offerCity: string | null;
  offerCountry: string | null;
  evaluationPriorities: string[];
  evaluationType: string;
};

// Benchmarks for Software Engineer / Lahore are p25 220000, p75 350000.
const ROLE = "Software Engineer";
const CITY = "Lahore";
const COUNTRY = "Pakistan";

export const GOLDEN_FIXTURES: GoldenFixture[] = [
  {
    id: "A",
    purpose:
      "Strong offer — every field at its best-scoring value, salary above p75, high negotiation room.",
    strategy: "best",
    compensation: {
      offerBaseSalary: 400_000,
      offerPayPeriod: "Annually",
      offerNegotiationRoom: "High",
    },
    roleTitle: ROLE,
    offerCity: CITY,
    offerCountry: COUNTRY,
    evaluationPriorities: ["Salary", "Growth", "Culture"],
    evaluationType: "New job offer",
  },
  {
    id: "B",
    purpose: "Weak offer — every field at its worst-scoring value, salary below p25.",
    strategy: "worst",
    compensation: {
      offerBaseSalary: 150_000,
      offerPayPeriod: "Annually",
      offerNegotiationRoom: "Low",
    },
    roleTitle: ROLE,
    offerCity: CITY,
    offerCountry: COUNTRY,
    evaluationPriorities: [],
    evaluationType: "New job offer",
  },
  {
    id: "C",
    purpose:
      'High uncertainty — every optional field blank or "Not clear"/"Not sure". Exercises nullScore, the enum fallback, and the two documented overrides.',
    strategy: "unclear",
    compensation: {
      offerBaseSalary: null,
      offerPayPeriod: null,
      offerNegotiationRoom: "Not sure",
    },
    roleTitle: ROLE,
    offerCity: CITY,
    offerCountry: COUNTRY,
    evaluationPriorities: ["Stability"],
    evaluationType: "New job offer",
  },
  {
    id: "D",
    purpose:
      "Minimum viable — only the required SCR-001/SCR-002 fields answered, every offer field blank. Must still score without error.",
    strategy: "blank",
    compensation: null,
    roleTitle: null,
    offerCity: null,
    offerCountry: null,
    evaluationPriorities: ["Salary"],
    evaluationType: "New job offer",
  },
];

/**
 * Fixture E is a session, not a single offer: two contrasting offers compared
 * against each other. It reuses A and B rather than inventing new answers, so
 * the comparison is exercised against numbers the other fixtures already pin.
 */
export const MULTI_OFFER_FIXTURE = {
  id: "E",
  purpose:
    "Multi-offer — two contrasting offers in one session. Exercises comparison, the winner badge, and tie handling.",
  offerFixtureIds: ["A", "B"] as const,
};

export function fixtureById(id: string): GoldenFixture {
  const fixture = GOLDEN_FIXTURES.find((f) => f.id === id);
  if (!fixture) throw new Error(`Unknown golden fixture "${id}".`);
  return fixture;
}

/** Assembles the ScoreOfferInput for a fixture, against the seeded baseline. */
export function scoreInputFor(fixture: GoldenFixture) {
  return {
    compensation: fixture.compensation,
    roleTitle: fixture.roleTitle,
    offerCity: fixture.offerCity,
    offerCountry: fixture.offerCountry,
    answerSources: [buildAnswers(fixture.strategy)],
    session: {
      evaluationPriorities: fixture.evaluationPriorities,
      evaluationType: fixture.evaluationType,
    },
    questions: seedQuestions,
    config: activeScoringConfig,
    configVersion: ACTIVE_CONFIG_VERSION,
    benchmarks: seedBenchmarks,
  };
}
