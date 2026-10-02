'use client';

import React from 'react';
import { Bar } from 'react-chartjs-2';
import type { ChartData, ChartOptions, Plugin } from 'chart.js';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface MIBarChartProps {
  chartData: {
    labels: string[];
    data: number[]; // can be 0–100 OR 0–5 OR 0–1 (we normalize to % for display only)
  };
  title: string;
}

/** Colors matched from your provided image */
const BAR_COLORS = [
  '#8CBEC1',
  '#F5E9BF',
  '#A4B7A1',
  '#E0C8A1',
  '#8CBEC1',
  '#F5E9BF',
  '#A4B7A1',
  '#E0C8A1',
];

function clamp(n: number, min = 0, max = 255) {
  return Math.max(min, Math.min(max, n));
}
function hexToRgb(hex: string) {
  const clean = hex.replace('#', '').trim();
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const num = parseInt(full, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}
function rgbToHex(r: number, g: number, b: number) {
  const to2 = (v: number) => clamp(v).toString(16).padStart(2, '0');
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

/** ✅ 3D extrusion plugin (top + right faces) */
const bar3DPlugin: Plugin<'bar'> = {
  id: 'bar3DPlugin',
  afterDatasetsDraw(chart, _args, pluginOptions) {
    const opts = (pluginOptions ?? {}) as {
      depth?: number;
      tilt?: number;
      topLighten?: number;
      sideDarken?: number;
      shadow?: boolean;
    };

    const depth = typeof opts.depth === 'number' ? opts.depth : 16;
    const tilt = typeof opts.tilt === 'number' ? opts.tilt : 0.65;
    const topLighten = typeof opts.topLighten === 'number' ? opts.topLighten : 0.18;
    const sideDarken = typeof opts.sideDarken === 'number' ? opts.sideDarken : -0.25;
    const shadow = opts.shadow ?? true;

    const dx = depth;
    const dy = depth * tilt;

    const { ctx } = chart;
    const meta = chart.getDatasetMeta(0);
    const dataset = chart.data.datasets[0];

    ctx.save();

    // allow drawing beyond chartArea so 3D faces won't be cut
    ctx.beginPath();
    ctx.rect(0, 0, chart.width, chart.height);
    ctx.clip();

    meta.data.forEach((element: any, i: number) => {
      const props = element.getProps(['x', 'y', 'base', 'width'], true);
      const x = props.x as number;
      const y = props.y as number;
      const base = props.base as number;
      const width = props.width as number;

      const left = x - width / 2;
      const right = x + width / 2;
      const top = y;
      const bottom = base;

      const bg =
        (Array.isArray((dataset as any).backgroundColor)
          ? (dataset as any).backgroundColor[i]
          : (dataset as any).backgroundColor) || BAR_COLORS[i % BAR_COLORS.length];

      const topColor = shade(bg, topLighten);
      const sideColor = shade(bg, sideDarken);

      if (shadow) {
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.18)';
        ctx.shadowBlur = 6;
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 3;

        ctx.beginPath();
        ctx.moveTo(right, top);
        ctx.lineTo(right + dx, top - dy);
        ctx.lineTo(right + dx, bottom - dy);
        ctx.lineTo(right, bottom);
        ctx.closePath();
        ctx.fillStyle = 'rgba(0,0,0,0.08)';
        ctx.fill();
        ctx.restore();
      }

      // right face
      ctx.beginPath();
      ctx.moveTo(right, top);
      ctx.lineTo(right + dx, top - dy);
      ctx.lineTo(right + dx, bottom - dy);
      ctx.lineTo(right, bottom);
      ctx.closePath();
      ctx.fillStyle = sideColor;
      ctx.fill();

      // top face
      ctx.beginPath();
      ctx.moveTo(left, top);
      ctx.lineTo(left + dx, top - dy);
      ctx.lineTo(right + dx, top - dy);
      ctx.lineTo(right, top);
      ctx.closePath();
      ctx.fillStyle = topColor;
      ctx.fill();
    });

    ctx.restore();
  },
};

/** ✅ Labels like: 10%, 20%, 55% */
const percentLabelPlugin: Plugin<'bar'> = {
  id: 'percentLabelPlugin',
  afterDatasetsDraw(chart) {
    const { ctx } = chart;
    const meta = chart.getDatasetMeta(0);
    const dataset = chart.data.datasets[0];

    ctx.save();
    ctx.font = '600 12px system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
    ctx.fillStyle = '#111827';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';

    meta.data.forEach((element: any, i: number) => {
      const v = dataset.data?.[i] as number | undefined;
      if (v == null) return;

      const props = element.getProps(['x', 'y'], true);
      ctx.fillText(`${Math.round(v)}%`, props.x as number, (props.y as number) - 4);
    });

    ctx.restore();
  },
};

const MIBarChart: React.FC<MIBarChartProps> = ({ chartData, title }) => {
  // Normalize ONLY to show % out of 100 (keeps your meaning)
  const maxVal = Math.max(...(chartData.data ?? [0]));
  const percentData = chartData.data.map((v) => {
    if (maxVal <= 1.01) return v * 100; // 0..1
    if (maxVal <= 5.01) return (v / 5) * 100; // 0..5
    return v; // already 0..100
  });

  const data: ChartData<'bar', number[], string> = {
    labels: chartData.labels,
    datasets: [
      {
        label: title,
        data: percentData,
        backgroundColor: BAR_COLORS.slice(0, percentData.length),
        borderColor: BAR_COLORS.slice(0, percentData.length),
        borderWidth: 1,
        borderSkipped: false,
        barPercentage: 0.7,
        categoryPercentage: 0.7,
        clip: 0, // ✅ FIX: must be number | false | ChartArea
      },
    ],
  };

  const options: ChartOptions<'bar'> = {
    devicePixelRatio: 2,
    responsive: true,
    maintainAspectRatio: false,
    layout: { padding: { top: 16, right: 24, left: 10, bottom: 0 } },
    scales: {
      x: { grid: { display: false } },
      y: {
        beginAtZero: true,
        min: 0,
        max: 100,
        ticks: { stepSize: 10 },
        grid: { color: '#e5e7eb' },
      },
    },
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: title,
        align: 'end',
        color: '#6b7280',
        font: { size: 13},
        padding: { bottom: 6 },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => `${Math.round(ctx.raw as number)}%`,
        },
      },
    },
  };

  return (
    <div className="w-full h-[270px] px-2">
      <Bar data={data} options={options} plugins={[bar3DPlugin, percentLabelPlugin]} />
    </div>
  );
};

export default MIBarChart;
