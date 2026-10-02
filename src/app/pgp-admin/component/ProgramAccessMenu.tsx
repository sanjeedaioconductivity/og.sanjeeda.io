"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Eye, EyeOff, Loader2 } from "lucide-react";

/**
 * Who a program is released to — the admin's per-program access dropdown.
 *
 * A program used to be published the moment it was saved: the candidate
 * endpoint returned every program with no filter, and a mentor saw anything
 * they were assigned to. So a draft that starts next quarter was already in
 * Offered Programs, with all of its tabs readable. These two ticks are the gate.
 *
 * The two are INDEPENDENT on purpose. The common case is releasing to the
 * mentor first, so they can prepare, and to candidates weeks later when
 * enrolment opens. Either can be turned off again.
 *
 * THE MENTOR TICK NAMES THE MENTOR. A program has exactly one assigned mentor,
 * so "show to the mentor" means that person — the label carries their name so
 * an admin ticking it knows precisely who is about to get access. With nobody
 * assigned there is no one to show it to, and the tick is disabled rather than
 * silently doing nothing.
 *
 * Each tick saves on its own, immediately, and is applied optimistically so the
 * checkbox responds at once; a failed save rolls the box back and reports why.
 * A tick that looks applied but did not save would leave an admin believing a
 * program is private when candidates can see it — the one mistake this control
 * must not make.
 *
 * ============ THE MENU IS A PORTAL, AND IT HAS TO BE ============
 *
 * The programs table sits inside `overflow-hidden` (the rounded card) wrapped
 * around `overflow-x-auto` (the horizontal scroller). An absolutely-positioned
 * menu inside a cell is clipped by BOTH: the panel opened and was simply not
 * visible, which is exactly how this first shipped.
 *
 * Neither wrapper can lose its overflow — one gives the card its rounded
 * corners, the other lets a wide table scroll — so the menu renders into
 * `document.body` instead and is positioned `fixed` against the trigger's
 * rect, escaping every ancestor's clipping. Being outside the trigger's DOM
 * subtree, it needs its own ref in the outside-click check and its own
 * repositioning on scroll and resize.
 */

/** Matches `w-60` on the panel. Needed in JS to right-align against the trigger. */
const MENU_WIDTH = 240;
const MENU_GAP = 4;

export type ProgramAccess = {
  visibleToMentor: boolean;
  visibleToCandidates: boolean;
};

export default function ProgramAccessMenu({
  programId,
  programName,
  mentorName,
  access,
  onChange,
}: {
  programId: string;
  programName: string;
  /** Empty when no mentor is assigned yet. */
  mentorName: string;
  access: ProgramAccess;
  /** Hands the saved state back so the table row stays in step. */
  onChange: (next: ProgramAccess) => void;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState<keyof ProgramAccess | null>(null);
  const [error, setError] = useState("");
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  /** Pins the panel under the trigger, flipping above when it would overhang. */
  const place = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const height = menuRef.current?.offsetHeight ?? 0;
    const belowFits = rect.bottom + MENU_GAP + height <= window.innerHeight - 8;

    setPos({
      top: belowFits ? rect.bottom + MENU_GAP : rect.top - MENU_GAP - height,
      // Right-aligned to the trigger, then clamped so a row near either edge
      // cannot push the panel off screen.
      left: Math.max(
        8,
        Math.min(rect.right - MENU_WIDTH, window.innerWidth - MENU_WIDTH - 8)
      ),
    });
  }, []);

  /**
   * Measured after the panel is in the DOM, so its real height decides the flip.
   *
   * `useEffect`, not `useLayoutEffect`: this tree is server-rendered, and React
   * warns that useLayoutEffect does nothing on the server. The usual reason to
   * reach for the layout variant — a frame of unpositioned content — does not
   * apply, because the panel stays `visibility: hidden` until `pos` is set.
   */
  useEffect(() => {
    if (open) place();
  }, [open, place]);

  useEffect(() => {
    if (!open) return;

    // `true` captures scrolls on the table's own scroller too, not just the
    // window — the panel is fixed, so it would otherwise stay put while the row
    // under it moved away.
    const onScroll = () => place();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);

    function onDown(event: MouseEvent) {
      const target = event.target as Node;
      // Two subtrees to check: the menu no longer lives inside the trigger.
      if (triggerRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, place]);

  async function toggle(key: keyof ProgramAccess) {
    if (saving) return;
    const next = { ...access, [key]: !access[key] };

    setError("");
    setSaving(key);
    onChange(next); // optimistic

    try {
      const res = await fetch("/api/pgp-management/programs-pgp", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        // Only the one field, never the whole program — the editor owns the
        // rest, and a table row must not write back a stale copy of it.
        body: JSON.stringify({ programId, [key]: next[key] }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Could not save access.");
      }
    } catch (err) {
      onChange(access); // roll back to what was actually stored
      setError(err instanceof Error ? err.message : "Could not save access.");
    } finally {
      setSaving(null);
    }
  }

  const releasedCount =
    Number(access.visibleToMentor) + Number(access.visibleToCandidates);
  const summary =
    releasedCount === 0
      ? "Hidden"
      : access.visibleToMentor && access.visibleToCandidates
        ? "Mentor + Candidates"
        : access.visibleToMentor
          ? "Mentor only"
          : "Candidates only";

  const menu = (
    <div
      ref={menuRef}
      role="menu"
      onClick={(e) => e.stopPropagation()}
      style={{
        top: pos?.top ?? 0,
        left: pos?.left ?? 0,
        width: MENU_WIDTH,
        // Hidden for the first paint, while `place()` measures it. Without this
        // the panel flashes at the top-left corner before jumping into place.
        visibility: pos ? "visible" : "hidden",
      }}
      className="fixed z-[80] rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-white/10 dark:bg-[#0b1736]"
    >
      <p className="px-2 pb-1 pt-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
        Who can see this program
      </p>

      <AccessRow
        checked={access.visibleToMentor}
        busy={saving === "visibleToMentor"}
        disabled={!mentorName}
        label="Mentor"
        hint={
          mentorName || "No mentor assigned — assign one in the program editor first"
        }
        onToggle={() => toggle("visibleToMentor")}
      />

      <AccessRow
        checked={access.visibleToCandidates}
        busy={saving === "visibleToCandidates"}
        label="Candidates"
        hint="Listed in Offered Programs, open to join"
        onToggle={() => toggle("visibleToCandidates")}
      />

      <p className="border-t border-slate-100 px-2 pb-1 pt-1.5 text-[10px] leading-relaxed text-slate-400 dark:border-white/10">
        Candidates already enrolled keep their program whatever this says.
      </p>

      {error && (
        <p className="px-2 pb-1 text-[10px] font-semibold text-rose-600">{error}</p>
      )}
    </div>
  );

  return (
    <div className="inline-block text-left">
      <button
        ref={triggerRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        aria-haspopup="true"
        aria-expanded={open}
        title={`Who can see ${programName || "this program"}`}
        className={[
          "inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-bold transition",
          releasedCount === 0
            ? "border-slate-200 bg-slate-50 text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
            : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-500/20 dark:text-emerald-200",
        ].join(" ")}
      >
        {releasedCount === 0 ? <EyeOff size={11} /> : <Eye size={11} />}
        {summary}
        <ChevronDown size={11} />
      </button>

      {/* Into the body, clear of the table's two overflow wrappers. */}
      {open && createPortal(menu, document.body)}
    </div>
  );
}

function AccessRow({
  checked,
  busy,
  disabled = false,
  label,
  hint,
  onToggle,
}: {
  checked: boolean;
  busy: boolean;
  disabled?: boolean;
  label: string;
  hint: string;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="menuitemcheckbox"
      aria-checked={checked}
      disabled={disabled || busy}
      onClick={onToggle}
      className="flex w-full items-start gap-2 rounded-lg px-2 py-2 text-left transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-white/5"
    >
      <span
        className={[
          "mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded border",
          checked
            ? "border-blue-600 bg-blue-600 text-white"
            : "border-slate-300 dark:border-white/20",
        ].join(" ")}
        aria-hidden="true"
      >
        {busy ? (
          <Loader2 size={10} className="animate-spin text-blue-600" />
        ) : (
          checked && <Check size={11} />
        )}
      </span>
      <span className="min-w-0">
        <span className="block text-[11px] font-bold text-slate-800 dark:text-slate-100">
          {label}
        </span>
        <span className="mt-0.5 block text-[10px] leading-snug text-slate-400">
          {hint}
        </span>
      </span>
    </button>
  );
}
