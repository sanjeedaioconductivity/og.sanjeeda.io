import type { CvDocument } from './cv';

/**
 * PDF and Word downloads, generated in the browser.
 *
 * Both are deliberately plain: single column, real text (never an image of the
 * page), standard section headings, no tables or text boxes. That is what ATS
 * parsers read reliably.
 *
 * Word: an HTML document saved as .doc, which Word opens and edits natively.
 * A true .docx needs a library (e.g. `docx`); swap it in here when the backend
 * lands, nothing else depends on the format.
 */

function download(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* ---------------------------------------------------------------------------
   PDF
   --------------------------------------------------------------------------- */

type JsPdf = InstanceType<(typeof import('jspdf'))['jsPDF']>;

class PdfWriter {
  private y: number;
  constructor(
    private pdf: JsPdf,
    private margin = 18,
  ) {
    this.y = margin;
  }
  private get width() {
    return this.pdf.internal.pageSize.getWidth() - this.margin * 2;
  }
  private ensure(h: number) {
    if (this.y + h > this.pdf.internal.pageSize.getHeight() - this.margin) {
      this.pdf.addPage();
      this.y = this.margin;
    }
  }
  text(s: string, opts: { size?: number; bold?: boolean; gray?: boolean; indent?: number; gap?: number } = {}) {
    const { size = 10, bold = false, gray = false, indent = 0, gap = 1.5 } = opts;
    this.pdf.setFont('helvetica', bold ? 'bold' : 'normal');
    this.pdf.setFontSize(size);
    this.pdf.setTextColor(gray ? 90 : 20);
    const lines = this.pdf.splitTextToSize(s, this.width - indent) as string[];
    const lh = size * 0.42;
    for (const line of lines) {
      this.ensure(lh);
      this.pdf.text(line, this.margin + indent, this.y + lh * 0.8);
      this.y += lh;
    }
    this.y += gap;
  }
  bullet(s: string) {
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setFontSize(10);
    const lines = this.pdf.splitTextToSize(s, this.width - 5) as string[];
    const lh = 4.2;
    lines.forEach((line, i) => {
      this.ensure(lh);
      if (i === 0) this.pdf.text('•', this.margin + 1, this.y + lh * 0.8);
      this.pdf.text(line, this.margin + 5, this.y + lh * 0.8);
      this.y += lh;
    });
    this.y += 0.8;
  }
  heading(s: string) {
    this.y += 2;
    this.ensure(10);
    this.text(s.toUpperCase(), { size: 11, bold: true, gap: 0.5 });
    this.pdf.setDrawColor(180);
    this.pdf.line(this.margin, this.y, this.margin + this.width, this.y);
    this.y += 3;
  }
  space(h: number) {
    this.y += h;
  }
}

async function newPdf(): Promise<JsPdf> {
  const { jsPDF } = await import('jspdf');
  return new jsPDF({ unit: 'mm', format: 'a4' });
}

export async function downloadCvPdf(doc: CvDocument, fileName: string) {
  const pdf = await newPdf();
  const w = new PdfWriter(pdf);
  w.text(doc.name, { size: 18, bold: true, gap: 0.5 });
  w.text(doc.title, { size: 11, gap: 0.5 });
  w.text(doc.contact.join('  |  '), { size: 9, gray: true, gap: 2 });
  w.heading('Professional Summary');
  w.text(doc.summary);
  for (const section of doc.sections) {
    w.heading(section.heading);
    for (const item of section.items) {
      w.text(item.heading, { size: 10.5, bold: true, gap: 0.3 });
      if (item.sub) w.text(item.sub, { size: 9.5, gray: true, gap: 0.8 });
      item.bullets.forEach((b) => w.bullet(b));
      w.space(1.5);
    }
  }
  pdf.save(`${fileName}.pdf`);
}

export async function downloadLetterPdf(letter: string, fileName: string) {
  const pdf = await newPdf();
  const w = new PdfWriter(pdf, 22);
  for (const para of letter.split('\n')) {
    if (para.trim()) w.text(para, { size: 11, gap: 0.5 });
    else w.space(4);
  }
  pdf.save(`${fileName}.pdf`);
}

/* ---------------------------------------------------------------------------
   Word
   --------------------------------------------------------------------------- */

function wordShell(title: string, body: string): string {
  return `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><title>${esc(title)}</title>
<style>
  body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; color: #141414; }
  h1 { font-size: 20pt; margin: 0; }
  h2 { font-size: 11.5pt; text-transform: uppercase; border-bottom: 1px solid #999; margin: 14pt 0 6pt; padding-bottom: 2pt; }
  h3 { font-size: 11pt; margin: 8pt 0 0; }
  p { margin: 0 0 6pt; }
  .muted { color: #555; font-size: 10pt; }
  ul { margin: 2pt 0 6pt 16pt; padding: 0; }
</style></head><body>${body}</body></html>`;
}

export function downloadCvWord(doc: CvDocument, fileName: string) {
  const body = [
    `<h1>${esc(doc.name)}</h1>`,
    `<p>${esc(doc.title)}</p>`,
    `<p class="muted">${esc(doc.contact.join('  |  '))}</p>`,
    `<h2>Professional Summary</h2><p>${esc(doc.summary)}</p>`,
    ...doc.sections.map(
      (s) =>
        `<h2>${esc(s.heading)}</h2>` +
        s.items
          .map(
            (i) =>
              `<h3>${esc(i.heading)}</h3>` +
              (i.sub ? `<p class="muted">${esc(i.sub)}</p>` : '') +
              (i.bullets.length ? `<ul>${i.bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>` : ''),
          )
          .join(''),
    ),
  ].join('\n');
  download(new Blob(['﻿', wordShell(doc.name, body)], { type: 'application/msword' }), `${fileName}.doc`);
}

export function downloadLetterWord(letter: string, fileName: string) {
  const body = letter
    .split('\n')
    .map((p) => (p.trim() ? `<p>${esc(p)}</p>` : '<p>&nbsp;</p>'))
    .join('\n');
  download(new Blob(['﻿', wordShell('Cover Letter', body)], { type: 'application/msword' }), `${fileName}.doc`);
}
