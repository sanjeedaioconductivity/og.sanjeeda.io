"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Save,
  Edit2,
  X,
  BookOpen,
  CalendarDays, ClipboardCheck, Trash2,
} from "lucide-react";
import AssessmentWeightageChart from "./AssessmentWeightageChart";
import ProgramView from "./ProgramView";
import {
  PGP_EVALUATION_TEMPLATE,
  PGP_PORTFOLIO_TEMPLATE,
  ROW_STATUS_OPTIONS,
  emptyProgram,
  renumberPortfolio,
  totalWeightage,
  type CapstoneTimeline,
  type EvaluationItem,
  type Mentor,
  type PortfolioItem,
  type Program,
  type SessionFlow,
  type WeeklySchedule,
} from "./pgpProgram";

type DetailTab =
  | "dashboard"
  | "overview"
  | "schedule"
  | "flow"
  | "capstone"
  | "portfolio"
  | "evaluation";

export default function ProgramsData() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [selected, setSelected] = useState<Program | null>(null);
  const [editData, setEditData] = useState<Program>(emptyProgram);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [tab, setTab] = useState<DetailTab>("overview");

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

  async function loadData() {
    try {
      const response = await fetch("/api/pgp-management/programs-pgp");
      const data = await response.json();

      setPrograms(data.programs || []);
      setMentors(data.mentors || []);
    } catch (error) {
      console.error("Programs loading error:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const assignedCount = useMemo(
    () => programs.filter((p) => p.assignedMentorId).length,
    [programs]
  );

  function createNew() {
    setSelected(null);
    setEditData(emptyProgram);
    setEditing(true);
    setMessage("");
    setTab("overview");
  }

  function selectProgram(program: Program) {
    setSelected(program);
    setEditData({ ...program });
    setEditing(false);
    setMessage("");
    setTab("overview");
  }

  function startEdit() {
    if (!selected) return;
    setEditData({ ...selected });
    setEditing(true);
    setMessage("");
  }

  function cancelEdit() {
    setEditing(false);
    setEditData(selected || emptyProgram);
    setMessage("");
  }

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


async function saveProgram() {
  setMessage("");

  const method = editData.programId ? "PATCH" : "POST";

  const updatedProgram = {
    ...editData,
    recommendedDuration: `${editData.weeklySchedule.length} Weeks`,
  };

  const response = await fetch("/api/pgp-management/programs-pgp", {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updatedProgram),
  });

  const data = await response.json();

  if (!response.ok) {
    setMessage(data.message || "Save failed.");
    return;
  }

  setMessage(data.message || "Program saved.");
  setEditing(false);
  await loadData();
}

  return (
    <div className="mt-24 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-white/10 px-3 py-2">
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 text-lg font-black text-slate-900 dark:text-white">
            <BookOpen size={18} className="text-blue-900" />
            Programs
          </span>
          <span className="text-slate-400">
            {programs.length} total · {assignedCount} assigned
          </span>
        </div>

        <button
          type="button"
          onClick={createNew}
          className="flex items-center gap-1.5 rounded-lg text-xs font-bold"
>
          <Plus size={13} />
          New 
        </button>
      </div>

      {message && (
        <div className="border-b border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800">
          {message}
        </div>
      )}

      {loading ? (
        <p className="p-4 text-slate-500">Loading programs...</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-3 py-2 font-bold">Program</th>
                  <th className="px-3 py-2 font-bold">Mentor</th>
                  <th className="px-3 py-2 text-center font-bold">Weeks</th>
                  <th className="px-3 py-2 text-center font-bold">Portfolio</th>
                  <th className="px-3 py-2 text-center font-bold">Capstone</th>
                  <th className="px-3 py-2 font-bold">Status</th>
                </tr>
              </thead>

              <tbody>
                {programs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-4 text-center text-slate-500">
                      No programs created.
                    </td>
                  </tr>
                ) : (
                  programs.map((program) => {
                    const active = selected?.programId === program.programId;

                    return (
                      <tr
                        key={program.programId}
                        onClick={() => selectProgram(program)}
                        className={`cursor-pointer border-b border-slate-100 dark:border-white/5 transition ${
                          active ? "bg-blue-50 dark:bg-white/10" : "hover:bg-slate-50 dark:hover:bg-white/5"
                        }`}
                      >
                        <td className="px-3 py-2 font-bold text-slate-900 dark:text-slate-100">
                          {program.programName || "Untitled program"}
                        </td>
                        <td className="px-3 py-2 text-slate-600 dark:text-slate-300">
                          {program.assignedMentorName || (
                            <span className="text-slate-400">Not assigned</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-center text-slate-600 dark:text-slate-300">
                          {program.weeklySchedule?.length || 0}
                        </td>
                        <td className="px-3 py-2 text-center text-slate-600 dark:text-slate-300">
                          {program.portfolioChecklist?.length || 0}
                        </td>
                        <td className="px-3 py-2 text-center text-slate-600 dark:text-slate-300">
                          {program.capstoneTimeline?.length || 0}
                        </td>
                        <td className="px-3 py-2">
                          <ProgramStatusPill status={program.status} />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {(selected || editing) && (
            <div className="border-t-2 border-[#0b2f5b] bg-white dark:bg-transparent">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-white/10 px-2 py-1.5">
                  <div className="flex flex-wrap gap-2">
                    <TabButton label="Dashboard" active={tab === "dashboard"} onClick={() => setTab("dashboard")} />
                    <TabButton label="Overview" active={tab === "overview"} onClick={() => setTab("overview")} />
                    <TabButton label="Weekly Schedule" active={tab === "schedule"} onClick={() => setTab("schedule")} />
                    <TabButton label="Session Flow" active={tab === "flow"} onClick={() => setTab("flow")} />
                    <TabButton label="Capstone Timeline" active={tab === "capstone"} onClick={() => setTab("capstone")} />
                    <TabButton label="Portfolio Checklist" active={tab === "portfolio"} onClick={() => setTab("portfolio")} />
                    <TabButton label="Evaluation Plan" active={tab === "evaluation"} onClick={() => setTab("evaluation")} />
                  </div>

    <div className="flex gap-2">
      {!editing && selected && (
                      <button
                        type="button"
                        onClick={startEdit}
                        className="flex text-zinc-600"
                      >
                        <Edit2 size={18} />
                        
                      </button>
                  )}

                    {editing && (
                      <>
                        <button
                          type="button"
                          onClick={saveProgram}
                          className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700"
                        >
                          <Save size={13} />
                          Save
                        </button>

                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="flex items-center gap-1.5 rounded-lg bg-white dark:bg-white/5 px-3 py-2 text-xs font-bold text-slate-600 dark:text-slate-200 ring-1 ring-slate-200 dark:ring-white/10 transition hover:bg-slate-100 dark:hover:bg-white/10"
                        >
                          <X size={13} />
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {!editing ? (
                  <ProgramView program={editData} tab={tab} />
                ) : (
                <div className="p-3">
                  {tab === "dashboard" && (
                    <ProgramView program={editData} tab="dashboard" />
                  )}
                  {tab === "overview" && (
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
      updateArrayItem<CapstoneTimeline>(
        "capstoneTimeline",
        index,
        key,
        value
      )
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

                  {tab === "evaluation" && (
                    <EvaluationTab
                      data={editData.evaluationPlan || []}
                      editing={editing}
                      update={(index, key, value) =>
                        updateArrayItem<EvaluationItem>("evaluationPlan", index, key, value)
                      }
                      addRow={addEvaluationRow}
                      removeRow={removeEvaluationRow}
                      loadTemplate={loadEvaluationTemplate}
                    />
                  )}
                </div>
                )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

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
    <div>
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

        <Input label="Frequency" value={editData.frequency} disabled={!editing} onChange={(v) => updateField("frequency", v)} />
        <Input label="Session Duration" value={editData.sessionDuration} disabled={!editing} onChange={(v) => updateField("sessionDuration", v)} />
        <Input label="Total Hours" value={String(editData.totalHours || "")} disabled={!editing} onChange={(v) => updateField("totalHours", v)} />
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

        <Input label="Final Output" value={editData.finalOutput} disabled={!editing} onChange={(v) => updateField("finalOutput", v)} />
        <Textarea label="Training Style" value={editData.trainingStyle} disabled={!editing} onChange={(v) => updateField("trainingStyle", v)} />
        <Textarea label="Program Promise" value={editData.programPromise} disabled={!editing} onChange={(v) => updateField("programPromise", v)} />
      </div>
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

                  <td className="min-w-[150px] px-2 py-2 align-top">
                    {editing ? (
                      <input
                        type="date"
                        value={row.due}
                        onChange={(e) => update(i, "due", e.target.value)}
                        className={FIELD}
                      />
                    ) : (
                      row.due
                    )}
                  </td>

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

  const chartRows = data.filter((row) => row.area.trim() !== "");

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] font-semibold text-slate-500">
          Suggested assessment weightage for certification and portfolio validation.
        </p>

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
        <table className="min-w-[900px] border-collapse text-left text-[11px]">
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
                          onChange={(e) => update(i, "weightage", e.target.value)}
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

      <div className="mt-4 rounded-2xl bg-white dark:bg-white/5 p-4 ring-1 ring-slate-200 dark:ring-white/10">
        <AssessmentWeightageChart
          areas={chartRows.map((row) => row.area)}
          weightages={chartRows.map((row) => Number(row.weightage) || 0)}
        />
      </div>
    </div>
  );
}

const PROGRAM_STATUS_STYLES: Record<string, string> = {
  Active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Completed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Draft: "bg-slate-100 text-slate-600 ring-slate-200",
  Paused: "bg-amber-50 text-amber-700 ring-amber-200",
};

function ProgramStatusPill({ status }: { status?: string }) {
  if (!status) return null;

  const style =
    PROGRAM_STATUS_STYLES[status] || "bg-slate-100 text-slate-600 ring-slate-200";

  return (
    <span
      className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ring-1 ring-inset ${style}`}
    >
      {status}
    </span>
  );
}

function TabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl px-3.5 py-2 text-[11px] font-bold transition ${
        active
          ? "bg-[#0b2f5b] text-white shadow-sm"
          : "text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white"
      }`}
    >
      {label}
    </button>
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

export function AddRowButton({
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
}: {
  value: string;
  disabled: boolean;
  wide?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <td className={`px-2 py-2 align-top ${wide ? "min-w-[190px]" : "min-w-[100px]"}`}>
      <textarea
        rows={wide ? 2 : 1}
        value={value || ""}
        disabled={disabled}
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
}: {
  label: string;
  value: string;
  disabled: boolean;
  type?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className={FORM_LABEL}>{label}</span>
      <input
        type={type}
        value={value || ""}
        disabled={disabled}
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