"use client";

import React, { useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock,
  FileText,
  Flag,
  GraduationCap,
  Hash,
  Layers,
  Link2,
  ListChecks,
  Mail,
  MessageSquare,
  Percent,
  Repeat,
  Target,
  Timer,
  Trophy,
  UserCog,
  Zap,
} from "lucide-react";
import AssessmentWeightageChart from "./AssessmentWeightageChart";
import {
  compareWeeks,
  totalScheduledHours,
  totalWeightage,
  type Program,
  type SessionFlow,
} from "./pgpProgram";

const STATUS_STYLES: Record<string, string> = {
  Active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Completed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Draft: "bg-slate-100 text-slate-600 dark:text-slate-300 ring-slate-200",
  Paused: "bg-amber-50 text-amber-700 ring-amber-200",
  "Not Started": "bg-slate-100 text-slate-500 ring-slate-200",
  "In Progress": "bg-sky-50 text-sky-700 ring-sky-200",
  Deferred: "bg-amber-50 text-amber-700 ring-amber-200",
  Delayed: "bg-rose-50 text-rose-700 ring-rose-200",
};

function StatusPill({ status }: { status?: string }) {
  if (!status) return <span className="text-slate-300">—</span>;

  const style = STATUS_STYLES[status] || "bg-slate-100 text-slate-600 dark:text-slate-300 ring-slate-200";

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset ${style}`}
    >
      {status}
    </span>
  );
}

function Empty({ label }: { label: string }) {
  return (
    <div className="flex min-h-[240px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 dark:border-white/10 bg-slate-50/60 dark:bg-white/5 text-center">
      <p className="text-sm font-bold text-slate-500">{label}</p>
      <p className="mt-1 text-xs text-slate-400">
        Click Edit to add rows, or load the PGP template.
      </p>
    </div>
  );
}

function SectionTitle({
  icon,
  title,
  hint,
}: {
  icon: React.ReactNode;
  title: string;
  hint?: string;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <span className="text-blue-900">{icon}</span>
        <h3 className="text-sm font-black tracking-tight text-slate-900 dark:text-white">{title}</h3>
      </div>
      {hint && <p className="text-[11px] font-semibold text-slate-400">{hint}</p>}
    </div>
  );
}

/** Key focus areas are stored as one semicolon-separated string. */
function splitFocus(focus: string): string[] {
  return (focus || "")
    .split(/[;•]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

/* -------------------------------- Sheet ---------------------------------- */

/** Fluid, dense document sheet — fills the panel, only as tall as its content. */
function A4Sheet({
  title,
  stats,
  children,
}: {
  title: string;
  stats: { icon: React.ReactNode; value: React.ReactNode; label: string }[];
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-white/5 px-3 py-2">
      <header className="mb-2 flex items-center justify-between gap-3 border-b border-slate-200 dark:border-white/10 pb-2">
        <h2 className="text-xs font-black uppercase tracking-wide text-[#0b2f5b] dark:text-sky-300">
          {title}
        </h2>

        <div className="flex shrink-0 items-center gap-3">
          {stats.map((stat) => (
            <div
              key={stat.label}
              title={stat.label}
              className="flex items-center gap-1 text-slate-500"
            >
              <span className="text-blue-900">{stat.icon}</span>
              <span className="text-xs font-black text-slate-900 dark:text-white">
                {stat.value}
              </span>
            </div>
          ))}
        </div>
      </header>

      {children}
    </div>
  );
}

/** Icon + value, with the meaning carried by the tooltip instead of a label. */
function Meta({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: React.ReactNode;
  label: string;
}) {
  if (!value) return null;

  return (
    <span
      title={label}
      className="inline-flex items-center gap-1 whitespace-nowrap text-[10px] font-semibold text-slate-500"
    >
      <span className="text-slate-400">{icon}</span>
      {value}
    </span>
  );
}

/** Collapsed to a single line; details expand on click to keep the sheet short. */
function ExpandableRow({
  badge,
  title,
  meta,
  status,
  details,
  defaultOpen = false,
}: {
  badge: React.ReactNode;
  title: string;
  meta?: React.ReactNode;
  status?: string;
  details?: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const hasDetails = Boolean(details);

  return (
    <li className="border-b border-slate-100 dark:border-white/5 last:border-0">
      <button
        type="button"
        onClick={() => hasDetails && setOpen(!open)}
        aria-expanded={open}
        className={`flex w-full items-center gap-2 py-1 text-left transition ${
          hasDetails ? "cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5" : "cursor-default"
        }`}
      >
        {badge}

        <span className="min-w-0 flex-1 truncate text-[11px] font-bold text-slate-900 dark:text-white">
          {title}
        </span>

        {meta && <span className="flex shrink-0 items-center gap-2">{meta}</span>}

        {status && <StatusPill status={status} />}

        <ChevronDown
          size={13}
          className={`shrink-0 transition ${
            hasDetails ? "text-slate-400" : "text-transparent"
          } ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && hasDetails && (
        <div className="pb-2 pl-8 pr-4 text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
          {details}
        </div>
      )}
    </li>
  );
}

function DetailBlock({
  icon,
  label,
  value,
  accent = false,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
  accent?: boolean;
}) {
  if (!value) return null;

  return (
    <div
      title={label}
      className={`flex gap-2 rounded-lg p-2
         ${
        accent ? "bg-blue-50/70 dark:bg-sky-500/10 text-blue-900 dark:text-sky-300" : "bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-slate-200"
      }`}
    >
      <span className={accent ? "mt-0.5 text-blue-900" : "mt-0.5 text-slate-400"}>
        {icon}
      </span>
      <p className="min-w-0 flex-1 text-xs
      ">{value}</p>
    </div>
  );
}

function formatDate(value: string): string {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/* ------------------------------- Overview -------------------------------- */

function MetricCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2">
      <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">
        <span className="text-blue-900">{icon}</span>
        {label}
      </div>
      <p className="mt-1 text-lg font-black leading-none text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}

function NarrativeCard({
  icon,
  label,
  value,
  accent = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border px-3 py-2 ${
        accent ? "border-blue-100 bg-blue-50/60" : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">
        <span className="text-blue-900">{icon}</span>
        {label}
      </div>
      <p className="mt-1 text-xs leading-relaxed text-slate-700 dark:text-slate-200">
        {value || <span className="text-slate-300">Not provided</span>}
      </p>
    </div>
  );
}

function OverviewView({ program }: { program: Program }) {
  const weeks = program.weeklySchedule?.length || 0;
  const hours = totalScheduledHours(program.weeklySchedule || []);
  const dateRange = [formatDate(program.startDate), formatDate(program.endDate)]
    .filter(Boolean)
    .join("  →  ");

  return (
    <div className="space-y-2">
      <div className=" bg-[#0b2f5b] px-4 py-3 text-white">
        <div className="flex flex-wrap  items-center gap-7
      ">
          <h2 className="text-lg font-black tracking-tight"> {program.programName || "Untitled program"} </h2>
          <StatusPill status={program.status} />
        </div>

 

        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-semibold text-blue-100">
          {program.assignedMentorName && (
            <span className="inline-flex items-center gap-1.5" title="Mentor">
              <UserCog size={12} className="text-cyan-200" />
              {program.assignedMentorName}
            </span>
          )}

          {program.assignedMentorEmail && (
            <span className="inline-flex items-center gap-1.5" title="Mentor email">
              <Mail size={12} className="text-cyan-200" />
              {program.assignedMentorEmail}
            </span>
          )}

          {dateRange && (
            <span className="inline-flex items-center gap-1.5" title="Dates">
              <CalendarDays size={12} className="text-cyan-200" />
              {dateRange}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1 lg:grid-cols-8">
        <MetricCard
          icon={<CalendarDays size={12} />}
          label="Duration"
          value={weeks ? `${weeks}w` : "—"}
        />
        <MetricCard
          icon={<Clock size={12} />}
          label="Total Hours"
          value={hours || program.totalHours || "—"}
        />
        <MetricCard
          icon={<Timer size={12} />}
          label="Per Session"
          value={program.sessionDuration || "—"}
        />
        <MetricCard
          icon={<Repeat size={12} />}
          label="Frequency"
          value={program.frequency || "—"}
        />
        <MetricCard
          icon={<ListChecks size={12} />}
          label="Portfolio"
          value={program.portfolioChecklist?.length || 0}
        />
        <MetricCard
          icon={<Trophy size={12} />}
          label="Capstone"
          value={program.capstoneTimeline?.length || 0}
        />
<NarrativeCard
          icon={<GraduationCap size={12} />}
          label="Training Style"
          value={program.trainingStyle}
        />
        <NarrativeCard
          icon={<Target size={12} />}
          label="Final Output"
          value={program.finalOutput}
          accent
        />

      </div>

   
    </div>
  );
}

/* ---------------------------- Weekly Schedule ---------------------------- */

function WeekBadge({ week }: { week: string }) {
  return (
    <span
      title={week || "Week"}
      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#0b2f5b] text-[10px] font-black text-white"
    >
      {(/\d+/.exec(week) || ["?"])[0]}
    </span>
  );
}

function ScheduleView({ program }: { program: Program }) {
  const rows = program.weeklySchedule || [];

  if (!rows.length) return <Empty label="No weekly session added yet." />;

  const completed = rows.filter((row) => row.status === "Completed").length;

  return (
    <A4Sheet
      title="Weekly Training Schedule"
      stats={[
        { icon: <CalendarDays size={13} />, value: rows.length, label: "Sessions" },
        { icon: <Clock size={13} />, value: totalScheduledHours(rows), label: "Total hours" },
        { icon: <CheckCircle2 size={13} />, value: completed, label: "Completed" },
      ]}
    >
      <ul>
        {rows.map((row, index) => (
          <ExpandableRow
            key={index}
            badge={<WeekBadge week={row.week} />}
            title={row.sessionTitle || "Untitled session"}
            status={row.status}
            meta={
              <>
                <Meta
                  icon={<Layers size={11} />}
                  value={row.module}
                  label="Module"
                />
                <Meta
                  icon={<Clock size={11} />}
                  value={row.duration ? `${row.duration}h` : ""}
                  label="Duration"
                />
              </>
            }
            details={
              row.focus || row.activity || row.output || row.notes ? (
                <div className="space-y-2">
                  {splitFocus(row.focus).length > 0 && (
                    <div className="flex flex-wrap gap-1" title="Key focus areas">
                      {splitFocus(row.focus).map((chip, chipIndex) => (
                        <span
                          key={chipIndex}
                          className="rounded-full bg-slate-100 dark:bg-white/10 px-2 py-0.5 text-xs
                           font-semibold text-slate-600 dark:text-slate-300"
                        >
                          {chip}
                        </span>
                      ))}
                    </div>
                  )}

                  <DetailBlock
                    icon={<Zap size={12} />}
                    label="Practical activity"
                    value={row.activity}
                  />

                  <DetailBlock
                    icon={<Flag size={12} />}
                    label="Output / assignment"
                    value={row.output}
                    accent
                  />

                  <DetailBlock
                    icon={<MessageSquare size={12} />}
                    label="Facilitator notes"
                    value={row.notes}
                  />
                </div>
              ) : null
            }
          />
        ))}
      </ul>
    </A4Sheet>
  );
}

/* ------------------------------ Session Flow ----------------------------- */

function FlowView({ program }: { program: Program }) {
  const rows = program.sessionFlow || [];

  if (!rows.length) return <Empty label="No session flow added yet." />;

  const grouped = rows.reduce<Record<string, SessionFlow[]>>((acc, row) => {
    const key = row.week || "Unscheduled";
    (acc[key] = acc[key] || []).push(row);
    return acc;
  }, {});

  const weeks = Object.keys(grouped).sort(compareWeeks);

  return (
    <div>
      <SectionTitle
        icon={<Layers size={15} />}
        title="Session Flow"
        hint={`${rows.length} activities across ${weeks.length} weeks`}
      />

      <div className="space-y-4">
        {weeks.map((week) => (
          <section
            key={week}
            className="overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 shadow-sm"
          >
            <header className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 bg-slate-50/80 dark:bg-white/5 px-5 py-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">
                {week}
              </h4>
              <span className="text-[10px] font-bold text-slate-400">
                {grouped[week].length} activities
              </span>
            </header>

            <ol className="relative px-5 py-4">
              <span className="absolute bottom-6 left-[27px] top-6 w-px bg-slate-200" />

              {grouped[week].map((row, index) => (
                <li key={index} className="relative flex gap-4 py-2.5">
                  <span className="relative z-10 mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-white ring-2 ring-blue-900">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-900" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-xs font-bold text-slate-900 dark:text-white">
                        {row.activity || "Untitled activity"}
                      </p>
                      {row.deliveryMode && (
                        <span className="rounded-full bg-slate-100 dark:bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                          {row.deliveryMode}
                        </span>
                      )}
                    </div>

                    <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500">
                      {row.resourceTemplate && (
                        <span className="inline-flex items-center gap-1">
                          <FileText size={11} className="text-slate-400" />
                          {row.resourceTemplate}
                        </span>
                      )}

                      {row.portfolioLink && (
                        <span className="inline-flex items-center gap-1 font-semibold text-blue-800">
                          <Link2 size={11} />
                          {row.portfolioLink}
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>
    </div>
  );
}

/* --------------------------- Capstone Timeline --------------------------- */

function CapstoneView({ program }: { program: Program }) {
  const rows = program.capstoneTimeline || [];

  if (!rows.length) return <Empty label="No capstone deliverable added yet." />;

  const completed = rows.filter((row) => row.status === "Completed").length;

  return (
    <A4Sheet
      title="Capstone Timeline"
      stats={[
        { icon: <Trophy size={13} />, value: rows.length, label: "Components" },
        { icon: <CheckCircle2 size={13} />, value: completed, label: "Delivered" },
      ]}
    >
      <ul>
        {rows.map((row, index) => (
          <ExpandableRow
            key={index}
            badge={<WeekBadge week={row.week} />}
            title={row.component || "Untitled component"}
            status={row.status}
            meta={
              <Meta
                icon={<CalendarDays size={11} />}
                value={formatDate(row.due)}
                label="Due"
              />
            }
            details={
              row.deliverable || row.notes ? (
                <div className="space-y-2">
                  <DetailBlock
                    icon={<FileText size={12} />}
                    label="Deliverable"
                    value={row.deliverable}
                    accent
                  />

                  <DetailBlock
                    icon={<MessageSquare size={12} />}
                    label="Facilitator notes"
                    value={row.notes}
                  />
                </div>
              ) : null
            }
          />
        ))}
      </ul>
    </A4Sheet>
  );
}

/* -------------------------- Portfolio Checklist -------------------------- */

function PortfolioView({ program }: { program: Program }) {
  const rows = program.portfolioChecklist || [];

  if (!rows.length) return <Empty label="No portfolio item added yet." />;

  const completed = rows.filter((row) => row.status === "Completed").length;
  const percent = Math.round((completed / rows.length) * 100);

  return (
    <A4Sheet
      title="Portfolio Checklist"
      stats={[
        { icon: <ListChecks size={13} />, value: rows.length, label: "Items" },
        { icon: <CheckCircle2 size={13} />, value: completed, label: "Completed" },
        { icon: <Percent size={13} />, value: percent, label: "Complete" },
      ]}
    >
      <div
        title={`${completed} of ${rows.length} complete`}
        className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-white/10"
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-blue-900 to-cyan-500 transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>

      <ul>
        {rows.map((row, index) => (
          <ExpandableRow
            key={index}
            badge={
              <span
                title={row.status}
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[10px] font-black ${
                  row.status === "Completed"
                    ? "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                    : "bg-slate-100 dark:bg-white/10 text-slate-500"
                }`}
              >
                {row.status === "Completed" ? (
                  <CheckCircle2 size={13} />
                ) : (
                  index + 1
                )}
              </span>
            }
            title={row.item || "Untitled item"}
            status={row.status}
            meta={
              <>
                <Meta
                  icon={<Hash size={11} />}
                  value={row.relatedWeek}
                  label="Related week"
                />
                {row.evidenceLink && (
                  <span title="Evidence attached" className="text-blue-800">
                    <Link2 size={11} />
                  </span>
                )}
              </>
            }
            details={
              row.purpose || row.evidenceLink || row.facilitatorRemarks ? (
                <div className="space-y-2">
                  <DetailBlock
                    icon={<Target size={12} />}
                    label="Purpose"
                    value={row.purpose}
                  />

                  <DetailBlock
                    icon={<Link2 size={12} />}
                    label="Evidence / link"
                    value={row.evidenceLink}
                    accent
                  />

                  <DetailBlock
                    icon={<MessageSquare size={12} />}
                    label="Facilitator remarks"
                    value={row.facilitatorRemarks}
                  />
                </div>
              ) : null
            }
          />
        ))}
      </ul>
    </A4Sheet>
  );
}

/* ---------------------------- Evaluation Plan ---------------------------- */

function EvaluationView({ program }: { program: Program }) {
  const rows = program.evaluationPlan || [];

  if (!rows.length) return <Empty label="No assessment area added yet." />;

  const total = Math.round(totalWeightage(rows) * 100) / 100;
  const balanced = total === 100;
  const chartRows = rows.filter((row) => row.area.trim() !== "");
  const highest = Math.max(...rows.map((row) => Number(row.weightage) || 0), 1);

  return (
    <A4Sheet
      title="Evaluation Plan"
      stats={[
        { icon: <Target size={13} />, value: rows.length, label: "Assessment areas" },
        {
          icon: <Percent size={13} />,
          value: (
            <span className={balanced ? "text-emerald-700" : "text-rose-700"}>
              {total}
            </span>
          ),
          label: balanced
            ? "Total weightage — balanced"
            : `Total weightage — must be 100%`,
        },
      ]}
    >
      <div className="mb-4">
        <AssessmentWeightageChart
          areas={chartRows.map((row) => row.area)}
          weightages={chartRows.map((row) => Number(row.weightage) || 0)}
        />
      </div>

      <ul>
        {rows.map((row, index) => {
          const weight = Number(row.weightage) || 0;

          return (
            <ExpandableRow
              key={index}
              badge={
                <span
                  title="Weightage"
                  className="flex h-6 w-11 shrink-0 items-center justify-center rounded-md bg-[#0b2f5b] text-[10px] font-black text-white"
                >
                  {weight}%
                </span>
              }
              title={row.area || "Untitled area"}
              meta={
                <span
                  title={`${weight}% of total`}
                  className="hidden h-1.5 w-24 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10 sm:block"
                >
                  <span
                    className="block h-full rounded-full bg-gradient-to-r from-blue-900 to-cyan-500"
                    style={{ width: `${(weight / highest) * 100}%` }}
                  />
                </span>
              }
              details={
                row.evidenceRequired || row.evaluatorNotes ? (
                  <div className="space-y-2">
                    <DetailBlock
                      icon={<FileText size={12} />}
                      label="Evidence required"
                      value={row.evidenceRequired}
                      accent
                    />

                    <DetailBlock
                      icon={<MessageSquare size={12} />}
                      label="Evaluator notes"
                      value={row.evaluatorNotes}
                    />
                  </div>
                ) : null
              }
            />
          );
        })}
      </ul>

      <div
        className={`mt-4 flex items-center justify-between rounded-lg px-4 py-3 ${
          balanced ? "bg-emerald-50" : "bg-rose-50"
        }`}
      >
        <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          <Percent size={13} className={balanced ? "text-emerald-700" : "text-rose-700"} />
          Total
        </span>

        <span
          className={`text-lg font-black leading-none ${
            balanced ? "text-emerald-700" : "text-rose-700"
          }`}
          title={
            balanced
              ? "Balanced and ready for certification"
              : `Must total 100% — ${total > 100 ? "over" : "under"} by ${Math.abs(
                  100 - total
                )}%`
          }
        >
          {total}%
        </span>
      </div>
    </A4Sheet>
  );
}

/* ------------------------------- Dashboard ------------------------------- */

/** The four tracking states shown as rows in the status matrix. */
const STATUS_ROWS = ["Not Started", "In Progress", "Completed", "Deferred"];

const STATUS_DOT: Record<string, string> = {
  "Not Started": "bg-slate-400",
  "In Progress": "bg-sky-500",
  Completed: "bg-emerald-500",
  Deferred: "bg-amber-500",
};

/** Empty status counts as Not Started; capstone's "Delayed" folds into Deferred. */
function normalizeStatus(status?: string): string {
  const value = (status || "").trim();
  if (!value) return "Not Started";
  if (value === "Delayed") return "Deferred";
  return value;
}

function countStatus(items: { status?: string }[], status: string): number {
  return items.filter((item) => normalizeStatus(item.status) === status).length;
}

function MetricPill({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  color: string;
}) {
  return (
    <div
      title={label}
      className="flex items-center gap-1.5 px-2 py-0.5"
    >
      <span className={`shrink-0 ${color}`}>{icon}</span>
      <span className={`text-sm font-black leading-none ${color}`}>{value}</span>
      <span className="min-w-0 truncate text-[12px] font-bold  text-zinc-600">
        {label}
      </span>
    </div>
  );
}

function DashboardView({ program }: { program: Program }) {
  const weekly = program.weeklySchedule || [];
  const capstone = program.capstoneTimeline || [];
  const portfolio = program.portfolioChecklist || [];
  const evalRows = program.evaluationPlan || [];

  const columns = [
    { key: "Weekly", full: "Weekly Sessions", items: weekly },
    { key: "Capstone", full: "Capstone Items", items: capstone },
    { key: "Portfolio", full: "Portfolio Items", items: portfolio },
  ];

  const chartRows = evalRows.filter((row) => row.area.trim() !== "");
  const total = Math.round(totalWeightage(evalRows) * 100) / 100;
  const balanced = total === 100;

  const metrics = [
    { icon: <Layers size={15} />, label: "Total Modules", value: weekly.length, color: "text-blue-700 dark:text-blue-300" },
    { icon: <Clock size={15} />, label: "Training Hours", value: totalScheduledHours(weekly), color: "text-sky-600 dark:text-sky-300" },
    { icon: <ListChecks size={15} />, label: "Portfolio Items", value: portfolio.length, color: "text-emerald-600 dark:text-emerald-300" },
    { icon: <Trophy size={15} />, label: "Capstone Components", value: capstone.length, color: "text-amber-600 dark:text-amber-300" },
    { icon: <GraduationCap size={15} />, label: "Concept Orientation", value: "30%", color: "text-violet-600 dark:text-violet-300" },
    { icon: <Zap size={15} />, label: "Practical Orientation", value: "70%", color: "text-rose-600 dark:text-rose-300" },
  ];

  return (
    <A4Sheet title="Dashboard" stats={[]}>
      {/* Metric values — compact inline strip */}
      <div className="mb-2 flex flex-wrap gap-x-4 gap-y-0.5">
        {metrics.map((m) => (
          <MetricPill
            key={m.label}
            icon={m.icon}
            label={m.label}
            value={m.value}
            color={m.color}
          />
        ))}
      </div>

      {/* Progress Status + Assessment Weightage — side by side */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {/* Progress status matrix */}
        <div>
          <h3 className="mb-2 text-[10px] font-black uppercase tracking-wider text-[#0b2f5b] dark:text-blue-300">
            Progress Status
          </h3>

          <div className="overflow-x-auto rounded-lg ring-1 ring-slate-200 dark:ring-white/10">
            <table className="w-full border-collapse text-left text-[11px]">
              <thead className="bg-slate-50 dark:bg-white/5 text-[10px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-2 py-2 font-bold">Status</th>
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      title={col.full}
                      className="px-2 py-2 text-center font-bold"
                    >
                      {col.key}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {STATUS_ROWS.map((status) => (
                  <tr
                    key={status}
                    className="border-t border-slate-100 dark:border-white/5"
                  >
                    <td className="px-2 py-2 font-bold text-slate-700 dark:text-slate-200">
                      <span className="flex items-center gap-1.5">
                        <span
                          className={`h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[status]}`}
                        />
                        {status}
                      </span>
                    </td>
                    {columns.map((col) => {
                      const count = countStatus(col.items, status);
                      return (
                        <td
                          key={col.key}
                          className={`px-2 py-2 text-center font-bold tabular-nums ${
                            count > 0
                              ? "text-slate-900 dark:text-slate-100"
                              : "text-slate-300 dark:text-slate-600"
                          }`}
                        >
                          {count}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>

              <tfoot>
                <tr className="border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
                  <td className="px-2 py-2 text-[10px] font-black uppercase tracking-wider text-slate-500">
                    Total
                  </td>
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className="px-2 py-2 text-center font-black tabular-nums text-slate-900 dark:text-slate-100"
                    >
                      {col.items.length}
                    </td>
                  ))}
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Assessment weightage */}
        <div>
          <h3 className="mb-2 text-[10px] font-black uppercase tracking-wider text-[#0b2f5b] dark:text-blue-300">
            Assessment Weightage
          </h3>

          {chartRows.length === 0 ? (
            <p className="rounded-lg bg-slate-50 dark:bg-white/5 px-3 py-4 text-center text-[11px] text-slate-400">
              No assessment areas defined yet.
            </p>
          ) : (
            <div className="space-y-2">

              <div className="overflow-x-auto rounded-lg ring-1 ring-slate-200 dark:ring-white/10">
                <table className="w-full border-collapse text-left text-[11px] mb-3">
                  <thead className="bg-slate-50 dark:bg-white/5 text-[10px] uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="px-2 py-1.5 font-bold">Assessment Area</th>
                      <th className="px-2 py-1.5 text-right font-bold">Weight</th>
                    </tr>
                  </thead>

                  <tbody>
                    {chartRows.map((row, index) => (
                      <tr
                        key={index}
                        className="border-t border-slate-100 dark:border-white/5"
                      >
                        <td className="px-2 py-1.5 font-semibold text-slate-700 dark:text-slate-200">
                          {row.area}
                        </td>
                        <td className="px-2 py-1.5 text-right font-bold tabular-nums text-slate-900 dark:text-slate-100">
                          {Number(row.weightage) || 0}%
                        </td>
                      </tr>
                    ))}
                  </tbody>

                  <tfoot>
                    <tr
                      className={`border-t border-slate-200 dark:border-white/10 ${
                        balanced ? "bg-emerald-50" : "bg-rose-50"
                      }`}
                    >
                      <td className="px-2 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-500">
                        Total
                      </td>
                      <td
                        className={`px-2 py-1.5 text-right text-sm font-black tabular-nums ${
                          balanced ? "text-emerald-700" : "text-rose-700"
                        }`}
                      >
                        {total}%
                      </td>
                    </tr>
                  </tfoot>
                </table>
                <AssessmentWeightageChart
                areas={chartRows.map((row) => row.area)}
                weightages={chartRows.map((row) => Number(row.weightage) || 0)}
                height={250}
                showTitle={false}
              /> 
              </div>

             
            </div>
          )}
        </div>
      </div>
    </A4Sheet>
  );
}

/* -------------------------------- Router --------------------------------- */

export type ViewTab =
  | "dashboard"
  | "overview"
  | "schedule"
  | "flow"
  | "capstone"
  | "portfolio"
  | "evaluation";

export default function ProgramView({
  program,
  tab,
}: {
  program: Program;
  tab: ViewTab;
}) {
  if (tab === "dashboard") return <DashboardView program={program} />;
  if (tab === "schedule") return <ScheduleView program={program} />;
  if (tab === "flow") return <FlowView program={program} />;
  if (tab === "capstone") return <CapstoneView program={program} />;
  if (tab === "portfolio") return <PortfolioView program={program} />;
  if (tab === "evaluation") return <EvaluationView program={program} />;

  return <OverviewView program={program} />;
}
