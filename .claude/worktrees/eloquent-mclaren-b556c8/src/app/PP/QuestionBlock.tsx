"use client";
import React from "react";

export type Option = {
  label: string;
  value: number;
  textTranslation?: string;
};

export type Answer = {
  primaryTraitOverride: string | undefined;
  traitScores: string;
  id: string;
  optionKey: string;
  text: string;
  textTranslation?: string;
  scores: number;
  baseScoreValue: number;
};

export type QuestionData = {
  id: string;
  type: "likert" | "forced" | "sjt" | "text" | "select";
  text: string;
  textTranslation?: string;
  answers?: Answer[];
  options?: Option[];
  reverse?: boolean;
  primaryTrait?: string;
  formatWeight?: number;
  traitWeight?: number;
  sectionWeight?: number;
  skills?: string[];
  sectionA?: string[];
  sectionB?: string[];
};

type QuestionBlockProps = {
  questionData: QuestionData;
  questionIndex: number;
  selectedAnswerValue: string | number;
  onAnswerChange: (questionId: string, answerValue: string | number) => void;
};

// ✅ Reusable Urdu styling (Jameel Noori Nastaleeq via Tailwind font-urdu)
const urduText = "font-urdu leading-[1.9]";

function QuestionBlock({
  questionData,
  questionIndex,
  selectedAnswerValue,
  onAnswerChange,
}: QuestionBlockProps) {
  const { id: questionId, type, text, answers } = questionData;

  const [showTranslation, setShowTranslation] = React.useState(false); // Urdu off by default

  // ✅ Special renderer for Shape-1 pattern (frontend-only)
  const renderShape1Pattern = () => {
    return (
      <div className="w-full flex justify-center">
        {/* ✅ Responsive cell sizes (same design, just scales) */}
        <div className="grid grid-cols-3 border-2 border-black">
          <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 2xl:w-20 2xl:h-20 flex items-center justify-center border border-black text-xl sm:text-2xl">🟢</div>
          <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 2xl:w-20 2xl:h-20 flex items-center justify-center border border-black text-xl sm:text-2xl">🔺</div>
          <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 2xl:w-20 2xl:h-20 flex items-center justify-center border border-black text-xl sm:text-2xl">🟦</div>

          <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 2xl:w-20 2xl:h-20 flex items-center justify-center border border-black text-xl sm:text-2xl">🔺</div>
          <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 2xl:w-20 2xl:h-20 flex items-center justify-center border border-black text-xl sm:text-2xl">🟦</div>
          <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 2xl:w-20 2xl:h-20 flex items-center justify-center border border-black text-xl sm:text-2xl">🟢</div>

          <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 2xl:w-20 2xl:h-20 flex items-center justify-center border border-black text-xl sm:text-2xl">🟦</div>
          <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 2xl:w-20 2xl:h-20 flex items-center justify-center border border-black text-xl sm:text-2xl">🟢</div>
          <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 2xl:w-20 2xl:h-20 flex items-center justify-center border border-black text-xl sm:text-2xl"></div>
        </div>
      </div>
    );
  };

  // ✅ Frontend-only L-shape for shape2
  const renderShape2LShape = () => {
    return (
      <div className="w-full flex justify-center">
        {/* ✅ Responsive svg scaling (same L shape, just scales) */}
        <svg
          viewBox="0 0 220 180"
          className="block w-[180px] h-[150px] sm:w-[220px] sm:h-[180px] lg:w-[260px] lg:h-[210px] 2xl:w-[320px] 2xl:h-[260px]"
          aria-label="L-shape"
        >
          <path
            d="M40 10 L40 150 L200 150"
            fill="none"
            stroke="Red"
            strokeWidth="6"
            strokeLinecap="square"
            strokeLinejoin="miter"
          />
        </svg>
      </div>
    );
  };

  // ✅ Frontend-only pattern for shape3
  const renderShape3Pattern = () => {
    return (
      <div className="w-full flex justify-center">
        <div className="grid grid-cols-2 border-2 border-black">
          {/* ✅ Responsive cell sizes (same design) */}
          <div className="w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 2xl:w-24 2xl:h-24 flex items-center justify-center border border-black text-xl sm:text-2xl">🟢</div>
          <div className="w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 2xl:w-24 2xl:h-24 flex items-center justify-center border border-black text-xl sm:text-2xl">🟢</div>

          <div className="w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 2xl:w-24 2xl:h-24 flex items-center justify-center border border-black text-xl sm:text-2xl">🟢</div>
          <div className="w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 2xl:w-24 2xl:h-24 flex items-center justify-center border border-black text-xl sm:text-2xl">🟦</div>
        </div>
      </div>
    );
  };

  const renderAnswers = () => {
    switch (type) {
    case "likert":
    return (
    <div className="mt-4">
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {questionData.options?.map((option) => {
          const isSelected = selectedAnswerValue === option.value;
          return (
            <label
              key={option.value}
              className={` cursor-pointer select-none flex items-center justify-center h-9 sm:h-9 lg:h-9 2xl:h-10 rounded-lg
                text-[11px] sm:text-xs lg:text-xs 2xl:text-sm transition-all duration-200 px-2
                ${
                  isSelected
                  ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md scale-[1.03]"
                  : "bg-whitesmoke text-black hover:bg-blue-100"
                }
              `}
            >
            <input type="radio" name={`question-${questionId}`} value={option.value} checked={isSelected}
             onChange={() => onAnswerChange(questionId, option.value)} className="hidden"
            />

            <span className="text-center leading-tight">{option.label}</span>

            {showTranslation && option.textTranslation && (
            <span lang="ur" dir="rtl"
             className={`${urduText} text-[10px] sm:text-[10px] lg:text-[11px] 2xl:text-xs block mt-0.5 text-center`}
            >
             {option.textTranslation}
            </span>
          )}
          </label>
          );
        })}
      </div>
    </div>
  );

      case "forced":
      case "sjt":
        // ✅ Special case ONLY for shape1
        if (questionId === "shape1") {
          const emojiByOptionKey: Record<string, string> = { A: "🟢", B: "🟦", C: "🔺"};
        return (
        // ✅ Wrap on mobile, same layout on larger screens
        <div className="flex flex-wrap sm:flex-row gap-5 sm:gap-8 justify-center mt-2">
        {answers?.map((answer) => {
        const valueToStore = answer.optionKey;
        const emoji = emojiByOptionKey[answer.optionKey];

          return (
            <label key={valueToStore} className="cursor-pointer flex items-center gap-2">
              <input type="radio" name={`question-${questionId}`} value={valueToStore} 
              checked={selectedAnswerValue === valueToStore} onChange={() => onAnswerChange(questionId, valueToStore)}
              className="w-4 h-4 sm:w-3 sm:h-4 lg:w-4 lg:h-4 accent-Blue"
              />
              <div className="text-2xl sm:text-xl lg:text-2xl 2xl:text-3xl leading-none">{emoji}</div>
            </label>
        );
          })}
          </div>
        ); }

        // ✅ Special case ONLY for shape3 (same UI as shape1)
        if (questionId === "shape3") {
          const emojiByOptionKey: Record<string, string> = { A: "🟢", B: "🟦", C: "🔺"};
          return (
            <div className="flex flex-wrap sm:flex-row gap-5 sm:gap-8 justify-center mt-2">
              {answers?.map((answer) => {
                const valueToStore = answer.optionKey;
                const emoji = emojiByOptionKey[answer.optionKey];

                return (
                  <label key={valueToStore} className="cursor-pointer flex items-center gap-2">
                    <input type="radio" name={`question-${questionId}`} value={valueToStore}
                      checked={selectedAnswerValue === valueToStore} onChange={() => onAnswerChange(questionId, valueToStore)}
                      className="w-4 h-4 sm:w-4 sm:h-4 lg:w-4 lg:h-4 accent-green1"
                    />
                    <div className="text-2xl sm:text-2xl lg:text-2xl 2xl:text-3xl leading-none">{emoji}</div>
                  </label>
                );
              })}
            </div>
          );
        }

        // ✅ Default SJT/Forced rendering (same UI, only responsive text sizes)
        return answers?.map((answer) => {
          const valueToStore = answer.id || answer.optionKey;

          return (
            <label key={valueToStore} className="answer-label block mb-3 sm:mb-2 cursor-pointer">
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={`question-${questionId}`}
                    value={valueToStore}
                    checked={selectedAnswerValue === valueToStore}
                    onChange={() => onAnswerChange(questionId, valueToStore)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm  lg:text-sm 2xl:text-base font-medium">
                    {answer.text}
                  </span>
                </div>

                {/* ✅ Urdu below English when ON */}
                {showTranslation && answer.textTranslation && (
                  <div
                    lang="ur"
                    dir="rtl"
                    className={`${urduText} px-8 text-lg sm:text-base lg:text-base 2xl:text-xl text-left text-black font-bold animate-fadeInUp`}
                  >
                    {answer.textTranslation}
                  </div>
                )}
              </div>
            </label>
          );
        });

      case "text":
        return (
          <input
            type="text"
            placeholder={text}
            value={String(selectedAnswerValue || "")}
            onChange={(e) => onAnswerChange(questionId, e.target.value)}
            className="w-full border border-gray px-3 py-2 text-sm sm:text-xs lg:text-sm 2xl:text-base"
          />
        );

      case "select":
        return (
          <select
            value={String(selectedAnswerValue || "")}
            onChange={(e) => onAnswerChange(questionId, e.target.value)}
            className="w-full border border-gray px-3 py-2 text-sm sm:text-xs lg:text-sm 2xl:text-base"
          >
            <option value="">Select...</option>
            {questionData.options?.map((option) => (
              <option key={option.value} value={option.label}>
                {option.label}
              </option>
            ))}
          </select>
        );

      default:
        return <p>Unknown question type</p>;
    }
  };

  return (
    // ✅ Responsive spacing (same structure)
    <div className="mb-6 sm:mb-4 lg:mb-6 2xl:mb-8">
      {/* ✅ Toggle Button */}
      <div className="flex items-center mb-1 sm:mb-1 -mt-3">
        <label className="inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={showTranslation}
            onChange={() => setShowTranslation((prev) => !prev)}
          />
          <div
            className="relative w-11 h-6 bg-green1 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-gray2 rounded-full peer
             dark:bg-gray peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full after:content-[''] after:absolute after:top-[2px]
             after:start-[2px] after:bg-white after:border-gray after:border after:rounded-full after:h-5 after:w-5 after:transition-all
             peer-checked:bg-gradient-to-r from-[#00838F] to-pink"
          ></div>

          <span className="ms-2 text-black text-xl sm:text-sm lg:text-base 2xl:text-lg font-bold">
            {showTranslation ? (
              <span lang="ur" dir="rtl" className={urduText}>
                اردو
              </span>
            ) : (
              "English"
            )}
          </span>
        </label>
      </div>

      {/* ✅ Question Text */}
      <div>
        <h6 className="text-sm sm:text-sm lg:text-sm 2xl:text-xl font-medium -sm:mb-1">
          {questionIndex + 1}. {text}
        </h6>

        {/* ✅ Frontend Patterns */}
        {questionId === "shape1" && renderShape1Pattern()}
        {questionId === "shape2" && renderShape2LShape()}
        {questionId === "shape3" && renderShape3Pattern()}

        {/* ✅ Urdu question translation */}
        {showTranslation && questionData.textTranslation && (
          <h6
            lang="ur"
            dir="rtl"
            className={`${urduText} text-base sm:text-base lg:text-lg 2xl:text-2xl font-semibold mb-2 sm:mb-1 text-left text-black animate-fadeInUp`}
          >
            {questionData.textTranslation}
          </h6>
        )}
      </div>

      {renderAnswers()}
    </div>
  );
}

export default QuestionBlock;
