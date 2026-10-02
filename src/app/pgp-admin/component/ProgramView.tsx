"use client";

import React, { useEffect, useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  Clock,
  FileText,
  GraduationCap,
  Layers,
  Link2,
  ListChecks,
  Mail,
  Menu,
  MessageSquare,
  Percent,
  Repeat,
  Target,
  Timer,
  Trophy,
  UserCog,
} from "lucide-react";
import AssessmentWeightageChart from "./AssessmentWeightageChart";
import { MentorAvatar } from "@/components/portal/CandidateAvatar";
import {
  PROGRESS_STATUSES,
  progressCounts,
  totalScheduledHours,
  totalWeightage,
  type CapstoneTimeline,
  type PortfolioItem,
  type Program,
  type SessionFlow,
  type WeeklySchedule,
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

/* --------------------------- Expandable table ---------------------------- */

type ExpandableColumn<T> = {
  key: string;
  label: string;
  render: (row: T, index: number) => React.ReactNode;
  /** Header/cell classes — alignment, weight. */
  className?: string;
  /** Detail columns only: how wide the column may grow once opened. */
  width?: string;
};

/** "Week 3" → "3". Plain text for the tables — no badge, no background. */
function weekNumber(week: string): string {
  return (/\d+/.exec(week || "") || [""])[0];
}

/**
 * A small, plain table whose detail columns open SIDEWAYS, like a drawer.
 * Only the base columns show at first, so the table is as narrow as its
 * content; the ☰ in the header's last cell — its own cell, so it never reads
 * as part of a column — slides the detail columns (purpose, deliverable,
 * remarks…) out to the right, and the next click folds them back in.
 * Nothing ever appears underneath a row.
 *
 * The detail cells are always in the DOM. Closed, each is padded to nothing
 * and its inner block is capped at zero width, so the column takes no space;
 * opening lifts the cap to the column's `width`, which is what animates.
 * The text stays on one line until the drawer has finished opening — wrapping
 * inside a zero-width block would stack it one letter per line and make every
 * closed row tall.
 *
 * Column names are the caller's, so a view can rename them without touching
 * this component.
 */
function ExpandableTable<T>({
  columns,
  detailColumns,
  rows,
  emptyLabel,
}: {
  /** Always visible. */
  columns: ExpandableColumn<T>[];
  /** Slide out to the right of the base columns when opened. */
  detailColumns: ExpandableColumn<T>[];
  rows: T[];
  emptyLabel: string;
}) {
  const [open, setOpen] = useState(false);
  // True once the open transition has run, so wrapping starts only then.
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => setSettled(true), 320);
    return () => clearTimeout(timer);
  }, [open]);

  const Toggle = (
    <button
      type="button"
      aria-expanded={open}
      aria-label={open ? "Hide details" : "Show details"}
      title={open ? "Hide details" : "Show details"}
      onClick={() => {
        setOpen((v) => !v);
        setSettled(false);
      }}
      className={`inline-grid h-5 w-5 place-items-center rounded transition ${
        open
          ? "bg-[#0b2f5b] text-white dark:bg-sky-300 dark:text-[#0b2f5b]"
          : "text-slate-500 hover:bg-slate-200 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
      }`}
    >
      <Menu size={13} />
    </button>
  );

  const cell = "px-2 py-1 align-top";
  // Padding is on the cell and the width cap on the block inside it, so a
  // closed column is truly 0px wide (border-box would otherwise keep the
  // padding). Both sides animate.
  const detailCell = `align-top transition-[padding] duration-300 ${open ? "px-2 py-1" : "p-0"}`;
  const detailBlock = `overflow-hidden transition-[max-width,opacity] duration-300 ${
    open ? "opacity-100" : "opacity-0"
  } ${open && settled ? "whitespace-normal" : "whitespace-nowrap"}`;
  const detailStyle = (column: ExpandableColumn<T>) => ({
    maxWidth: open ? column.width ?? "16rem" : 0,
  });

  return (
    <div className="max-w-full overflow-x-auto">
      <table className="w-auto border-collapse text-left text-[11px] leading-snug text-slate-800 dark:text-slate-100">
        <thead>
          <tr className="border-b-2 border-slate-300 dark:border-white/20">
            {columns.map((column) => (
              <th key={column.key} className={`${cell} whitespace-nowrap font-bold ${column.className ?? ""}`}>
                {column.label}
              </th>
            ))}
            {detailColumns.map((column) => (
              <th key={column.key} aria-hidden={!open} className={`${detailCell} whitespace-nowrap font-bold ${column.className ?? ""}`}>
                <div className={detailBlock} style={detailStyle(column)}>
                  {column.label}
                </div>
              </th>
            ))}
            <th className="w-7 px-1 py-1 text-right align-middle">{Toggle}</th>
          </tr>
        </thead>

        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length + detailColumns.length + 1} className={`${cell} text-center text-slate-500`}>
                {emptyLabel}
              </td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr key={index} className="border-b border-slate-200 dark:border-white/10">
                {columns.map((column) => (
                  <td key={column.key} className={`${cell} ${column.className ?? ""}`}>
                    {column.render(row, index)}
                  </td>
                ))}
                {detailColumns.map((column) => (
                  <td key={column.key} aria-hidden={!open} className={`${detailCell} ${column.className ?? ""}`}>
                    <div className={detailBlock} style={detailStyle(column)}>
                      {column.render(row, index)}
                    </div>
                  </td>
                ))}
                <td className="p-0" />
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
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

/** Formats a calendar date (YYYY-MM-DD, as a date input stores it); any other
 *  text — "End of Week 1", "Session Day" — is shown as typed. The lenient Date
 *  parser would otherwise read "End of Week 1" as 1 Jan 2001. */
function formatDate(value: string): string {
  if (!value) return "";
  if (!/^\d{4}-\d{2}-\d{2}/.test(value)) return value;

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
      <div className="flex items-start gap-4 bg-[#0b2f5b] px-4 py-3 text-white">
        {program.assignedMentorName && (
          <MentorAvatar
            email={program.assignedMentorEmail}
            name={program.assignedMentorName}
            size={44}
            className="ring-2 ring-white/40"
          />
        )}

        <div className="min-w-0">
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

function ScheduleView({ program }: { program: Program }) {
  const rows = program.weeklySchedule || [];

  if (!rows.length) return <Empty label="No weekly session added yet." />;

  const dash = <span className="text-slate-300">—</span>;

  return (
    <div className="p-3">
      {/* Column names are the caller's to rename — see ExpandableTable. */}
      <ExpandableTable<WeeklySchedule>
        rows={rows}
        emptyLabel="No weekly session added yet."
        columns={[
          {
            key: "no",
            label: "#",
            className: "whitespace-nowrap text-center tabular-nums text-slate-400",
            render: (_row, index) => index + 1,
          },
          {
            key: "week",
            label: "Week",
            className: "whitespace-nowrap text-center tabular-nums text-slate-500 dark:text-slate-400",
            render: (row) => weekNumber(row.week) || dash,
          },
          {
            key: "module",
            label: "Module",
            className: "whitespace-nowrap",
            render: (row) => row.module || dash,
          },
          {
            key: "title",
            label: "Session Title",
            className: "font-bold text-slate-900 dark:text-white",
            render: (row) => <div className="max-w-[16rem]">{row.sessionTitle || "Untitled session"}</div>,
          },
          {
            key: "focus",
            label: "Key Focus Areas",
            render: (row) => {
              const focus = splitFocus(row.focus);
              return focus.length ? <div className="max-w-[18rem]">{focus.join(" · ")}</div> : dash;
            },
          },
        ]}
        detailColumns={[
          {
            key: "activity",
            label: "Practical Activity",
            width: "16rem",
            render: (row) => row.activity || dash,
          },
          {
            key: "output",
            label: "Output / Assignment",
            width: "14rem",
            render: (row) => row.output || dash,
          },
          {
            key: "duration",
            label: "Duration (hrs)",
            width: "6rem",
            className: "whitespace-nowrap text-center tabular-nums",
            render: (row) => (row.duration ? String(row.duration) : dash),
          },
          {
            key: "notes",
            label: "Notes",
            width: "14rem",
            render: (row) => row.notes || dash,
          },
        ]}
      />
    </div>
  );
}

/* ------------------------------ Session Flow ----------------------------- */

function FlowView({ program }: { program: Program }) {
  const rows = program.sessionFlow || [];

  if (!rows.length) return <Empty label="No session flow added yet." />;

  const dash = <span className="text-slate-300">—</span>;

  return (
    <div className="p-3">
      {/* Column names are the caller's to rename — see ExpandableTable. */}
      <ExpandableTable<SessionFlow>
        rows={rows}
        emptyLabel="No session flow added yet."
        columns={[
          {
            key: "no",
            label: "#",
            className: "whitespace-nowrap text-center tabular-nums text-slate-400",
            render: (_row, index) => index + 1,
          },
          {
            key: "week",
            label: "Week",
            className: "whitespace-nowrap text-center tabular-nums text-slate-500 dark:text-slate-400",
            render: (row) => weekNumber(row.week) || dash,
          },
          {
            key: "activity",
            label: "Activity",
            className: "font-bold text-slate-900 dark:text-white",
            render: (row) => <div className="max-w-[18rem]">{row.activity || "Untitled activity"}</div>,
          },
          {
            key: "mode",
            label: "Delivery Mode",
            className: "whitespace-nowrap",
            render: (row) => row.deliveryMode || dash,
          },
        ]}
        detailColumns={[
          {
            key: "resource",
            label: "Resource / Template",
            width: "14rem",
            render: (row) => row.resourceTemplate || dash,
          },
          {
            key: "portfolio",
            label: "Portfolio Link",
            width: "14rem",
            render: (row) => row.portfolioLink || dash,
          },
        ]}
      />
    </div>
  );
}

/* --------------------------- Capstone Timeline --------------------------- */

function CapstoneView({ program }: { program: Program }) {
  const rows = program.capstoneTimeline || [];

  if (!rows.length) return <Empty label="No capstone deliverable added yet." />;

  return (
    <div className="p-3">
      {/* Column names are the caller's to rename — see ExpandableTable. */}
      <ExpandableTable<CapstoneTimeline>
        rows={rows}
        emptyLabel="No capstone deliverable added yet."
        columns={[
          {
            key: "no",
            label: "#",
            className: "whitespace-nowrap text-center tabular-nums text-slate-400",
            render: (_row, index) => index + 1,
          },
          {
            key: "week",
            label: "Week",
            className: "whitespace-nowrap text-center tabular-nums text-slate-500 dark:text-slate-400",
            render: (row) => weekNumber(row.week) || <span className="text-slate-300">—</span>,
          },
          {
            key: "component",
            label: "Capstone Component",
            className: "font-bold text-slate-900 dark:text-white",
            render: (row) => <div className="max-w-[16rem]">{row.component || "Untitled component"}</div>,
          },
          {
            key: "deliverable",
            label: "Deliverable",
            render: (row) => <div className="max-w-[16rem]">{row.deliverable || <span className="text-slate-300">—</span>}</div>,
          },
          {
            key: "due",
            label: "Suggested Due Point",
            className: "whitespace-nowrap",
            render: (row) => formatDate(row.due) || <span className="text-slate-300">—</span>,
          },
        ]}
        detailColumns={[
          {
            key: "notes",
            label: "Facilitator Notes",
            width: "16rem",
            render: (row) => row.notes || <span className="text-slate-300">—</span>,
          },
        ]}
      />
    </div>
  );
}

/* -------------------------- Portfolio Checklist -------------------------- */

function PortfolioView({ program }: { program: Program }) {
  const rows = program.portfolioChecklist || [];

  if (!rows.length) return <Empty label="No portfolio item added yet." />;

  return (
    <div className="p-3">
      {/* Column names are the caller's to rename — see ExpandableTable. */}
      <ExpandableTable<PortfolioItem>
        rows={rows}
        emptyLabel="No portfolio item added yet."
        columns={[
          {
            key: "no",
            label: "#",
            className: "whitespace-nowrap text-center tabular-nums text-slate-400",
            render: (_row, index) => index + 1,
          },
          {
            key: "week",
            label: "Week",
            className: "whitespace-nowrap text-center tabular-nums text-slate-500 dark:text-slate-400",
            render: (row) => weekNumber(row.relatedWeek) || <span className="text-slate-300">—</span>,
          },
          {
            key: "item",
            label: "Portfolio Items",
            className: "font-bold text-slate-900 dark:text-white",
            render: (row) => (
              <>
                {row.item || "Untitled item"}
                {row.evidenceLink && (
                  <Link2 size={11} className="ml-1.5 inline text-blue-800 dark:text-sky-300" aria-label="Evidence attached" />
                )}
              </>
            ),
          },
        ]}
        detailColumns={[
          {
            key: "purpose",
            label: "Purpose",
            width: "16rem",
            render: (row) => row.purpose || <span className="text-slate-300">—</span>,
          },
          {
            key: "evidence",
            label: "Evidence / link",
            width: "12rem",
            className: "break-all",
            render: (row) => row.evidenceLink || <span className="text-slate-300">—</span>,
          },
          {
            key: "remarks",
            label: "Facilitator remarks",
            width: "14rem",
            render: (row) => row.facilitatorRemarks || <span className="text-slate-300">—</span>,
          },
        ]}
      />
    </div>
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
const STATUS_ROWS = PROGRESS_STATUSES;

const STATUS_DOT: Record<string, string> = {
  "Not Started": "bg-slate-400",
  "In Progress": "bg-sky-500",
  Completed: "bg-emerald-500",
  Deferred: "bg-amber-500",
};

/** The admin's figure when one is set; otherwise what the rows add up to. */
function factOr(value: number | string | undefined, fallback: React.ReactNode): React.ReactNode {
  return value === undefined || value === null || value === "" ? fallback : value;
}

function DashboardView({ program }: { program: Program }) {
  const weekly = program.weeklySchedule || [];
  const capstone = program.capstoneTimeline || [];
  const portfolio = program.portfolioChecklist || [];
  const evalRows = program.evaluationPlan || [];

  // Each column's counts: the mentor's marks against the admin's total.
  const columns = [
    { key: "Weekly", full: "Weekly Sessions", counts: progressCounts(weekly, program.progressWeeklyTotal) },
    { key: "Capstone", full: "Capstone Items", counts: progressCounts(capstone, program.progressCapstoneTotal) },
    { key: "Portfolio", full: "Portfolio Items", counts: progressCounts(portfolio, program.progressPortfolioTotal) },
  ];

  const chartRows = evalRows.filter((row) => row.area.trim() !== "");
  const total = Math.round(totalWeightage(evalRows) * 100) / 100;
  const balanced = total === 100;

  // Programme facts, the Overview's included, as two small key/value
  // columns: the plan's shape on the left, its hours and style on the right.
  type Fact = { icon: React.ReactNode; label: string; value: React.ReactNode };
  const factColumns: Fact[][] = [
    [
      { icon: <Layers size={13} />, label: "Total Modules", value: factOr(program.totalModules, weekly.length) },
      { icon: <Trophy size={13} />, label: "Capstone Components", value: factOr(program.capstoneComponents, capstone.length) },
      { icon: <ListChecks size={13} />, label: "Portfolio Items", value: factOr(program.portfolioItems, portfolio.length) },
      { icon: <CalendarDays size={13} />, label: "Duration", value: factOr(program.durationWeeks === "" || program.durationWeeks == null ? "" : `${program.durationWeeks} Weeks`, weekly.length ? `${weekly.length} Weeks` : "—") },
      { icon: <Timer size={13} />, label: "Per Session Hrs.", value: program.sessionDuration || "—" },
      { icon: <Repeat size={13} />, label: "Frequency", value: program.frequency || "—" },
      { icon: <Clock size={13} />, label: "Training Hours", value: factOr(program.trainingHours, totalScheduledHours(weekly)) },
      { icon: <Clock size={13} />, label: "Total Hrs.", value: program.totalHours || "—" },
      { icon: <GraduationCap size={13} />, label: "Training Style", value: program.trainingStyle || "—" },
      { icon: <Target size={13} />, label: "Final Output", value: program.finalOutput || "—" },      
    ],
 
  ];

  return (
    <div className="bg-white dark:bg-white/5 px-3 py-2">
      {/* Facts beside the progress table */}
      <div className="mb-3 flex flex-wrap items-start gap-x-8 gap-y-6">
        {/* Facts — two tight tables, one colour throughout */}
        <div className="flex flex-wrap gap-x-10 gap-y-1">
          {factColumns.map((column, index) => (
            <table key={index} className="w-auto border-collapse text-[10px]">
              <tbody>
                {column.map((f) => (
                  <tr key={f.label} className="border-b border-slate-100 last:border-0 dark:border-white/5">
                    <td className="py-0.5 pr-2 text-[#0b2f5b] dark:text-sky-300">{f.icon}</td>
                    <td className="whitespace-nowrap py-0.5 pr-4 text-sm  font-semibold text-slate-500 dark:text-slate-400">
                      {f.label}
                    </td>
                    <td className="py-0.5 font-bold text-sm text-[#0b2f5b] dark:text-sky-300">{f.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ))}
        </div>

        {/* Progress status matrix — narrow */}
        <div className="w-full max-w-md ">
          <h3 className="mb-1.5 text-[14px] font-black uppercase tracking-wider text-[#0b2f5b] dark:text-blue-300">
            Progress Status
          </h3>

          <div className="overflow-x-auto rounded-lg ring-1 ring-slate-200 dark:ring-white/10">
            <table className="w-full border-collapse text-left text-[13px]">
              <thead className="bg-slate-50 dark:bg-white/5 text-[10px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-2 py-1 font-bold">Status</th>
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      title={col.full}
                      className="px-2 py-1 text-center font-bold"
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
                    <td className="px-2 py-1 font-bold text-slate-700 dark:text-slate-200">
                      <span className="flex items-center gap-1.5">
                        <span
                          className={`h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[status]}`}
                        />
                        {status}
                      </span>
                    </td>
                    {columns.map((col) => {
                      const count = col.counts[status];
                      return (
                        <td
                          key={col.key}
                          className={`px-2 py-1 text-center font-bold tabular-nums ${
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
                  <td className="px-2 py-1 text-[10px] font-black uppercase tracking-wider text-slate-500">
                    Total
                  </td>
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className="px-2 py-1 text-center font-black tabular-nums text-slate-900 dark:text-slate-100"
                    >
                      {col.counts.Total}
                    </td>
                  ))}
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {/* Assessment weightage with its graph beside it */}
      <div className="mt-6 flex flex-wrap items-start gap-10">
        <div className="w-full max-w-md">
          <h3 className="mb-1.5 text-[14px] font-black uppercase tracking-wider text-[#0b2f5b] dark:text-blue-300">
            Assessment Weightage
          </h3>

          {chartRows.length === 0 ? (
            <p className="rounded-lg bg-slate-50 dark:bg-white/5 px-3 py-4 text-center text-[11px] text-slate-400">
              No assessment areas defined yet.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg ring-1 ring-slate-200 dark:ring-white/10">
              <table className="w-full border-collapse text-left text-[13px]">
                <thead className="bg-slate-50 dark:bg-white/5 text-[12px] uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-2 py-1 font-bold">Assessment Area</th>
                    <th className="px-2 py-1 text-right font-bold">Weight</th>
                  </tr>
                </thead>

                <tbody>
                  {chartRows.map((row, index) => (
                    <tr
                      key={index}
                      className="border-t border-slate-100 dark:border-white/5"
                    >
                      <td className="px-2 py-1 font-semibold text-slate-700 dark:text-slate-200">
                        {row.area}
                      </td>
                      <td className="px-2 py-1 text-right font-bold tabular-nums text-slate-900 dark:text-slate-100">
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
                    <td className="px-2 py-1 text-[10px] font-black uppercase tracking-wider text-slate-500">
                      Total
                    </td>
                    <td
                      className={`px-2 py-1 text-right text-xs font-black tabular-nums ${
                        balanced ? "text-emerald-700" : "text-rose-700"
                      }`}
                    >
                      {total}%
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {chartRows.length > 0 && (
          <div className="w-full max-w-md">
            <h3 className="mb-1.5 text-[14px] font-black uppercase tracking-wider text-[#0b2f5b] dark:text-blue-300">
              Evaluation Plan
            </h3>
            <div className="rounded-lg py-2 ring-1 ring-slate-200 dark:ring-white/10">
              <AssessmentWeightageChart
                areas={chartRows.map((row) => row.area)}
                weightages={chartRows.map((row) => Number(row.weightage) || 0)}
                height={200}
                showTitle={false}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* -------------------------------- Progress ------------------------------- */

/**
 * The delivery status of every item, read-only — what the mentor sets on the
 * Update Progress tab, as management and candidates see it.
 */
function ProgressView({ program }: { program: Program }) {
  const groups: {
    key: string;
    title: string;
    icon: React.ReactNode;
    rows: { label: string; sub: string; status: string }[];
  }[] = [
    {
      key: "weekly",
      title: "Weekly Sessions",
      icon: <CalendarDays size={13} />,
      rows: (program.weeklySchedule || []).map((r, i) => ({
        label: r.week || `Session ${i + 1}`,
        sub: r.sessionTitle || r.module || "",
        status: r.status || "Not Started",
      })),
    },
    {
      key: "capstone",
      title: "Capstone Components",
      icon: <Trophy size={13} />,
      rows: (program.capstoneTimeline || []).map((r, i) => ({
        label: r.week || `Component ${i + 1}`,
        sub: r.component || "",
        status: r.status || "Not Started",
      })),
    },
    {
      key: "portfolio",
      title: "Portfolio Items",
      icon: <ListChecks size={13} />,
      rows: (program.portfolioChecklist || []).map((r, i) => ({
        label: r.item || `Item ${i + 1}`,
        sub: r.relatedWeek || "",
        status: r.status || "Not Started",
      })),
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-x-5 gap-y-4 p-3 md:grid-cols-2 lg:grid-cols-3">
      {groups.map((g) => (
        <div key={g.key} className="min-w-0">
          <h3 className="mb-1.5 flex items-center gap-1.5 border-b border-slate-200 pb-1 text-[11px] font-black uppercase tracking-wider text-[#0b2f5b] dark:border-white/10 dark:text-sky-300">
            {g.icon}
            {g.title}
            <span className="ml-auto text-slate-400">{g.rows.length}</span>
          </h3>

          {g.rows.length === 0 ? (
            <p className="py-3 text-center text-[11px] text-slate-400">No items.</p>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-white/5">
              {g.rows.map((row, index) => (
                <li key={index} className="flex items-center gap-2 py-1.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-bold text-slate-900 dark:text-white">
                      {row.label}
                    </p>
                    {row.sub && (
                      <p className="truncate text-[10px] text-slate-400">{row.sub}</p>
                    )}
                  </div>
                  <StatusPill status={row.status} />
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}

/* -------------------------------- Router --------------------------------- */

export type ViewTab =
  | "dashboard"
  | "overview"
  | "progress"
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
  if (tab === "progress") return <ProgressView program={program} />;
  if (tab === "schedule") return <ScheduleView program={program} />;
  if (tab === "flow") return <FlowView program={program} />;
  if (tab === "capstone") return <CapstoneView program={program} />;
  if (tab === "portfolio") return <PortfolioView program={program} />;
  if (tab === "evaluation") return <EvaluationView program={program} />;

  return <OverviewView program={program} />;
}
