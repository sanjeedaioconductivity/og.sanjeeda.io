"use client";
import React, { useMemo } from "react";
import type { QuestionData, Answer } from "../../QuestionBlock";

type WorkingWithWordsScoreProps = {
  questions: QuestionData[];
  responses: Record<string, string | number | undefined>;
};

const CORRECT_OPTION_KEY_BY_ID: Record<string, string> = {
  word1: "B", word2: "C", word3: "B", word4: "C",
//Accommodate, //Definitely, //inspirational, //Enlarge
};

function getSelectedOptionKey(
  q: QuestionData,
  selectedValue: string | number | undefined
): string | undefined {
  if (selectedValue === undefined || selectedValue === null || !q.answers) {
    return undefined;
  }

  const byId = q.answers.find((a: Answer) => a.id === selectedValue);
  if (byId?.optionKey) return byId.optionKey;

  const byOptionKey = q.answers.find(
    (a: Answer) => a.optionKey === selectedValue
  );
  if (byOptionKey?.optionKey) return byOptionKey.optionKey;

  const byText = q.answers.find((a: Answer) => a.text === selectedValue);
  return byText?.optionKey;
}

const WorkingWithWordsScore: React.FC<WorkingWithWordsScoreProps> = ({
  questions,
  responses,
}) => {
  const workingWithWordsQs = useMemo(() => {
    return questions.filter(
      (q: QuestionData) => q.primaryTrait === "Working with Words"
    );
  }, [questions]);

  const totalQuestions = workingWithWordsQs.length || 4;

  const { scaledScore } = useMemo(() => {
    let correct = 0;

    for (const q of workingWithWordsQs) {
      const selected = responses[q.id];
      if (selected === undefined || selected === null || selected === "") {
        continue;
      }

      const selectedKey = getSelectedOptionKey(q, selected);
      const correctKey = CORRECT_OPTION_KEY_BY_ID[q.id];

      if (selectedKey && correctKey && selectedKey === correctKey) {
        correct += 1;
      }
    }

    const ratio = totalQuestions > 0 ? correct / totalQuestions : 0;
    const scaled = Math.round(1 + ratio * 9); // 1..10

    return {
      correctCount: correct,
      scaledScore: scaled,
    };
  }, [workingWithWordsQs, responses, totalQuestions]);

  // ✅ Align circle to segment centers
  const indicatorLeftPct = ((scaledScore - 0.5) / 10) * 100;

 return (
 <div className="w-full max-w-2xl mx-auto px-2 py-0">
    
    {/* Header */}
    <div className="flex items-center justify-between">
      <h1 className="mb-1 text-[12px] font-semibold text-gray-700 leading-none"> Working with Words</h1>
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

export default WorkingWithWordsScore;