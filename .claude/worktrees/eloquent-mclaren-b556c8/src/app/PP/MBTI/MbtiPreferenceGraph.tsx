"use client";

type MbtiRow = {
  leftLabel: string;
  rightLabel: string;
  leftPct: number;  // 0..100 (strength on LEFT side)
  rightPct: number; // 0..100 (strength on RIGHT side)
};

const TEAL = "#749c9e";
const TEAL_DARK = "#5f8688";
const WEAK = "#d9d9d9";
const WEAK_DARK = "#cfcfcf";

function clampPct(v: number) {
  return Math.max(0, Math.min(100, v));
}

type Tick = { pct: number };

const TICKS: Tick[] = [
  { pct: 0 },
  { pct: 12.5 },
  { pct: 25 },
  { pct: 37.5 },
  { pct: 50 },
  { pct: 62.5 },
  { pct: 75 },
  { pct: 87.5 },
  { pct: 100 },
];

const AXIS_LABELS = ["100%", "75%", "50%", "25%", "0%", "25%", "50%", "75%", "100%"];

export default function MbtiPreferenceGraph({ rows }: { rows: MbtiRow[] }) {
  return (
    <div className="w-full">
      {/* Legend */}
      <div className="mb-2 flex items-center justify-center gap-4 text-xs text-slate-700">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: TEAL }} />
          Stronger
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-sm border border-slate-300 bg-white" />
          Weaker
        </div>
      </div>

      {/* Rows */}
      <div className="space-y-[2px]">
        {rows.map((r) => {
          const leftPct = clampPct(r.leftPct);
          const rightPct = clampPct(r.rightPct);

          const leftStrong = leftPct > rightPct;
          const rightStrong = rightPct > leftPct;
          const tie = leftPct === rightPct;

          const leftBg =
            tie || leftStrong
              ? `linear-gradient(to bottom, ${TEAL}, ${TEAL_DARK})`
              : `linear-gradient(to bottom, ${WEAK}, ${WEAK_DARK})`;

          const rightBg =
            tie || rightStrong
              ? `linear-gradient(to bottom, ${TEAL}, ${TEAL_DARK})`
              : `linear-gradient(to bottom, ${WEAK}, ${WEAK_DARK})`;

          // ✅ each side max occupies 50% of total bar
          const leftWidthPctOfFullBar = leftPct / 2;   // 0..50
          const rightWidthPctOfFullBar = rightPct / 2; // 0..50

          // % label placement near OUTER end (avoid center collision)
          const leftLabelLeft =
            leftPct < 18 ? "calc(50% - 6px)" : `calc(50% - ${leftWidthPctOfFullBar}% + 8px)`;
          const rightLabelLeft =
            rightPct < 18 ? "calc(50% + 6px)" : `calc(50% + ${rightWidthPctOfFullBar}% - 8px)`;

          const leftLabelTransform = leftPct < 18 ? "translate(-100%, -50%)" : "translate(0, -50%)";
          const rightLabelTransform = rightPct < 18 ? "translate(0, -50%)" : "translate(-100%, -50%)";

          const leftBadgeText = tie || leftStrong ? "text-white" : "text-slate-900";
          const rightBadgeText = tie || rightStrong ? "text-white" : "text-slate-900";

          return (
            <div
              key={`${r.leftLabel}-${r.rightLabel}`}
              className="
                grid items-center
                gap-0
                grid-cols-[76px_1fr_76px]
                sm:grid-cols-[92px_1fr_92px]
              "
            >
              {/* ✅ Left label SUPER close to bar */}
              <div className="pr-1 text-right text-xs font-semibold text-slate-900 leading-none">
                {r.leftLabel}
              </div>

              {/* Bar area */}
              <div className="relative h-10 w-full rounded-sm bg-white">
                {/* ticks */}
                {TICKS.map((t) => (
                  <div
                    key={t.pct}
                    className={
                      t.pct === 50
                        ? "absolute top-0 h-full w-[2px] bg-slate-500/80"
                        : "absolute top-0 h-full w-px bg-slate-900/10"
                    }
                    style={{
                      left: `${t.pct}%`,
                      transform: t.pct === 0 ? "translateX(0)" : "translateX(-50%)",
                    }}
                    aria-hidden="true"
                  />
                ))}

                {/* LEFT bar (center -> left) */}
                <div
                  className="absolute top-1/2 h-7 -translate-y-1/2 rounded-sm shadow-sm"
                  style={{
                    right: "50%",
                    width: `${leftWidthPctOfFullBar}%`,
                    background: leftBg,
                  }}
                />

                {/* RIGHT bar (center -> right) */}
                <div
                  className="absolute top-1/2 h-7 -translate-y-1/2 rounded-sm shadow-sm"
                  style={{
                    left: "50%",
                    width: `${rightWidthPctOfFullBar}%`,
                    background: rightBg,
                  }}
                />

                {/* Percent badges */}
                <div
                  className={`pointer-events-none absolute top-1/2 rounded px-1 py-[1px] text-[10px] font-bold ${leftBadgeText}`}
                  style={{
                    left: leftLabelLeft,
                    transform: leftLabelTransform,
                  }}
                >
                  {Math.round(leftPct)}%
                </div>

                <div
                  className={`pointer-events-none absolute top-1/2 rounded px-1 py-[1px] text-[10px] font-bold ${rightBadgeText}`}
                  style={{
                    left: rightLabelLeft,
                    transform: rightLabelTransform,
                  }}
                >
                  {Math.round(rightPct)}%
                </div>
              </div>

              {/* ✅ Right label SUPER close to bar */}
              <div className="pl-1 text-left text-xs font-semibold text-slate-900 leading-none">
                {r.rightLabel}
              </div>
            </div>
          );
        })}
      </div>

      {/* X-axis aligned under bar column only */}
      <div
        className="
          mt-2 grid items-start
          gap-0
          grid-cols-[76px_1fr_76px]
          sm:grid-cols-[92px_1fr_92px]
        "
      >
        <div />
        <div className="flex w-full justify-between text-[10px] text-slate-600 tabular-nums">
          {AXIS_LABELS.map((t, i) => (
            <span key={`${t}-${i}`} className="whitespace-nowrap">
              {t}
            </span>
          ))}
        </div>
        <div />
      </div>
    </div>
  );
}
