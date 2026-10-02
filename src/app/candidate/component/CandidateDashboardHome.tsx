"use client";

import { useEffect, useState } from "react";
import { CalendarCheck, GraduationCap } from "lucide-react";

/**
 * The candidate's landing screen — a "My Stats" panel of tiles pulled from the
 * same data the other sections already show (My Courses, Application Form,
 * Attendance), each a shortcut into that section rather than a new source of
 * truth.
 */

type Tile = {
  key: string;
  label: string;
  value: string;
  icon: React.ReactNode;
  onClick: () => void;
  /**
   * Each tile is tinted end to end rather than being a white card with a small
   * coloured square on it: the card's own background carries the accent, and the
   * icon, label and value all sit in the same hue.
   *
   * Written out as whole class strings on purpose. Tailwind scans source text
   * for complete names, so a tile colour assembled as `bg-${hue}-50` compiles to
   * nothing at all — the tint would silently be missing in the production build
   * while looking fine in dev.
   *
   * `bg`/`fg` carry the tint and the icon-plus-label colour; `strong` is a step
   * darker for the value. Every hue also declares its dark-mode partner, since a
   * pastel that works on white is unreadable on the portal's dark surface.
   */
  color: { bg: string; fg: string; strong: string };
};

/**
 * One row of the My Courses panel. Every field comes straight from
 * GET /api/pgp-candidate/programs, which already returns the mentor's name
 * alongside the programme — nothing new is asked of the API.
 */

export default function CandidateDashboardHome({ onNav }: { onNav: (label: string) => void }) {
  const [courseCount, setCourseCount] = useState(0);
  /** The programmes this candidate is actually enrolled on, with their mentor. */
  const [attendancePercent, setAttendancePercent] = useState<number | null>(null);

  /**
   * ===================== CGPA HAS NO SOURCE YET =====================
   *
   * Held as state, and deliberately never set, because nothing in the PGP data
   * model records what a candidate scored. Searched before building this tile:
   *
   *   - no marks, grade, score or CGPA field on any model
   *   - /api/pgp-candidate/* returns programmes, the application and attendance;
   *     none of them carry a result
   *   - PGPProgram.evaluationPlan is the programme's WEIGHTAGE plan — the
   *     assessment areas and their percentages, i.e. how a programme would be
   *     graded. It holds no candidate's actual marks.
   *
   * So the tile shows a dash rather than a made-up number. A dashboard figure
   * that looks like a real grade but is not is worse than an honest blank,
   * especially one a candidate might repeat in an interview.
   *
   * TO MAKE IT REAL, in order: marks have to be recorded per candidate per
   * assessment area (admin side), exposed on /api/pgp-candidate, then this
   * becomes a fetch like the three below — the tile itself needs no change.
   */
  
  useEffect(() => {
    let email = "";
    try {
      const saved = JSON.parse(localStorage.getItem("candidateUser") || "{}");
      // Only the email is needed here — the candidate's name is shown by the
      // header's account chip, not on this panel.
      email = saved.email || "";
    } catch {
      /* ignore */
    }
    if (!email) return;

    fetch(`/api/pgp-candidate/programs?email=${encodeURIComponent(email)}`)
      .then((res) => res.json())
      .then((data) => {
        const enrolledIds: string[] = data.enrolledProgramIds || [];
        setCourseCount(enrolledIds.length);
      })
      .catch((error) => console.error("Dashboard programs load error:", error));

    fetch(`/api/pgp-candidate/application/${encodeURIComponent(email)}`)
      .then((res) => res.json())
      .catch((error) => console.error("Dashboard application load error:", error));

    fetch(`/api/pgp-candidate/attendance?email=${encodeURIComponent(email)}`)
      .then((res) => res.json())
      .then((data) => {
        const courses = data.courses || [];
        const active = courses.find((c: { isActive?: boolean }) => c.isActive) || courses[0];
        setAttendancePercent(
          typeof active?.summary?.percent === "number" ? active.summary.percent : null
        );
      })
      .catch((error) => console.error("Dashboard attendance load error:", error));
  }, []);

  /**
   * Tile order and colour both follow the reference panel position for position:
   * warm top-left, blue top-right (CGPA), pink bottom-left, mint bottom-right
   * (attendance). Reordering these reshuffles the colours, so keep the pairs
   * together if you move one.
   */
  const tiles: Tile[] = [
    {
      key: "courses",
      label: "My Courses",
      value: String(courseCount),
      icon: <GraduationCap size={26} />,
      onClick: () => onNav("My Courses"),
      color: {
        bg: "bg-amber-50 dark:bg-amber-500/20",
        fg: "text-amber-500 dark:text-amber-300",
        strong: "text-amber-600 dark:text-amber-200",
      },
    },
    {
      key: "attendance",
      label: "Attendance",
      value: attendancePercent === null ? "—" : `${attendancePercent}%`,
      icon: <CalendarCheck size={26} />,
      onClick: () => onNav("Attendance"),
      color: {
        bg: "bg-teal-50 dark:bg-teal-500/20",
        fg: "text-teal-500 dark:text-teal-300",
        strong: "text-teal-600 dark:text-teal-200",
      },
    },
  ];

  return (
    <div className="text-sm">
      {/*
        The panel is deliberately NOT full width. It is a summary block that sits
        beside the section's real content, so it is capped and left-aligned;
        stretched across a desktop it reads as the whole dashboard, with each
        tile mostly empty space around a two-word value.
      */}
      <section className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-white/5 dark:ring-1 dark:ring-white/10">
        {/*
          Coral band, with the tiles pulled up over it by the `-mt-8` below so
          they overlap its lower edge rather than sitting under it. That overlap
          is the whole look, which is why the band carries the extra `pb-12`:
          it has to be tall enough to still show above the tiles once they are
          pulled up into it.

          Hard-coded hex rather than a Tailwind red: rose-500 is noticeably
          pinker and red-500 more orange than the reference coral.
        */}
        <header className="bg-[#f2545b] px-5 pb-12 pt-4">
          <h2 className="text-base font-bold text-white">My Stats</h2>
        </header>

        <div className="-mt-8 grid grid-cols-2 gap-3 p-3">
          {tiles.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={t.onClick}
              className={`flex flex-col items-start gap-2 rounded-2xl p-4 text-left ring-inset transition dark:ring-1 dark:ring-white/15 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current ${t.color.bg} ${t.color.fg}`}
            >
              {/* No container behind the glyph — the card itself is the tint. */}
              <span aria-hidden="true">{t.icon}</span>
              <span className="text-[13px] font-bold leading-tight">{t.label}</span>
              {/*
                `min-w-0` on the button's child is what lets `truncate` work
                here: a flex item defaults to min-width:auto and refuses to
                shrink below its text, so a long value would widen the tile
                instead of ellipsing. `w-full` gives it a box to truncate within.
              */}
              <span
                className={`w-full min-w-0 truncate text-[13px] font-bold ${t.color.strong}`}
              >
                ({t.value})
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
