"use client";

/**
 * The golden-fixture diff (Story 10.2.6): the five fixtures scored under the
 * active config vs. a target version, per category and overall, with the delta
 * highlighted. A Recharts grouped bar of overall scores sits above the table —
 * Recharts, following OfferGuide's own ScoreBreakdown, not the PGP portal's
 * Chart.js.
 *
 * Framed as a warning surface, not a gate: a recommendation-label change is
 * called out, but nothing here blocks activation.
 */

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { cn } from "@/lib/utils";
import { SCORE_CATEGORIES, delta, type PreviewResponse } from "./scoringTypes";

export function FixtureDiff({ preview }: { preview: PreviewResponse }) {
  const chartData = preview.fixtures.map((f) => ({
    fixture: f.fixtureId,
    Active: f.active.overallScore,
    Draft: f.preview.overallScore,
  }));

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Version {preview.previewVersion} vs. the active version {preview.activeVersion}, across the five golden
        fixtures. A changed recommendation label is flagged — you can still activate, but see it first.
      </p>

      <div className="h-56 w-full rounded-xl border border-[#0b163f]/10 p-3 dark:border-white/10">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 4, left: -16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-white/10" />
            <XAxis dataKey="fixture" tick={{ fontSize: 12 }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="Active" fill="#94a3b8" radius={[3, 3, 0, 0]} />
            <Bar dataKey="Draft" fill="#1746b5" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[#0b163f]/10 dark:border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#0b163f]/10 bg-slate-50 text-left dark:border-white/10 dark:bg-white/5">
              <th scope="col" className="px-3 py-2 font-bold">Fixture</th>
              {SCORE_CATEGORIES.map((c) => (
                <th key={c} scope="col" className="px-2 py-2 text-right font-bold">{c}</th>
              ))}
              <th scope="col" className="px-2 py-2 text-right font-bold">Overall</th>
            </tr>
          </thead>
          <tbody>
            {preview.fixtures.map((f) => {
              const labelChanged = f.active.recommendationLabel !== f.preview.recommendationLabel;
              return (
                <tr key={f.fixtureId} className="border-b border-[#0b163f]/5 last:border-0 dark:border-white/5">
                  <th scope="row" className="px-3 py-2 text-left font-semibold" title={f.label}>
                    {f.fixtureId}
                    {labelChanged && (
                      <span className="ml-1 rounded bg-amber-100 px-1 text-[10px] font-bold text-amber-700 dark:bg-amber-500/20 dark:text-amber-300" title={`${f.active.recommendationLabel} → ${f.preview.recommendationLabel}`}>
                        label
                      </span>
                    )}
                  </th>
                  {SCORE_CATEGORIES.map((c) => (
                    <DeltaCell key={c} active={f.active.categoryScores[c] ?? 0} preview={f.preview.categoryScores[c] ?? 0} />
                  ))}
                  <DeltaCell active={f.active.overallScore} preview={f.preview.overallScore} bold />
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DeltaCell({ active, preview, bold }: { active: number; preview: number; bold?: boolean }) {
  const d = delta(active, preview);
  return (
    <td className={cn("px-2 py-2 text-right tabular-nums", bold && "font-bold")}>
      <span>{Math.round(preview)}</span>
      {d.dir !== "same" && (
        <span
          className={cn(
            "ml-1 text-xs font-semibold",
            d.dir === "up" ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
          )}
        >
          {d.dir === "up" ? "▲" : "▼"}{Math.abs(d.value)}
        </span>
      )}
    </td>
  );
}
