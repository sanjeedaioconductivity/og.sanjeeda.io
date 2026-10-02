type Attribute = { leftLabel: string; rightLabel: string; score: number;};

const attributes: Attribute[] = [
  { leftLabel: "Analytical Thinking", rightLabel: "Quick Thinking", score: 7,},
  { leftLabel: "Adaptability", rightLabel: "Adheres to Experience", score: 6,},
  { leftLabel: "Detail-Oriented", rightLabel: "Bird-eye view", score: 5,},
  { leftLabel: "Team Collaboration", rightLabel: "Independent", score: 8,},
  { leftLabel: "Customer Services Orientation", rightLabel: "Task-Driven", score: 7,},
  { leftLabel: "Reliability", rightLabel: "Flexible", score: 8,},
  { leftLabel: "Proactiveness", rightLabel: "Reactive", score: 6,},
];

export default function AttributeFitness() {
  return (
    <div className="space-y-1">
      {attributes.map((a) => (
        <div key={`${a.leftLabel}-${a.rightLabel}`} className="flex items-start justify-between gap-2 px-8">
          <div className="w-full">
            {/* Score Scale */}
            <div className="flex items-center justify-between gap-5 text-xs text-slate-600">
              <span className="truncate text-left text-black">{a.leftLabel}</span>
              <span className="truncate text-right text-black">{a.rightLabel}</span>
            </div>

            <div className="mt-2 flex items-center gap-1">
              {Array.from({ length: 10 }).map((_, i) => {
                const n = i + 1;
                const selected = n <= a.score;

                return (
                  <div
                    key={n}
                    className={[
                      "flex h-7 w-7 items-center justify-center rounded-md border text-xs font-medium",
                      selected
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-white text-slate-700",
                    ].join(" ")}
                    title={`${n}`}
                  >
                    {n}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}