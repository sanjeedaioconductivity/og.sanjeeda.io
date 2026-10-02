/**
 * SCR-010 — PDF decision summary.
 *
 * Replaces the plain-text download. `buildSummaryText` in _constants/scr010.ts
 * is kept: it is still the readable, diffable representation of the same data
 * and is what the unit tests assert against, so the two must not drift.
 *
 * FORMATS, NEVER COMPUTES.
 * Every number and sentence here arrives from the scoring engine response. The
 * Sprint 7 handoff §5 is explicit that a threshold comparison in the frontend
 * which produces a displayed value is a defect — so there is deliberately not a
 * single `>` against a score anywhere in this file. Bar widths are proportional
 * rendering of a given number, not a judgement about it.
 *
 * COLOURS ARE LITERAL RGB, ON PURPOSE.
 * The rest of the module is forbidden from hardcoding colour and must use theme
 * tokens. A PDF has no theme, no dark mode and no CSS custom properties — it is
 * printed and mailed. These values mirror the light-theme tokens so the export
 * looks like the screen it came from; they are the one correct place for
 * literals, which is why they are named and grouped rather than inlined.
 *
 * jsPDF is imported dynamically. It is a large dependency and only a candidate
 * who actually clicks Download needs it, so it stays out of the initial bundle.
 */

export type SummaryPdfInput = {
  offerLabel: string;
  companyName: string | null;
  roleTitle: string | null;
  overallScore: number;
  recommendationLabel: string;
  categories: { label: string; score: number }[];
  strengths: { category: string; score: number }[];
  watchOuts: string[];
  nextSteps: string[];
  /** Rendered into the footer so a printed copy is traceable. */
  generatedAt?: Date;
};

/** Mirrors the light-theme tokens. See the note above on why these are literal. */
const COLOR = {
  ink: [24, 24, 27] as [number, number, number],
  muted: [113, 113, 122] as [number, number, number],
  border: [228, 228, 231] as [number, number, number],
  success: [11, 131, 107] as [number, number, number],
  warning: [166, 87, 12] as [number, number, number],
  track: [244, 244, 245] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
};

const PAGE = { width: 210, height: 297, margin: 18 };
const CONTENT_WIDTH = PAGE.width - PAGE.margin * 2;

export async function buildSummaryPdf(input: SummaryPdfInput): Promise<Blob> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  const generatedAt = input.generatedAt ?? new Date();
  let y = PAGE.margin;

  /**
   * Adds a page when the next block would not fit.
   *
   * The limit is the bottom margin, with no extra reserve for the footer: the
   * footer baseline sits at `height - 10`, which is already inside the 18mm
   * margin band, so subtracting for it again would stop content ~12mm early and
   * tip borderline blocks onto a page of their own. That is exactly what sent
   * the disclaimer to an otherwise empty page 2.
   */
  function ensureSpace(needed: number): void {
    if (y + needed <= PAGE.height - PAGE.margin) return;
    doc.addPage();
    y = PAGE.margin;
  }

  function sectionHeading(text: string): void {
    ensureSpace(14);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...COLOR.ink);
    doc.text(text, PAGE.margin, y);
    y += 2.5;
    doc.setDrawColor(...COLOR.border);
    doc.setLineWidth(0.3);
    doc.line(PAGE.margin, y, PAGE.width - PAGE.margin, y);
    y += 6;
  }

  /**
   * Wrapped bullet. Watch-outs and next steps are full sentences from the
   * engine and regularly exceed one line, so measuring before drawing is what
   * keeps them from running off the page edge.
   */
  function bullet(text: string, color = COLOR.ink): void {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    const lines = doc.splitTextToSize(text, CONTENT_WIDTH - 6) as string[];
    ensureSpace(lines.length * 4.6 + 2);
    doc.setTextColor(...color);
    doc.text('•', PAGE.margin, y);
    doc.text(lines, PAGE.margin + 4, y);
    y += lines.length * 4.6 + 1.6;
  }

  // ----------------------------------------------------------- title block --
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...COLOR.ink);
  doc.text('Offer decision summary', PAGE.margin, y);
  y += 6.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...COLOR.muted);
  doc.text('OfferGuide · Sanjeeda', PAGE.margin, y);
  y += 8;

  // --------------------------------------------------------- offer details --
  doc.setDrawColor(...COLOR.border);
  doc.setLineWidth(0.3);
  doc.line(PAGE.margin, y, PAGE.width - PAGE.margin, y);
  y += 7;

  const details: [string, string][] = [['Offer', input.offerLabel]];
  if (input.companyName) details.push(['Company', input.companyName]);
  if (input.roleTitle) details.push(['Role', input.roleTitle]);

  for (const [label, value] of details) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(...COLOR.muted);
    doc.text(label, PAGE.margin, y);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLOR.ink);
    doc.text(value, PAGE.margin + 26, y);
    y += 5.4;
  }
  y += 4;

  // ------------------------------------------------------------- fit score --
  ensureSpace(30);
  const boxHeight = 24;
  doc.setFillColor(...COLOR.track);
  doc.roundedRect(PAGE.margin, y, CONTENT_WIDTH, boxHeight, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.setTextColor(...COLOR.success);
  doc.text(`${input.overallScore}`, PAGE.margin + 8, y + 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...COLOR.muted);
  const scoreWidth = doc.getTextWidth(`${input.overallScore}`);
  doc.text('/ 100', PAGE.margin + 10 + scoreWidth, y + 15);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...COLOR.muted);
  doc.text('RECOMMENDATION', PAGE.margin + 58, y + 9);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...COLOR.ink);
  doc.text(
    doc.splitTextToSize(input.recommendationLabel, CONTENT_WIDTH - 64) as string[],
    PAGE.margin + 58,
    y + 16,
  );
  y += boxHeight + 10;

  // -------------------------------------------------------- category bars ---
  sectionHeading('How this offer scores across categories');

  const barX = PAGE.margin + 30;
  const barWidth = CONTENT_WIDTH - 30 - 16;

  for (const category of input.categories) {
    ensureSpace(8);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...COLOR.ink);
    doc.text(category.label, PAGE.margin, y + 2.6);

    doc.setFillColor(...COLOR.track);
    doc.roundedRect(barX, y, barWidth, 3.6, 1.8, 1.8, 'F');

    // Proportional width only — clamped so a malformed score cannot draw
    // outside the track. No threshold, no verdict.
    const ratio = Math.max(0, Math.min(100, category.score)) / 100;
    if (ratio > 0) {
      doc.setFillColor(...COLOR.success);
      doc.roundedRect(barX, y, barWidth * ratio, 3.6, 1.8, 1.8, 'F');
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...COLOR.ink);
    doc.text(`${category.score}`, PAGE.width - PAGE.margin, y + 2.6, {
      align: 'right',
    });
    y += 8;
  }
  y += 4;

  // ------------------------------------------------------------ strengths ---
  sectionHeading('Top strengths');
  if (input.strengths.length === 0) {
    bullet('No categories scored above 75.', COLOR.muted);
  } else {
    for (const s of input.strengths) {
      bullet(`${s.category} — ${s.score} / 100`, COLOR.success);
    }
  }
  y += 3;

  // ----------------------------------------------------------- watch-outs ---
  sectionHeading('Watch-outs');
  if (input.watchOuts.length === 0) {
    bullet('No major watch-outs identified.', COLOR.muted);
  } else {
    for (const w of input.watchOuts) bullet(w, COLOR.warning);
  }
  y += 3;

  // ----------------------------------------------------------- next steps ---
  sectionHeading('Suggested next steps');
  if (input.nextSteps.length === 0) {
    bullet('No next steps identified.', COLOR.muted);
  } else {
    for (const n of input.nextSteps) bullet(n);
  }
  y += 4;

  // ----------------------------------------------------------- disclaimer ---
  // Measured before reserving space rather than assumed: the secondary line
  // wraps to a different number of lines at different page widths, and a
  // guessed height is what pushes this block onto a page by itself.
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const disclaimerLines = doc.splitTextToSize(
    'You choose what fits your life and career. OfferGuide helps you think clearly — the decision is always yours.',
    CONTENT_WIDTH,
  ) as string[];

  const separatorGap = 6;
  const primaryLineHeight = 5;
  ensureSpace(separatorGap + primaryLineHeight + disclaimerLines.length * 4.4);

  doc.setDrawColor(...COLOR.border);
  doc.setLineWidth(0.3);
  doc.line(PAGE.margin, y, PAGE.width - PAGE.margin, y);
  y += separatorGap;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...COLOR.ink);
  doc.text('This is decision guidance, not a final decision.', PAGE.margin, y);
  y += primaryLineHeight;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...COLOR.muted);
  doc.text(disclaimerLines, PAGE.margin, y);

  // ---------------------------------------------------------------- footer --
  // Written last so getNumberOfPages() covers every page the content created.
  const pageCount = doc.getNumberOfPages();
  const stamp = generatedAt.toISOString().slice(0, 10);
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...COLOR.muted);
    doc.text(`Generated ${stamp}`, PAGE.margin, PAGE.height - 10);
    doc.text(
      `Page ${page} of ${pageCount}`,
      PAGE.width - PAGE.margin,
      PAGE.height - 10,
      { align: 'right' },
    );
  }

  return doc.output('blob');
}

/** Kebab-cased, safe on every filesystem. */
export function summaryPdfFilename(offerLabel: string | null): string {
  const slug = (offerLabel ?? 'offer')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `offerguide-summary-${slug || 'offer'}.pdf`;
}
