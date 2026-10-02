"use client";

import { useEffect, useState } from "react";

/**
 * The two-row header that sits above every candidate tab.
 *
 *   row 1   the drawer button on the left, the account chip on the right
 *   row 2   the tab's title, and today's date
 *
 * Row 1 held a "Welcome, <name>" greeting, a profile chip and a Logout icon,
 * all on the right — which printed the candidate's name twice side by side. The
 * three collapsed into one control: the account chip now carries the greeting,
 * and Sign Out moved inside the drawer it opens.
 *
 * Row 2 briefly carried a meta strip ("My Email · My Program") next to the
 * title, mirroring the university portal's "My ID · My Enrollment No. ·
 * My Section". It is gone: the email is in the profile drawer and the programme
 * is on the tiles below, so on the dashboard it was a third copy of things the
 * screen already said. The title and the date are what is left.
 */

export default function CandidatePageHeader({
  accountSlot,
  menuSlot,
}: {
  /** The active tab — "Dashboard", "My Courses", … */
  title: string;
  /** The greeting chip that opens the User Profile drawer. */
  accountSlot: React.ReactNode;
  /** The drawer button, which only appears below the sidebar's breakpoint. */
  menuSlot?: React.ReactNode;
}) {
  /**
   * Rendered after mount, not during it. This is a client component, but Next
   * still server-renders it, and a date built in the render body is computed
   * once on the server and again in the browser — different clocks, occasionally
   * different days, and React logs a hydration mismatch when they disagree. An
   * effect runs only in the browser, so the two passes always agree: the server
   * renders nothing here and the date appears on the first client paint.
   */
  const [, setToday] = useState("");

  useEffect(() => {
    const now = new Date();
    const weekday = now.toLocaleDateString("en-US", { weekday: "long" });
    const month = now.toLocaleDateString("en-US", { month: "short" });
    // Assembled rather than taken from a single toLocaleDateString call: every
    // preset that includes the weekday also puts a comma before the year
    // ("Tuesday, Sep 29, 2026"), and the reference has none.
    //
    // The rule below wants state derived during render, which is exactly what
    // cannot happen here — the clock is a browser-only value and reading it in
    // the render body is the hydration mismatch this effect exists to avoid.
    // Synchronising React with an external system is the effect's documented
    // purpose, and this runs once.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setToday(`${weekday}, ${month} ${now.getDate()} ${now.getFullYear()}`);
  }, []);

  return (
    <header className="mb-4">
      {/* ---------------------------- row 1 ---------------------------- */}
      {/*
        Drawer button left, account chip right — via `ml-auto` on the chip, NOT
        `justify-between` on the row. MenuButton is `lg:hidden`, and a
        display:none child is not a flex item at all, so above `lg` the row holds
        a single item and `justify-between` parks it at the start: the chip would
        sit on the left on exactly the widths where there is most room for it.
        The auto margin eats the free space whatever the sibling count.
      */}
      <div className="flex items-center gap-2.5 border-b border-slate-200 pb-2.5 dark:border-white/10">
        {menuSlot}
        <div className="ml-auto flex min-w-0 items-center">{accountSlot}</div>
      </div>
    </header>
  );
}
