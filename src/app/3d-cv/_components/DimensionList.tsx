'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { DIMENSIONS, STAGE_ORDER, statusFromScore, type CareerStage, type DimensionId } from '../_lib/dimensions';
import { StatusBadge } from './ui';

/**
 * Number-tile colours cycle through the mockups' five accents. Whole literal
 * strings so Tailwind generates them.
 */
const TILE_COLORS = [
  'bg-blue-600 text-white',
  'bg-emerald-600 text-white',
  'bg-orange-500 text-white',
  'bg-red-600 text-white',
  'bg-violet-600 text-white',
];

/**
 * The nine dimension rows of screens 5 and 7, in the order this career stage's
 * CV will print them (junior by default, like the mockups).
 */
export default function DimensionList({
  scores,
  stage,
}: {
  scores: Record<DimensionId, number>;
  stage: CareerStage | '';
}) {
  const order = STAGE_ORDER[stage || 'junior'];
  return (
    <ol className="space-y-2">
      {order.map((id, i) => (
        <li key={id}>
          <Link
            href={`/3d-cv/profile/${id}`}
            className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-3 transition hover:border-[hsl(var(--cv-primary))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--cv-primary))]"
          >
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold ${TILE_COLORS[i % TILE_COLORS.length]}`}
            >
              {i + 1}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm font-medium">{DIMENSIONS[id].label}</span>
            <StatusBadge status={statusFromScore(scores[id])} />
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          </Link>
        </li>
      ))}
    </ol>
  );
}
