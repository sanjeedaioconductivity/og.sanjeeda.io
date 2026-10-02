"use client";

import React, { useMemo } from "react";
import { broadSkillCategories, skillCategoryMapping, BroadSkillCategory} from "../../quizData";
import { AllCareerProfiles } from "../../careerAnalytics";
const careerDatabase = Object.values(AllCareerProfiles);

type Props = {
  candidateName?: string;

  // Keeping these props so ResultsPage doesn't break (even if not used directly)
  careerMatches?: { name: string; score: number }[];

  // These are used to compute readiness + candidate category profile
  skillScores?: Record<string, number | null | undefined>;
  traitScores?: Record<string, number | null | undefined>;
};

function clamp(v: number, a = 0, b = 100) {
  return Math.max(a, Math.min(b, v));
}

/** Convert unknown scales into 0..100 safely */
function toPct(v: number | null | undefined): number {
  if (v === null || v === undefined || Number.isNaN(v)) return 0;
  const n = Number(v);

  // common scales: 0..5, 0..10, 0..100
  if (n <= 5) return clamp((n / 5) * 100);
  if (n <= 10) return clamp((n / 10) * 100);
  return clamp(n);
}

function mean(nums: number[]) {
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function readinessLabel(pct: number) {
  if (pct >= 80) return "Ready Now";
  if (pct >= 65) return "Nearly Ready";
  if (pct >= 50) return "Developing";
  return "Needs Development";
}

function matchStrengthLabel(scorePct: number) {
  if (scorePct >= 80) return "Strong match";
  if (scorePct >= 65) return "Good match";
  if (scorePct >= 50) return "Moderate match";
  return "Low match (needs exploration)";
}

type LockStatus = "UNLOCKED" | "LOCKED" | "CONSIDER";

/**
 * Business rule:
 * - UNLOCKED if match >= 70 AND readiness >= 60
 * - LOCKED if match >= 60 AND readiness < 60
 * - otherwise CONSIDER
 */
function lockStatus(matchPct: number, readinessPct: number): LockStatus {
  if (matchPct >= 70 && readinessPct >= 60) return "UNLOCKED";
  if (matchPct >= 60 && readinessPct < 60) return "LOCKED";
  return "CONSIDER";
}

/** Candidate-friendly labels */
function statusLabel(s: LockStatus) {
  if (s === "UNLOCKED") return "Start Now";
  if (s === "LOCKED") return "Build First";
  return "Explore";
}

/** Candidate-friendly meaning (one line) */
function statusMeaning(s: LockStatus) {
  if (s === "UNLOCKED")
    return "You’re a strong fit and ready enough to start applying or doing real projects now.";
  if (s === "LOCKED")
    return "You’re a strong fit, but you need to improve readiness before you pursue this professionally.";
  return "This is not your strongest match right now. Explore it only if you’re very interested.";
}

function statusTone(s: LockStatus) {
  if (s === "UNLOCKED") return { bg: "#E8FFF0", fg: "#0A7A2F" };
  if (s === "LOCKED") return { bg: "#FFF5E6", fg: "#8A4B00" };
  return { bg: "#F3F4F6", fg: "#111827" };
}

/**
 * Compute candidate % for each of the 7 categories from granular skillScores
 */
function computeCandidateCategoryPcts(
  skillScores: Record<string, number | null | undefined> | undefined,
  mapping: Record<BroadSkillCategory, string[]>
): Record<BroadSkillCategory, number> {
  const out = {} as Record<BroadSkillCategory, number>;
  for (const cat of broadSkillCategories) {
    const keys = mapping[cat] ?? [];
    const vals = keys
      .map((k) => Number(skillScores?.[k] ?? 0))
      .filter((x) => Number.isFinite(x));
    out[cat] = toPct(mean(vals));
  }
  return out;
}

/**
 * Overall skills readiness (normalized)
 */
function computeSkillReadiness(skillScores?: Record<string, number | null | undefined>) {
  const vals = skillScores ? Object.values(skillScores).map((v) => Number(v ?? 0)) : [];
  return toPct(mean(vals));
}

function getTraitPct(traitScores: Props["traitScores"], key: string) {
  const direct = (traitScores as any)?.[key];
  return toPct(direct);
}

/** Communication subset readiness (same as your original) */
function computeCommunicationPct(skillScores?: Record<string, number | null | undefined>) {
  const commKeys = [
    "assertiveCommunication",
    "audienceAwareness",
    "conceptCommunication",
    "communicationAdaptability",
    "communicationFlexibility",
    "explanatoryClarity",
    "feedbackDelivery",
    "influenceStyle",
    "persuasionApproach",
    "verbalExplanation",
  ] as const;

  const vals = commKeys
    .map((k) => Number(skillScores?.[k] ?? 0))
    .filter((x) => Number.isFinite(x));
  return toPct(mean(vals));
}

/**
 * Readiness % (same formula you used):
 * readiness = 0.5*skillAvg + 0.25*conscientious + 0.15*emotionalStability + 0.1*communication
 */
function computeReadinessPct(
  skillScores?: Record<string, number | null | undefined>,
  traitScores?: Props["traitScores"]
) {
  const skillPct = computeSkillReadiness(skillScores);

  const conscientiousPct =
    getTraitPct(traitScores, "Conscientiousness") || getTraitPct(traitScores, "conscientiousness");

  const emotionalPct =
    getTraitPct(traitScores, "Emotional Stability") ||
    getTraitPct(traitScores, "EmotionalStability") ||
    getTraitPct(traitScores, "emotionalStability");

  const commPct = computeCommunicationPct(skillScores);

  return clamp(0.5 * skillPct + 0.25 * conscientiousPct + 0.15 * emotionalPct + 0.1 * commPct);
}

/**
 * Career match %:
 * - Convert career targets (1..5) => (20..100)
 * - per category: 100 - |candidatePct - targetPct|
 * - overall: mean across 7 categories
 */
function computeCareerMatchPct(
  candidateCats: Record<BroadSkillCategory, number>,
  careerTarget: Record<string, number>
) {
  const per: number[] = [];
  for (const cat of broadSkillCategories) {
    const candidate = candidateCats[cat] ?? 0;
    const target5 = Number((careerTarget as any)?.[cat] ?? 0);
    const targetPct = clamp((target5 / 5) * 100);
    per.push(100 - Math.abs(candidate - targetPct));
  }
  return clamp(Math.round(mean(per)));
}

/**
 * Top 3 biggest gaps (targetPct - candidatePct) for the PRIMARY career
 */
function topGaps(
  candidateCats: Record<BroadSkillCategory, number>,
  careerTarget: Record<string, number>,
  n = 3
) {
  const gaps = broadSkillCategories
    .map((cat) => {
      const cand = candidateCats[cat] ?? 0;
      const tgt = clamp((Number((careerTarget as any)?.[cat] ?? 0) / 5) * 100);
      return { cat, gap: Math.round(tgt - cand), cand, tgt };
    })
    .sort((a, b) => b.gap - a.gap);

  return gaps.filter((g) => g.gap > 0).slice(0, n);
}

function catTitle(cat: BroadSkillCategory) {
  const map: Record<BroadSkillCategory, string> = {
    AnalyticalProblemSolving: "Analytical & Problem Solving",
    CommunicationInfluence: "Communication & Influence",
    EthicalProfessional: "Ethical & Professional",
    InterpersonalTeam: "Interpersonal & Team",
    LeadershipInitiative: "Leadership & Initiative",
    LearningDevelopment: "Learning & Development",
    SelfManagement: "Self-Management",
  };
  return map[cat] ?? cat;
}

/** Split sentences into lines for your table formatting */
function toLines(text: string) {
  if (!text) return [];
  return text
    .split(". ")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s, i, arr) => (i === arr.length - 1 && s.endsWith(".") ? s : s.endsWith(".") ? s : s + "."));
}

export default function CareerLockingReadinessPage({ 
  candidateName, 
  careerMatches,
  skillScores, 
  traitScores 
}: Props) {
  const view = useMemo(() => {
    const readinessPct = computeReadinessPct(skillScores, traitScores);
    const readinessText = readinessLabel(readinessPct);
    return { readinessPct, readinessText };
  }, [skillScores, traitScores]);

  const computed = useMemo(() => {
    const candidateCats = computeCandidateCategoryPcts(skillScores, skillCategoryMapping);

    const matches = careerDatabase
      .map((c: any) => {
        const matchPct = computeCareerMatchPct(candidateCats, c.skills);
        const s = lockStatus(matchPct, view.readinessPct);
        const strength = matchStrengthLabel(matchPct);

        const gaps = topGaps(candidateCats, c.skills, 3);
        const gapText =
          gaps.length === 0
            ? "You are already close to the target in all key areas."
            : gaps.map((g) => `${catTitle(g.cat)} (improve by ~${g.gap}%)`).join(", ");

        return {
          name: c.name as string,
          matchPct,
          status: s as LockStatus,
          strength,
          gaps,
          gapText,
          skillsTarget: c.skills as Record<string, number>,
        };
      })
      .sort((a: any, b: any) => b.matchPct - a.matchPct);

const primaryFromUI = careerMatches?.[0] ?? null;
const backupFromUI = careerMatches?.[1] ?? null;

const primary = primaryFromUI
  ? matches.find((m: any) => m.name === primaryFromUI.name) ?? null
  : matches[0] ?? null;

const backup = backupFromUI
  ? matches.find((m: any) => m.name === backupFromUI.name) ?? null
  : matches[1] ?? null;

    const personalityMatchText = primary
      ? `${primary.strength}. This means your strengths fit the role “${primary.name}” (match score: ${Math.round(
          primary.matchPct
        )}%).`
      : "Career match data is not available.";

    const advisorVerdictText = primary
      ? `Primary recommendation: “${primary.name}”. ${
          backup ? `Backup option: “${backup.name}”. ` : ""
        }Your readiness is ${Math.round(view.readinessPct)}% (${view.readinessText}). 
Next step: ${statusLabel(primary.status)} — ${statusMeaning(primary.status)} 
Focus on these 3 areas to improve fastest: ${primary.gapText}.`
      : "Career guidance will appear once results are available.";

    // Roadmap timeline (based on primary gaps)
    const roadmap = (() => {
      if (!primary) return null;
      const gaps = primary.gaps;

      const year2023 = gaps[0]
        ? `Choose your path + learn basics of ${catTitle(gaps[0].cat)}.`
        : "Choose your path + understand the role clearly.";
      const year2024 = gaps[0]
        ? `Build core skill routine for ${catTitle(gaps[0].cat)} (practice weekly).`
        : "Build a core skill routine (practice weekly).";
      const year2025 = gaps[1]
        ? `Do mini projects to improve ${catTitle(gaps[1].cat)}.`
        : "Do mini projects aligned to your role.";
      const year2026 = gaps[2]
        ? `Create portfolio proof for ${catTitle(gaps[2].cat)}.`
        : "Create portfolio proof (CV + case studies).";
      const year2027 = `Apply + network + prepare interviews for ${primary.name}.`;
      const year2028 = `Start in ${primary.name} (internship/job) and keep growing.`;

      return [
        { y: "2023", t: "Clarity", d: year2023 },
        { y: "2024", t: "Skills", d: year2024 },
        { y: "2025", t: "Projects", d: year2025 },
        { y: "2026", t: "Portfolio", d: year2026 },
        { y: "2027", t: "Apply", d: year2027 },
        { y: "2028", t: "Launch", d: year2028 },
      ];
    })();

    return { primary, backup, matches, personalityMatchText, advisorVerdictText, roadmap };
  }, [skillScores, view.readinessPct, view.readinessText, careerMatches]);

  const readinessLevel = computed.primary ? view.readinessText : "Not Available";

  // Colors tuned to your screenshot
  const barGray = "bg-[#D9D9D9]";
  const teal = "bg-[#0B5D78]";
  const cellGray = "bg-[#C9CED6]";
  const border = "border border-white";

  const personalityLines = toLines(computed.personalityMatchText);
  const verdictLines = toLines(computed.advisorVerdictText);

  const primaryStatus: LockStatus = computed.primary
    ? lockStatus(computed.primary.matchPct, view.readinessPct)
    : "CONSIDER";

  const tone = statusTone(primaryStatus);

  return (
    <div className="w-full bg-white">
      <div className="mx-auto w-full max-w-[900px] px-6 py-6">
        {/* Title bar */}
        <div className={`${barGray} px-4 py-2`}>
          <div className="text-sm font-bold text-slate-900">Career Locking &amp; Readiness</div>
          {candidateName ? (
            <div className="text-[11px] text-slate-600 mt-0.5">Candidate: {candidateName}</div>
          ) : null}
          <div className="text-[11px] text-slate-700 mt-1">
            How to read this: <b>Career Match</b> = fit for the role, <b>Readiness</b> = how prepared you are now.
          </div>
        </div>

        {/* Table 1: Readiness / Primary / Backup */}
        <div className="mt-3 w-full">
          <div className="grid grid-cols-3">
            <div className={`${teal} ${border} px-3 py-2 text-xs font-semibold text-white`}>
              Readiness Level
            </div>
            <div className={`${teal} ${border} px-3 py-2 text-xs font-semibold text-white`}>
              Primary Career
            </div>
            <div className={`${teal} ${border} px-3 py-2 text-xs font-semibold text-white`}>
              Backup Career
            </div>

            <div className={`${cellGray} ${border} px-3 py-3 text-xs text-slate-900`}>
              {readinessLevel}
            </div>
            <div className={`${cellGray} ${border} px-3 py-3 text-xs text-slate-900`}>
              {computed.primary?.name ?? "—"}
            </div>
            <div className={`${cellGray} ${border} px-3 py-3 text-xs text-slate-900`}>
              {computed.backup?.name ?? "—"}
            </div>
          </div>
        </div>

        {/* Table 2: Personality Match / Advisor Verdict */}
        <div className="mt-4 w-full">
          <div className="grid grid-cols-2">
            <div className={`${teal} ${border} px-3 py-2 text-xs font-semibold text-white`}>
              Career Match Explanation
            </div>
            <div className={`${teal} ${border} px-3 py-2 text-xs font-semibold text-white`}>
              Career Advisor Verdict
            </div>

            {/* Left cell */}
            <div className={`${cellGray} ${border} px-3 py-3 text-xs text-slate-900`}>
              <div className="space-y-1">
                {personalityLines.length ? (
                  personalityLines.map((line, idx) => (
                    <div key={idx} title={line}>
                      {line}
                    </div>
                  ))
                ) : (
                  <div>—</div>
                )}

                {computed.primary ? (
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <span
                      className="inline-block rounded-full px-2 py-0.5 text-[10px] font-bold"
                      style={{ background: tone.bg, color: tone.fg }}
                      title={statusMeaning(primaryStatus)}
                    >
                      {statusLabel(primaryStatus)}
                    </span>

                    <span className="text-[10px] text-slate-800">
                      Match: {Math.round(computed.primary.matchPct)}% • Readiness: {Math.round(view.readinessPct)}%
                    </span>

                    <span className="text-[10px] text-slate-700">{statusMeaning(primaryStatus)}</span>
              </div>
                ) : null}
              </div>
            </div>

            {/* Right cell */}
            <div className={`${cellGray} ${border} px-3 py-3 text-xs text-slate-900`}>
              <div className="space-y-1">
                {verdictLines.length ? (
                  verdictLines.map((line, idx) => (
                    <div key={idx} title={line}>
                      {line}
                    </div>
                  ))
                ) : (
                  <div>—</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mentor Comments */}
        <div className="mt-4 w-full">
          <div className={`${teal} px-3 py-2 text-xs font-semibold text-white`}>Mentor Comments</div>
          <div className={`${cellGray} px-3 py-3 text-xs text-slate-900 min-h-[70px]`} />
        </div>

        {/* Candidate Comment */}
        <div className="mt-4 w-full">
          <div className={`${teal} px-3 py-2 text-xs font-semibold text-white`}>Candidate Comment</div>
          <div className={`${cellGray} px-3 py-3 text-xs text-slate-900 min-h-[85px]`} />
        </div>

        {/* Progress Map */}
        <div className="mt-6">
          <div className={`${barGray} px-4 py-2`}>
            <div className="text-sm font-bold text-slate-900">Progress Map</div>
          </div>

          <div className="mt-4 rounded-md bg-white">
            <div className="w-full rounded-md bg-[#EEF2F5] p-6">
              <div className="text-center font-extrabold tracking-wide text-3xl text-slate-700">
                CAREER ROADMAP
                <br />
                TIMELINE
              </div>

              <div className="mt-6 rounded-md bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between text-[11px] text-slate-600">
                  <span>Career Process Roadmap {computed.primary ? `for ${computed.primary.name}` : ""}</span>
                  <span className="font-semibold">2023 → 2028</span>
                </div>

                <div className="mt-3 grid grid-cols-6 gap-2">
                  {(computed.roadmap ?? [
                    { y: "2023", t: "Clarity", d: "Choose direction" },
                    { y: "2024", t: "Skills", d: "Core learning plan" },
                    { y: "2025", t: "Projects", d: "Mini projects" },
                    { y: "2026", t: "Portfolio", d: "CV + case studies" },
                    { y: "2027", t: "Apply", d: "Networking + interviews" },
                    { y: "2028", t: "Launch", d: "Role transition" },
                  ]).map((x) => (
                    <div key={x.y} className="rounded-md bg-[#F3F6F8] border border-slate-200 p-2">
                      <div className="text-[10px] font-semibold text-slate-600">{x.y}</div>
                      <div className="mt-1 text-[11px] font-bold text-slate-800">{x.t}</div>
                      <div className="mt-1 text-[10px] text-slate-600 leading-snug">{x.d}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 text-right text-[10px] text-slate-600">Career Goals Description</div>
              </div>
            </div>
          </div>
          {/* end timeline */}
        </div>
      </div>
    </div>
  );
}
