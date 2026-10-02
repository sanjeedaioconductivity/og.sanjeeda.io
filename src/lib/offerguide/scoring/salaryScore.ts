// OfferGuide — Salary market-percentile formula
// Sprint 5, Epic 5.1 §3.2. Salary is not in OgQuestions and never enters the
// generic category-averaging path — it's computed independently here and
// merged into the final weighted total by scoreOffer.ts.

import { SALARY_SCORE_NO_BASE_SALARY } from "./constants";

export type MarketBenchmark = {
  role: string;
  location: string;
  p25: number;
  p75: number;
  sampleSize?: number;
};

export type SalaryScoreInput = {
  baseSalary: number | null | undefined;
  payPeriod: string | null | undefined; // "Monthly" | "Annually"
  negotiationRoom: string | null | undefined;
  roleTitle: string | null | undefined;
  location: string | null | undefined; // offer city, falls back to offer country
  benchmarks: MarketBenchmark[];
};

export type SalaryScoreResult = {
  score: number;
  usedNoBaseSalaryFallback: boolean;
  benchmarkPoolStage: "role" | "location" | "full" | "none";
};

const MIN_POOL_SIZE = 3;

function normalize(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

function annualize(baseSalary: number, payPeriod: string | null | undefined): number {
  return payPeriod === "Monthly" ? baseSalary * 12 : baseSalary;
}

function negotiationBonus(room: string | null | undefined): number {
  if (room === "High") return 8;
  if (room === "Medium") return 4;
  return 0; // Low / Not sure / Not applicable
}

/**
 * Degrade-in-stages pool selection: role match -> city/location match -> full
 * pool. As long as at least one benchmark document exists, this never
 * produces a "zero benchmark data" case to special-case.
 */
function selectBenchmarkPool(
  benchmarks: MarketBenchmark[],
  roleTitle: string | null | undefined,
  location: string | null | undefined
): { pool: MarketBenchmark[]; stage: SalaryScoreResult["benchmarkPoolStage"] } {
  const roleMatches = benchmarks.filter((b) => normalize(b.role) === normalize(roleTitle));
  if (roleMatches.length >= MIN_POOL_SIZE) return { pool: roleMatches, stage: "role" };

  const locationMatches = benchmarks.filter((b) => normalize(b.location) === normalize(location));
  if (locationMatches.length >= MIN_POOL_SIZE) return { pool: locationMatches, stage: "location" };

  if (benchmarks.length > 0) return { pool: benchmarks, stage: "full" };
  return { pool: [], stage: "none" };
}

// Each benchmark document is itself a precomputed role/location percentile
// pair (not a raw salary sample), so combining multiple matched documents
// blends them weighted by sampleSize rather than re-deriving percentiles
// from scratch.
function blendPercentiles(pool: MarketBenchmark[]): { p25: number; p75: number } {
  const weightOf = (b: MarketBenchmark) => (b.sampleSize && b.sampleSize > 0 ? b.sampleSize : 1);
  const totalWeight = pool.reduce((sum, b) => sum + weightOf(b), 0);
  const p25 = pool.reduce((sum, b) => sum + b.p25 * weightOf(b), 0) / totalWeight;
  const p75 = pool.reduce((sum, b) => sum + b.p75 * weightOf(b), 0) / totalWeight;
  return { p25, p75 };
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, value));
}

export function scoreSalary(input: SalaryScoreInput): SalaryScoreResult {
  const { baseSalary, payPeriod, negotiationRoom, roleTitle, location, benchmarks } = input;

  // No-base-salary fallback: a flat score, not computed via the percentile
  // formula at all — not even benchmark pool selection runs in this case.
  if (
    baseSalary === null ||
    baseSalary === undefined ||
    !Number.isFinite(baseSalary) ||
    baseSalary <= 0
  ) {
    return {
      score: SALARY_SCORE_NO_BASE_SALARY,
      usedNoBaseSalaryFallback: true,
      benchmarkPoolStage: "none",
    };
  }

  const annualBaseSalary = annualize(baseSalary, payPeriod);
  const { pool, stage } = selectBenchmarkPool(benchmarks, roleTitle, location);

  if (pool.length === 0) {
    // No benchmark data exists anywhere yet (empty collection) — same flat
    // fallback, since there's no pool to compute a percentile against.
    return {
      score: SALARY_SCORE_NO_BASE_SALARY,
      usedNoBaseSalaryFallback: true,
      benchmarkPoolStage: "none",
    };
  }

  const { p25, p75 } = blendPercentiles(pool);
  const bonus = negotiationBonus(negotiationRoom);
  const raw = 40 + ((annualBaseSalary - p25) / Math.max(1, p75 - p25)) * 45 + bonus;

  return {
    score: Math.round(clamp(raw)),
    usedNoBaseSalaryFallback: false,
    benchmarkPoolStage: stage,
  };
}
