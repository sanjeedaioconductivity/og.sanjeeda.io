// OfferGuide — scoring orchestrator
// Sprint 5, Epic 5.1. Combines the 6 generic category averages with the
// dedicated Salary formula into the final weighted overall score. Pure
// function over already-loaded data (no DB access here) so it's directly
// unit-testable, per the handoff's "write the engine so this is testable
// now" note — DB loading lives in the persistence layer that calls this.

import { scoreCategories, GENERIC_CATEGORIES, type FieldScoreDetail } from "./categoryScore";
import type { ScoringQuestionDoc, ScoreableAnswer } from "./fieldScore";
import { scoreSalary, type MarketBenchmark, type SalaryScoreResult } from "./salaryScore";
import {
  computeCategoryWeights,
  type ScoreCategory,
  type ScoringConfigDoc,
} from "./weightCalculation";
import { FIELD_SCORING_RULES_VERSION, RECOMMENDATION_THRESHOLDS, RECOMMENDATION_LABELS } from "./constants";
import { camelToSnake } from "../questions";

// One flattened camelCase object per offer sub-table (compensation is
// handled separately via `compensation`, not passed here).
export type OfferAnswerSource = Record<string, unknown> | null | undefined;

export type ScoreOfferInput = {
  compensation: {
    offerBaseSalary: number | null | undefined;
    offerPayPeriod: string | null | undefined;
    offerNegotiationRoom: string | null | undefined;
  } | null;
  roleTitle: string | null | undefined;
  offerCity: string | null | undefined;
  offerCountry: string | null | undefined;
  answerSources: OfferAnswerSource[];
  session: {
    evaluationPriorities: string[];
    evaluationType: string;
  };
  questions: ScoringQuestionDoc[];
  config: ScoringConfigDoc;
  configVersion: number;
  benchmarks: MarketBenchmark[];
};

export type OfferScoreResult = {
  salaryScore: number;
  benefitsScore: number;
  stabilityScore: number;
  worklifeScore: number;
  growthScore: number;
  cultureScore: number;
  purposeScore: number;
  overallScore: number;
  recommendationLabel: string;
  scoreBreakdown: {
    categoryWeights: Record<ScoreCategory, number>;
    fields: FieldScoreDetail[];
    salary: SalaryScoreResult;
  };
  scoringConfigVersion: number;
  fieldScoringRulesVersion: number;
};

function flattenAnswers(sources: OfferAnswerSource[]): Record<string, ScoreableAnswer> {
  const flat: Record<string, ScoreableAnswer> = {};
  for (const source of sources) {
    if (!source) continue;
    for (const [key, value] of Object.entries(source)) {
      if (value instanceof Date) continue;
      flat[camelToSnake(key)] = value as ScoreableAnswer;
    }
  }
  return flat;
}

function recommendationLabel(overallScore: number): string {
  if (overallScore >= RECOMMENDATION_THRESHOLDS.strong) return RECOMMENDATION_LABELS.strong;
  if (overallScore >= RECOMMENDATION_THRESHOLDS.good) return RECOMMENDATION_LABELS.good;
  if (overallScore >= RECOMMENDATION_THRESHOLDS.caution) return RECOMMENDATION_LABELS.caution;
  return RECOMMENDATION_LABELS.weak;
}

export function scoreOffer(input: ScoreOfferInput): OfferScoreResult {
  const answers = flattenAnswers(input.answerSources);
  const { categoryScores, fieldDetails } = scoreCategories(input.questions, answers);

  const weights = computeCategoryWeights({
    config: input.config,
    evaluationPriorities: input.session.evaluationPriorities,
    evaluationType: input.session.evaluationType,
    worklifeImportance: answers["offer_worklife_importance"] as string | null | undefined,
    growthImportance: answers["offer_growth_importance"] as number | null | undefined,
    cultureImportance: answers["offer_culture_importance"] as number | null | undefined,
  });

  const salaryResult = scoreSalary({
    baseSalary: input.compensation?.offerBaseSalary ?? null,
    payPeriod: input.compensation?.offerPayPeriod ?? null,
    negotiationRoom: input.compensation?.offerNegotiationRoom ?? null,
    roleTitle: input.roleTitle,
    location: input.offerCity ?? input.offerCountry,
    benchmarks: input.benchmarks,
  });

  const allScores: Record<ScoreCategory, number> = {
    Salary: salaryResult.score,
    ...categoryScores,
  };

  const weightedSum = (Object.entries(allScores) as [ScoreCategory, number][]).reduce(
    (sum, [category, score]) => sum + score * weights[category],
    0
  );
  const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
  const overallScore = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;

  return {
    salaryScore: salaryResult.score,
    benefitsScore: Math.round(categoryScores.Benefits),
    stabilityScore: Math.round(categoryScores.Stability),
    worklifeScore: Math.round(categoryScores["Work-Life"]),
    growthScore: Math.round(categoryScores.Growth),
    cultureScore: Math.round(categoryScores.Culture),
    purposeScore: Math.round(categoryScores.Purpose),
    overallScore,
    recommendationLabel: recommendationLabel(overallScore),
    scoreBreakdown: {
      categoryWeights: weights,
      fields: fieldDetails,
      salary: salaryResult,
    },
    scoringConfigVersion: input.configVersion,
    fieldScoringRulesVersion: FIELD_SCORING_RULES_VERSION,
  };
}

// Re-exported so callers only need one import path for the scoring engine.
export { GENERIC_CATEGORIES };
