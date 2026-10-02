"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Download, Loader2, RefreshCw } from "lucide-react";
import { downloadProgramPack } from "@/app/candidate/component/downloadProgramPack";
// The same view the mentor and admin program pages use, so all three read
// identically — Dashboard, Weekly Schedule, Session Flow, Capstone Timeline
// and Portfolio Checklist share one implementation, not three.
import ProgramView from "@/app/pgp-admin/component/ProgramView";
import CandidateShell, {
  CANDIDATE_PROGRAM_TABS,
  CANDIDATE_PROGRAM_TAB_KEYS,
  MenuButton,
  type CandidateProgramTab,
} from "@/app/candidate/component/CandidateShell";
import { useTabParam } from "@/lib/portal/useTabParam";
import type { Program } from "@/app/pgp-admin/component/pgpProgram";

export default function CandidateProgramPage() {
  const params = useParams();
  const id = String(params.id || "");

  const [program, setProgram] = useState<Program | null>(null);
  // Read from `?tab=` so the sidebar can open any tab by link; the key is per
  // program, so a revisit lands on the tab this program was left on.
  const [tab, setTab] = useTabParam<CandidateProgramTab>(
    `candidateProgramTab:${id}`,
    CANDIDATE_PROGRAM_TAB_KEYS,
    "dashboard"
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/pgp-candidate/program/${id}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Failed to load program.");
        return;
      }
      setError("");
      setProgram(data.program);
    } catch {
      setError("Failed to load program.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function refresh() {
    if (refreshing) return;
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  // Zips a proper PDF per tab — Dashboard, Weekly Schedule, Session Flow,
  // Capstone Timeline, Portfolio Checklist — so the candidate can keep the
  // whole program, not just what is on screen right now.
  async function handleDownload() {
    if (!program || downloading) return;
    setDownloading(true);
    try {
      await downloadProgramPack(program);
    } catch (err) {
      console.error("Program download error:", err);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <CandidateShell
      active="My Courses"
      currentProgramId={id}
      currentTab={tab}
      onProgramTab={setTab}
    >
      {(openMenu) => (
      <div className="w-full">
        <div className="mb-3 lg:hidden">
          <MenuButton onClick={openMenu} />
        </div>

        {loading ? (
          <div className="rounded-xs bg-white dark:bg-white/5 p-6 text-sm text-slate-500 shadow-sm">
            <Loader2 size={18} className="inline animate-spin" /> Loading program…
          </div>
        ) : error || !program ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm font-semibold text-rose-700">
            {error || "Program not found."}
          </div>
        ) : (
          // One surface, tall enough to reach the bottom of the screen.
          <div className="min-h-[calc(100vh-var(--header-h)-2rem)] overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-white/5 dark:ring-white/10">
            {/* Header — the same block every program screen uses. */}
            <div className="bg-[#0b2f5b] px-5 py-4 text-white">
              <h1 className="mt-1 text-xl font-black">
                {program.programName || "Untitled program"}
              </h1>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-semibold text-blue-100" />
            </div>

            {/* The tabs live in the sidebar's Programs group; this strip
                names the one on screen and refreshes it. */}
            <div className="flex items-center gap-2 border-b border-slate-200 px-3 py-1.5 dark:border-white/10">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#0b2f5b] dark:text-sky-300">
                {CANDIDATE_PROGRAM_TABS.find((t) => t.key === tab)?.label ?? ""}
              </span>

              <button
                type="button"
                onClick={handleDownload}
                disabled={downloading}
                title="Download — Dashboard, Weekly Schedule, Session Flow, Capstone Timeline and Portfolio Checklist as a ZIP of PDFs"
                aria-label="Download program"
                className="ml-auto grid h-7 w-7 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-[#0b2f5b] disabled:opacity-60 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
              >
                {downloading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Download size={14} />
                )}
              </button>

              <button
                type="button"
                onClick={refresh}
                disabled={refreshing}
                title="Refresh — pull the latest rows and statuses"
                aria-label="Refresh program"
                className="grid h-7 w-7 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-[#0b2f5b] disabled:opacity-60 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
              >
                <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
              </button>
            </div>

            {/* Content */}
            <ProgramView program={program} tab={tab} />
          </div>
        )}
      </div>
      )}
    </CandidateShell>
  );
}
