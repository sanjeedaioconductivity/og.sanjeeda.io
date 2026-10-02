"use client";

import React, { useState } from "react";
import { BarChart3, CalendarDays, ClipboardCheck, ListChecks, Percent, Plus, Save, Trash2, X } from "lucide-react";
import {
  PGP_EVALUATION_TEMPLATE,
  PGP_PORTFOLIO_TEMPLATE,
  PROGRESS_STATUSES,
  ROW_STATUS_OPTIONS,
  progressCounts,
  renumberPortfolio,
  totalScheduledHours,
  totalWeightage,
  type CapstoneTimeline,
  type EvaluationItem,
  type Mentor,
  type PortfolioItem,
  type Program,
  type SessionFlow,
  type WeeklySchedule,
} from "./pgpProgram";

/**
 * The admin's create/edit surface for one program: the details form and the
 * five row tables, with Save / Cancel. It lives on the program's own page
 * (/pgp-admin/program/<id>, or /new); the Programs list only lists.
 *
 * Works on its own copy of the program, so Cancel simply throws it away.
 * `onSaved` receives the API's message and the saved record (whose `_id` is
 * what a freshly created program is then opened by).
 */

type EditorTab = "details" | "dashboard" | "schedule" | "flow" | "capstone" | "portfolio";

const EDITOR_TABS: { key: EditorTab; label: string }[] = [
  { key: "details", label: "Program Details" },
  { key: "dashboard", label: "Dashboard" },
  { key: "schedule", label: "Weekly Schedule" },
  { key: "flow", label: "Session Flow" },
  { key: "capstone", label: "Capstone Timeline" },
  { key: "portfolio", label: "Portfolio Checklist" },
];

export default function ProgramEditor({
  program,
  mentors,
  onSaved,
  onCancel,
}: {
  program: Program;
  mentors: Mentor[];
  onSaved: (message: string, saved: { _id?: string } & Partial<Program>) => void;
  onCancel: () => void;
}) {
  const [editData, setEditData] = useState<Program>({ ...program });
  const [tab, setTab] = useState<EditorTab>("details");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const editing = true;

  function updateField(name: keyof Program, value: string | number) {
    setEditData({ ...editData, [name]: value });
  }

  function updateArrayItem<T>(
    field: keyof Program,
    index: number,
    key: keyof T,
    value: string
  ) {
    const current = [...((editData[field] as T[]) || [])];
    current[index] = { ...current[index], [key]: value };
    setEditData({ ...editData, [field]: current });
  }

  async function save() {
    if (saving) return;

    // The weightage is a share of one whole: parts may be missing while the
    // plan is being drafted, but they can never add up to more than 100%.
    const weight = Math.round(totalWeightage(editData.evaluationPlan || []) * 100) / 100;
    if (weight > 100) {
      setError(`Assessment weightage totals ${weight}% — it cannot exceed 100%.`);
      setTab("dashboard");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/pgp-management/programs-pgp", {
        method: editData.programId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editData,
          recommendedDuration: `${editData.weeklySchedule.length} Weeks`,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Save failed.");
        return;
      }

      onSaved(data.message || "Program saved.", data.program || {});
    } catch {
      setError("Save failed. Check your connection.");
    } finally {
      setSaving(false);
    }
  }

/* ------------------------------ Row helpers ------------------------------ */

  function addWeeklySessionRow() {
    const weeklySchedule = [
      ...(editData.weeklySchedule || []),
      {
        week: "",
        module: "",
        sessionTitle: "",
        focus: "",
        activity: "",
        output: "",
        duration: "",
        status: "Not Started",
        notes: "",
      },
    ];

    setEditData({
      ...editData,
      weeklySchedule,
      recommendedDuration: `${weeklySchedule.length} Weeks`,
    });
  } 

  function removeWeeklySessionRow(index: number) {
    const weeklySchedule = [...editData.weeklySchedule];

    weeklySchedule.splice(index, 1);

    setEditData({
      ...editData,
      weeklySchedule,
      recommendedDuration: `${weeklySchedule.length} Weeks`,
    });
  } 

  function addSessionFlowRow() {
    setEditData({
      ...editData,
      sessionFlow: [
        ...(editData.sessionFlow || []),
        {
          week: "",
          activity: "",
          deliveryMode: "",
          resourceTemplate: "",
          portfolioLink: "",
        },
      ],
    });
  }

  function removeSessionFlowRow(index: number) {
    const rows = [...(editData.sessionFlow || [])];
    rows.splice(index, 1);

    setEditData({
      ...editData,
      sessionFlow: rows,
    });
  }

  function addCapstoneRow() {
    setEditData({
      ...editData,
      capstoneTimeline: [
        ...(editData.capstoneTimeline || []),
        {
          week: "",
          component: "",
          deliverable: "",
          due: "",
          status: "Not Started",
          notes: "",
        },
      ],
    });
  }

  function removeCapstoneRow(index: number) {
    const rows = [...(editData.capstoneTimeline || [])];
    rows.splice(index, 1);

    setEditData({
      ...editData,
      capstoneTimeline: rows,
    });
  }

  function addPortfolioRow() {
    setEditData({
      ...editData,
      portfolioChecklist: renumberPortfolio([
        ...(editData.portfolioChecklist || []),
        {
          no: "",
          item: "",
          relatedWeek: "",
          purpose: "",
          status: "Not Started",
          evidenceLink: "",
          facilitatorRemarks: "",
        },
      ]),
    });
  }

  function removePortfolioRow(index: number) {
    const rows = [...(editData.portfolioChecklist || [])];
    rows.splice(index, 1);

    setEditData({
      ...editData,
      portfolioChecklist: renumberPortfolio(rows),
    });
  }

  function loadPortfolioTemplate() {
    setEditData({
      ...editData,
      portfolioChecklist: renumberPortfolio([
        ...(editData.portfolioChecklist || []),
        ...PGP_PORTFOLIO_TEMPLATE.map((row) => ({ ...row })),
      ]),
    });
  }

  function addEvaluationRow() {
    setEditData({
      ...editData,
      evaluationPlan: [
        ...(editData.evaluationPlan || []),
        {
          area: "",
          weightage: "",
          evidenceRequired: "",
          evaluatorNotes: "",
        },
      ],
    });
  }

  function removeEvaluationRow(index: number) {
    const rows = [...(editData.evaluationPlan || [])];
    rows.splice(index, 1);

    setEditData({
      ...editData,
      evaluationPlan: rows,
    });
  }

  function loadEvaluationTemplate() {
    setEditData({
      ...editData,
      evaluationPlan: [
        ...(editData.evaluationPlan || []),
        ...PGP_EVALUATION_TEMPLATE.map((row) => ({ ...row })),
      ],
    });
  }

  return (
    <div>
      {/* Same tab bar as the mentor's program page, with Save / Cancel at the end. */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-slate-200 px-2 py-1.5 dark:border-white/10">
        {EDITOR_TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`rounded-lg px-3 py-1.5 text-[11px] font-bold transition ${
              tab === t.key
                ? "bg-[#0b2f5b] text-white shadow-sm"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/10"
            }`}
          >
            {t.label}
          </button>
        ))}

        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60"
          >
            <Save size={12} />
            {saving ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-[11px] font-bold text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-100 disabled:opacity-60 dark:bg-white/5 dark:text-slate-200 dark:ring-white/10 dark:hover:bg-white/10"
          >
            <X size={12} />
            Cancel
          </button>
        </div>
      </div>

      {error && (
        <p className="border-b border-rose-100 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700">
          {error}
        </p>
      )}

      <div className="p-3">
        {tab === "details" && (
          <OverviewTab
            editData={editData}
            mentors={mentors}
            editing={editing}
            updateField={updateField}
          />
        )}
        {tab === "schedule" && (
          <ScheduleTab
            data={editData.weeklySchedule || []}
            editing={editing}
            update={(index, key, value) =>
              updateArrayItem<WeeklySchedule>("weeklySchedule", index, key, value)
            }
            addRow={addWeeklySessionRow}
            removeRow={removeWeeklySessionRow}
          />
        )}
        {tab === "flow" && (
          <FlowTab
            data={editData.sessionFlow || []}
            weeklySchedule={editData.weeklySchedule || []}
            editing={editing}
            update={(index, key, value) =>
              updateArrayItem<SessionFlow>("sessionFlow", index, key, value)
            }
            addRow={addSessionFlowRow}
            removeRow={removeSessionFlowRow}
          />
        )}
        {tab === "capstone" && (
          <CapstoneTab
            data={editData.capstoneTimeline || []}
            weeklySchedule={editData.weeklySchedule || []}
            editing={editing}
            update={(index, key, value) =>
              updateArrayItem<CapstoneTimeline>("capstoneTimeline", index, key, value)
            }
            addRow={addCapstoneRow}
            removeRow={removeCapstoneRow}
          />
        )}
        {tab === "portfolio" && (
          <PortfolioTab
            data={editData.portfolioChecklist || []}
            weeklySchedule={editData.weeklySchedule || []}
            editing={editing}
            update={(index, key, value) =>
              updateArrayItem<PortfolioItem>("portfolioChecklist", index, key, value)
            }
            addRow={addPortfolioRow}
            removeRow={removePortfolioRow}
            loadTemplate={loadPortfolioTemplate}
          />
        )}
        {tab === "dashboard" && (
          <DashboardTab
            editData={editData}
            editing={editing}
            updateField={updateField}
            evaluation={{
              update: (index, key, value) =>
                updateArrayItem<EvaluationItem>("evaluationPlan", index, key, value),
              addRow: addEvaluationRow,
              removeRow: removeEvaluationRow,
              loadTemplate: loadEvaluationTemplate,
            }}
          />
        )}
      </div>
    </div>
  );
}

/* ------------------------------ Tab editors ------------------------------ */

function OverviewTab({
  editData,
  mentors,
  editing,
  updateField,
}: {
  editData: Program;
  mentors: Mentor[];
  editing: boolean;
  updateField: (name: keyof Program, value: string | number) => void;
}) {
  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-4 flex items-center gap-2">
        <span className="text-blue-900">
          <CalendarDays size={15} />
        </span>
        <h3 className="text-sm font-black tracking-tight text-slate-900 dark:text-white">
          Program Master
        </h3>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Input label="Program Name" value={editData.programName} disabled={!editing} onChange={(v) => updateField("programName", v)} />

        <div>
          <span className={FORM_LABEL}>Recommended Duration</span>
          <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-500 ring-1 ring-inset ring-slate-200">
            {editData.weeklySchedule?.length
              ? `${editData.weeklySchedule.length} Weeks`
              : "0 Weeks"}
            <span className="text-[10px] font-semibold text-slate-400">
              (auto)
            </span>
          </div>
        </div>

        <Select
          label="Status"
          value={editData.status}
          disabled={!editing}
          options={["Draft", "Active", "Completed", "Paused"]}
          onChange={(v) => updateField("status", v)}
        />

        <Input type="date" label="Start Date" value={editData.startDate} disabled={!editing} onChange={(v) => updateField("startDate", v)} />
        <Input type="date" label="End Date" value={editData.endDate} disabled={!editing} onChange={(v) => updateField("endDate", v)} />

        <Select
          label="Assigned Mentor"
          value={editData.assignedMentorId}
          disabled={!editing}
          options={mentors.map((m) => ({
            label: `${m.fullName} (${m.email})`,
            value: m.mentorId,
          }))}
          onChange={(v) => updateField("assignedMentorId", v)}
        />

        <Textarea label="Program Promise" value={editData.programPromise} disabled={!editing} onChange={(v) => updateField("programPromise", v)} />
      </div>

    </div>
  );
}

/** A titled block of the Dashboard form, ruled off from the one above. */
function FormSection({
  icon,
  title,
  hint,
  first = false,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  hint?: string;
  first?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className={first ? "" : "mt-6 border-t border-slate-200 pt-5 dark:border-white/10"}>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="text-blue-900">{icon}</span>
        <h3 className="text-sm font-black tracking-tight text-slate-900 dark:text-white">{title}</h3>
        {hint && <span className="text-[11px] font-semibold text-slate-400">{hint}</span>}
      </div>
      {children}
    </section>
  );
}

/**
 * What the Dashboard tab shows, as one form: the facts, the progress totals,
 * and the assessment weightage. The graph is not here — it is drawn on the
 * Dashboard from the saved weightage.
 */
function DashboardTab({
  editData,
  editing,
  updateField,
  evaluation,
}: {
  editData: Program;
  editing: boolean;
  updateField: (name: keyof Program, value: string | number) => void;
  evaluation: {
    update: (index: number, key: keyof EvaluationItem, value: string) => void;
    addRow: () => void;
    removeRow: (index: number) => void;
    loadTemplate: () => void;
  };
}) {
  const weekly = editData.weeklySchedule || [];
  const capstone = editData.capstoneTimeline || [];
  const portfolio = editData.portfolioChecklist || [];

  const progress = [
    { key: "Weekly", field: "progressWeeklyTotal" as const, counts: progressCounts(weekly, editData.progressWeeklyTotal), rows: weekly.length },
    { key: "Capstone", field: "progressCapstoneTotal" as const, counts: progressCounts(capstone, editData.progressCapstoneTotal), rows: capstone.length },
    { key: "Portfolio", field: "progressPortfolioTotal" as const, counts: progressCounts(portfolio, editData.progressPortfolioTotal), rows: portfolio.length },
  ];

  return (
    <div className="mx-auto max-w-4xl">
      <FormSection
        first
        icon={<ClipboardCheck size={15} />}
        title="Facts"
        hint="Blank = counted from the tables"
      >
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <Input
            type="number"
            label="Total Modules"
            value={String(editData.totalModules ?? "")}
            placeholder={`auto: ${weekly.length}`}
            disabled={!editing}
            onChange={(v) => updateField("totalModules", v)}
          />
          <Input
            type="number"
            label="Capstone Components"
            value={String(editData.capstoneComponents ?? "")}
            placeholder={`auto: ${capstone.length}`}
            disabled={!editing}
            onChange={(v) => updateField("capstoneComponents", v)}
          />
          <Input
            type="number"
            label="Portfolio Items"
            value={String(editData.portfolioItems ?? "")}
            placeholder={`auto: ${portfolio.length}`}
            disabled={!editing}
            onChange={(v) => updateField("portfolioItems", v)}
          />
          <Input
            type="number"
            label="Duration (weeks)"
            value={String(editData.durationWeeks ?? "")}
            placeholder={`auto: ${weekly.length}`}
            disabled={!editing}
            onChange={(v) => updateField("durationWeeks", v)}
          />
          <Input
            label="Per Session Hrs."
            value={editData.sessionDuration}
            placeholder="e.g. 3 hours"
            disabled={!editing}
            onChange={(v) => updateField("sessionDuration", v)}
          />
          <Input
            label="Frequency"
            value={editData.frequency}
            placeholder="e.g. 1 session per week"
            disabled={!editing}
            onChange={(v) => updateField("frequency", v)}
          />
          <Input
            type="number"
            label="Training Hours"
            value={String(editData.trainingHours ?? "")}
            placeholder={`auto: ${totalScheduledHours(weekly)}`}
            disabled={!editing}
            onChange={(v) => updateField("trainingHours", v)}
          />
          <Input
            type="number"
            label="Total Hrs."
            value={String(editData.totalHours || "")}
            disabled={!editing}
            onChange={(v) => updateField("totalHours", v)}
          />
          <Input
            label="Training Style"
            value={editData.trainingStyle}
            placeholder="e.g. 30% concepts + 70% practical application"
            disabled={!editing}
            onChange={(v) => updateField("trainingStyle", v)}
          />
          <Input
            label="Final Output"
            value={editData.finalOutput}
            placeholder="e.g. HR Fresher Portfolio + Capstone Project"
            disabled={!editing}
            onChange={(v) => updateField("finalOutput", v)}
          />
        </div>
      </FormSection>

      <FormSection
        icon={<ListChecks size={15} />}
        title="Progress"
        hint="The totals are yours; the mentor marks each row's status on Update Progress"
      >
        <div className="max-w-md overflow-x-auto rounded-lg ring-1 ring-slate-200 dark:ring-white/10">
          <table className="w-full border-collapse text-left text-[11px]">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400 dark:bg-white/5">
              <tr>
                <th className="px-2 py-1.5 font-bold">Status</th>
                {progress.map((col) => (
                  <th key={col.key} className="px-2 py-1.5 text-center font-bold">
                    {col.key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PROGRESS_STATUSES.map((status) => (
                <tr key={status} className="border-t border-slate-100 dark:border-white/5">
                  <td className="px-2 py-1.5 font-bold text-slate-700 dark:text-slate-200">{status}</td>
                  {progress.map((col) => (
                    <td
                      key={col.key}
                      className={`px-2 py-1.5 text-center font-bold tabular-nums ${
                        col.counts[status] > 0
                          ? "text-slate-900 dark:text-slate-100"
                          : "text-slate-300 dark:text-slate-600"
                      }`}
                    >
                      {col.counts[status]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/5">
                <td className="px-2 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Total
                </td>
                {progress.map((col) => (
                  <td key={col.key} className="px-1 py-1 text-center">
                    <input
                      type="number"
                      min={0}
                      value={String(editData[col.field] ?? "")}
                      placeholder={`auto: ${col.rows}`}
                      disabled={!editing}
                      onChange={(e) => updateField(col.field, e.target.value)}
                      title="Blank = the number of rows in the table"
                      className={`${FIELD} w-20 text-center font-black`}
                    />
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>
        <p className="mt-1.5 text-[11px] text-slate-400">
          Not Started is whatever the marks by the mentor leave, so the rows always add up to the total.
        </p>
      </FormSection>

      <FormSection
        icon={<Percent size={15} />}
        title="Assessment Weightage"
        hint="The areas share 100% between them"
      >
        <EvaluationTab
          data={editData.evaluationPlan || []}
          editing={editing}
          update={evaluation.update}
          addRow={evaluation.addRow}
          removeRow={evaluation.removeRow}
          loadTemplate={evaluation.loadTemplate}
        />
      </FormSection>

      <FormSection icon={<BarChart3 size={15} />} title="Graph">
        <p className="text-[11px] font-semibold text-slate-500">
          Nothing to fill in here: the Evaluation Plan graph is drawn on the Dashboard from the
          assessment weightage above once it is saved.
        </p>
      </FormSection>
    </div>
  );
}

function ScheduleTab({
  data,
  editing,
  update,
  addRow,
  removeRow,
}: {
  data: WeeklySchedule[];
  editing: boolean;
  update: (index: number, key: keyof WeeklySchedule, value: string) => void;
  addRow: () => void;
  removeRow: (index: number) => void;
}) {
  return (
    <div>
      {editing && (
        <div className="mb-3 flex justify-end">
          <AddRowButton label="Add Week" onClick={addRow} />
        </div>
      )}

    <TableWrap title="Weekly Session">
      <table className="w-full border-collapse text-left text-[11px]">
        <thead className="border-b border-slate-200 bg-slate-50">
          <tr>
            <Th>Week</Th>
            <Th>Module</Th>
            <Th>Session Title</Th>
            <Th>Key Focus Areas</Th>
            <Th>Practical Activity</Th>
            <Th>Output/Assignment</Th>
            <Th>Duration (hrs)</Th>
            <Th>Status</Th>
            <Th>Notes</Th>
            {editing && <Th>Action</Th>}
          </tr>
        </thead>

        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={editing ? 10 : 9}
                className="px-3 py-6 text-center text-slate-400"
              >
                No weekly session added.
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr
                key={`${row.week}-${i}`}
                className="border-b border-slate-100 dark:border-white/5 transition last:border-0 hover:bg-slate-50/70 dark:hover:bg-white/5"
              >
                <td className="min-w-[130px] px-2 py-2 align-top">
                  {editing ? (
                    <CellSelect
                      value={row.week}
                      options={Array.from(
                        { length: 15 },
                        (_, index) => `Week ${index + 1}`
                      )}
                      onChange={(v) => update(i, "week", v)}
                    />
                  ) : (
                    row.week
                  )}
                </td>

                <EditableCell
                  value={row.module}
                  disabled={!editing}
                  onChange={(v) => update(i, "module", v)}
                />

                <EditableCell
                  value={row.sessionTitle}
                  disabled={!editing}
                  onChange={(v) => update(i, "sessionTitle", v)}
                  wide
                />

                <EditableCell
                  value={row.focus}
                  disabled={!editing}
                  onChange={(v) => update(i, "focus", v)}
                  wide
                />

                <EditableCell
                  value={row.activity}
                  disabled={!editing}
                  onChange={(v) => update(i, "activity", v)}
                  wide
                />

                <EditableCell
                  value={row.output}
                  disabled={!editing}
                  onChange={(v) => update(i, "output", v)}
                  wide
                />

                <EditableCell
                  value={String(row.duration || "")}
                  disabled={!editing}
                  onChange={(v) => update(i, "duration", v)}
                />

                <EditableSelectCell
                  value={row.status}
                  disabled={!editing}
                  options={[
                    "Not Started",
                    "In Progress",
                    "Completed",
                    "Deferred",
                  ]}
                  onChange={(v) => update(i, "status", v)}
                />

                <EditableCell
                  value={row.notes || ""}
                  disabled={!editing}
                  onChange={(v) => update(i, "notes", v)}
                  wide
                />

                {editing && (
                  <td className="px-2 py-2 align-top">
                    <RemoveRowButton onClick={() => removeRow(i)} />
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </TableWrap>
    </div>
  );
}

function FlowTab({
  data,
  weeklySchedule,
  editing,
  update,
  addRow,
  removeRow,
}: {
  data: SessionFlow[];
  weeklySchedule: WeeklySchedule[];
  editing: boolean;
  update: (index: number, key: keyof SessionFlow, value: string) => void;
  addRow: () => void;
  removeRow: (index: number) => void;
}) {
  return (
    <div>
      {editing && (
        <div className="mb-3 flex justify-end">
          <AddRowButton label="Add Session" onClick={addRow} />
        </div>
      )}

      <TableWrap title="Session Flow">
        <table className="w-full border-collapse text-left text-[11px]">
          <thead className="border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
            <tr>
              <Th>Week</Th>
              <Th>Activity</Th>
              <Th>Delivery Mode</Th>
              <Th>Resource / Template</Th>
              <Th>Portfolio Link</Th>
              {editing && <Th>Action</Th>}
            </tr>
          </thead>

          <tbody>
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={editing ? 6 : 5}
                  className="px-3 py-6 text-center text-slate-400"
                >
                  No session activity added.
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr
                  key={i}
                  className="border-b border-slate-100 dark:border-white/5 transition last:border-0 hover:bg-slate-50/70 dark:hover:bg-white/5"
                >
                  <td className="min-w-[130px] px-2 py-2 align-top">
                    {editing ? (
                      <CellSelect
                        value={row.week}
                        options={weekOptions(weeklySchedule, row.week)}
                        onChange={(v) => update(i, "week", v)}
                      />
                    ) : (
                      row.week
                    )}
                  </td>

                  <EditableCell
                    value={row.activity}
                    disabled={!editing}
                    onChange={(v) => update(i, "activity", v)}
                    wide
                  />

                  <EditableCell
                    value={row.deliveryMode}
                    disabled={!editing}
                    onChange={(v) => update(i, "deliveryMode", v)}
                  />

                  <EditableCell
                    value={row.resourceTemplate}
                    disabled={!editing}
                    onChange={(v) => update(i, "resourceTemplate", v)}
                    wide
                  />

                  <EditableCell
                    value={row.portfolioLink}
                    disabled={!editing}
                    onChange={(v) => update(i, "portfolioLink", v)}
                    wide
                  />

                  {editing && (
                    <td className="px-2 py-2 align-top">
                      <RemoveRowButton onClick={() => removeRow(i)} />
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </TableWrap>
    </div>
  );
}

function CapstoneTab({
  data,
  weeklySchedule,
  editing,
  update,
  addRow,
  removeRow,
}: {
  data: CapstoneTimeline[];
  weeklySchedule: WeeklySchedule[];
  editing: boolean;
  update: (
    index: number,
    key: keyof CapstoneTimeline,
    value: string
  ) => void;
  addRow: () => void;
  removeRow: (index: number) => void;
}) {
  return (
    <div>
      {editing && (
        <div className="mb-3 flex justify-end">
          <AddRowButton label="Add Deliverable" onClick={addRow} />
        </div>
      )}

      <TableWrap title="Capstone Timeline">
        <table className="min-w-[1100px] border-collapse text-left text-[11px]">
          <thead className="border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
            <tr>
              <Th>Week</Th>
              <Th>Capstone Component</Th>
              <Th>Deliverable</Th>
              <Th>Suggested Due Point</Th>
              <Th>Status</Th>
              <Th>Facilitator Notes</Th>
              {editing && <Th>Action</Th>}
            </tr>
          </thead>

          <tbody>
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={editing ? 7 : 6}
                  className="px-3 py-6 text-center text-slate-400"
                >
                  No capstone deliverable added.
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr
                  key={i}
                  className="border-b border-slate-100 dark:border-white/5 transition last:border-0 hover:bg-slate-50/70 dark:hover:bg-white/5"
                >
                  <td className="min-w-[130px] px-2 py-2 align-top">
                    {editing ? (
                      <CellSelect
                        value={row.week}
                        options={weekOptions(weeklySchedule, row.week)}
                        onChange={(v) => update(i, "week", v)}
                      />
                    ) : (
                      row.week
                    )}
                  </td>

                  <EditableCell
                    value={row.component}
                    disabled={!editing}
                    onChange={(v) => update(i, "component", v)}
                    wide
                  />

                  <EditableCell
                    value={row.deliverable}
                    disabled={!editing}
                    onChange={(v) => update(i, "deliverable", v)}
                    wide
                  />

                  {/* Free text, as on the programme sheet: "End of Week 1", "Session Day". */}
                  <EditableCell
                    value={row.due}
                    disabled={!editing}
                    placeholder="e.g. End of Week 1"
                    onChange={(v) => update(i, "due", v)}
                  />

                  <EditableSelectCell
                    value={row.status}
                    disabled={!editing}
                    options={["Not Started", "In Progress", "Completed", "Delayed"]}
                    onChange={(v) => update(i, "status", v)}
                  />

                  <EditableCell
                    value={row.notes}
                    disabled={!editing}
                    onChange={(v) => update(i, "notes", v)}
                    wide
                  />

                  {editing && (
                    <td className="px-2 py-2 align-top">
                      <RemoveRowButton onClick={() => removeRow(i)} />
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </TableWrap>
    </div>
  );
}

/**
 * Weeks available in the dropdown. A row can reference a week the program has
 * not defined yet (the 9-week template loaded into a shorter program), so keep
 * the stored value selectable instead of rendering the cell blank.
 */
function weekOptions(weeklySchedule: WeeklySchedule[], current: string) {
  const weeks = weeklySchedule.map((w) => w.week).filter(Boolean);

  if (current && !weeks.includes(current)) {
    return [...weeks, current];
  }

  return weeks;
}

function PortfolioTab({
  data,
  weeklySchedule,
  editing,
  update,
  addRow,
  removeRow,
  loadTemplate,
}: {
  data: PortfolioItem[];
  weeklySchedule: WeeklySchedule[];
  editing: boolean;
  update: (index: number, key: keyof PortfolioItem, value: string) => void;
  addRow: () => void;
  removeRow: (index: number) => void;
  loadTemplate: () => void;
}) {
  const completed = data.filter((row) => row.status === "Completed").length;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] font-semibold text-slate-500">
          {data.length} items · {completed} completed
        </p>

        {editing && (
          <div className="flex gap-2">
            <AddRowButton
              label="Load PGP Template (20)"
              onClick={loadTemplate}
              variant="outline"
            />
            <AddRowButton label="Add Item" onClick={addRow} />
          </div>
        )}
      </div>

      <TableWrap title="Portfolio Checklist">
        <table className="min-w-[1150px] border-collapse text-left text-[11px]">
          <thead className="border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
            <tr>
              <Th>No.</Th>
              <Th>Portfolio Item</Th>
              <Th>Related Week</Th>
              <Th>Purpose</Th>
              <Th>Status</Th>
              <Th>Evidence / Link</Th>
              <Th>Facilitator Remarks</Th>
              {editing && <Th>Action</Th>}
            </tr>
          </thead>

          <tbody>
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={editing ? 8 : 7}
                  className="border px-3 py-4 text-center text-slate-500"
                >
                  No portfolio item added.
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr key={i} className="border-b">
                  <td className="border px-2 py-1 text-center font-bold text-slate-500">
                    {i + 1}
                  </td>

                  <EditableCell
                    value={row.item}
                    disabled={!editing}
                    onChange={(v) => update(i, "item", v)}
                    wide
                  />

                  <td className="min-w-[130px] px-2 py-2 align-top">
                    {editing ? (
                      <CellSelect
                        value={row.relatedWeek}
                        options={weekOptions(weeklySchedule, row.relatedWeek)}
                        onChange={(v) => update(i, "relatedWeek", v)}
                      />
                    ) : (
                      row.relatedWeek
                    )}
                  </td>

                  <EditableCell
                    value={row.purpose}
                    disabled={!editing}
                    onChange={(v) => update(i, "purpose", v)}
                    wide
                  />

                  <EditableSelectCell
                    value={row.status}
                    disabled={!editing}
                    options={ROW_STATUS_OPTIONS}
                    onChange={(v) => update(i, "status", v)}
                  />

                  <EditableCell
                    value={row.evidenceLink}
                    disabled={!editing}
                    onChange={(v) => update(i, "evidenceLink", v)}
                    wide
                  />

                  <EditableCell
                    value={row.facilitatorRemarks}
                    disabled={!editing}
                    onChange={(v) => update(i, "facilitatorRemarks", v)}
                    wide
                  />

                  {editing && (
                    <td className="px-2 py-2 align-top">
                      <RemoveRowButton onClick={() => removeRow(i)} />
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </TableWrap>
    </div>
  );
}

function EvaluationTab({
  data,
  editing,
  update,
  addRow,
  removeRow,
  loadTemplate,
}: {
  data: EvaluationItem[];
  editing: boolean;
  update: (index: number, key: keyof EvaluationItem, value: string) => void;
  addRow: () => void;
  removeRow: (index: number) => void;
  loadTemplate: () => void;
}) {
  const total = Math.round(totalWeightage(data) * 100) / 100;
  const balanced = total === 100;

  // Each area gets a share of one whole, so a share is capped at whatever
  // the other rows have left.
  function setWeightage(index: number, raw: string) {
    if (raw === "") {
      update(index, "weightage", "");
      return;
    }
    const others = data.reduce(
      (sum, row, i) => (i === index ? sum : sum + (Number(row.weightage) || 0)),
      0
    );
    const room = Math.max(0, 100 - others);
    const value = Math.max(0, Math.min(room, Number(raw) || 0));
    update(index, "weightage", String(value));
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-end gap-2">
        {editing && (
          <div className="flex gap-2">
            <AddRowButton
              label="Load PGP Template (6)"
              onClick={loadTemplate}
              variant="outline"
            />
            <AddRowButton label="Add Assessment Area" onClick={addRow} />
          </div>
        )}
      </div>

      <TableWrap title="Evaluation Plan">
        <table className="w-full min-w-[640px] border-collapse text-left text-[11px]">
          <thead className="border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
            <tr>
              <Th>Assessment Area</Th>
              <Th>Weightage (%)</Th>
              <Th>Evidence Required</Th>
              <Th>Evaluator Notes</Th>
              {editing && <Th>Action</Th>}
            </tr>
          </thead>

          <tbody>
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={editing ? 5 : 4}
                  className="px-3 py-6 text-center text-slate-400"
                >
                  No assessment area added.
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr
                  key={i}
                  className="border-b border-slate-100 dark:border-white/5 transition last:border-0 hover:bg-slate-50/70 dark:hover:bg-white/5"
                >
                  <EditableCell
                    value={row.area}
                    disabled={!editing}
                    onChange={(v) => update(i, "area", v)}
                    wide
                  />

                  <td className="w-[130px] px-2 py-2 align-top">
                    {editing ? (
                      <div className="relative">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step={1}
                          value={row.weightage === "" ? "" : String(row.weightage)}
                          onChange={(e) => setWeightage(i, e.target.value)}
                          className={`${FIELD} pr-6 font-bold`}
                        />
                        <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                          %
                        </span>
                      </div>
                    ) : (
                      `${row.weightage || 0}%`
                    )}
                  </td>

                  <EditableCell
                    value={row.evidenceRequired}
                    disabled={!editing}
                    onChange={(v) => update(i, "evidenceRequired", v)}
                    wide
                  />

                  <EditableCell
                    value={row.evaluatorNotes}
                    disabled={!editing}
                    onChange={(v) => update(i, "evaluatorNotes", v)}
                    wide
                  />

                  {editing && (
                    <td className="px-2 py-2 align-top">
                      <RemoveRowButton onClick={() => removeRow(i)} />
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>

          {data.length > 0 && (
            <tfoot>
              <tr
                className={`border-t-2 font-bold ${
                  balanced
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-rose-200 bg-rose-50"
                }`}
              >
                <td className="px-3 py-3 text-[11px] uppercase tracking-wider text-slate-500">
                  Total Weightage
                </td>
                <td
                  className={`px-3 py-3 text-base font-black ${
                    balanced ? "text-emerald-700" : "text-rose-700"
                  }`}
                >
                  {total}%
                </td>
                <td className="px-3 py-3" colSpan={editing ? 3 : 2}>
                  {balanced ? (
                    <span className="text-emerald-700">Balanced.</span>
                  ) : (
                    <span className="text-rose-700">
                      Must total 100% — currently {total > 100 ? "over" : "under"} by{" "}
                      {Math.abs(100 - total)}%.
                    </span>
                  )}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </TableWrap>

    </div>
  );
}


/* --------------------------- Shared edit styles --------------------------- */

/** Every editable control shares one look: white, soft ring, navy focus ring. */
const FIELD =
  "w-full rounded-lg border-0 bg-white dark:bg-white/5 px-2.5 py-1.5 text-[11px] text-slate-800 dark:text-slate-100 shadow-sm ring-1 ring-inset ring-slate-200 dark:ring-white/10 outline-none transition placeholder:text-slate-300 focus:ring-2 focus:ring-blue-900 disabled:bg-slate-50 dark:disabled:bg-white/5 disabled:text-slate-500 dark:disabled:text-slate-400 disabled:shadow-none";

const FORM_FIELD =
  "w-full rounded-xl border-0 bg-white dark:bg-white/5 px-3.5 py-2.5 text-xs font-medium text-slate-800 dark:text-slate-100 shadow-sm ring-1 ring-inset ring-slate-200 dark:ring-white/10 outline-none transition focus:ring-2 focus:ring-blue-900 disabled:bg-slate-50 dark:disabled:bg-white/5 disabled:text-slate-500 dark:disabled:text-slate-400 disabled:shadow-none";

const FORM_LABEL =
  "mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-300";

function AddRowButton({
  label,
  onClick,
  variant = "solid",
}: {
  label: string;
  onClick: () => void;
  variant?: "solid" | "outline";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[11px] font-bold shadow-sm transition ${
        variant === "solid"
          ? "bg-[#0b2f5b] text-white hover:bg-blue-950"
          : "bg-white text-blue-900 ring-1 ring-inset ring-blue-200 hover:bg-blue-50"
      }`}
    >
      <Plus size={13} />
      {label}
    </button>
  );
}

function RemoveRowButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title="Remove row"
      className="inline-flex items-center gap-1 rounded-lg bg-white px-2 py-1.5 text-[10px] font-bold text-rose-600 ring-1 ring-inset ring-rose-200 transition hover:bg-rose-50"
    >
      <Trash2 size={12} />
      Remove
    </button>
  );
}

function TableWrap({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <span className="text-blue-900">
          <ClipboardCheck size={15} />
        </span>
        <h3 className="text-sm font-black tracking-tight text-slate-900 dark:text-white">{title}</h3>
      </div>

      <div className="overflow-x-auto rounded-2xl ring-1 ring-slate-200">
        {children}
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="whitespace-nowrap px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
      {children}
    </th>
  );
}

function EditableCell({
  value,
  disabled,
  onChange,
  wide = false,
  placeholder,
}: {
  value: string;
  disabled: boolean;
  wide?: boolean;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  return (
    <td className={`px-2 py-2 align-top ${wide ? "min-w-[190px]" : "min-w-[100px]"}`}>
      <textarea
        rows={wide ? 2 : 1}
        value={value || ""}
        disabled={disabled}
        placeholder={disabled ? undefined : placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`${FIELD} resize-y leading-relaxed`}
      />
    </td>
  );
}

function EditableSelectCell({
  value,
  disabled,
  options,
  onChange,
}: {
  value: string;
  disabled: boolean;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <td className="min-w-[130px] px-2 py-2 align-top">
      <select
        value={value || ""}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={`${FIELD} cursor-pointer font-semibold`}
      >
        <option value="">Select</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </td>
  );
}

/** Inline select used for the Week column across the schedule-linked tabs. */
function CellSelect({
  value,
  options,
  onChange,
  placeholder = "Select Week",
}: {
  value: string;
  options: string[];
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <select
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      className={`${FIELD} cursor-pointer font-semibold`}
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

function Input({
  label,
  value,
  onChange,
  disabled,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  disabled: boolean;
  type?: string;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className={FORM_LABEL}>{label}</span>
      <input
        type={type}
        value={value || ""}
        disabled={disabled}
        placeholder={disabled ? undefined : placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={FORM_FIELD}
      />
    </label>
  );
}

function Select({
  label,
  value,
  options,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  options: string[] | { label: string; value: string }[];
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className={FORM_LABEL}>{label}</span>
      <select
        value={value || ""}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={`${FORM_FIELD} cursor-pointer`}
      >
        <option value="">Select</option>
        {options.map((option) =>
          typeof option === "string" ? (
            <option key={option} value={option}>
              {option}
            </option>
          ) : (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          )
        )}
      </select>
    </label>
  );
}

function Textarea({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block md:col-span-2">
      <span className={FORM_LABEL}>{label}</span>
      <textarea
        rows={3}
        value={value || ""}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={`${FORM_FIELD} resize-y leading-relaxed`}
      />
    </label>
  );
}
