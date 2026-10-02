"use client";

import React from "react";
import { Bar } from "react-chartjs-2";
import type { ChartData, ChartOptions, Plugin } from "chart.js";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip);

const BAR_COLOR = "#1F6287";

/** Writes each bar's share ("25%") just above it, as the weightage table does. */
const percentLabels: Plugin<"bar"> = {
  id: "percentLabels",
  afterDatasetsDraw(chart) {
    const { ctx } = chart;
    const meta = chart.getDatasetMeta(0);
    const values = chart.data.datasets[0]?.data ?? [];
    ctx.save();
    ctx.font = "bold 11px sans-serif";
    ctx.fillStyle = "#000000";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    meta.data.forEach((bar, index) => {
      const value = Number(values[index]);
      if (!Number.isFinite(value)) return;
      ctx.fillText(`${value}%`, bar.x, bar.y - 3);
    });
    ctx.restore();
  },
};

/** Chart.js renders an array of strings as stacked lines, so wrap long labels. */
function wrapLabel(label: string, maxChars = 14): string[] {
  const lines: string[] = [];
  let line = "";

  for (const word of label.split(" ")) {
    if (line && `${line} ${word}`.length > maxChars) {
      lines.push(line);
      line = word;
    } else {
      line = line ? `${line} ${word}` : word;
    }
  }

  if (line) lines.push(line);

  return lines.length ? lines : [label];
}

export default function AssessmentWeightageChart({
  areas,
  weightages,
  height = 340,
  showTitle = true,
  showAxisTitles = false,
}: {
  areas: string[];
  weightages: number[];
  height?: number;
  showTitle?: boolean;
  /** Name the axes ("Assessment Area" / "Weightage (%)") — for the admin's editor. */
  showAxisTitles?: boolean;
}) {
  if (!areas.length) {
    return (
      <div
        style={{ height }}
        className="flex items-center justify-center border bg-slate-50 text-xs text-slate-500"
      >
        Add an assessment area to see the weightage chart.
      </div>
    );
  }

  const highest = Math.max(...weightages, 0);
  const axisMax = Math.max(30, Math.ceil(highest / 5) * 5);

  const data: ChartData<"bar", number[], string[]> = {
    labels: areas.map((area) => wrapLabel(area)),
    datasets: [
      {
        label: "Weightage",
        data: weightages,
        backgroundColor: BAR_COLOR,
        borderColor: BAR_COLOR,
        barPercentage: 0.5,
        categoryPercentage: 0.8,
      },
    ],
  };

  const options: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    // Room above the tallest bar for its "%" label.
    layout: { padding: { top: 16 } },
    scales: {
      x: {
        grid: { color: "#d4d4d4", drawOnChartArea: true },
        border: { display: true, color: "#000000" },
        ticks: { color: "#000000", font: { size: 11 } },
        title: {
          display: showAxisTitles,
          text: "Assessment Area",
          color: "#000000",
          font: { size: 11, weight: "bold" },
        },
      },
      y: {
        beginAtZero: true,
        max: axisMax,
        title: {
          display: showAxisTitles,
          text: "Weightage (%)",
          color: "#000000",
          font: { size: 11, weight: "bold" },
        },
        ticks: {
          stepSize: 5,
          color: "#000000",
          font: { size: 11 },
          callback: (value) => `${value}%`,
        },
        grid: { color: "#d4d4d4" },
        border: { display: true, color: "#000000", dash: [4, 4] },
      },
    },
    plugins: {
      legend: { display: false },
      title: {
        display: showTitle,
        text: "Assessment Weightage",
        color: "#000000",
        font: { size: 22, weight: "normal" },
        padding: { bottom: 14 },
      },
      tooltip: {
        callbacks: {
          title: (items) => {
            const label = items[0]?.label ?? "";
            return Array.isArray(label) ? label.join(" ") : label;
          },
          label: (item) => `${item.raw as number}%`,
        },
      },
    },
  };

  return (
    <div style={{ height }} className="w-full border p-2">
      <Bar data={data} options={options} plugins={[percentLabels]} />
    </div>
  );
}
