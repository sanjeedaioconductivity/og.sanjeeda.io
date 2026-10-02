"use client";

import React, { useState } from "react";

type MCQQuestion = {
  id: string;
  section: "numbers" | "words" | "shapes";
  text: string;
  options: string[];
  correctIndex: number;
};

type LikertQuestion = {
  id: string;
  dimension: "people" | "data" | "things";
  text: string;
};

type AttributeScore = {
  label: string;
  value: number;
  group: "Ability" | "Interest";
};

// ----- DATA: QUESTIONS -----

const mcqQuestions: MCQQuestion[] = [
  // --- Working With Numbers ---
  {
    id: "num1",
    section: "numbers",
    text: "1. What is 27 × 14?",
    options: ["378", "356", "410", "298"],
    correctIndex: 0, // 378
  },
  {
    id: "num2",
    section: "numbers",
    text:
      "2. A product costs 480 after a 20% discount. What was the original price?",
    options: ["520", "560", "600", "640"],
    correctIndex: 2, // 600
  },
  {
    id: "num3",
    section: "numbers",
    text: "3. What comes next in the series: 4, 9, 16, 25, __ ?",
    options: ["36", "30", "28", "45"],
    correctIndex: 0, // 36
  },
  {
    id: "num4",
    section: "numbers",
    text:
      "4. A train travels 240 km in 3 hours. What is its average speed (km/h)?",
    options: ["60", "70", "75", "80"],
    correctIndex: 3, // 80 km/h
  },

  // --- Working With Words ---
  {
    id: "word1",
    section: "words",
    text: "1. Select the correctly spelled word.",
    options: ["Acommodate", "Accommodate", "Acomodate", "Acommadate"],
    correctIndex: 1, // Accommodate
  },
  {
    id: "word2",
    section: "words",
    text: "2. Which word is spelled correctly?",
    options: ["Definately", "Definitly", "Definitely", "Definate"],
    correctIndex: 2, // Definitely
  },
  {
    id: "word3",
    section: "words",
    text:
      "3. Choose the correct word to complete the sentence: “The CEO delivered an _____ message.”",
    options: ["inspirashun", "inspiration", "inspirition", "inspirational"],
    correctIndex: 3, // inspirational
  },
  {
    id: "word4",
    section: "words",
    text: "4. Select the correct synonym for ‘expand’.",
    options: ["Contract", "Reduce", "Enlarge", "Limit"],
    correctIndex: 2, // Enlarge
  },

  // --- Working With Shapes ---
  {
    id: "shape1",
    section: "shapes",
    text:
      "1. Which option completes the pattern? (Align this key with the visual question you insert.)",
    options: ["Circle", "Triangle", "Square", "Diamond"],
    correctIndex: 0, // assume circle is correct in your pattern
  },
  {
    id: "shape2",
    section: "shapes",
    text:
      "2. Which option shows the correct rotation of the target shape? (Based on your image key.)",
    options: [
      "Rotated 90° clockwise",
      "Rotated 180°",
      "Rotated 270° clockwise",
      "Same as target",
    ],
    correctIndex: 0, // you can change based on your final image
  },
  {
    id: "shape3",
    section: "shapes",
    text: "3. Which shape does NOT belong in the group?",
    options: ["Shape 1", "Shape 2", "Shape 3", "Shape 4"],
    correctIndex: 3, // e.g. Shape 4 is the odd one out
  },
  {
    id: "shape4",
    section: "shapes",
    text:
      "4. Choose the correct mirror image of the target shape (left-facing triangle).",
    options: [
      "Horizontally flipped",
      "Vertically flipped",
      "Rotated 180°",
      "Same as target",
    ],
    correctIndex: 0, // Horizontally flipped
  },
];

const likertQuestions: LikertQuestion[] = [
  // --- Working With People ---
  {
    id: "p1",
    dimension: "people",
    text: "I enjoy helping others solve problems.",
  },
  {
    id: "p2",
    dimension: "people",
    text: "I prefer tasks that require teamwork and communication.",
  },
  {
    id: "p3",
    dimension: "people",
    text: "I feel energized when interacting with different types of people.",
  },

  // --- Working With Data ---
  {
    id: "d1",
    dimension: "data",
    text: "I enjoy analyzing information to identify patterns or insights.",
  },
  {
    id: "d2",
    dimension: "data",
    text: "I prefer roles where accuracy and data handling are essential.",
  },
  {
    id: "d3",
    dimension: "data",
    text: "I like working with spreadsheets, statistics, or reports.",
  },

  // --- Working With Things ---
  {
    id: "t1",
    dimension: "things",
    text: "I enjoy hands-on tasks involving tools, machines, or physical objects.",
  },
  {
    id: "t2",
    dimension: "things",
    text: "I prefer practical, real-world tasks over abstract ideas.",
  },
  {
    id: "t3",
    dimension: "things",
    text: "I like assembling, organizing, or fixing equipment.",
  },
];

// ----- HELPERS -----

const scaleTo10 = (correct: number, total: number): number => {
  if (total === 0) return 0;
  const raw = (correct / total) * 10;
  return Math.round(raw); // 0–10
};

const scaleLikertAvgTo10 = (avg: number | null): number => {
  if (avg === null) return 0;
  // avg is between 1 and 5; map to 1–10
  const raw = ((avg - 1) / 4) * 9 + 1;
  return Math.round(raw); // 1–10
};

// ----- COMPONENT -----

export default function QuestionnairePage() {
  const [mcqAnswers, setMcqAnswers] = useState<Record<string, number | null>>(
    {}
  );
  const [likertAnswers, setLikertAnswers] = useState<
    Record<string, number | null>
  >({});
  const [attributes, setAttributes] = useState<AttributeScore[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleMCQChange = (id: string, optionIndex: number) => {
    setMcqAnswers((prev) => ({ ...prev, [id]: optionIndex }));
  };

  const handleLikertChange = (id: string, value: number) => {
    setLikertAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = () => {
    // Basic validation: ensure all answered
    const unansweredMCQ = mcqQuestions.some(
      (q) => mcqAnswers[q.id] === undefined || mcqAnswers[q.id] === null
    );
    const unansweredLikert = likertQuestions.some(
      (q) => likertAnswers[q.id] === undefined || likertAnswers[q.id] === null
    );

    if (unansweredMCQ || unansweredLikert) {
      setError("Please answer all questions before viewing results.");
      setAttributes(null);
      return;
    }

    setError(null);

    // Count correct per ability section
    const numbersQuestions = mcqQuestions.filter(
      (q) => q.section === "numbers"
    );
    const wordsQuestions = mcqQuestions.filter((q) => q.section === "words");
    const shapesQuestions = mcqQuestions.filter((q) => q.section === "shapes");

    const correctNumbers = numbersQuestions.filter((q) => {
      const ans = mcqAnswers[q.id];
      return ans === q.correctIndex;
    }).length;

    const correctWords = wordsQuestions.filter((q) => {
      const ans = mcqAnswers[q.id];
      return ans === q.correctIndex;
    }).length;

    const correctShapes = shapesQuestions.filter((q) => {
      const ans = mcqAnswers[q.id];
      return ans === q.correctIndex;
    }).length;

    const numbersScore = scaleTo10(correctNumbers, numbersQuestions.length);
    const wordsScore = scaleTo10(correctWords, wordsQuestions.length);
    const shapesScore = scaleTo10(correctShapes, shapesQuestions.length);

    // Interests: compute average per dimension (1–5) then scale to 1–10
    const byDim: Record<
      "people" | "data" | "things",
      { sum: number; count: number }
    > = {
      people: { sum: 0, count: 0 },
      data: { sum: 0, count: 0 },
      things: { sum: 0, count: 0 },
    };

    likertQuestions.forEach((q) => {
      const val = likertAnswers[q.id];
      if (val != null) {
        byDim[q.dimension].sum += val;
        byDim[q.dimension].count += 1;
      }
    });

    const peopleAvg =
      byDim.people.count > 0 ? byDim.people.sum / byDim.people.count : null;
    const dataAvg =
      byDim.data.count > 0 ? byDim.data.sum / byDim.data.count : null;
    const thingsAvg =
      byDim.things.count > 0 ? byDim.things.sum / byDim.things.count : null;

    const peopleScore = scaleLikertAvgTo10(peopleAvg);
    const dataScore = scaleLikertAvgTo10(dataAvg);
    const thingsScore = scaleLikertAvgTo10(thingsAvg);

    const computedAttributes: AttributeScore[] = [
      { label: "Working With Numbers", value: numbersScore, group: "Ability" },
      { label: "Working With Words", value: wordsScore, group: "Ability" },
      { label: "Working With Shapes", value: shapesScore, group: "Ability" },
      { label: "Working With People", value: peopleScore, group: "Interest" },
      { label: "Working With Data", value: dataScore, group: "Interest" },
      { label: "Working With Things", value: thingsScore, group: "Interest" },
    ];

    setAttributes(computedAttributes);
  };

  // Group MCQs by section for nicer layout
  const numbersMCQs = mcqQuestions.filter((q) => q.section === "numbers");
  const wordsMCQs = mcqQuestions.filter((q) => q.section === "words");
  const shapesMCQs = mcqQuestions.filter((q) => q.section === "shapes");

  return (
    <div className="page">
      <h1 className="title">Abilities & Interests Assessment</h1>

      <section className="card">
        <h2>Section A: Abilities</h2>

        <div className="subsection">
          <h3>Working With Numbers</h3>
          {numbersMCQs.map((q) => (
            <div key={q.id} className="question-block">
              <p className="question-text">{q.text}</p>
              <div className="options">
                {q.options.map((opt, idx) => (
                  <label key={idx} className="option">
                    <input
                      type="radio"
                      name={q.id}
                      value={idx}
                      checked={mcqAnswers[q.id] === idx}
                      onChange={() => handleMCQChange(q.id, idx)}
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="subsection">
          <h3>Working With Words</h3>
          {wordsMCQs.map((q) => (
            <div key={q.id} className="question-block">
              <p className="question-text">{q.text}</p>
              <div className="options">
                {q.options.map((opt, idx) => (
                  <label key={idx} className="option">
                    <input
                      type="radio"
                      name={q.id}
                      value={idx}
                      checked={mcqAnswers[q.id] === idx}
                      onChange={() => handleMCQChange(q.id, idx)}
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="subsection">
          <h3>Working With Shapes</h3>
          <p className="hint">
            (Connect each question with the corresponding visual you show in
            your Word / test platform.)
          </p>
          {shapesMCQs.map((q) => (
            <div key={q.id} className="question-block">
              <p className="question-text">{q.text}</p>
              <div className="options">
                {q.options.map((opt, idx) => (
                  <label key={idx} className="option">
                    <input
                      type="radio"
                      name={q.id}
                      value={idx}
                      checked={mcqAnswers[q.id] === idx}
                      onChange={() => handleMCQChange(q.id, idx)}
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <h2>Section B: Motivation / Interests</h2>
        <p className="hint">
          Please rate each statement from Strongly Disagree (1) to Strongly
          Agree (5).
        </p>

        <div className="subsection">
          <h3>Working With People</h3>
          {likertQuestions
            .filter((q) => q.dimension === "people")
            .map((q) => (
              <div key={q.id} className="question-block">
                <p className="question-text">{q.text}</p>
                <div className="options">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <label key={val} className="option">
                      <input
                        type="radio"
                        name={q.id}
                        value={val}
                        checked={likertAnswers[q.id] === val}
                        onChange={() => handleLikertChange(q.id, val)}
                      />
                      <span>
                        {val} –{" "}
                        {val === 1
                          ? "Strongly Disagree"
                          : val === 2
                          ? "Disagree"
                          : val === 3
                          ? "Neutral"
                          : val === 4
                          ? "Agree"
                          : "Strongly Agree"}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
        </div>

        <div className="subsection">
          <h3>Working With Data</h3>
          {likertQuestions
            .filter((q) => q.dimension === "data")
            .map((q) => (
              <div key={q.id} className="question-block">
                <p className="question-text">{q.text}</p>
                <div className="options">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <label key={val} className="option">
                      <input
                        type="radio"
                        name={q.id}
                        value={val}
                        checked={likertAnswers[q.id] === val}
                        onChange={() => handleLikertChange(q.id, val)}
                      />
                      <span>
                        {val} –{" "}
                        {val === 1
                          ? "Strongly Disagree"
                          : val === 2
                          ? "Disagree"
                          : val === 3
                          ? "Neutral"
                          : val === 4
                          ? "Agree"
                          : "Strongly Agree"}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
        </div>

        <div className="subsection">
          <h3>Working With Things</h3>
          {likertQuestions
            .filter((q) => q.dimension === "things")
            .map((q) => (
              <div key={q.id} className="question-block">
                <p className="question-text">{q.text}</p>
                <div className="options">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <label key={val} className="option">
                      <input
                        type="radio"
                        name={q.id}
                        value={val}
                        checked={likertAnswers[q.id] === val}
                        onChange={() => handleLikertChange(q.id, val)}
                      />
                      <span>
                        {val} –{" "}
                        {val === 1
                          ? "Strongly Disagree"
                          : val === 2
                          ? "Disagree"
                          : val === 3
                          ? "Neutral"
                          : val === 4
                          ? "Agree"
                          : "Strongly Agree"}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
        </div>
      </section>

      <button className="submit-btn" onClick={handleSubmit}>
        Calculate Results
      </button>

      {error && <p className="error">{error}</p>}

      {attributes && (
        <section className="card">
          <h2>Results: Attribute Profile</h2>
          <p className="hint">
            Scores are shown on a 0–10 scale. Bars visually represent strength
            for each attribute, similar to your report image.
          </p>
          <div className="attributes">
            {attributes.map((attr) => (
              <div key={attr.label} className="attribute-row">
                <div className="attribute-label">
                  {attr.label}{" "}
                  <span className="badge">{attr.group.toUpperCase()}</span>
                </div>
                <div className="bar-wrapper">
                  <div className="bar-bg">
                    <div
                      className="bar-fill"
                      style={{ width: `${attr.value * 10}%` }}
                    />
                  </div>
                  <div className="bar-value">{attr.value}/10</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <style jsx>{`
        .page {
          max-width: 900px;
          margin: 0 auto;
          padding: 2rem 1rem 4rem;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
            sans-serif;
        }

        .title {
          text-align: center;
          margin-bottom: 2rem;
        }

        .card {
          background: #ffffff;
          border-radius: 12px;
          padding: 1.5rem 1.75rem;
          margin-bottom: 1.5rem;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
          border: 1px solid #eef1f4;
        }

        h2 {
          margin-bottom: 0.75rem;
        }

        h3 {
          margin-top: 1.25rem;
          margin-bottom: 0.5rem;
        }

        .subsection {
          margin-bottom: 1rem;
        }

        .question-block {
          margin-bottom: 0.85rem;
        }

        .question-text {
          margin: 0 0 0.4rem 0;
          font-weight: 500;
        }

        .options {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .option {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          font-size: 0.95rem;
        }

        .option input {
          accent-color: #16a34a;
        }

        .hint {
          font-size: 0.85rem;
          color: #6b7280;
          margin-bottom: 0.5rem;
        }

        .submit-btn {
          display: inline-block;
          margin-top: 0.5rem;
          margin-bottom: 1rem;
          padding: 0.75rem 1.5rem;
          border-radius: 999px;
          border: none;
          background: #16a34a;
          color: white;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 10px 20px rgba(22, 163, 74, 0.25);
          transition: transform 0.08s ease, box-shadow 0.08s ease,
            background 0.12s ease;
        }

        .submit-btn:hover {
          background: #15803d;
          transform: translateY(-1px);
          box-shadow: 0 14px 24px rgba(22, 163, 74, 0.35);
        }

        .submit-btn:active {
          transform: translateY(0);
          box-shadow: 0 8px 16px rgba(22, 163, 74, 0.25);
        }

        .error {
          color: #b91c1c;
          margin-bottom: 1rem;
          font-weight: 500;
        }

        .attributes {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .attribute-row {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .attribute-label {
          font-size: 0.95rem;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }

        .badge {
          font-size: 0.7rem;
          text-transform: uppercase;
          padding: 0.1rem 0.4rem;
          border-radius: 999px;
          background: #e5f9ef;
          color: #15803d;
          border: 1px solid #bbf7d0;
        }

        .bar-wrapper {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .bar-bg {
          flex: 1;
          height: 14px;
          border-radius: 999px;
          background: #e5e7eb;
          overflow: hidden;
        }

        .bar-fill {
          height: 100%;
          background: #16a34a;
          transition: width 0.3s ease;
        }

        .bar-value {
          width: 60px;
          text-align: right;
          font-size: 0.85rem;
          color: #374151;
        }
      `}</style>
    </div>
  );
}