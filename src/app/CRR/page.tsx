"use client";
import React, { useEffect, useMemo, useState } from "react";

type Score1to5 = 1 | 2 | 3 | 4 | 5;
type Gap = "L" | "M" | "H";
type Confidence = "Low" | "Med" | "High";

type CandidateDetails = {
  candidateName: string; targetRoleNow: string; targetRoleNext: string; 
  level: string; assessedBy: string;
 organization: string; reportDate: string; cirReference: string;
};

type WorkPull = { id: string; item: string; score?: Score1to5 };
type SimpleItem = { id: string; item: string };

type EngagementRow = { id: string; task: string; context: string; why: string; score?: Score1to5; }; // A1 — Engagement scan
type ExcellenceRow = { id: string; capability: string; proof: string; independencePct?: number; score?: Score1to5; }; // A2 — Excellence evidence
type OverlapRow = { id: string; overlapItem: string; evidenceRef: string; confidence?: Confidence;}; //A3 — Element discovery

type RoleAlignmentRow = { id: string; roleRequirement: string; currentProof: string; gap?: Gap; next2WeekAction: string;}; //A5 — Earning (role alignment + 2-week plan)

type SnapshotRow = {
  id: string;
  e: "Engagement" | "Excellence" | "Element" | "Energy" | "Earning";
  score?: Score1to5;
  evidence: string;
  nextFix: string;
};

type Guardrails = {
  maxHrsEnabled: boolean;
  maxHrs?: number;
  restDayEnabled: boolean;
  sleepMinEnabled: boolean;
  sleepMinHrs?: number;
  breaksEnabled: boolean;
  movementEnabled: boolean;
  movementTimes?: number;
  noTaskAfterEnabled: boolean;
  noTaskAfter?: string;
  otherEnabled: boolean;
  otherText: string;
};

type RiskFlags = {
  inconsistentSleep: boolean;
  tooManyCommitments: boolean;
  poorBoundaries: boolean;
  highStress: boolean;
  otherEnabled: boolean;
  otherText: string;
};

type ElementThemes = {
  communicationPeople: boolean;
  analysisInsight: boolean;
  buildSystems: boolean;
  operationsProcess: boolean;
  otherEnabled: boolean;
  otherText: string;
};

type ReadinessDecision =
  | "ReadyNow"
  | "ReadyWithConditions"
  | "NotReadyYet"
  | "";

type MentorDecision = "agree" | "adjustScores" | "adjustElement" | "";

type FormState = {
  details: CandidateDetails;

  step0: {
    workPulls: WorkPull[]; // 3
    activitiesToTest: SimpleItem[]; // 4
    strengthsToTest: SimpleItem[]; // 3
    earlyElementHypothesis: string;
    disconfirmingEvidence: string;
  };

  a1: { rows: EngagementRow[] };
  a2: { rows: ExcellenceRow[] };

  a3: {
    overlaps: OverlapRow[];
    themes: ElementThemes;
    elementStatement: string;
    proof1: string;
    proof2: string;
    proof3: string;
    artifactLink: string;
    elementScore?: Score1to5;
  };

  a4: {
    weeklyCapacityHrs?: number;
    bestTimeBlocks: string;
    constraints: string;
    guardrails: Guardrails;
    riskFlags: RiskFlags;
    energyScore?: Score1to5;
  };

  a5: {
    rows: RoleAlignmentRow[];
    earningScore?: Score1to5;
  };

  finalSnapshot: {
    rows: SnapshotRow[];
    readinessDecision: ReadinessDecision;
    readyConditions1: string;
    readyConditions2: string;
    notReadyBlocker1: string;
    notReadyBlocker2: string;

    mentorDecision: MentorDecision;
    mentorAdjustWhy: string;
    mentorName: string;
    mentorSignature: string;
    mentorDate: string;
  };
};

const STORAGE_KEY = "crr_5e_v21";

function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function normalize(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-lg font-semibold tracking-tight mt-8 mb-3 px-6">
      {children}
    </h2>
  );
}

function SubTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-base text-black font-semibold mt-5 mb-2 px-6">{children}</h3>;
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs font-medium text-slate-700 mb-1">{children}</div>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: React.HTMLInputTypeAttribute;
}) {
  return (
    <input
      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      type={type}
    />
  );
}

function TextArea({
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
    />
  );
}

function SelectScore({
  value,
  onChange,
  placeholder = "—",
}: {
  value?: Score1to5;
  onChange: (v?: Score1to5) => void;
  placeholder?: string;
}) {
  return (
    <select
      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
      value={value ?? ""}
      onChange={(e) => {
        const v = e.target.value ? (Number(e.target.value) as Score1to5) : undefined;
        onChange(v);
      }}
    >
      <option value="">{placeholder}</option>
      {[1, 2, 3, 4, 5].map((n) => (
        <option key={n} value={n}>
          {n}
        </option>
      ))}
    </select>
  );
}

function SelectGap({
  value,
  onChange,
}: {
  value?: Gap;
  onChange: (v?: Gap) => void;
}) {
  return (
    <select
      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
      value={value ?? ""}
      onChange={(e) => onChange((e.target.value || undefined) as Gap | undefined)}
    >
      <option value="">—</option>
      <option value="L">L</option>
      <option value="M">M</option>
      <option value="H">H</option>
    </select>
  );
}

function SelectConfidence({
  value,
  onChange,
}: {
  value?: Confidence;
  onChange: (v?: Confidence) => void;
}) {
  return (
    <select
      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
      value={value ?? ""}
      onChange={(e) =>
        onChange((e.target.value || undefined) as Confidence | undefined)
      }
    >
      <option value="">—</option>
      <option value="Low">Low</option>
      <option value="Med">Med</option>
      <option value="High">High</option>
    </select>
  );
}

function Checkbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        className="h-4 w-4 rounded border-slate-300"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>{label}</span>
    </label>
  );
}

function Radio({
  name,
  checked,
  onChange,
  label,
}: {
  name: string;
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input
        type="radio"
        name={name}
        className="h-4 w-4 border-slate-300"
        checked={checked}
        onChange={onChange}
      />
      <span>{label}</span>
    </label>
  );
}

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
return (
  <div
    className={[
      "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm",
      "avoid-break print-flat print:shadow-none",
      className,
    ].join(" ")}
  >
    {children}
  </div>
);

}

const initialState: FormState = {
  details: {
    candidateName: "",
    targetRoleNow: "",
    targetRoleNext: "",
    level: "",
    assessedBy: "",
    organization: "",
    reportDate: "",
    cirReference: "",
  },
  step0: {
    workPulls: Array.from({ length: 3 }).map(() => ({
      id: uid("wp"),
      item: "",
      score: undefined,
    })),
    activitiesToTest: Array.from({ length: 4 }).map(() => ({
      id: uid("act"),
      item: "",
    })),
    strengthsToTest: Array.from({ length: 3 }).map(() => ({
      id: uid("str"),
      item: "",
    })),
    earlyElementHypothesis: "",
    disconfirmingEvidence: "",
  },
  a1: {
    rows: [
      { id: uid("a1"), task: "", context: "", why: "", score: undefined },
      { id: uid("a1"), task: "", context: "", why: "", score: undefined },
    ],
  },
  a2: {
    rows: [
      {
        id: uid("a2"),
        capability: "",
        proof: "",
        independencePct: undefined,
        score: undefined,
      },
      {
        id: uid("a2"),
        capability: "",
        proof: "",
        independencePct: undefined,
        score: undefined,
      },
    ],
  },
  a3: {
    overlaps: [{ id: uid("ov"), overlapItem: "", evidenceRef: "", confidence: undefined }],
    themes: {
      communicationPeople: false,
      analysisInsight: false,
      buildSystems: false,
      operationsProcess: false,
      otherEnabled: false,
      otherText: "",
    },
    elementStatement: "",
    proof1: "",
    proof2: "",
    proof3: "",
    artifactLink: "",
    elementScore: undefined,
  },
  a4: {
    weeklyCapacityHrs: undefined,
    bestTimeBlocks: "",
    constraints: "",
    guardrails: {
      maxHrsEnabled: false,
      maxHrs: undefined,
      restDayEnabled: false,
      sleepMinEnabled: false,
      sleepMinHrs: undefined,
      breaksEnabled: false,
      movementEnabled: false,
      movementTimes: undefined,
      noTaskAfterEnabled: false,
      noTaskAfter: "",
      otherEnabled: false,
      otherText: "",
    },
    riskFlags: {
      inconsistentSleep: false,
      tooManyCommitments: false,
      poorBoundaries: false,
      highStress: false,
      otherEnabled: false,
      otherText: "",
    },
    energyScore: undefined,
  },
  a5: {
    rows: [
      { id: uid("a5"), roleRequirement: "", currentProof: "", gap: undefined, next2WeekAction: "" },
      { id: uid("a5"), roleRequirement: "", currentProof: "", gap: undefined, next2WeekAction: "" },
      { id: uid("a5"), roleRequirement: "", currentProof: "", gap: undefined, next2WeekAction: "" },
    ],
    earningScore: undefined,
  },
  finalSnapshot: {
    rows: (["Engagement", "Excellence", "Element", "Energy", "Earning"] as const).map((e) => ({
      id: uid("fs"),
      e,
      score: undefined,
      evidence: "",
      nextFix: "",
    })),
    readinessDecision: "",
    readyConditions1: "",
    readyConditions2: "",
    notReadyBlocker1: "",
    notReadyBlocker2: "",
    mentorDecision: "",
    mentorAdjustWhy: "",
    mentorName: "",
    mentorSignature: "",
    mentorDate: "",
  },
};

export default function CRRPage() {
  const [state, setState] = useState<FormState>(initialState);

  // Load on mount (best effort)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setState(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, []);

  const computedOverlaps = useMemo(() => {
    // Simple overlap heuristic: exact-match (normalized) between A1 task names and A2 capability names
    const a1 = state.a1.rows
      .map((r) => ({ name: r.task, score: r.score }))
      .filter((x) => normalize(x.name).length > 0 && (x.score ?? 0) >= 4);
    const a2 = state.a2.rows
      .map((r) => ({ name: r.capability, score: r.score }))
      .filter((x) => normalize(x.name).length > 0 && (x.score ?? 0) >= 4);

    const a2Set = new Set(a2.map((x) => normalize(x.name)));
    const overlapNames = a1
      .map((x) => x.name)
      .filter((name) => a2Set.has(normalize(name)));

    return Array.from(new Set(overlapNames));
  }, [state.a1.rows, state.a2.rows]);


  const addA1Row = () =>
    setState((s) => ({
      ...s,
      a1: { rows: [...s.a1.rows, { id: uid("a1"), task: "", context: "", why: "", score: undefined }] },
    }));

  const addA2Row = () =>
    setState((s) => ({
      ...s,
      a2: {
        rows: [
          ...s.a2.rows,
          { id: uid("a2"), capability: "", proof: "", independencePct: undefined, score: undefined },
        ],
      },
    }));

  const addOverlapRow = () =>
    setState((s) => ({
      ...s,
      a3: { ...s.a3, overlaps: [...s.a3.overlaps, { id: uid("ov"), overlapItem: "", evidenceRef: "", confidence: undefined }] },
    }));

  const addA5Row = () =>
    setState((s) => ({
      ...s,
      a5: {
        ...s.a5,
        rows: [...s.a5.rows, { id: uid("a5"), roleRequirement: "", currentProof: "", gap: undefined, next2WeekAction: "" }],
      },
    }));

  return (
<div className="min-h-screen bg-slate-50 print:bg-white text-slate-900">
  <div className="mx-auto px-4 py-6 print:px-0 print:py-0">
    <div className="a4-sheet mx-auto max-w-[210mm] bg-white print:bg-white print:max-w-none">

        {/* Header / Actions */}
        <div className="flex flex-col gap-3 px-10  md:flex-row md:items-end md:justify-between print:hidden">
          <div>
            <h1 className="mt-10 px-18 text-xl sm:text-2xl lg:text-3xl 2xl:text-4xl font-semibold">Candidate Readiness Report — 5E</h1>
            <p className="text-sm text-slate-600">
              Flow: 
              Engagement → Excellence → Element → Energy (heat applied) → Earning
            </p>
          </div>

        </div>

        {/* Candidate details */}
        <SectionTitle>Candidate details</SectionTitle>
         
          <div className="px-8 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label>Candidate name</Label>
              <Input value={state.details.candidateName} onChange={(v) => setState((s) => ({ ...s, details: { ...s.details, candidateName: v } }))}/>
            </div>
            <div>
              <Label>Organization</Label>
              <Input value={state.details.organization} onChange={(v) => setState((s) => ({ ...s, details: { ...s.details, organization: v } }))}/>
            </div>
            <div>
              <Label>Target role (now)</Label>
              <Input value={state.details.targetRoleNow} onChange={(v) => setState((s) => ({ ...s, details: { ...s.details, targetRoleNow: v } }))}/>
            </div>
            <div>
              <Label>Target role (next)</Label>
              <Input value={state.details.targetRoleNext} onChange={(v) => setState((s) => ({ ...s, details: { ...s.details, targetRoleNext: v } }))} />
            </div>
            <div>
              <Label>Level</Label>
              <Input value={state.details.level} onChange={(v) => setState((s) => ({ ...s, details: { ...s.details, level: v } }))}/>
            </div>
            <div>
              <Label>Assessed by</Label>
              <Input value={state.details.assessedBy} onChange={(v) => setState((s) => ({ ...s, details: { ...s.details, assessedBy: v } }))}/>
            </div>
            <div>
              <Label>Report date</Label>
              <Input type="date" value={state.details.reportDate} onChange={(v) => setState((s) => ({ ...s, details: { ...s.details, reportDate: v } }))}/>
            </div>
            <div>
              <Label>CIR reference (version/date)</Label>
              <Input value={state.details.cirReference} onChange={(v) => setState((s) => ({ ...s, details: { ...s.details, cirReference: v } }))}/>
            </div>
          </div>
       

        {/* Step 0 */}
        <SectionTitle>Step 0 — CIR inputs (copy from CIR)</SectionTitle>
          <SubTitle>Top work pulls (3 items + scores)</SubTitle>
          <div className="px-8 grid grid-cols-1 gap-3 md:grid-cols-3">
            {state.step0.workPulls.map((wp, idx) => (
              <div key={wp.id} className="rounded-xl border border-slate-200 p-3">
                <div className="text-xs font-medium text-slate-600 mb-2">Pull {idx + 1}</div>
                <Label>Item</Label>
                <Input
                  value={wp.item}
                  onChange={(v) =>
                    setState((s) => ({
                      ...s,
                      step0: {
                        ...s.step0,
                        workPulls: s.step0.workPulls.map((x) => (x.id === wp.id ? { ...x, item: v } : x)),
                      },
                    }))
                  }
                />
                <div className="mt-2">
                  <Label>Score (optional)</Label>
                  <SelectScore
                    value={wp.score}
                    onChange={(v) =>
                      setState((s) => ({
                        ...s,
                        step0: {
                          ...s.step0,
                          workPulls: s.step0.workPulls.map((x) => (x.id === wp.id ? { ...x, score: v } : x)),
                        },
                      }))
                    }
                  />
                </div>
              </div>
            ))}
          </div>

          <SubTitle>Top activities to test (4 items)</SubTitle>
          <div className="px-8 grid grid-cols-1 gap-3 md:grid-cols-2">
            {state.step0.activitiesToTest.map((it, idx) => (
              <div key={it.id}>
                <Label>Activity {idx + 1}</Label>
                <Input
                  value={it.item}
                  onChange={(v) =>
                    setState((s) => ({
                      ...s,
                      step0: {
                        ...s.step0,
                        activitiesToTest: s.step0.activitiesToTest.map((x) =>
                          x.id === it.id ? { ...x, item: v } : x
                        ),
                      },
                    }))
                  }
                />
              </div>
            ))}
          </div>

          <SubTitle>Top strengths to test (3 items)</SubTitle>
          <div className="px-8 grid grid-cols-1 gap-3 md:grid-cols-3">
            {state.step0.strengthsToTest.map((it, idx) => (
              <div key={it.id}>
                <Label>Strength {idx + 1}</Label>
                <Input
                  value={it.item}
                  onChange={(v) =>
                    setState((s) => ({
                      ...s,
                      step0: {
                        ...s.step0,
                        strengthsToTest: s.step0.strengthsToTest.map((x) =>
                          x.id === it.id ? { ...x, item: v } : x
                        ),
                      },
                    }))
                  }
                />
              </div>
            ))}
          </div>

          <div className="px-8 grid grid-cols-1 gap-4 mt-5 md:grid-cols-2">
            <div>
              <Label>Early Element hypothesis (1 line)</Label>
              <TextArea
                value={state.step0.earlyElementHypothesis}
                onChange={(v) => setState((s) => ({ ...s, step0: { ...s.step0, earlyElementHypothesis: v } }))}
                rows={3}
              />
            </div>
            <div>
              <Label>Disconfirming evidence (what would prove this wrong?)</Label>
              <TextArea
                value={state.step0.disconfirmingEvidence}
                onChange={(v) => setState((s) => ({ ...s, step0: { ...s.step0, disconfirmingEvidence: v } }))}
                rows={3}
              />
            </div>
          </div>

        {/* A1 */}
        <SectionTitle>A1 — Engagement scan</SectionTitle>
          <p className="px-6 text-sm text-slate-600 mb-4">
            List tasks you naturally choose or want to repeat. Score 1–5 (1 Avoid / 3 Neutral / 5 Seek it).
          </p>

          <div className="px-6 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-xs text-slate-600">
                <tr className="border-b">
                  <th className="py-2 pr-3">Task / activity</th>
                  <th className="py-2 pr-3">Context</th>
                  <th className="py-2 pr-3">Why it pulls me (1 line)</th>
                  <th className="py-2 pr-3 w-28">Score</th>
                  <th className="py-2 w-10" />
                </tr>
              </thead>
              <tbody>
                {state.a1.rows.map((r) => (
                  <tr key={r.id} className="border-b align-top">
                    <td className="py-2 pr-3">
                      <Input
                        value={r.task}
                        onChange={(v) =>
                          setState((s) => ({
                            ...s,
                            a1: { rows: s.a1.rows.map((x) => (x.id === r.id ? { ...x, task: v } : x)) },
                          }))
                        }
                      />
                    </td>
                    <td className="py-2 pr-3">
                      <Input
                        value={r.context}
                        onChange={(v) =>
                          setState((s) => ({
                            ...s,
                            a1: { rows: s.a1.rows.map((x) => (x.id === r.id ? { ...x, context: v } : x)) },
                          }))
                        }
                      />
                    </td>
                    <td className="py-2 pr-3">
                      <Input
                        value={r.why}
                        onChange={(v) =>
                          setState((s) => ({
                            ...s,
                            a1: { rows: s.a1.rows.map((x) => (x.id === r.id ? { ...x, why: v } : x)) },
                          }))
                        }
                      />
                    </td>
                    <td className="py-2 pr-3">
                      <SelectScore
                        value={r.score}
                        onChange={(v) =>
                          setState((s) => ({
                            ...s,
                            a1: { rows: s.a1.rows.map((x) => (x.id === r.id ? { ...x, score: v } : x)) },
                          }))
                        }
                      />
                    </td>
                    <td className="py-2">
                      <button
                        className="text-slate-500 hover:text-slate-900"
                        title="Remove row"
                        onClick={() =>
                          setState((s) => ({ ...s, a1: { rows: s.a1.rows.filter((x) => x.id !== r.id) } }))
                        }
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            onClick={addA1Row}
            className="mt-3 ml-6 bg-gradient-to-r from-emerald-600 to-teal-600 px-3 py-2 2xl:px-6 2xl:py-4 text-sm font-semibold text-white shadow-sm"
          >
            + Add row
          </button>

        {/* A2 */}
        <SectionTitle>A2 — Excellence evidence</SectionTitle>
           <p className="px-6 text-sm text-slate-600 mb-4">
            Only write capabilities you can prove (metric, feedback, artifact link). Score 1–5 (1 Needs help / 3 Guided / 5 Independent + consistent quality).
          </p>

          <div className="px-6 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-xs text-slate-600">
                <tr className="border-b">
                  <th className="py-2 pr-3">Capability</th>
                  <th className="py-2 pr-3">Proof (metric/result/feedback/link)</th>
                  <th className="py-2 pr-3 w-32">Independence %</th>
                  <th className="py-2 pr-3 w-28">Score</th>
                  <th className="py-2 w-10" />
                </tr>
              </thead>
              <tbody>
                {state.a2.rows.map((r) => (
                  <tr key={r.id} className="border-b align-top">
                    <td className="py-2 pr-3">
                      <Input
                        value={r.capability}
                        onChange={(v) =>
                          setState((s) => ({
                            ...s,
                            a2: { rows: s.a2.rows.map((x) => (x.id === r.id ? { ...x, capability: v } : x)) },
                          }))
                        }
                      />
                    </td>
                    <td className="py-2 pr-3">
                      <Input
                        value={r.proof}
                        onChange={(v) =>
                          setState((s) => ({
                            ...s,
                            a2: { rows: s.a2.rows.map((x) => (x.id === r.id ? { ...x, proof: v } : x)) },
                          }))
                        }
                      />
                    </td>
                    <td className="py-2 pr-3">
                      <input
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                        type="number"
                        min={0}
                        max={100}
                        value={r.independencePct ?? ""}
                        onChange={(e) => {
                          const raw = e.target.value;
                          const num = raw === "" ? undefined : clamp(Number(raw), 0, 100);
                          setState((s) => ({
                            ...s,
                            a2: { rows: s.a2.rows.map((x) => (x.id === r.id ? { ...x, independencePct: num } : x)) },
                          }));
                        }}
                        placeholder="0–100"
                      />
                    </td>
                    <td className="py-2 pr-3">
                      <SelectScore
                        value={r.score}
                        onChange={(v) =>
                          setState((s) => ({
                            ...s,
                            a2: { rows: s.a2.rows.map((x) => (x.id === r.id ? { ...x, score: v } : x)) },
                          }))
                        }
                      />
                    </td>
                    <td className="py-2">
                      <button
                        className="text-slate-500 hover:text-slate-900"
                        title="Remove row"
                        onClick={() =>
                          setState((s) => ({ ...s, a2: { rows: s.a2.rows.filter((x) => x.id !== r.id) } }))
                        }
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            onClick={addA2Row}
            className="mt-3 ml-6 bg-gradient-to-r from-emerald-600 to-teal-600 px-3 py-2 2xl:px-6 2xl:py-4 text-sm font-semibold text-white shadow-sm"
          >
            + Add row
          </button>
 
        {/* A3 */}
        <SectionTitle>A3 — Element discovery (validated overlap)</SectionTitle>
           <div className="ml-6 mr-6 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
            <div className="font-medium">Auto-suggested overlaps (exact-match, score 4–5 in BOTH A1 and A2):</div>
            <div className="mt-1 text-slate-700">
              {computedOverlaps.length ? (
                <ul className="list-disc pl-5">
                  {computedOverlaps.map((name) => (
                    <li key={name}>{name}</li>
                  ))}
                </ul>
              ) : (
                <span className="text-slate-600">No overlaps detected yet (this is normal early on).</span>
              )}
            </div>
          </div>

          <SubTitle>Overlap items (manual / validated)</SubTitle>
          <div className="px-6 overflow-x-auto mt-2">
            <table className="min-w-full text-sm">
              <thead className="text-left text-xs text-slate-600">
                <tr className="border-b">
                  <th className="py-2 pr-3">Overlap item</th>
                  <th className="py-2 pr-3">Evidence reference</th>
                  <th className="py-2 pr-3 w-36">Confidence</th>
                  <th className="py-2 w-10" />
                </tr>
              </thead>
              <tbody>
                {state.a3.overlaps.map((r) => (
                  <tr key={r.id} className="border-b align-top">
                    <td className="py-2 pr-3">
                      <Input
                        value={r.overlapItem}
                        onChange={(v) =>
                          setState((s) => ({
                            ...s,
                            a3: {
                              ...s.a3,
                              overlaps: s.a3.overlaps.map((x) =>
                                x.id === r.id ? { ...x, overlapItem: v } : x
                              ),
                            },
                          }))
                        }
                      />
                    </td>
                    <td className="py-2 pr-3">
                      <Input
                        value={r.evidenceRef}
                        onChange={(v) =>
                          setState((s) => ({
                            ...s,
                            a3: {
                              ...s.a3,
                              overlaps: s.a3.overlaps.map((x) =>
                                x.id === r.id ? { ...x, evidenceRef: v } : x
                              ),
                            },
                          }))
                        }
                      />
                    </td>
                    <td className="py-2 pr-3">
                      <SelectConfidence
                        value={r.confidence}
                        onChange={(v) =>
                          setState((s) => ({
                            ...s,
                            a3: {
                              ...s.a3,
                              overlaps: s.a3.overlaps.map((x) =>
                                x.id === r.id ? { ...x, confidence: v } : x
                              ),
                            },
                          }))
                        }
                      />
                    </td>
                    <td className="py-2">
                      <button
                        className="text-slate-500 hover:text-slate-900"
                        title="Remove row"
                        onClick={() =>
                          setState((s) => ({
                            ...s,
                            a3: { ...s.a3, overlaps: s.a3.overlaps.filter((x) => x.id !== r.id) },
                          }))
                        }
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            onClick={addOverlapRow}
            className="mt-3 ml-6 bg-gradient-to-r from-emerald-600 to-teal-600 px-3 py-2 2xl:px-6 2xl:py-4 text-sm font-semibold text-white shadow-sm"
          >
            + Add overlap
          </button>

          <SubTitle>Element themes (choose 1–2)</SubTitle>
          <div className="px-6 grid grid-cols-1 gap-2 md:grid-cols-2">
            <Checkbox
              checked={state.a3.themes.communicationPeople}
              onChange={(v) => setState((s) => ({ ...s, a3: { ...s.a3, themes: { ...s.a3.themes, communicationPeople: v } } }))}
              label="Communication & People"
            />
            <Checkbox
              checked={state.a3.themes.analysisInsight}
              onChange={(v) => setState((s) => ({ ...s, a3: { ...s.a3, themes: { ...s.a3.themes, analysisInsight: v } } }))}
              label="Analysis & Insight"
            />
            <Checkbox
              checked={state.a3.themes.buildSystems}
              onChange={(v) => setState((s) => ({ ...s, a3: { ...s.a3, themes: { ...s.a3.themes, buildSystems: v } } }))}
              label="Build & Systems"
            />
            <Checkbox
              checked={state.a3.themes.operationsProcess}
              onChange={(v) => setState((s) => ({ ...s, a3: { ...s.a3, themes: { ...s.a3.themes, operationsProcess: v } } }))}
              label="Operations & Process"
            />
            <div className="flex items-center gap-3">
              <Checkbox
                checked={state.a3.themes.otherEnabled}
                onChange={(v) => setState((s) => ({ ...s, a3: { ...s.a3, themes: { ...s.a3.themes, otherEnabled: v } } }))}
                label="Other"
              />
              {state.a3.themes.otherEnabled && (
                <div className="flex-1">
                  <Input
                    value={state.a3.themes.otherText}
                    onChange={(v) => setState((s) => ({ ...s, a3: { ...s.a3, themes: { ...s.a3.themes, otherText: v } } }))}
                    placeholder="Theme name"
                  />
                </div>
              )}
            </div>
          </div>

          <SubTitle>Element statement</SubTitle>
          <div className="px-6">
            <TextArea
            value={state.a3.elementStatement}
            onChange={(v) => setState((s) => ({ ...s, a3: { ...s.a3, elementStatement: v } }))}
            placeholder="I am in my element when I ____ for ____ using ____ to achieve ____."
            rows={3}
            />
          </div>
 
          <SubTitle>Element proof pack (3 bullets + 1 artifact link)</SubTitle>
          <div className="px-6 grid grid-cols-1 gap-3 md:grid-cols-3">
            <div>
              <Label>Proof 1</Label>
              <Input value={state.a3.proof1} onChange={(v) => setState((s) => ({ ...s, a3: { ...s.a3, proof1: v } }))} />
            </div>
            <div>
              <Label>Proof 2</Label>
              <Input value={state.a3.proof2} onChange={(v) => setState((s) => ({ ...s, a3: { ...s.a3, proof2: v } }))} />
            </div>
            <div>
              <Label>Proof 3</Label>
              <Input value={state.a3.proof3} onChange={(v) => setState((s) => ({ ...s, a3: { ...s.a3, proof3: v } }))} />
            </div>
          </div>
          <div className="px-6 mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <Label>Artifact link / reference</Label>
              <Input value={state.a3.artifactLink} onChange={(v) => setState((s) => ({ ...s, a3: { ...s.a3, artifactLink: v } }))} />
            </div>
            <div>
              <Label>Element score (1–5)</Label>
              <SelectScore value={state.a3.elementScore} onChange={(v) => setState((s) => ({ ...s, a3: { ...s.a3, elementScore: v } }))} />
            </div>
          </div>
 
        {/* A4 */}
        <SectionTitle>A4 — Energy and environment (heat applied)</SectionTitle>
           <div className="px-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label>Weekly capacity (hours/week)</Label>
              <input
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                type="number"
                min={0}
                value={state.a4.weeklyCapacityHrs ?? ""}
                onChange={(e) => {
                  const raw = e.target.value;
                  const num = raw === "" ? undefined : clamp(Number(raw), 0, 200);
                  setState((s) => ({ ...s, a4: { ...s.a4, weeklyCapacityHrs: num } }));
                }}
                placeholder="e.g., 10"
              />
            </div>
            <div>
              <Label>Best time blocks</Label>
              <Input
                value={state.a4.bestTimeBlocks}
                onChange={(v) => setState((s) => ({ ...s, a4: { ...s.a4, bestTimeBlocks: v } }))}
                placeholder="e.g., Mon/Wed mornings"
              />
            </div>
          </div>

          <div className="mt-4 px-6">
            <Label>Constraints</Label>
            <TextArea
              value={state.a4.constraints}
              onChange={(v) => setState((s) => ({ ...s, a4: { ...s.a4, constraints: v } }))}
              rows={3}
            />
          </div>

          <SubTitle>Guardrails</SubTitle>
          <div className="px-6 grid grid-cols-1 gap-2 md:grid-cols-2">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={state.a4.guardrails.maxHrsEnabled}
                onChange={(v) => setState((s) => ({ ...s, a4: { ...s.a4, guardrails: { ...s.a4.guardrails, maxHrsEnabled: v } } }))}
                label="≤ ___ hrs/week"
              />
              {state.a4.guardrails.maxHrsEnabled && (
                <input
                  className="w-32 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                  type="number"
                  min={0}
                  value={state.a4.guardrails.maxHrs ?? ""}
                  onChange={(e) => {
                    const raw = e.target.value;
                    const num = raw === "" ? undefined : clamp(Number(raw), 0, 200);
                    setState((s) => ({ ...s, a4: { ...s.a4, guardrails: { ...s.a4.guardrails, maxHrs: num } } }));
                  }}
                  placeholder="hrs"
                />
              )}
            </div>

            <Checkbox
              checked={state.a4.guardrails.restDayEnabled}
              onChange={(v) => setState((s) => ({ ...s, a4: { ...s.a4, guardrails: { ...s.a4.guardrails, restDayEnabled: v } } }))}
              label="1 rest day/week"
            />

            <div className="flex items-center gap-3">
              <Checkbox
                checked={state.a4.guardrails.sleepMinEnabled}
                onChange={(v) => setState((s) => ({ ...s, a4: { ...s.a4, guardrails: { ...s.a4.guardrails, sleepMinEnabled: v } } }))}
                label="Sleep min ___ hrs"
              />
              {state.a4.guardrails.sleepMinEnabled && (
                <input
                  className="w-32 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                  type="number"
                  min={0}
                  value={state.a4.guardrails.sleepMinHrs ?? ""}
                  onChange={(e) => {
                    const raw = e.target.value;
                    const num = raw === "" ? undefined : clamp(Number(raw), 0, 24);
                    setState((s) => ({ ...s, a4: { ...s.a4, guardrails: { ...s.a4.guardrails, sleepMinHrs: num } } }));
                  }}
                  placeholder="hrs"
                />
              )}
            </div>

            <Checkbox
              checked={state.a4.guardrails.breaksEnabled}
              onChange={(v) => setState((s) => ({ ...s, a4: { ...s.a4, guardrails: { ...s.a4.guardrails, breaksEnabled: v } } }))}
              label="Breaks"
            />

            <div className="flex items-center gap-3">
              <Checkbox
                checked={state.a4.guardrails.movementEnabled}
                onChange={(v) => setState((s) => ({ ...s, a4: { ...s.a4, guardrails: { ...s.a4.guardrails, movementEnabled: v } } }))}
                label="Movement ___ times/week"
              />
              {state.a4.guardrails.movementEnabled && (
                <input
                  className="w-32 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                  type="number"
                  min={0}
                  value={state.a4.guardrails.movementTimes ?? ""}
                  onChange={(e) => {
                    const raw = e.target.value;
                    const num = raw === "" ? undefined : clamp(Number(raw), 0, 21);
                    setState((s) => ({ ...s, a4: { ...s.a4, guardrails: { ...s.a4.guardrails, movementTimes: num } } }));
                  }}
                  placeholder="times"
                />
              )}
            </div>

            <div className="flex items-center gap-3">
              <Checkbox
                checked={state.a4.guardrails.noTaskAfterEnabled}
                onChange={(v) => setState((s) => ({ ...s, a4: { ...s.a4, guardrails: { ...s.a4.guardrails, noTaskAfterEnabled: v } } }))}
                label="No task after ___"
              />
              {state.a4.guardrails.noTaskAfterEnabled && (
                <Input
                  value={state.a4.guardrails.noTaskAfter ?? ""}
                  onChange={(v) => setState((s) => ({ ...s, a4: { ...s.a4, guardrails: { ...s.a4.guardrails, noTaskAfter: v } } }))}
                  placeholder="e.g., 9pm"
                />
              )}
            </div>

            <div className="flex items-center gap-3">
              <Checkbox
                checked={state.a4.guardrails.otherEnabled}
                onChange={(v) => setState((s) => ({ ...s, a4: { ...s.a4, guardrails: { ...s.a4.guardrails, otherEnabled: v } } }))}
                label="Other"
              />
              {state.a4.guardrails.otherEnabled && (
                <Input
                  value={state.a4.guardrails.otherText}
                  onChange={(v) => setState((s) => ({ ...s, a4: { ...s.a4, guardrails: { ...s.a4.guardrails, otherText: v } } }))}
                  placeholder="Guardrail"
                />
              )}
            </div>
          </div>

          <SubTitle>Risk flags</SubTitle>
          <div className="px-6 grid grid-cols-1 gap-2 md:grid-cols-2">
            <Checkbox
              checked={state.a4.riskFlags.inconsistentSleep}
              onChange={(v) => setState((s) => ({ ...s, a4: { ...s.a4, riskFlags: { ...s.a4.riskFlags, inconsistentSleep: v } } }))}
              label="inconsistent sleep"
            />
            <Checkbox
              checked={state.a4.riskFlags.tooManyCommitments}
              onChange={(v) => setState((s) => ({ ...s, a4: { ...s.a4, riskFlags: { ...s.a4.riskFlags, tooManyCommitments: v } } }))}
              label="too many commitments"
            />
            <Checkbox
              checked={state.a4.riskFlags.poorBoundaries}
              onChange={(v) => setState((s) => ({ ...s, a4: { ...s.a4, riskFlags: { ...s.a4.riskFlags, poorBoundaries: v } } }))}
              label="poor boundaries"
            />
            <Checkbox
              checked={state.a4.riskFlags.highStress}
              onChange={(v) => setState((s) => ({ ...s, a4: { ...s.a4, riskFlags: { ...s.a4.riskFlags, highStress: v } } }))}
              label="high stress"
            />
            <div className="flex items-center gap-3">
              <Checkbox
                checked={state.a4.riskFlags.otherEnabled}
                onChange={(v) => setState((s) => ({ ...s, a4: { ...s.a4, riskFlags: { ...s.a4.riskFlags, otherEnabled: v } } }))}
                label="other"
              />
              {state.a4.riskFlags.otherEnabled && (
                <Input
                  value={state.a4.riskFlags.otherText}
                  onChange={(v) => setState((s) => ({ ...s, a4: { ...s.a4, riskFlags: { ...s.a4.riskFlags, otherText: v } } }))}
                  placeholder="Risk flag"
                />
              )}
            </div>
          </div>

          <div className="mt-4 px-6">
            <Label>Energy score (1–5): </Label>
            <SelectScore
              value={state.a4.energyScore}
              onChange={(v) => setState((s) => ({ ...s, a4: { ...s.a4, energyScore: v } }))}
            />
          </div>
 
        {/* A5 */}
        <SectionTitle>A5 — Earning (role alignment + 2-week plan)</SectionTitle>
           <p className="px-6 text-sm text-slate-600 mb-4">
            Use 3–5 job posts or KRAs. Fill the top gaps and define the next 2-week actions.
          </p>

          <div className="px-6 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-xs text-slate-600">
                <tr className="border-b">
                  <th className="py-2 pr-3">Role requirement</th>
                  <th className="py-2 pr-3">Current proof</th>
                  <th className="py-2 pr-3 w-24">Gap (L/M/H)</th>
                  <th className="py-2 pr-3">Next 2-week action</th>
                  <th className="py-2 w-10" />
                </tr>
              </thead>
              <tbody>
                {state.a5.rows.map((r) => (
                  <tr key={r.id} className="border-b align-top">
                    <td className="py-2 pr-3">
                      <Input
                        value={r.roleRequirement}
                        onChange={(v) =>
                          setState((s) => ({
                            ...s,
                            a5: { ...s.a5, rows: s.a5.rows.map((x) => (x.id === r.id ? { ...x, roleRequirement: v } : x)) },
                          }))
                        }
                      />
                    </td>
                    <td className="py-2 pr-3">
                      <Input
                        value={r.currentProof}
                        onChange={(v) =>
                          setState((s) => ({
                            ...s,
                            a5: { ...s.a5, rows: s.a5.rows.map((x) => (x.id === r.id ? { ...x, currentProof: v } : x)) },
                          }))
                        }
                      />
                    </td>
                    <td className="py-2 pr-3">
                      <SelectGap
                        value={r.gap}
                        onChange={(v) =>
                          setState((s) => ({
                            ...s,
                            a5: { ...s.a5, rows: s.a5.rows.map((x) => (x.id === r.id ? { ...x, gap: v } : x)) },
                          }))
                        }
                      />
                    </td>
                    <td className="py-2 pr-3">
                      <Input
                        value={r.next2WeekAction}
                        onChange={(v) =>
                          setState((s) => ({
                            ...s,
                            a5: { ...s.a5, rows: s.a5.rows.map((x) => (x.id === r.id ? { ...x, next2WeekAction: v } : x)) },
                          }))
                        }
                      />
                    </td>
                    <td className="py-2">
                      <button
                        className="text-slate-500 hover:text-slate-900"
                        title="Remove row"
                        onClick={() =>
                          setState((s) => ({ ...s, a5: { ...s.a5, rows: s.a5.rows.filter((x) => x.id !== r.id) } }))
                        }
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            onClick={addA5Row}
            className="mt-3 ml-6 bg-gradient-to-r from-emerald-600 to-teal-600 px-3 py-2 2xl:px-6 2xl:py-4 text-sm font-semibold text-white shadow-sm"
          >
            + Add row
          </button>

          <div className="px-6 mt-4">
            <Label>Earning score (1–5)</Label>
            <SelectScore
              value={state.a5.earningScore}
              onChange={(v) => setState((s) => ({ ...s, a5: { ...s.a5, earningScore: v } }))}
            />
          </div>
 
        {/* Final snapshot */}
        <SectionTitle>Final 5E snapshot</SectionTitle>
           <div className="px-6 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-xs text-slate-600">
                <tr className="border-b">
                  <th className="py-2 pr-3 w-36">5E</th>
                  <th className="py-2 pr-3 w-24">Score</th>
                  <th className="py-2 pr-3">One-line evidence</th>
                  <th className="py-2 pr-3">Next fix (2 weeks)</th>
                </tr>
              </thead>
              <tbody>
                {state.finalSnapshot.rows.map((r) => (
                  <tr key={r.id} className="border-b align-top">
                    <td className="py-2 pr-3 font-medium">{r.e}</td>
                    <td className="py-2 pr-3">
                      <SelectScore
                        value={r.score}
                        onChange={(v) =>
                          setState((s) => ({
                            ...s,
                            finalSnapshot: {
                              ...s.finalSnapshot,
                              rows: s.finalSnapshot.rows.map((x) => (x.id === r.id ? { ...x, score: v } : x)),
                            },
                          }))
                        }
                      />
                    </td>
                    <td className="py-2 pr-3">
                      <Input
                        value={r.evidence}
                        onChange={(v) =>
                          setState((s) => ({
                            ...s,
                            finalSnapshot: {
                              ...s.finalSnapshot,
                              rows: s.finalSnapshot.rows.map((x) => (x.id === r.id ? { ...x, evidence: v } : x)),
                            },
                          }))
                        }
                      />
                    </td>
                    <td className="py-2 pr-3">
                      <Input
                        value={r.nextFix}
                        onChange={(v) =>
                          setState((s) => ({
                            ...s,
                            finalSnapshot: {
                              ...s.finalSnapshot,
                              rows: s.finalSnapshot.rows.map((x) => (x.id === r.id ? { ...x, nextFix: v } : x)),
                            },
                          }))
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <SubTitle>Readiness decision</SubTitle>
          <div className="px-6 grid grid-cols-1 gap-2 md:grid-cols-3">
            <Radio
              name="readiness"
              checked={state.finalSnapshot.readinessDecision === "ReadyNow"}
              onChange={() => setState((s) => ({ ...s, finalSnapshot: { ...s.finalSnapshot, readinessDecision: "ReadyNow" } }))}
              label="Ready now"
            />
            <Radio
              name="readiness"
              checked={state.finalSnapshot.readinessDecision === "ReadyWithConditions"}
              onChange={() =>
                setState((s) => ({ ...s, finalSnapshot: { ...s.finalSnapshot, readinessDecision: "ReadyWithConditions" } }))
              }
              label="Ready with conditions"
            />
            <Radio
              name="readiness"
              checked={state.finalSnapshot.readinessDecision === "NotReadyYet"}
              onChange={() =>
                setState((s) => ({ ...s, finalSnapshot: { ...s.finalSnapshot, readinessDecision: "NotReadyYet" } }))
              }
              label="Not ready yet"
            />
          </div>

          {state.finalSnapshot.readinessDecision === "ReadyWithConditions" && (
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <Label>Condition 1</Label>
                <Input
                  value={state.finalSnapshot.readyConditions1}
                  onChange={(v) => setState((s) => ({ ...s, finalSnapshot: { ...s.finalSnapshot, readyConditions1: v } }))}
                />
              </div>
              <div>
                <Label>Condition 2</Label>
                <Input
                  value={state.finalSnapshot.readyConditions2}
                  onChange={(v) => setState((s) => ({ ...s, finalSnapshot: { ...s.finalSnapshot, readyConditions2: v } }))}
                />
              </div>
            </div>
          )}

          {state.finalSnapshot.readinessDecision === "NotReadyYet" && (
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <Label>Top blocker 1</Label>
                <Input
                  value={state.finalSnapshot.notReadyBlocker1}
                  onChange={(v) => setState((s) => ({ ...s, finalSnapshot: { ...s.finalSnapshot, notReadyBlocker1: v } }))}
                />
              </div>
              <div>
                <Label>Top blocker 2</Label>
                <Input
                  value={state.finalSnapshot.notReadyBlocker2}
                  onChange={(v) => setState((s) => ({ ...s, finalSnapshot: { ...s.finalSnapshot, notReadyBlocker2: v } }))}
                />
              </div>
            </div>
          )}

          <SubTitle>Mentor / sponsor validation</SubTitle>
          <div className="px-6 grid grid-cols-1 gap-2 md:grid-cols-3">
            <Radio
              name="mentorDecision"
              checked={state.finalSnapshot.mentorDecision === "agree"}
              onChange={() => setState((s) => ({ ...s, finalSnapshot: { ...s.finalSnapshot, mentorDecision: "agree" } }))}
              label="agree"
            />
            <Radio
              name="mentorDecision"
              checked={state.finalSnapshot.mentorDecision === "adjustScores"}
              onChange={() =>
                setState((s) => ({ ...s, finalSnapshot: { ...s.finalSnapshot, mentorDecision: "adjustScores" } }))
              }
              label="adjust scores"
            />
            <Radio
              name="mentorDecision"
              checked={state.finalSnapshot.mentorDecision === "adjustElement"}
              onChange={() =>
                setState((s) => ({ ...s, finalSnapshot: { ...s.finalSnapshot, mentorDecision: "adjustElement" } }))
              }
              label="adjust Element"
            />
          </div>

          {state.finalSnapshot.mentorDecision && state.finalSnapshot.mentorDecision !== "agree" && (
            <div className="mt-3">
              <Label>If adjusted, why (1–2 lines)</Label>
              <TextArea
                value={state.finalSnapshot.mentorAdjustWhy}
                onChange={(v) => setState((s) => ({ ...s, finalSnapshot: { ...s.finalSnapshot, mentorAdjustWhy: v } }))}
                rows={2}
              />
            </div>
          )}

          <div className="px-6 mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
            <div>
              <Label>Mentor / sponsor name</Label>
              <Input
                value={state.finalSnapshot.mentorName}
                onChange={(v) => setState((s) => ({ ...s, finalSnapshot: { ...s.finalSnapshot, mentorName: v } }))}
              />
            </div>
            <div>
              <Label>Signature</Label>
              <Input
                value={state.finalSnapshot.mentorSignature}
                onChange={(v) => setState((s) => ({ ...s, finalSnapshot: { ...s.finalSnapshot, mentorSignature: v } }))}
              />
            </div>
            <div>
              <Label>Date</Label>
              <Input
                type="date"
                value={state.finalSnapshot.mentorDate}
                onChange={(v) => setState((s) => ({ ...s, finalSnapshot: { ...s.finalSnapshot, mentorDate: v } }))}
              />
            </div>
          </div>
 
        <div className="py-10 print:hidden text-center text-xs text-slate-500">
          Tip: Use <span className="font-medium">Print</span> to generate a PDF from your browser.
        </div>
      </div>
    </div>
</div>    
  );
}