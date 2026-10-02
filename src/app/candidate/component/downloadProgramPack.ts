import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import JSZip from "jszip";
import {
  PROGRESS_STATUSES,
  progressCounts,
  totalScheduledHours,
  totalWeightage,
  type Program,
} from "@/app/pgp-admin/component/pgpProgram";

/**
 * Lets a candidate take their program away with them: one ZIP holding a
 * proper PDF per screen — Dashboard, Weekly Schedule, Session Flow, Capstone
 * Timeline, Portfolio Checklist — built with real PDF tables (autoTable),
 * not a screenshot, so the text stays selectable and the file stays small.
 *
 * Every table here mirrors the columns the candidate already sees in
 * `ProgramView` — same order, same "—" for a blank cell — so the PDF reads
 * as the same program, on paper.
 */

const NAVY: [number, number, number] = [11, 47, 91]; // #0b2f5b
const LIGHT: [number, number, number] = [248, 250, 252]; // slate-50

const dash = "—";
const cell = (value: unknown): string => {
  const text = value === null || value === undefined ? "" : String(value).trim();
  return text || dash;
};

/** "Week 3" → "3", the same plain number every table shows. */
function weekNumber(week: string): string {
  return (/\d+/.exec(week || "") || [""])[0];
}

/** A calendar date (YYYY-MM-DD) formatted; any other text — "End of Week 1" — as typed. */
function formatDate(value: string): string {
  if (!value) return "";
  if (!/^\d{4}-\d{2}-\d{2}/.test(value)) return value;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

/** The admin's figure when one is set; otherwise what the rows add up to. */
function factOr(value: number | string | undefined, fallback: string): string {
  return value === undefined || value === null || value === "" ? fallback : String(value);
}

function newDoc(orientation: "portrait" | "landscape" = "landscape") {
  const doc = new jsPDF({ orientation, unit: "pt", format: "a4" });
  return doc;
}

/** The banner every PDF in the pack opens with — program name, then the sheet's title. */
function addHeader(doc: jsPDF, programName: string, sheetTitle: string): number {
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(...NAVY);
  doc.rect(0, 0, pageWidth, 54, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(programName || "Untitled program", 28, 24);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(sheetTitle.toUpperCase(), 28, 40);

  doc.setTextColor(0, 0, 0);
  return 70;
}

const tableTheme = {
  theme: "grid" as const,
  styles: { fontSize: 8.5, cellPadding: 5, textColor: [30, 41, 59] as [number, number, number], lineColor: [203, 213, 225] as [number, number, number], lineWidth: 0.5 },
  headStyles: { fillColor: LIGHT, textColor: NAVY, fontStyle: "bold" as const, lineColor: [148, 163, 184] as [number, number, number] },
};

/** One PDF for a simple item table — Weekly Schedule, Session Flow, Capstone, Portfolio. */
function buildTablePdf(
  programName: string,
  sheetTitle: string,
  head: string[],
  rows: string[][],
  emptyLabel: string
): jsPDF {
  const doc = newDoc("landscape");
  const startY = addHeader(doc, programName, sheetTitle);

  if (rows.length === 0) {
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(emptyLabel, 28, startY + 16);
  } else {
    autoTable(doc, {
      ...tableTheme,
      startY,
      margin: { left: 28, right: 28 },
      head: [head],
      body: rows,
    });
  }

  return doc;
}

function buildScheduleRows(program: Program): string[][] {
  return (program.weeklySchedule || []).map((r, i) => [
    String(i + 1),
    weekNumber(r.week) || dash,
    cell(r.module),
    cell(r.sessionTitle),
    cell((r.focus || "").split(/[;•]/).map((s) => s.trim()).filter(Boolean).join(" · ")),
    cell(r.activity),
    cell(r.output),
    r.duration ? String(r.duration) : dash,
    cell(r.notes),
  ]);
}

function buildFlowRows(program: Program): string[][] {
  return (program.sessionFlow || []).map((r, i) => [
    String(i + 1),
    weekNumber(r.week) || dash,
    cell(r.activity),
    cell(r.deliveryMode),
    cell(r.resourceTemplate),
    cell(r.portfolioLink),
  ]);
}

function buildCapstoneRows(program: Program): string[][] {
  return (program.capstoneTimeline || []).map((r, i) => [
    String(i + 1),
    weekNumber(r.week) || dash,
    cell(r.component),
    cell(r.deliverable),
    formatDate(r.due) || dash,
    cell(r.notes),
  ]);
}

function buildPortfolioRows(program: Program): string[][] {
  return (program.portfolioChecklist || []).map((r, i) => [
    String(i + 1),
    weekNumber(r.relatedWeek) || dash,
    cell(r.item),
    cell(r.purpose),
    cell(r.evidenceLink),
    cell(r.facilitatorRemarks),
  ]);
}

/** The Dashboard tab: facts, progress status, and assessment weightage, as three tables. */
function buildDashboardPdf(program: Program): jsPDF {
  const doc = newDoc("portrait");
  const programName = program.programName || "Untitled program";
  let y = addHeader(doc, programName, "Dashboard");

  const weekly = program.weeklySchedule || [];
  const capstone = program.capstoneTimeline || [];
  const portfolio = program.portfolioChecklist || [];
  const evalRows = program.evaluationPlan || [];

  // Facts
  const facts: [string, string][] = [
    ["Total Modules", factOr(program.totalModules, String(weekly.length))],
    ["Capstone Components", factOr(program.capstoneComponents, String(capstone.length))],
    ["Portfolio Items", factOr(program.portfolioItems, String(portfolio.length))],
    [
      "Duration",
      program.durationWeeks === "" || program.durationWeeks == null
        ? weekly.length
          ? `${weekly.length} Weeks`
          : dash
        : `${program.durationWeeks} Weeks`,
    ],
    ["Per Session Hrs.", cell(program.sessionDuration)],
    ["Frequency", cell(program.frequency)],
    ["Training Hours", factOr(program.trainingHours, String(totalScheduledHours(weekly)))],
    ["Total Hrs.", cell(program.totalHours)],
    ["Training Style", cell(program.trainingStyle)],
    ["Final Output", cell(program.finalOutput)],
  ];

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...NAVY);
  doc.text("Facts", 28, y);

  autoTable(doc, {
    ...tableTheme,
    startY: y + 8,
    margin: { left: 28, right: 28 },
    head: [["Field", "Value"]],
    body: facts,
    columnStyles: { 0: { cellWidth: 160, fontStyle: "bold" } },
  });

  // Progress Status
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 24;
  const progCols = [
    { key: "Weekly", counts: progressCounts(weekly, program.progressWeeklyTotal) },
    { key: "Capstone", counts: progressCounts(capstone, program.progressCapstoneTotal) },
    { key: "Portfolio", counts: progressCounts(portfolio, program.progressPortfolioTotal) },
  ];

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...NAVY);
  doc.text("Progress Status", 28, y);

  autoTable(doc, {
    ...tableTheme,
    startY: y + 8,
    margin: { left: 28, right: 28 },
    head: [["Status", ...progCols.map((c) => c.key)]],
    body: [
      ...PROGRESS_STATUSES.map((status) => [
        status,
        ...progCols.map((c) => String(c.counts[status])),
      ]),
      ["Total", ...progCols.map((c) => String(c.counts.Total))],
    ],
    didParseCell: (data) => {
      if (data.row.index === PROGRESS_STATUSES.length) data.cell.styles.fontStyle = "bold";
    },
  });

  // Assessment Weightage
  const chartRows = evalRows.filter((row) => (row.area || "").trim() !== "");
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 24;

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...NAVY);
  doc.text("Assessment Weightage", 28, y);

  if (chartRows.length === 0) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text("No assessment areas defined yet.", 28, y + 16);
  } else {
    const total = Math.round(totalWeightage(evalRows) * 100) / 100;
    autoTable(doc, {
      ...tableTheme,
      startY: y + 8,
      margin: { left: 28, right: 28 },
      head: [["Assessment Area", "Weight"]],
      body: [
        ...chartRows.map((row) => [cell(row.area), `${Number(row.weightage) || 0}%`]),
        ["Total", `${total}%`],
      ],
      columnStyles: { 1: { halign: "right" as const } },
      didParseCell: (data) => {
        if (data.row.index === chartRows.length) data.cell.styles.fontStyle = "bold";
      },
    });
  }

  return doc;
}

/** Builds the pack and hands the browser a ZIP to save. */
export async function downloadProgramPack(program: Program): Promise<void> {
  const programName = program.programName || "Untitled program";

  const dashboardPdf = buildDashboardPdf(program);

  const schedulePdf = buildTablePdf(
    programName,
    "Weekly Schedule",
    ["#", "Week", "Module", "Session Title", "Key Focus Areas", "Practical Activity", "Output / Assignment", "Duration (hrs)", "Notes"],
    buildScheduleRows(program),
    "No weekly session added yet."
  );

  const flowPdf = buildTablePdf(
    programName,
    "Session Flow",
    ["#", "Week", "Activity", "Delivery Mode", "Resource / Template", "Portfolio Link"],
    buildFlowRows(program),
    "No session flow added yet."
  );

  const capstonePdf = buildTablePdf(
    programName,
    "Capstone Timeline",
    ["#", "Week", "Capstone Component", "Deliverable", "Suggested Due Point", "Facilitator Notes"],
    buildCapstoneRows(program),
    "No capstone deliverable added yet."
  );

  const portfolioPdf = buildTablePdf(
    programName,
    "Portfolio Checklist",
    ["#", "Week", "Portfolio Items", "Purpose", "Evidence / link", "Facilitator remarks"],
    buildPortfolioRows(program),
    "No portfolio item added yet."
  );

  const zip = new JSZip();
  const folderName = programName.replace(/[\\/:*?"<>|]+/g, "").trim() || "Program";
  const folder = zip.folder(folderName)!;

  folder.file("1 - Dashboard.pdf", dashboardPdf.output("blob"));
  folder.file("2 - Weekly Schedule.pdf", schedulePdf.output("blob"));
  folder.file("3 - Session Flow.pdf", flowPdf.output("blob"));
  folder.file("4 - Capstone Timeline.pdf", capstonePdf.output("blob"));
  folder.file("5 - Portfolio Checklist.pdf", portfolioPdf.output("blob"));

  const zipBlob = await zip.generateAsync({ type: "blob" });

  const url = URL.createObjectURL(zipBlob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${folderName}.zip`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
