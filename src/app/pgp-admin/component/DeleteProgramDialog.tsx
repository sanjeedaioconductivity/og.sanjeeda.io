"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, X } from "lucide-react";

/**
 * The guard in front of deleting a program. The admin has to type the
 * program's name exactly — twice, when the delete cannot be undone — before
 * Delete turns on, so a stray click cannot take one out; Cancel, the ✕ and
 * Escape all leave without touching anything.
 *
 * Two uses: moving a program to the recycle bin (one box, nothing is lost),
 * and emptying it out of the bin for good (two boxes, it is gone).
 */
export default function DeleteProgramDialog({
  programName,
  permanent = false,
  onCancel,
  onConfirm,
}: {
  programName: string;
  /** Permanent: the record is destroyed, so the name is asked for twice. */
  permanent?: boolean;
  onCancel: () => void;
  /** Resolves to an error message, or "" when the program was deleted. */
  onConfirm: () => Promise<string>;
}) {
  const [first, setFirst] = useState("");
  const [second, setSecond] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const target = programName.trim();
  const matches =
    target !== "" &&
    first.trim() === target &&
    (!permanent || second.trim() === target);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  async function confirm() {
    if (!matches || deleting) return;
    setDeleting(true);
    setError("");
    const message = await onConfirm();
    if (message) {
      setError(message);
      setDeleting(false);
    }
  }

  const field =
    "mt-1.5 w-full rounded-lg border-0 bg-white px-3 py-2 text-xs font-medium text-slate-800 shadow-sm ring-1 ring-inset ring-slate-200 outline-none transition placeholder:text-slate-300 focus:ring-2 focus:ring-rose-500 disabled:bg-slate-50 dark:bg-white/5 dark:text-slate-100 dark:ring-white/10";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Delete ${programName}`}
      className="fixed inset-0 z-[80] grid place-items-center p-4"
    >
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />

      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-[#0b1736]">
        <div className="flex items-start gap-3 border-b border-slate-200 px-5 py-4 dark:border-white/10">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-rose-50 text-rose-600 dark:bg-rose-500/10">
            <AlertTriangle size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-black text-slate-900 dark:text-white">
              {permanent ? "Delete permanently?" : "Delete this program?"}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-300">
              {permanent ? (
                <>
                  Are you sure? This will be permanently deleted from the system:{" "}
                  <span className="font-bold text-slate-900 dark:text-white">{programName}</span>.
                </>
              ) : (
                <>
                  Are you sure you want to delete{" "}
                  <span className="font-bold text-slate-900 dark:text-white">{programName}</span>?
                </>
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={onCancel}
            aria-label="Close"
            title="Close"
            className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-4">
          <p
            className={`mb-3 rounded-lg px-3 py-2 text-[11px] font-semibold ${
              permanent
                ? "bg-rose-50 text-rose-800 dark:bg-rose-500/10 dark:text-rose-200"
                : "bg-amber-50 text-amber-800 dark:bg-amber-400/10 dark:text-amber-200"
            }`}
          >
            {permanent
              ? "There is no undo: the program and everything stored with it leave the system for good."
              : "The program moves to the recycle bin, so it can be restored — but until then, the mentor and its candidates lose sight of it."}
          </p>

          <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300">
            Type <span className="font-black text-slate-900 dark:text-white">{programName}</span>{" "}
            to confirm
            <input
              ref={inputRef}
              value={first}
              onChange={(e) => setFirst(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !permanent && confirm()}
              placeholder={programName}
              disabled={deleting}
              className={field}
            />
          </label>

          {permanent && (
            <label className="mt-3 block text-[11px] font-bold text-slate-600 dark:text-slate-300">
              Type it once more
              <input
                value={second}
                onChange={(e) => setSecond(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && confirm()}
                placeholder={programName}
                disabled={deleting}
                className={field}
              />
            </label>
          )}

          {error && (
            <p className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-[11px] font-bold text-rose-700">
              {error}
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-5 py-3 dark:border-white/10">
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className="rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-100 disabled:opacity-60 dark:bg-white/5 dark:text-slate-200 dark:ring-white/10 dark:hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={confirm}
            disabled={!matches || deleting}
            title={
              matches
                ? permanent
                  ? "Delete permanently"
                  : "Delete this program"
                : `Type the program's name${permanent ? " in both boxes" : ""} first`
            }
            className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-300"
          >
            {deleting ? "Deleting…" : permanent ? "Delete forever" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
