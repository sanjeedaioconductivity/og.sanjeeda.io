import { describe, it, expect } from "vitest";
import { scoreSalary } from "./salaryScore";
import { SALARY_SCORE_NO_BASE_SALARY } from "./constants";
import { ogMarketBenchmarksData } from "@/lib/db/mongo/seed-offerguide.js";
import type { MarketBenchmark } from "./salaryScore";

const seedBenchmarks = ogMarketBenchmarksData as unknown as MarketBenchmark[];

describe("scoreSalary — no-base-salary fallback", () => {
  it("returns the flat fallback score, skipping the percentile formula entirely, when base salary is missing", () => {
    const result = scoreSalary({
      baseSalary: null,
      payPeriod: "Monthly",
      negotiationRoom: "High",
      roleTitle: "Software Engineer",
      location: "Lahore",
      benchmarks: seedBenchmarks,
    });
    expect(result.score).toBe(SALARY_SCORE_NO_BASE_SALARY);
    expect(result.usedNoBaseSalaryFallback).toBe(true);
    expect(result.benchmarkPoolStage).toBe("none");
  });

  it("treats zero/unparseable base salary the same as missing", () => {
    expect(
      scoreSalary({
        baseSalary: 0,
        payPeriod: "Monthly",
        negotiationRoom: null,
        roleTitle: "Software Engineer",
        location: "Lahore",
        benchmarks: seedBenchmarks,
      }).usedNoBaseSalaryFallback
    ).toBe(true);
  });

  it("falls back the same way when no benchmark data exists anywhere", () => {
    const result = scoreSalary({
      baseSalary: 300000,
      payPeriod: "Monthly",
      negotiationRoom: "Low",
      roleTitle: "Software Engineer",
      location: "Lahore",
      benchmarks: [],
    });
    expect(result.score).toBe(SALARY_SCORE_NO_BASE_SALARY);
    expect(result.benchmarkPoolStage).toBe("none");
  });
});

describe("scoreSalary — benchmark pool degrade-in-stages selection", () => {
  const rolePool: MarketBenchmark[] = [
    { role: "Product Manager", location: "Lahore", p25: 200000, p75: 300000, sampleSize: 10 },
    { role: "Product Manager", location: "Karachi", p25: 210000, p75: 310000, sampleSize: 10 },
    { role: "Product Manager", location: "Dubai", p25: 220000, p75: 320000, sampleSize: 10 },
  ];

  it("uses the role-matched pool when it has >= 3 matching documents", () => {
    const result = scoreSalary({
      baseSalary: 250000,
      payPeriod: "Annually",
      negotiationRoom: "Not sure",
      roleTitle: "Product Manager",
      location: "Islamabad", // doesn't matter — role match wins first
      benchmarks: rolePool,
    });
    expect(result.benchmarkPoolStage).toBe("role");
  });

  it("degrades to a city/location match when fewer than 3 role matches exist", () => {
    const locationPool: MarketBenchmark[] = [
      { role: "Product Manager", location: "Lahore", p25: 200000, p75: 300000, sampleSize: 5 }, // 1 role match
      { role: "Data Analyst", location: "Lahore", p25: 150000, p75: 220000, sampleSize: 5 },
      { role: "UX Designer", location: "Lahore", p25: 180000, p75: 260000, sampleSize: 5 },
    ];
    const result = scoreSalary({
      baseSalary: 250000,
      payPeriod: "Annually",
      negotiationRoom: "Not sure",
      roleTitle: "Product Manager",
      location: "Lahore",
      benchmarks: locationPool,
    });
    expect(result.benchmarkPoolStage).toBe("location");
  });

  it("degrades to the full pool when neither role nor location has >= 3 matches", () => {
    const scatteredPool: MarketBenchmark[] = [
      { role: "Product Manager", location: "Lahore", p25: 200000, p75: 300000, sampleSize: 5 },
      { role: "Data Analyst", location: "Karachi", p25: 150000, p75: 220000, sampleSize: 5 },
    ];
    const result = scoreSalary({
      baseSalary: 250000,
      payPeriod: "Annually",
      negotiationRoom: "Not sure",
      roleTitle: "Product Manager",
      location: "Lahore",
      benchmarks: scatteredPool,
    });
    expect(result.benchmarkPoolStage).toBe("full");
  });
});

describe("scoreSalary — percentile formula", () => {
  const benchmarks: MarketBenchmark[] = [
    { role: "Software Engineer", location: "Lahore", p25: 200000, p75: 300000, sampleSize: 10 },
  ];

  it("scores at p25 as 40 (base) + 0 (percentile) + bonus", () => {
    const result = scoreSalary({
      baseSalary: 200000,
      payPeriod: "Annually",
      negotiationRoom: "Not applicable",
      roleTitle: "Software Engineer",
      location: "Lahore",
      benchmarks,
    });
    expect(result.score).toBe(40);
  });

  it("scores at p75 as 40 + 45 (full percentile range) + bonus", () => {
    const result = scoreSalary({
      baseSalary: 300000,
      payPeriod: "Annually",
      negotiationRoom: "Not applicable",
      roleTitle: "Software Engineer",
      location: "Lahore",
      benchmarks,
    });
    expect(result.score).toBe(85);
  });

  it("annualizes a monthly base salary before computing the percentile", () => {
    const monthly = scoreSalary({
      baseSalary: 25000, // *12 = 300000 = p75
      payPeriod: "Monthly",
      negotiationRoom: "Not applicable",
      roleTitle: "Software Engineer",
      location: "Lahore",
      benchmarks,
    });
    expect(monthly.score).toBe(85);
  });

  it.each([
    ["High", 8],
    ["Medium", 4],
    ["Low", 0],
    ["Not sure", 0],
    ["Not applicable", 0],
  ])("applies the correct negotiation bonus for %s", (room, bonus) => {
    const result = scoreSalary({
      baseSalary: 200000, // at p25, formula contributes 0
      payPeriod: "Annually",
      negotiationRoom: room,
      roleTitle: "Software Engineer",
      location: "Lahore",
      benchmarks,
    });
    expect(result.score).toBe(40 + bonus);
  });

  it("clamps the result to [0, 100]", () => {
    const wayAboveP75 = scoreSalary({
      baseSalary: 10_000_000,
      payPeriod: "Annually",
      negotiationRoom: "High",
      roleTitle: "Software Engineer",
      location: "Lahore",
      benchmarks,
    });
    expect(wayAboveP75.score).toBe(100);
  });
});
