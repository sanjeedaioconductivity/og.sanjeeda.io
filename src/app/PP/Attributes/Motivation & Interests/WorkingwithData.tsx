"use client";
import React, { useMemo } from "react";
import type { QuestionData } from "../../QuestionBlock";

type WorkingWithDataScoreProps = {
  questions: QuestionData[];
  responses: Record<string, string | number | undefined>;
};

const WorkingWithDataScore: React.FC<WorkingWithDataScoreProps> = ({
  questions,
 responses,
}) => {
  const dataQs = useMemo(() => {
    return questions.filter(
      (q: QuestionData) =>
        q.primaryTrait === "Working with Data" && q.type === "likert"
    );
  }, [questions]);

  // const totalQuestions = dataQs.length || 3;

  const { scaledScore } = useMemo(() => {
    let sum = 0;
    let count = 0;

    for (const q of dataQs) {
      const v = responses[q.id];
      if (v === undefined || v === null || v === "") continue;

      const num = Number(v);
      if (!isNaN(num)) {
        sum += num;
        count += 1;
      }
    }

    const avg = count > 0 ? sum / count : 0;
    const ratio = avg > 0 ? (avg - 1) / 4 : 0;
    const scaled = Math.round(1 + ratio * 9);

    return { avgLikert: avg, scaledScore: scaled };
  }, [dataQs, responses]);

  const indicatorLeftPct = ((scaledScore - 0.5) / 10) * 100;

 return (
 <div className="w-full max-w-2xl mx-auto px-2 py-0">
    
    {/* Header */}
    <div className="flex items-center justify-between">
      <h1 className="mb-1 text-[12px] font-semibold text-gray-700 leading-none"> Working with Data</h1>
      <div className="mb-3 flex flex-col items-end">
        <span className="text-2xl font-bold text-sky-700 leading-none">
          {scaledScore}
        </span>
      </div>
    </div>

      {/* Bar area */}
    <div className="mt-0 relative">
      <span className="absolute left-0 top-[6px] -translate-y-1/2 text-[10px] font-bold  text-gray-500"> Low</span>
      <span className="absolute right-0 top-[6px] -translate-y-1/2 text-[10px] font-bold text-gray-500"> High</span>

      {/* ✅ IMPORTANT: everything aligned inside SAME padding */}
      <div className="relative px-6">
      {/* Indicator (aligned with segments width now) */}
      <div className="absolute z-20" style={{ left: `${indicatorLeftPct}%`, top: "6px", transform: "translate(-50%, -50%)", }}> </div>

      {/* Segments */}
      <div className="flex items-center gap-1">
        {Array.from({ length: 10 }).map((_, i) => {
          const index = i + 1;
          const isFilled = index <= scaledScore;
          return (
          <div key={index} className={[ "h-3 flex-1 rounded-sm transition-all duration-300",
           isFilled ? "bg-gradient-to-r from-orange-400 to-pink" : "bg-slate-300",
           ].join(" ")}
          />
         );
        })}
      </div>

      {/* Scale numbers */}
      <div className="flex items-center gap-1 mt-1">
      {Array.from({ length: 10 }).map((_, i) => {
        const index = i + 1;
        return (
        <div key={`scale-${index}`} className="flex-1 text-center text-[10px] text-black font-bold">{index}</div>
        );
        })}
      </div>

        </div>
      </div>
    </div>
  );};
export default WorkingWithDataScore;