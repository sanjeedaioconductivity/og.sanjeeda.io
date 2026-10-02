// OfferGuide — weight calculation
// Sprint 5, Epic 5.1 §3.3. Base weight 1.0 per category, priority boost via
// OgScoringConfig.priorityCategoryMap, and importance-slider/evaluation_type
// adjustment layers wired into the pathway. With the seeded v1 config
// (schema defaults — every adjustment at 0) these layers have zero effect,
// matching the prototype's actual base+priority-only behavior exactly. The
// seeded v2 config exercises non-zero values so the mechanism itself is
// tested, per "must exist and be exercised by tests."

import { GENERIC_CATEGORIES } from "./categoryScore";

export const ALL_SCORE_CATEGORIES = ["Salary", ...GENERIC_CATEGORIES] as const;
export type ScoreCategory = (typeof ALL_SCORE_CATEGORIES)[number];

type PlainOrMap<V> = Map<string, V> | Record<string, V> | undefined | null;

export type ScoringConfigDoc = {
  categoryBaseWeights?: Partial<Record<ScoreCategory, number>>;
  priorityBoost?: number;
  priorityCategoryMap?: PlainOrMap<string>;
  importanceWeighting?: {
    offer_worklife_importance?: { Low?: number; Medium?: number; High?: number };
    offer_growth_importance?: { perPointIncrement?: number };
    offer_culture_importance?: { perPointIncrement?: number };
  };
  evaluationTypeBonus?: Record<string, PlainOrMap<number>>;
};

export type WeightCalculationInput = {
  config: ScoringConfigDoc;
  evaluationPriorities: string[];
  evaluationType: string;
  worklifeImportance: string | null | undefined; // Low/Medium/High
  growthImportance: number | null | undefined; // 1-5
  cultureImportance: number | null | undefined; // 1-5
};

// 1-5 rating fields' neutral midpoint (also each field's own Prisma default),
// so an untouched slider contributes zero adjustment regardless of
// perPointIncrement.
const IMPORTANCE_MIDPOINT = 3;

function toPlainRecord<V>(value: PlainOrMap<V>): Record<string, V> {
  if (!value) return {};
  return value instanceof Map ? Object.fromEntries(value) : value;
}

export function computeCategoryWeights(
  input: WeightCalculationInput
): Record<ScoreCategory, number> {
  const {
    config,
    evaluationPriorities,
    evaluationType,
    worklifeImportance,
    growthImportance,
    cultureImportance,
  } = input;

  const weights = {} as Record<ScoreCategory, number>;
  for (const category of ALL_SCORE_CATEGORIES) {
    weights[category] = config.categoryBaseWeights?.[category] ?? 1;
  }

  const priorityBoost = config.priorityBoost ?? 1.2;
  const priorityMap = toPlainRecord(config.priorityCategoryMap);
  for (const priority of evaluationPriorities ?? []) {
    const mapped = priorityMap[priority] as ScoreCategory | undefined;
    if (mapped && mapped in weights) weights[mapped] += priorityBoost;
  }

  const worklifeAdj = config.importanceWeighting?.offer_worklife_importance;
  if (worklifeAdj && worklifeImportance) {
    weights["Work-Life"] += (worklifeAdj as Record<string, number>)[worklifeImportance] ?? 0;
  }

  const growthIncrement = config.importanceWeighting?.offer_growth_importance?.perPointIncrement ?? 0;
  if (typeof growthImportance === "number") {
    weights.Growth += (growthImportance - IMPORTANCE_MIDPOINT) * growthIncrement;
  }

  const cultureIncrement = config.importanceWeighting?.offer_culture_importance?.perPointIncrement ?? 0;
  if (typeof cultureImportance === "number") {
    weights.Culture += (cultureImportance - IMPORTANCE_MIDPOINT) * cultureIncrement;
  }

  const evalTypeBonus = toPlainRecord(config.evaluationTypeBonus?.[evaluationType]);
  for (const [category, bonus] of Object.entries(evalTypeBonus)) {
    if (category in weights) weights[category as ScoreCategory] += bonus;
  }

  for (const category of ALL_SCORE_CATEGORIES) {
    weights[category] = Math.max(0, weights[category]);
  }

  return weights;
}
