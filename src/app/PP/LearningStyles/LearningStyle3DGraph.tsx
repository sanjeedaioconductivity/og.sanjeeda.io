"use client";
import React, { useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  type Plugin,
  type ChartOptions,
  type ChartDataset,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

type Responses = Record<string, string | number | undefined>;

function toLikertNumber(v: string | number | undefined): number | null {
  if (v === undefined || v === null) return null;
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return null;
  if (n < 1 || n > 5) return null;
  return n;
}

// 1..5 -> 0..100
function likertToPct(v: number) {
  return ((v - 1) / 4) * 100;
}

function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}

function hexToRgb(hex: string) {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbToHex(r: number, g: number, b: number) {
  const to = (x: number) => x.toString(16).padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
}

// amount: -1..1 (negative = darker, positive = lighter)
function shade(hex: string, amount: number) {
  const { r, g, b } = hexToRgb(hex);
  const t = amount < 0 ? 0 : 255;
  const p = Math.abs(amount);
  const nr = Math.round(r + (t - r) * p);
  const ng = Math.round(g + (t - g) * p);
  const nb = Math.round(b + (t - b) * p);
  return rgbToHex(nr, ng, nb);
}

function avgPct(ids: string[], responses: Responses): number {
  const vals = ids
    .map((id) => toLikertNumber(responses[id]))
    .filter((v): v is number => v !== null);

  if (vals.length === 0) return 0;

  const mean = vals.reduce((s, x) => s + likertToPct(x), 0) / vals.length;
  return clamp(mean, 0, 100);
}

// ✅ Match these ids with your Postman question ids
const IDS = {
  Auditory: ["LS-AUD-1", "LS-AUD-2", "LS-AUD-3"],
  Visual: ["LS-VIS-1", "LS-VIS-2", "LS-VIS-3"],
  Kinesthetic: ["LS-KIN-1", "LS-KIN-2", "LS-KIN-3"],
};

// colors close to your screenshot
const COLORS = {
  Auditory: "#efe2b6",
  Visual: "#6f846f",
  Kinesthetic: "#c9a876",
};

// custom dataset type (no `any`)
type Bar3DDataset = ChartDataset<"bar", number[]> & { _baseColors: string[] };

// 3D plugin (draw top + right faces + number on bar)
const bar3DPlugin: Plugin<"bar"> = {
  id: "bar3DPlugin",
  afterDatasetsDraw(chart) {
    const meta = chart.getDatasetMeta(0);
    const ds = chart.data.datasets[0] as unknown as Bar3DDataset;
    const values = (ds.data ?? []) as number[];
    const baseColors = ds._baseColors ?? [];

    const ctx = chart.ctx;

    const dx = 12; // 3D depth X
    const dy = 8;  // 3D depth Y

    meta.data.forEach((barEl, i) => {
      const props = barEl.getProps(["x", "y", "base", "width"], true);

      const x = props.x as number;
      const y = props.y as number;
      const base = props.base as number;
      const w = props.width as number;

      const left = x - w / 2;
      const right = x + w / 2;
      const top = y;
      const bottom = base;

      const baseColor = baseColors[i] ?? "#cccccc";
      const front = baseColor;
      const topFace = shade(baseColor, 0.12);
      const sideFace = shade(baseColor, -0.18);

      ctx.save();

      // FRONT
      ctx.fillStyle = front;
      ctx.fillRect(left, top, w, bottom - top);

      // RIGHT SIDE
      ctx.beginPath();
      ctx.moveTo(right, top);
      ctx.lineTo(right + dx, top - dy);
      ctx.lineTo(right + dx, bottom - dy);
      ctx.lineTo(right, bottom);
      ctx.closePath();
      ctx.fillStyle = sideFace;
      ctx.fill();

      // TOP
      ctx.beginPath();
      ctx.moveTo(left, top);
      ctx.lineTo(right, top);
      ctx.lineTo(right + dx, top - dy);
      ctx.lineTo(left + dx, top - dy);
      ctx.closePath();
      ctx.fillStyle = topFace;
      ctx.fill();

      // subtle outline
      ctx.strokeStyle = "rgba(0,0,0,0.18)";
      ctx.lineWidth = 1;
      ctx.strokeRect(left, top, w, bottom - top);

      // value text
      const v = Math.round(clamp(values[i] ?? 0, 0, 100));
      const textY = Math.min(bottom - 12, top + 18);

      ctx.font = "700 10px sans-serif";
      ctx.fillStyle = "#111";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(v), x + dx * 0.15, textY);

      ctx.restore();
    });
  },
};

export default function LearningStyle3DGraph({
  responses,
  title = "Learning Styles",
  subtitle = "Sadaf's Learning Styles",
}: {
  responses: Responses;
  title?: string;
  subtitle?: string;
}) {
  const values = useMemo(() => {
    const auditory = avgPct(IDS.Auditory, responses);
    const visual = avgPct(IDS.Visual, responses);
    const kinesthetic = avgPct(IDS.Kinesthetic, responses);

    return {
      labels: ["Auditory", "Visual", "Kinesthetic"],
      data: [auditory, visual, kinesthetic],
      baseColors: [COLORS.Auditory, COLORS.Visual, COLORS.Kinesthetic],
    };
  }, [responses]);

  const dataset: Bar3DDataset = {
    label: title,
    data: values.data,
    // hide default bars; plugin draws 3D
    backgroundColor: "rgba(0,0,0,0)",
    borderWidth: 0,
    barPercentage: 0.6,
    categoryPercentage: 0.7,
    _baseColors: values.baseColors,
  };

  const data = {
    labels: values.labels,
    datasets: [dataset],
  };

  // ✅ FIX: type options properly + font.weight numeric (600)
  const options: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: true,
        callbacks: {
          label: (ctx) => ` ${Math.round(Number(ctx.raw))}%`,
        },
      },
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        ticks: { stepSize: 20, color: "#111" },
        grid: { color: "rgba(0,0,0,0.10)" },
      },
      x: {
        type: "category",
        ticks: {
          color: "#111",
          maxRotation: 45,
          minRotation: 45,
          font: { size: 12, weight: 600 }, // ✅ must be number
        },
        grid: { display: false },
      },
    },
  };

  return (
    <div className="w-full">
<div className="h-[280px] w-full" data-pdf-ls-chart>
  <Bar data={data} options={options} plugins={[bar3DPlugin]} />
</div>

      {/* <div className="mt-2 text-center text-xs font-semibold text-slate-500">
        {subtitle}
      </div> */}
    </div>
  );
}
