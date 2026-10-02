"use client";

import React from "react";
import { Chart as ChartJS, ArcElement, Tooltip, type Plugin } from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip);

interface DISCCircularProps {
  chartData: {
    labels: string[];
    data: number[]; // scores (0-5) (do NOT change calculation)
  };
}

/** Keep your DISC colors */
const COLORS = [
  "#16a34a", // Dominance
  "#3b82f6", // Influence
  "#f97316", // Steadiness
  "#9333ea", // Compliance
];

function clamp(n: number, min = 0, max = 255) {
  return Math.max(min, Math.min(max, n));
}
function hexToRgb(hex: string) {
  const clean = hex.replace("#", "").trim();
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const num = parseInt(full, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}
function rgbToHex(r: number, g: number, b: number) {
  const to2 = (v: number) => clamp(v).toString(16).padStart(2, "0");
  return `#${to2(r)}${to2(g)}${to2(b)}`;
}
function shade(hex: string, pct: number) {
  const { r, g, b } = hexToRgb(hex);
  const t = pct < 0 ? 0 : 255;
  const p = Math.abs(pct);
  return rgbToHex(
    Math.round((t - r) * p + r),
    Math.round((t - g) * p + g),
    Math.round((t - b) * p + b)
  );
}

/**
 * ✅ 3D look for rings:
 * - adds subtle shadow + highlight arc on the colored segment (per ring)
 * - does NOT change data/calculations
 */
const disc3DPlugin: Plugin<"doughnut"> = {
  id: "disc3DPlugin",
  afterDatasetsDraw(chart) {
    const { ctx } = chart;

    ctx.save();
    // allow drawing outside chartArea a bit (shadow/highlight)
    ctx.beginPath();
    ctx.rect(0, 0, chart.width, chart.height);
    ctx.clip();

    chart.data.datasets.forEach((ds, dsIndex) => {
      const meta = chart.getDatasetMeta(dsIndex);
      const arc = meta.data?.[0] as any; // colored segment is data[0]

      if (!arc) return;

      const props = arc.getProps(
        ["x", "y", "startAngle", "endAngle", "innerRadius", "outerRadius", "circumference"],
        true
      );

      const x = props.x as number;
      const y = props.y as number;
      const startAngle = props.startAngle as number;
      const endAngle = props.endAngle as number;
      const innerRadius = props.innerRadius as number;
      const outerRadius = props.outerRadius as number;

      // If value is 0, endAngle == startAngle (no colored arc)
      if (Math.abs(endAngle - startAngle) < 0.0001) return;

      const baseColor =
        (Array.isArray((ds as any).backgroundColor) ? (ds as any).backgroundColor[0] : undefined) ||
        COLORS[dsIndex % COLORS.length];

      // --- Shadow (gives lift) ---
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.18)";
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 3;
      ctx.shadowOffsetY = 3;

      ctx.beginPath();
      ctx.arc(x, y, outerRadius, startAngle, endAngle);
      ctx.arc(x, y, innerRadius, endAngle, startAngle, true);
      ctx.closePath();
      ctx.fillStyle = "rgba(0,0,0,0.08)";
      ctx.fill();
      ctx.restore();

      // --- Highlight band (3D shine) ---
      const highlightColor = shade(baseColor, 0.25);
      ctx.save();
      ctx.beginPath();

      // thin band near the outer edge
      const bandOuter = outerRadius;
      const bandInner = outerRadius - Math.max(3, (outerRadius - innerRadius) * 0.22);

      ctx.arc(x, y, bandOuter, startAngle, endAngle);
      ctx.arc(x, y, bandInner, endAngle, startAngle, true);
      ctx.closePath();

      ctx.globalAlpha = 0.65;
      ctx.fillStyle = highlightColor;
      ctx.fill();
      ctx.restore();

      // --- Edge stroke for depth (optional subtle) ---
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, outerRadius, startAngle, endAngle);
      ctx.strokeStyle = "rgba(0,0,0,0.10)";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    });

    ctx.restore();
  },
};

const DISCCircularChart: React.FC<DISCCircularProps> = ({ chartData }) => {
  const ringThickness = 10;
  const ringGap = 4;
  const baseOuter = 85;

  const datasets = chartData.data.map((val, idx) => {
    const outer = baseOuter - idx * (ringThickness + ringGap);
    const inner = outer - ringThickness;
    const isZero = val === 0;

    return {
      label: chartData.labels[idx],
      data: [val, 5 - val], // ✅ keep your calculation (out of 5)
      backgroundColor: isZero ? ["#e6e6e6", "#e6e6e6"] : [COLORS[idx], "#e6e6e6"],
      borderColor: "transparent",
      borderWidth: 2,
      hoverOffset: 0,
      hoverBorderWidth: 0,
      hoverBorderColor: "transparent",
      hoverBackgroundColor: isZero ? ["#e6e6e6", "#e6e6e6"] : [COLORS[idx], "#e6e6e6"],
      borderRadius: 999,
      radius: `${outer}%`,
      innerRadius: `${inner}%`,
      spacing: 0,
    };
  });

  return (
    <div>
      <div className="flex flex-row sm:flex-row items-center justify-center">
        {/* Chart (small) */}
        <div className="relative w-52 h-52">
          <Doughnut
            data={{ datasets }}
            options={{
              devicePixelRatio: 2,
              responsive: true,
              maintainAspectRatio: false,
              animation: false,
              cutout: "35%", // center hole, keeps it compact
              interaction: { mode: "nearest", intersect: true },
              plugins: {
                legend: { display: false },
                tooltip: {
                  enabled: true,
                  backgroundColor: "rgba(255,255,255,0.95)",
                  titleColor: "#000",
                  bodyColor: "#000",
                  borderColor: "#d1d5db",
                  borderWidth: 1,
                  displayColors: false,
                  padding: 8,
                  bodyFont: { size: 12, family: "sans-serif" },
                  callbacks: {
                    title: () => "",
                    label: function (ctx) {
                      const dsIndex = ctx.datasetIndex ?? 0;
                      const val = chartData.data[dsIndex];
                      const label = chartData.labels[dsIndex] || `Value`;
                      return `${label}: ${Number(val).toFixed(1)}/5`;
                    },
                  },
                },
              },
            }}
            plugins={[disc3DPlugin]}
          />
        </div>

        {/* Labels */}
        <div className="text-xs -mr-6">
          {chartData.labels.map((label, i) => (
            <div key={i} className="flex items-center gap-1 text-black">
              <span className="w-2 h-2" style={{ backgroundColor: COLORS[i] }} />
              {label}:<span>{chartData.data[i].toFixed(1)}/5</span>
            </div>
          ))}
        </div>
      </div>    

    </div>
  );
};

export default DISCCircularChart;