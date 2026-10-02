'use client';

import * as React from 'react';

/**
 * Section mini-stepper — the within-screen progress rail.
 *
 * Shown on the screens that have more than one section: SCR-001 (2 groups),
 * SCR-003 (2), SCR-004 (4), SCR-005 (2). Unlike the module stepper this renders on
 * BOTH desktop and mobile (Sprint 6 handoff §2).
 *
 * These screens are single scrollable pages, not paginated — the FRS is explicit
 * about that for SCR-003 and SCR-004. So this rail reflects which section the
 * candidate is currently reading, and does not gate anything.
 *
 * Circles and their connecting lines are laid out on a shared CSS grid — a real
 * grid, not a flex row with a hand-tuned margin nudging the line up to roughly
 * meet the circles' centres. The old approach wasted vertical space on the fudge
 * factor and the label row and circle row could drift out of alignment; a grid
 * with two rows sharing one `gridTemplateColumns` guarantees every label sits
 * exactly under its circle with no fudging, and comes out more compact for it.
 */

export type SectionStep = {
  /** Full label, used on desktop. */
  label: string;
  /** Shorter label for narrow screens. Falls back to `label`. */
  shortLabel?: string;
};

export default function SectionStepper({
  sections,
  activeIndex,
  heading,
}: {
  sections: SectionStep[];
  /** 0-based index of the section currently in view. */
  activeIndex: number;
  /** e.g. "Compensation — 4 sections" on desktop. */
  heading?: string;
}) {
  if (sections.length < 2) return null;

  // One `auto` column per circle, one `1fr` connecting column between each
  // pair — shared by both the circle row and the label row so a label can
  // never land under the wrong circle regardless of how long its neighbours'
  // text is.
  const columns = sections
    .map((_, i) => (i < sections.length - 1 ? 'auto 1fr' : 'auto'))
    .join(' ');

  return (
    <div className="border-b border-border bg-card/30 px-4 py-1.5 sm:px-6">
      <div className="mx-auto max-w-md">
        {heading && (
          <p className="mb-1 hidden text-center text-[10px] text-muted-foreground md:block">
            {heading}
          </p>
        )}

        {/*
          ONE grid, not two. Circles+lines occupy row 1, labels+spacers occupy
          row 2, but they share a single `gridTemplateColumns` computation
          because they're the same grid — CSS auto-flows same-column items
          into two rows in source order. Two separate grids (one per row)
          would each size their `auto` columns from their OWN content only, so
          a label wider than its circle would silently drift the label out
          from under it; sharing one grid is what actually guarantees
          alignment, not just matching the column list.
        */}
        <div
          className="grid justify-items-center gap-y-1"
          style={{ gridTemplateColumns: columns }}
        >
          {/*
            Each circle's grid COLUMN is sized by its label below (usually far
            wider than the 20px circle), so a line confined to just the middle
            `1fr` track would stop well short of the circle's actual edge —
            visible gaps on both sides, disconnected-looking.
            Fix: the line spans all three tracks its two circles occupy
            (circle_i's column → the gap → circle_{i+1}'s column), and is
            rendered BEFORE the circles in DOM order so the circles paint on
            top and visually occlude the overrun — the line reads as if it
            starts and ends exactly at each circle's edge. Hollow
            "not yet reached" circles have no fill, so the line is faintly
            visible through the ring's centre — standard stepper behaviour,
            not a bug.
          */}
          {sections.slice(0, -1).map((_, index) => {
            const lineDone = index < activeIndex;
            return (
              <span
                key={`line-${index}`}
                className={['h-0.5 w-full self-center', lineDone ? 'bg-success' : 'bg-muted-foreground/30'].join(' ')}
                style={{
                  gridColumnStart: index * 2 + 1,
                  gridColumnEnd: index * 2 + 4,
                  gridRow: 1,
                }}
                aria-hidden="true"
              />
            );
          })}

          {sections.map((section, index) => {
            const isCurrent = index === activeIndex;
            const isDone = index < activeIndex;

            return (
              <span
                key={`circle-${section.label}`}
                className={[
                  'relative flex h-5 w-5 shrink-0 items-center justify-center self-center rounded-full text-[10px] font-semibold',
                  isCurrent
                    ? 'bg-primary text-primary-foreground'
                    : isDone
                      ? 'bg-success text-success-foreground'
                      : 'border-2 border-muted-foreground/50 bg-card text-muted-foreground',
                ].join(' ')}
                style={{ gridColumn: index * 2 + 1, gridRow: 1 }}
                aria-current={isCurrent ? 'step' : undefined}
              >
                {index + 1}
              </span>
            );
          })}

          {sections.map((section, index) => {
            const isCurrent = index === activeIndex;
            return (
              <span
                key={`label-${section.label}`}
                className={[
                  'whitespace-nowrap text-center text-[10px] sm:text-[11px]',
                  isCurrent ? 'font-semibold text-primary' : 'text-muted-foreground',
                ].join(' ')}
                style={{ gridColumn: index * 2 + 1, gridRow: 2 }}
              >
                <span className="sm:hidden">
                  {section.shortLabel ?? section.label}
                </span>
                <span className="hidden sm:inline">{section.label}</span>
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
