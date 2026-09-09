import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { toPng } from "html-to-image";

/** Classic Nivra theme tokens (matches packages/ui color-themes "classic") */
const INK: RGB = [15, 23, 42]; // --app-text / primary
const MUTED: RGB = [100, 116, 139];
const SUBTLE: RGB = [148, 163, 184];
const LINE: RGB = [226, 232, 240];
const HEAD_BG: RGB = [15, 23, 42];
const ALT_ROW: RGB = [248, 250, 252];
const SURFACE: RGB = [255, 255, 255];
const PAGE_BG: RGB = [250, 249, 246]; // --app-bg
const GAIN: RGB = [5, 150, 105]; // emerald-600-ish for badges
const GAIN_SOFT: RGB = [209, 250, 229];
const DANGER: RGB = [239, 68, 68];
const CARD_NAVY: RGB = [21, 32, 51]; // --app-chart-invested

type RGB = [number, number, number];

const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Math.round(n));

const money = (n: number) => `Rs. ${fmt(n)}`;

function cellText(value: string | number, asCurrency: boolean): string {
  if (typeof value === "number") {
    return asCurrency ? money(value) : String(value);
  }
  return String(value ?? "");
}

export type PdfAssumption = [string, string | number, boolean?];

export type PdfMetric = {
  label: string;
  value: string | number;
  currency?: boolean;
  danger?: boolean;
  hint?: string;
};

export type PdfHeadline = {
  label: string;
  value: string | number;
  currency?: boolean;
  hint?: string;
  /** Dark navy card (primary milestone) */
  highlight?: boolean;
};

export type PdfTableData = {
  title: string;
  head: string[];
  body: (string | number)[][];
  columnAlignments?: ("left" | "center" | "right")[];
  currencyColumns?: number[];
  /** 0-based row indices to highlight (emerald milestone) */
  highlightRows?: number[];
};

export type PdfPlaybookItem = {
  title: string;
  description: string;
};

export type CalculatorReportData = {
  title: string;
  subtitle?: string;
  clientName: string;
  age?: number;
  meta?: Array<{ label: string; value: string }>;
  status?: string;
  filename: string;
  headlines?: PdfHeadline[];
  metrics?: PdfMetric[];
  assumptions?: PdfAssumption[];
  tables?: PdfTableData[];
  playbook?: PdfPlaybookItem[];
};

function lastY(doc: jsPDF) {
  return (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable
    .finalY;
}

function ensureSpace(doc: jsPDF, y: number, need: number) {
  const pageH = doc.internal.pageSize.getHeight();
  if (y + need > pageH - 18) {
    doc.addPage();
    return 16;
  }
  return y;
}

function drawSectionTitle(doc: jsPDF, text: string, y: number) {
  const pageW = doc.internal.pageSize.getWidth();
  doc.setFillColor(52, 211, 153); // chart-gain accent square
  doc.roundedRect(14, y - 2.2, 2.2, 2.2, 0.3, 0.3, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...INK);
  doc.text(text.toUpperCase(), 19, y);
  doc.setDrawColor(...LINE);
  doc.setLineWidth(0.35);
  doc.line(14, y + 2.5, pageW - 14, y + 2.5);
  return y + 8;
}

function drawHeader(doc: jsPDF, data: CalculatorReportData) {
  const pageW = doc.internal.pageSize.getWidth();
  let y = 14;

  // Logo mark
  doc.setFillColor(...CARD_NAVY);
  doc.roundedRect(14, y, 14, 14, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("N", 21, y + 9.2, { align: "center" });

  doc.setTextColor(...GAIN);
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text("NIVRA PRIVATE WEALTH", 32, y + 3.5);

  doc.setTextColor(...INK);
  doc.setFontSize(13);
  doc.text(data.title.toUpperCase(), 32, y + 9);

  doc.setTextColor(...MUTED);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text(
    data.subtitle ||
      "Institutional Wealth Advisory Desk · Comprehensive Architecture",
    32,
    y + 13.5,
  );

  // Client meta card (right) — not a website navbar
  const metaX = pageW - 78;
  const metaW = 64;
  doc.setDrawColor(...LINE);
  doc.setFillColor(...SURFACE);
  doc.setLineWidth(0.4);
  doc.roundedRect(metaX, y - 1, metaW, 18, 1.5, 1.5, "FD");

  const metaRows: Array<{ label: string; value: string }> = [
    { label: "CLIENT", value: data.clientName || "Client" },
    ...(data.age != null
      ? [{ label: "AGE", value: String(data.age) }]
      : []),
    ...(data.meta ?? []).slice(0, 2),
  ];

  const my = y + 3;
  metaRows.slice(0, 3).forEach((row, i) => {
    const col = i % 2;
    const rowIdx = Math.floor(i / 2);
    const cx = metaX + 3 + col * 30;
    const cy = my + rowIdx * 7;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(5.5);
    doc.setTextColor(...SUBTLE);
    doc.text(row.label, cx, cy);
    doc.setFontSize(7.5);
    doc.setTextColor(...INK);
    doc.text(String(row.value).slice(0, 18), cx, cy + 3.5);
  });

  if (data.status) {
    doc.setFillColor(...GAIN_SOFT);
    doc.roundedRect(metaX + 32, y + 11.5, 28, 4.2, 1, 1, "F");
    doc.setTextColor(...GAIN);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(5.5);
    doc.text(data.status.toUpperCase().slice(0, 16), metaX + 46, y + 14.3, {
      align: "center",
    });
  }

  y = 36;
  doc.setDrawColor(...LINE);
  doc.setLineWidth(0.8);
  doc.line(14, y, pageW - 14, y);
  return y + 6;
}

function drawHeadlines(doc: jsPDF, headlines: PdfHeadline[], y: number) {
  if (!headlines.length) return y;
  y = ensureSpace(doc, y, 42);
  y = drawSectionTitle(doc, "Primary Capital Milestones", y);

  const pageW = doc.internal.pageSize.getWidth();
  const gap = 4;
  const usable = pageW - 28;
  const n = Math.min(headlines.length, 2);
  const cardW = (usable - gap * (n - 1)) / n;
  const cardH = 28;

  headlines.slice(0, 2).forEach((h, i) => {
    const x = 14 + i * (cardW + gap);
    if (h.highlight) {
      doc.setFillColor(...CARD_NAVY);
      doc.roundedRect(x, y, cardW, cardH, 2, 2, "F");
      doc.setTextColor(203, 213, 225);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      doc.text(h.label.toUpperCase(), x + 5, y + 7);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      const val =
        typeof h.value === "number" && h.currency !== false
          ? money(h.value)
          : String(h.value);
      doc.text(val, x + 5, y + 17);
      if (h.hint) {
        doc.setTextColor(52, 211, 153);
        doc.setFontSize(6.5);
        doc.setFont("helvetica", "normal");
        doc.text(h.hint, x + 5, y + 23.5);
      }
    } else {
      doc.setFillColor(...SURFACE);
      doc.setDrawColor(52, 211, 153);
      doc.setLineWidth(0.9);
      doc.roundedRect(x, y, cardW, cardH, 2, 2, "FD");
      doc.setTextColor(...MUTED);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      doc.text(h.label.toUpperCase(), x + 5, y + 7);
      doc.setTextColor(...INK);
      doc.setFontSize(16);
      const val =
        typeof h.value === "number" && h.currency !== false
          ? money(h.value)
          : String(h.value);
      doc.text(val, x + 5, y + 17);
      if (h.hint) {
        doc.setTextColor(...GAIN);
        doc.setFontSize(6.5);
        doc.setFont("helvetica", "normal");
        doc.text(h.hint, x + 5, y + 23.5);
      }
    }
  });

  return y + cardH + 6;
}

function drawMetrics(doc: jsPDF, metrics: PdfMetric[], y: number) {
  if (!metrics.length) return y;
  y = ensureSpace(doc, y, 24);
  const pageW = doc.internal.pageSize.getWidth();
  const cols = Math.min(metrics.length, 4);
  const gap = 3;
  const usable = pageW - 28;
  const cardW = (usable - gap * (cols - 1)) / cols;
  const cardH = 18;

  metrics.slice(0, 4).forEach((m, i) => {
    const x = 14 + i * (cardW + gap);
    doc.setFillColor(...SURFACE);
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.4);
    doc.roundedRect(x, y, cardW, cardH, 1.5, 1.5, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(5.5);
    doc.setTextColor(m.danger ? DANGER[0] : MUTED[0], m.danger ? DANGER[1] : MUTED[1], m.danger ? DANGER[2] : MUTED[2]);
    doc.text(m.label.toUpperCase(), x + 3.5, y + 5.5);
    doc.setFontSize(10);
    doc.setTextColor(m.danger ? DANGER[0] : INK[0], m.danger ? DANGER[1] : INK[1], m.danger ? DANGER[2] : INK[2]);
    const val =
      typeof m.value === "number" && m.currency !== false
        ? money(m.value)
        : String(m.value);
    doc.text(val, x + 3.5, y + 12.5);
    if (m.hint) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(5.5);
      doc.setTextColor(...SUBTLE);
      doc.text(m.hint, x + 3.5, y + 16);
    }
  });

  return y + cardH + 8;
}

function drawAssumptions(doc: jsPDF, assumptions: PdfAssumption[], y: number) {
  if (!assumptions.length) return y;
  y = ensureSpace(doc, y, 36);
  y = drawSectionTitle(doc, "Underlying Assumptions", y);

  const pageW = doc.internal.pageSize.getWidth();
  const cols = 4;
  const gap = 3;
  const usable = pageW - 28;
  const cellW = (usable - gap * (cols - 1)) / cols;
  const rows = Math.ceil(assumptions.length / cols);
  const cellH = 12;
  const boxH = rows * cellH + 6;

  doc.setFillColor(...SURFACE);
  doc.setDrawColor(...LINE);
  doc.setLineWidth(0.4);
  doc.roundedRect(14, y, usable, boxH, 2, 2, "FD");

  assumptions.forEach((a, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = 14 + 4 + col * (cellW + gap);
    const cy = y + 5 + row * cellH;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(5.5);
    doc.setTextColor(...SUBTLE);
    doc.text(String(a[0]).toUpperCase(), x, cy);
    doc.setFontSize(8.5);
    doc.setTextColor(...INK);
    const val =
      typeof a[1] === "number" && a[2]
        ? money(a[1])
        : String(a[1]);
    doc.text(val, x, cy + 5);
  });

  return y + boxH + 8;
}

function drawTable(doc: jsPDF, table: PdfTableData, y: number) {
  y = ensureSpace(doc, y, 40);
  y = drawSectionTitle(doc, table.title, y);

  const currencySet = new Set(table.currencyColumns ?? []);
  const highlightSet = new Set(table.highlightRows ?? []);

  autoTable(doc, {
    startY: y,
    head: [table.head],
    body: table.body.map((row) =>
      row.map((cell, i) => cellText(cell, currencySet.has(i))),
    ),
    theme: "grid",
    styles: {
      font: "helvetica",
      fontSize: 7.5,
      cellPadding: 2.2,
      lineColor: LINE as unknown as RGB,
      lineWidth: 0.2,
      textColor: INK as unknown as RGB,
      overflow: "ellipsize",
    },
    headStyles: {
      fillColor: HEAD_BG as unknown as RGB,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 6.5,
      halign: "left",
    },
    alternateRowStyles: {
      fillColor: ALT_ROW as unknown as RGB,
    },
    columnStyles: Object.fromEntries(
      (table.columnAlignments ?? []).map((align, i) => [
        i,
        { halign: align },
      ]),
    ),
    didParseCell: (hook) => {
      if (hook.section === "body" && highlightSet.has(hook.row.index)) {
        hook.cell.styles.fillColor = [209, 250, 229];
        hook.cell.styles.fontStyle = "bold";
        hook.cell.styles.textColor = INK as unknown as RGB;
      }
    },
    margin: { left: 14, right: 14 },
  });

  return lastY(doc) + 8;
}

function drawPlaybook(doc: jsPDF, items: PdfPlaybookItem[], y: number) {
  if (!items.length) return y;
  y = ensureSpace(doc, y, 42);
  y = drawSectionTitle(doc, "Advisor Strategic Mandate & Execution Playbook", y);

  const pageW = doc.internal.pageSize.getWidth();
  const n = Math.min(items.length, 3);
  const gap = 3;
  const usable = pageW - 28;
  const cardW = (usable - gap * (n - 1)) / n;
  const cardH = 36;

  items.slice(0, 3).forEach((item, i) => {
    const x = 14 + i * (cardW + gap);
    doc.setFillColor(...SURFACE);
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.4);
    doc.roundedRect(x, y, cardW, cardH, 1.5, 1.5, "FD");

    doc.setFillColor(...GAIN_SOFT);
    doc.circle(x + 6, y + 6, 3.2, "F");
    doc.setTextColor(...GAIN);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.text(String(i + 1).padStart(2, "0"), x + 6, y + 7.2, {
      align: "center",
    });

    doc.setTextColor(...INK);
    doc.setFontSize(7.5);
    doc.text(item.title, x + 12, y + 7);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(...MUTED);
    const lines = doc.splitTextToSize(item.description, cardW - 8);
    doc.text(lines.slice(0, 5), x + 4, y + 14);
  });

  return y + cardH + 8;
}

function drawFooter(doc: jsPDF) {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const pages = doc.getNumberOfPages();

  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);

    // Soft page wash on first page only already drawn; footer strip
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.4);
    doc.line(14, pageH - 16, pageW - 14, pageH - 16);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(5.5);
    doc.setTextColor(...SUBTLE);
    const disclaimer =
      "This advisory planning dossier is prepared by Nivra Private Advisory for private client review only. Projections are illustrative and do not constitute guaranteed returns. Mutual fund investments are subject to market risks.";
    const lines = doc.splitTextToSize(disclaimer, pageW - 70);
    doc.text(lines.slice(0, 2), 14, pageH - 12);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(6);
    doc.setTextColor(...INK);
    doc.text("Advisory Desk Lead", pageW - 14, pageH - 12, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(5.5);
    doc.setTextColor(...MUTED);
    doc.text(`Page ${i} of ${pages}`, pageW - 14, pageH - 8, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(5.5);
    doc.setTextColor(...SUBTLE);
    doc.text("Powered by Nivra", pageW / 2, pageH - 4, { align: "center" });
  }
}

/**
 * Professional multi-page dossier PDF for any calculator.
 * Layout mirrors the executive FIRE dossier (no website navbar).
 */
export function generateCalculatorReport(data: CalculatorReportData) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  // Soft background on page 1
  doc.setFillColor(...PAGE_BG);
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), doc.internal.pageSize.getHeight(), "F");

  let y = drawHeader(doc, data);

  if (data.headlines?.length) {
    y = drawHeadlines(doc, data.headlines, y);
  }
  if (data.metrics?.length) {
    y = drawMetrics(doc, data.metrics, y);
  }
  if (data.assumptions?.length) {
    y = drawAssumptions(doc, data.assumptions, y);
  }
  for (const table of data.tables ?? []) {
    if (!table.body.length) continue;
    y = drawTable(doc, table, y);
  }
  if (data.playbook?.length) {
    y = drawPlaybook(doc, data.playbook, y);
  }

  drawFooter(doc);

  const safeName = (data.filename || data.clientName || "report")
    .replace(/[^a-zA-Z0-9-_ ]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();
  doc.save(`${safeName || "report"}.pdf`);
}

/**
 * Capture an off-screen HTML dossier element to a multi-page A4 PDF.
 */
export async function generatePdfFromElement(elementId: string, filename: string) {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id ${elementId} not found`);
    throw new Error(`PDF element #${elementId} not found`);
  }

  const prevCss = element.style.cssText;

  // Make measurable and visible for layout
  element.style.cssText = [
    "position: absolute",
    "left: 0",
    "top: 0",
    "z-index: -1000",
    "width: 900px",
    "background-color: #ffffff",
    "opacity: 1",
    "visibility: visible",
    "pointer-events: none",
  ].join(";");

  try {
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );

    // Wait for logo / other images so they paint into the capture
    const imgs = Array.from(element.querySelectorAll("img"));
    await Promise.all(
      imgs.map(
        (img) =>
          img.complete
            ? Promise.resolve()
            : new Promise<void>((resolve) => {
                img.onload = () => resolve();
                img.onerror = () => resolve();
              }),
      ),
    );
    await new Promise((resolve) => setTimeout(resolve, 150));

    const w = 900;
    const h = Math.max(element.scrollHeight, element.offsetHeight, 1);
    if (h < 40) {
      throw new Error("PDF element has no measurable height");
    }

    const maxCanvas = 8192;
    const pixelRatio = Math.min(2, maxCanvas / Math.max(w, h));

    const dataUrl = await toPng(element, {
      width: w,
      height: h,
      pixelRatio: pixelRatio,
      cacheBust: true,
      backgroundColor: "#ffffff",
      skipFonts: true, // often causes issues in html-to-image
    });

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const imgW = pageW;
    const imgH = (h * imgW) / w;
    let heightLeft = imgH;
    let position = 0;

    pdf.addImage(dataUrl, "PNG", 0, position, imgW, imgH);
    heightLeft -= pageH;

    while (heightLeft > 4) {
      position -= pageH;
      pdf.addPage();
      pdf.addImage(dataUrl, "PNG", 0, position, imgW, imgH);
      heightLeft -= pageH;
    }

    const safeName = (filename || "report")
      .replace(/[^a-zA-Z0-9-_ ]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .toLowerCase();

    pdf.save(`${safeName}.pdf`);
  } finally {
    element.style.cssText = prevCss;
  }
}
