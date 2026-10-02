'use client';

import * as React from 'react';
import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';

/**
 * ScoreBreakdown — SCR-010's 7-category bar chart.
 *
 * Recharts by decided dependency (Sprint 7 §2.3): React-native, composable with
 * the shadcn model, and SVG-based so the teal→blue gradient the FRS specifies is
 * a real `<linearGradient>` rather than a CSS workaround. It is the ONLY
 * charting library in this module — the repo has chart.js elsewhere; do not
 * reuse it here or add a third.
 *
 * THEME: chart colours must come from theme tokens, not hardcoded fills. Recharts
 * needs concrete colour strings (it can't consume a Tailwind class), so the two
 * gradient stops are read from the live CSS custom properties at runtime and
 * re-read whenever the theme changes. That keeps the "no hardcoded colour
 * values, including chart fills" DoD line honest while still giving Recharts
 * what it needs.
 *
 * DISPLAY ONLY. Every number here is read from the scoring engine — nothing on
 * this component computes, rounds into a band, or re-derives a score.
 */

export type CategoryScore = { category: string; score: number };

/** Reads an `hsl(var(--token))` triplet off the document and returns a usable colour. */
function readToken(name: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return raw ? `hsl(${raw})` : fallback;
}

export default function ScoreBreakdown({
  scores,
  infoNote,
}: {
  scores: CategoryScore[];
  infoNote?: string;
}) {
  // Fallbacks only matter for the first server-rendered frame; the effect below
  // replaces them with the real token values as soon as the DOM exists.
  const [colors, setColors] = React.useState({
    from: 'hsl(172 66% 45%)',
    to: 'hsl(217 91% 60%)',
    label: 'hsl(215 16% 47%)',
  });

  React.useEffect(() => {
    const read = () =>
      setColors({
        // Teal → blue, per the FRS gradient spec.
        from: readToken('--success', 'hsl(172 66% 45%)'),
        to: readToken('--primary', 'hsl(217 91% 60%)'),
        label: readToken('--muted-foreground', 'hsl(215 16% 47%)'),
      });

    read();

    // The theme toggle swaps the `dark` class on <html>; re-read so the chart
    // follows light/dark/system instead of freezing at whatever loaded first.
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, []);

  if (scores.length === 0) return null;

  return (
    <div>
      <div className="h-52 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={scores}
            margin={{ top: 18, right: 4, bottom: 4, left: 4 }}
            barCategoryGap="22%"
          >
            <defs>
              <linearGradient id="og-score-gradient" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor={colors.from} />
                <stop offset="100%" stopColor={colors.to} />
              </linearGradient>
            </defs>

            <XAxis
              dataKey="category"
              tickLine={false}
              axisLine={false}
              interval={0}
              tick={{ fontSize: 10, fill: colors.label }}
            />
            {/* Fixed 0-100 domain so bar height is proportional to the actual
                score rather than auto-scaled to the highest one — an 80 must
                not look like a 100 just because nothing scored higher. */}
            <YAxis domain={[0, 100]} hide />

            <Bar dataKey="score" radius={[3, 3, 0, 0]} isAnimationActive={false}>
              {scores.map((s) => (
                <Cell key={s.category} fill="url(#og-score-gradient)" />
              ))}
              <LabelList
                dataKey="score"
                position="top"
                offset={6}
                style={{ fontSize: 11, fontWeight: 600, fill: colors.label }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {infoNote && (
        <p className="mt-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
          {infoNote}
        </p>
      )}
    </div>
  );
}
