// OfferGuide — category grouping
// Sprint 5, Epic 5.1 §3.1. Groups OgQuestions documents by their own
// `category` field at query time and averages within each group — no
// field-to-category map is hardcoded here, so reassigning a field's category
// in Mongo changes scoring behavior on the next run with zero code deploy.

import { scoreField, type ScoreableAnswer, type ScoringQuestionDoc } from "./fieldScore";

export const GENERIC_CATEGORIES = [
  "Benefits",
  "Stability",
  "Work-Life",
  "Growth",
  "Culture",
  "Purpose",
] as const;
export type GenericCategory = (typeof GENERIC_CATEGORIES)[number];

export type FieldScoreDetail = {
  fieldId: string;
  category: string;
  value: ScoreableAnswer;
  score: number;
};

export type CategoryScoreResult = {
  categoryScores: Record<GenericCategory, number>;
  fieldDetails: FieldScoreDetail[];
};

/**
 * `questions` should already be filtered to active documents by the caller
 * (matching the same `active: true` convention used by the public /config/*
 * routes) — retired fields don't participate in the average.
 */
export function scoreCategories(
  questions: ScoringQuestionDoc[],
  answers: Record<string, ScoreableAnswer>
): CategoryScoreResult {
  const byCategory = new Map<string, number[]>();
  const fieldDetails: FieldScoreDetail[] = [];

  for (const question of questions) {
    const value = answers[question.fieldId];
    const score = scoreField(question, value);
    fieldDetails.push({ fieldId: question.fieldId, category: question.category, value, score });

    const bucket = byCategory.get(question.category) ?? [];
    bucket.push(score);
    byCategory.set(question.category, bucket);
  }

  const categoryScores = {} as Record<GenericCategory, number>;
  for (const category of GENERIC_CATEGORIES) {
    const scores = byCategory.get(category) ?? [];
    categoryScores[category] =
      scores.length > 0 ? scores.reduce((sum, s) => sum + s, 0) / scores.length : 0;
  }

  return { categoryScores, fieldDetails };
}
