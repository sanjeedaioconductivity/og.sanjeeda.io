/** Shared types for the Scoring admin screen (Sprint 10, Epic 10.2). */

export const SCORE_CATEGORIES = [
  "Salary",
  "Benefits",
  "Stability",
  "Work-Life",
  "Growth",
  "Culture",
  "Purpose",
] as const;
export type ScoreCategory = (typeof SCORE_CATEGORIES)[number];

export type ScoringConfig = {
  version: number;
  effectiveFrom?: string;
  isActive?: boolean;
  categoryBaseWeights: Record<string, number>;
  priorityBoost: number;
  priorityCategoryMap: Record<string, string>;
  importanceWeighting: Record<string, Record<string, unknown>>;
  evaluationTypeBonus: Record<string, Record<string, number>>;
};

export type FixtureScore = {
  categoryScores: Record<string, number>;
  overallScore: number;
  recommendationLabel: string;
};

export type PreviewResponse = {
  activeVersion: number;
  previewVersion: number;
  fixtures: { fixtureId: string; label: string; active: FixtureScore; preview: FixtureScore }[];
};

/** A cell delta for the diff table. */
export function delta(active: number, preview: number): { value: number; dir: "up" | "down" | "same" } {
  const value = Math.round((preview - active) * 100) / 100;
  return { value, dir: value > 0 ? "up" : value < 0 ? "down" : "same" };
}
