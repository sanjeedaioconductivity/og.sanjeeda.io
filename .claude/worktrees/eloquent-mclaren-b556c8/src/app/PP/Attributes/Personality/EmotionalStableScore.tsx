"use client";

import React, { useMemo } from "react";
import type { QuestionData } from "../../QuestionBlock";

type Responses = Record<string, string | number | undefined>;

type Props = {
  questions: QuestionData[];
  responses: Responses;
  traitKey?: string;   // must match question.primaryTrait
  leftLabel?: string;  // Emotional
  rightLabel?: string; // Stable
};

/** Accepts: "A"/"B", 1/2, "Emo_Stab_1A", "Emo_Stab_2B" */
function parseForcedChoice(v: string | number | undefined): "A" | "B" | null {
  if (v === undefined || v === null || v === "") return null;

  if (typeof v === "number") {
    if (v === 1) return "A";
    if (v === 2) return "B";
    return null;
  }

  const s = String(v).trim();
  if (s === "A" || s === "B") return s;

  const last = s.slice(-1).toUpperCase();
  if (last === "A" || last === "B") return last as "A" | "B";

  return null;
}

function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}

// ratio 0..1 => 1..7
function ratioToScaled7(ratio: number) {
  return Math.round(1 + ratio * 6);
}

const QUAL_ROW = [
  "Very Strong",
  "Strong",
  "Moderate",
  "Neutral",
  "Moderate",
  "Strong",
  "Very Strong",
] as const;

function strengthLabel(score: number) {
  return QUAL_ROW[score - 1] ?? "Neutral";
}

function whereLies(score: number, leftLabel: string, rightLabel: string) {
  if (score === 4) return "Middle";
  if (score <= 3) return `Near ${leftLabel}`;
  return `Near ${rightLabel}`;
}

export default function EmotionalStableScore({
  questions,
  responses,
  traitKey = "Emotional vs Stable",
  leftLabel = "Emotional",
  rightLabel = "Stable",
}: Props) {
  const { scaledScore, strength, region } = useMemo(() => {
    const forcedQs = questions.filter(
      (q) => q.primaryTrait === traitKey && q.type === "forced"
    );

    let answeredCount = 0;
    let stableCount = 0; // B = Stable

    for (const q of forcedQs) {
      const pick = parseForcedChoice(responses[q.id]);
      if (!pick) continue;

      answeredCount += 1;

      // default: A=Emotional, B=Stable
      // optional reverse support if you ever add it
      const reverse =
        typeof (q as unknown as { reverse?: boolean }).reverse === "boolean"
          ? Boolean((q as unknown as { reverse?: boolean }).reverse)
          : false;

      const isStable = reverse ? pick === "A" : pick === "B";
      if (isStable) stableCount += 1;
    }

    if (answeredCount === 0) {
      return { scaledScore: 0, strength: "—", region: "—" };
    }

    const ratio = stableCount / answeredCount; // 0..1
    const score = clamp(ratioToScaled7(ratio), 1, 7);

    return {
      scaledScore: score,
      strength: strengthLabel(score),
      region: whereLies(score, leftLabel, rightLabel),
    };
  }, [questions, responses, traitKey, leftLabel, rightLabel]);

  // circle position across 7 boxes
  const indicatorLeftPct = scaledScore > 0 ? ((scaledScore - 0.5) / 7) * 100 : 0;

  return (
    <div className="w-full max-w-4xl mx-auto px-8 py-0">
      <div className="mt-2 relative">
        {/* Side labels */}
        <span className="absolute -left-3 top-2 -translate-y-1/2 text-[10px] font-bold text-gray-500">
          {leftLabel}
        </span>
        <span className="absolute right-2 top-2 -translate-y-1/2 text-[10px] font-bold text-gray-500">
          {rightLabel}
        </span>

        {/* shared width container for circle + boxes */}
        <div className="px-10">
          <div className="relative">
            {/* Circle */}
            {scaledScore > 0 && (
              <div
                className="absolute top-1/2 z-10"
                style={{
                  left: `${indicatorLeftPct}%`,
                  transform: "translate(-50%, -50%)",
                }}
              >
                <div className="w-5 h-5 rounded-full bg-gradient-to-r from-orange-400 to-pink text-white border-2 border-white text-xs flex items-center justify-center">
                  {scaledScore}
                </div>
              </div>
            )}

            {/* 7 gray boxes */}
            <div className="flex items-center gap-1">
              {Array.from({ length: 7 }).map((_, i) => (
                <div
                  key={i + 1}
                  className="h-4 flex-1 rounded-sm bg-slate-300"
                  aria-label={`score-segment-${i + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Labels row */}
          <div className="flex items-center mt-2">
            {QUAL_ROW.map((lab, i) => (
              <div
                key={`qual-${i}`}
                className="flex-1 text-center text-[9px] text-slate-500 leading-none"
              >
                {lab}
              </div>
            ))}
          </div>
        </div>

        {/* Meaning line */}
        {/* {scaledScore > 0 && (
          <div className="mt-1 px-6">
            <span className="text-[11px] font-bold text-slate-600 leading-tight">
              {region} • {strength}
            </span>
          </div>
        )} */}
      </div>
    </div>
  );
}
