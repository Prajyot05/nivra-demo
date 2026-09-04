import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { getReportPlaybook } from "@/lib/report-playbooks";

export type SipPdfData = {
  clientName: string;
  age: number;
  goal: number;
  inflAdjGoal: number;
  useInflAdj: boolean;
  targetGoal: number;
  tenure: number;
  returnPct: number;
  inflation: number;
  tax: number;
  stepUp: number;
  standardSIP: number;
  stepUpSIP: number;
  stdInvested: number;
  stepInvested: number;
  stdGain: number;
  stepGain: number;
  stdTax: number;
  stepTax: number;
  stdCorpus: number;
  stepCorpus: number;
  stdSchedule: { year: number; monthly: number; yearEnd: number }[];
  stepSchedule: { year: number; monthly: number; yearEnd: number }[];
  delays: { mo: number; sip: number; extra: number }[];
};

type RGB = [number, number, number];

const INK: RGB = [15, 23, 42];
const MUTED: RGB = [100, 116, 139];
const SUBTLE: RGB = [148, 163, 184];
const LINE: RGB = [226, 232, 240];
const HEAD_BG: RGB = [15, 23, 42];
const ALT_ROW: RGB = [248, 250, 252];
const SURFACE: RGB = [255, 255, 255];
const PAGE_BG: RGB = [255, 255, 255];
const CARD_NAVY: RGB = [2, 6, 23];
const GAIN: RGB = [5, 150, 105];
const GAIN_SOFT: RGB = [209, 250, 229];
const EMERALD_BG: RGB = [236, 253, 245];
const ROSE: RGB = [225, 29, 72];
const ROSE_BG: RGB = [255, 241, 242];
const AMBER_BG: RGB = [255, 251, 235];

const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Math.round(n));

const money = (n: number) => `Rs. ${fmt(n)}`;

function lastY(doc: jsPDF) {
  return (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
}

function ensureSpace(doc: jsPDF, y: number, need: number) {
  const pageH = doc.internal.pageSize.getHeight();
  if (y + need > pageH - 18) {
    doc.addPage();
    doc.setFillColor(...PAGE_BG);
    doc.rect(0, 0, doc.internal.pageSize.getWidth(), pageH, "F");
    return 16;
  }
  return y;
}

function sectionTitle(doc: jsPDF, text: string, y: number, square = false) {
  const pageW = doc.internal.pageSize.getWidth();
  if (square) {
    doc.setFillColor(...GAIN);
    doc.roundedRect(14, y - 2.2, 2.2, 2.2, 0.3, 0.3, "F");
  } else {
    doc.setFillColor(...INK);
    doc.roundedRect(14, y - 2.5, 1.4, 3.2, 0.2, 0.2, "F");
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...INK);
  doc.text(text.toUpperCase(), 19, y);
  doc.setDrawColor(...LINE);
  doc.setLineWidth(0.35);
  doc.line(14, y + 2.5, pageW - 14, y + 2.5);
  return y + 8;
}

function drawDonut(
  doc: jsPDF,
  x: number,
  y: number,
  r: number,
  invested: number,
  gain: number,
  tax: number,
) {
  const total = Math.max(invested + gain + tax, 1);
  const slices: { v: number; c: RGB }[] = [
    { v: invested, c: [30, 41, 59] },
    { v: gain, c: [16, 185, 129] },
    { v: tax, c: [239, 68, 68] },
  ];

  // Stroke-based donut (reliable in jsPDF)
  let angle = -Math.PI / 2;
  for (const s of slices) {
    const sweep = (s.v / total) * Math.PI * 2;
    if (sweep <= 0) continue;
    doc.setDrawColor(...s.c);
    doc.setLineWidth(7);
    const steps = Math.max(12, Math.ceil((sweep / (Math.PI * 2)) * 64));
    for (let i = 0; i < steps; i++) {
      const a0 = angle + (sweep * i) / steps;
      const a1 = angle + (sweep * (i + 1)) / steps;
      doc.line(
        x + Math.cos(a0) * (r - 3.5),
        y + Math.sin(a0) * (r - 3.5),
        x + Math.cos(a1) * (r - 3.5),
        y + Math.sin(a1) * (r - 3.5),
      );
    }
    angle += sweep;
  }
}

/**
 * Executive Goal SIP dossier PDF (native jsPDF — reliable vs html-to-image).
 */
export function downloadSipPdf(data: SipPdfData) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  let y = 0;

  doc.setFillColor(...PAGE_BG);
  doc.rect(0, 0, pageW, pageH, "F");

  // Header
  doc.setFillColor(...CARD_NAVY);
  doc.roundedRect(14, 12, 12, 12, 1.5, 1.5, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("N", 20, 20, { align: "center" });

  doc.setTextColor(...GAIN);
  doc.setFontSize(7);
  doc.text("NIVRA PRIVATE WEALTH", 30, 15.5);
  doc.setTextColor(...INK);
  doc.setFontSize(13);
  doc.text("GOAL SIP INVESTMENT PLANNER", 30, 21.5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...MUTED);
  doc.text(
    "Institutional Wealth Advisory Desk · Goal Wealth Modeling",
    30,
    26,
  );

  // Meta card
  const metaX = pageW - 78;
  doc.setDrawColor(...LINE);
  doc.setFillColor(...ALT_ROW);
  doc.setLineWidth(0.4);
  doc.roundedRect(metaX, 11, 64, 20, 1.5, 1.5, "FD");

  const endAge = data.age + data.tenure;
  const metaRows = [
    ["CLIENT", (data.clientName || "Client").slice(0, 18)],
    ["TIMELINE", `Age ${data.age} → ${endAge}`],
    ["TARGET", money(data.targetGoal)],
  ];
  metaRows.forEach((row, i) => {
    const cy = 15 + i * 5.2;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(5);
    doc.setTextColor(...SUBTLE);
    doc.text(row[0]!, metaX + 3, cy);
    doc.setFontSize(7);
    doc.setTextColor(...INK);
    doc.text(row[1]!, metaX + 22, cy);
  });

  y = 38;
  doc.setDrawColor(...LINE);
  doc.setLineWidth(0.7);
  doc.line(14, y, pageW - 14, y);
  y += 8;

  // Primary milestones
  y = sectionTitle(doc, "Primary Goal & Accumulation Milestones", y, true);

  const cardW = (pageW - 28 - 4) / 2;
  const cardH = 36;

  // Standard card
  doc.setFillColor(...CARD_NAVY);
  doc.roundedRect(14, y, cardW, cardH, 2, 2, "F");
  doc.setTextColor(148, 163, 184);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  doc.text("FIXED MONTHLY ALLOCATION", 18, y + 5);
  doc.setTextColor(241, 245, 249);
  doc.setFontSize(8);
  doc.text("Standard Systematic Plan", 18, y + 10);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text(money(data.standardSIP), 18, y + 20);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text("/ month", 18 + doc.getTextWidth(money(data.standardSIP)) + 2, y + 20);
  doc.setFontSize(5.5);
  doc.text("Net Corpus", 18, y + 26);
  doc.setTextColor(52, 211, 153);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text(money(data.stdCorpus), 18, y + 31);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(5.5);
  doc.setTextColor(148, 163, 184);
  doc.text("Invested", 18 + cardW / 3, y + 26);
  doc.setTextColor(226, 232, 240);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text(money(data.stdInvested), 18 + cardW / 3, y + 31);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(5.5);
  doc.setTextColor(148, 163, 184);
  doc.text("Pre-Tax Gain", 18 + (2 * cardW) / 3, y + 26);
  doc.setTextColor(110, 231, 183);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text(`+${money(data.stdGain)}`, 18 + (2 * cardW) / 3, y + 31);

  // Step-up card
  const sx = 14 + cardW + 4;
  doc.setFillColor(...EMERALD_BG);
  doc.setDrawColor(167, 243, 208);
  doc.setLineWidth(0.6);
  doc.roundedRect(sx, y, cardW, cardH, 2, 2, "FD");
  doc.setFillColor(...GAIN);
  doc.roundedRect(sx + cardW - 32, y + 3, 28, 5, 1.2, 1.2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(5);
  doc.text("RECOMMENDED", sx + cardW - 18, y + 6.3, { align: "center" });
  doc.setTextColor(6, 95, 70);
  doc.setFontSize(6);
  doc.text("ACCELERATED OUTLAY ROUTE", sx + 4, y + 5);
  doc.setTextColor(2, 44, 34);
  doc.setFontSize(8);
  doc.text(`Step-Up SIP (+${data.stepUp}% p.a.)`, sx + 4, y + 10);
  doc.setFontSize(16);
  doc.text(money(data.stepUpSIP), sx + 4, y + 20);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(6, 95, 70);
  doc.text(
    "/ mo initial",
    sx + 4 + doc.getTextWidth(money(data.stepUpSIP)) + 2,
    y + 20,
  );
  doc.setFontSize(5.5);
  doc.text("Net Corpus", sx + 4, y + 26);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(2, 44, 34);
  doc.text(money(data.stepCorpus), sx + 4, y + 31);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(5.5);
  doc.setTextColor(6, 95, 70);
  doc.text("Invested", sx + 4 + cardW / 3, y + 26);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(51, 65, 85);
  doc.text(money(data.stepInvested), sx + 4 + cardW / 3, y + 31);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(5.5);
  doc.setTextColor(6, 95, 70);
  doc.text("Pre-Tax Gain", sx + 4 + (2 * cardW) / 3, y + 26);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(4, 120, 87);
  doc.text(`+${money(data.stepGain)}`, sx + 4 + (2 * cardW) / 3, y + 31);

  y += cardH + 4;

  // Insight banner
  const savingsPct =
    data.standardSIP > 0
      ? (((data.standardSIP - data.stepUpSIP) / data.standardSIP) * 100).toFixed(1)
      : "0";
  doc.setFillColor(...ALT_ROW);
  doc.setDrawColor(...LINE);
  doc.roundedRect(14, y, pageW - 28, 10, 1.5, 1.5, "FD");
  doc.setFillColor(...GAIN);
  doc.circle(18, y + 5, 1.1, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(...INK);
  const insight = `Key Advisory Insight: Step-Up SIP starts ${savingsPct}% lower (${money(data.stepUpSIP)} vs ${money(data.standardSIP)}/mo) while still delivering the target goal.`;
  doc.text(doc.splitTextToSize(insight, pageW - 40), 22, y + 4.5);
  y += 14;

  // Assumptions
  y = sectionTitle(doc, "Actuarial & Financial Parameters Baseline", y);
  const assumptions: [string, string][] = [
    ["Client Age", `${data.age} Yrs`],
    ["Goal Amount", money(data.goal)],
    ["Tenure", `${data.tenure} Yrs`],
    ["Return CAGR", `${data.returnPct.toFixed(2)}%`],
    ["Inflation", `${data.inflation.toFixed(2)}%`],
    ["Tax on Gains", `${data.tax.toFixed(2)}%`],
    ["Annual Step-Up", `${data.stepUp.toFixed(2)}%`],
    ["Infl. Adjusted", data.useInflAdj ? "ENABLED" : "OFF"],
  ];
  const cols = 4;
  const gap = 3;
  const usable = pageW - 28;
  const cellW = (usable - gap * (cols - 1)) / cols;
  const rows = Math.ceil(assumptions.length / cols);
  const boxH = rows * 11 + 4;
  doc.setFillColor(...SURFACE);
  doc.setDrawColor(...LINE);
  doc.roundedRect(14, y, usable, boxH, 2, 2, "FD");
  assumptions.forEach((a, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const cx = 14 + 3 + col * (cellW + gap);
    const cy = y + 5 + row * 11;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(5.5);
    doc.setTextColor(...SUBTLE);
    doc.text(a[0].toUpperCase(), cx, cy);
    doc.setFontSize(8);
    doc.setTextColor(...INK);
    doc.text(a[1], cx, cy + 4.5);
  });
  y += boxH + 8;

  // Corpus composition
  y = ensureSpace(doc, y, 52);
  y = sectionTitle(doc, "Corpus Composition & Capital Gains Breakdown", y);

  const drawBreakdown = (
    title: string,
    ox: number,
    invested: number,
    gain: number,
    taxAmt: number,
    corpus: number,
  ) => {
    const boxW = (usable - 4) / 2;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(...LINE);
    doc.roundedRect(ox, y, boxW, 44, 2, 2, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...INK);
    doc.text(title.toUpperCase(), ox + 4, y + 5);
    doc.setFontSize(6.5);
    doc.setTextColor(...MUTED);
    doc.text(`Gross: ${money(invested + gain)}`, ox + boxW - 4, y + 5, {
      align: "right",
    });

    drawDonut(doc, ox + 18, y + 24, 12, invested, gain, taxAmt);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(5);
    doc.setTextColor(...SUBTLE);
    doc.text("NET", ox + 18, y + 22.5, { align: "center" });
    doc.setFontSize(6);
    doc.setTextColor(...INK);
    doc.text(fmt(corpus), ox + 18, y + 26.5, { align: "center" });

    const lx = ox + 36;
    const rowsL: [string, string, RGB][] = [
      ["Invested", money(invested), [30, 41, 59]],
      ["Gain (Pre-tax)", money(gain), [16, 185, 129]],
      ["Capital Tax", money(taxAmt), [239, 68, 68]],
    ];
    rowsL.forEach((r, i) => {
      const ly = y + 14 + i * 7;
      doc.setFillColor(...r[2]);
      doc.circle(lx, ly, 1.3, "F");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(...MUTED);
      doc.text(r[0], lx + 4, ly + 1);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...INK);
      doc.text(r[1], ox + boxW - 4, ly + 1, { align: "right" });
    });
    const mult = invested > 0 ? (corpus / invested).toFixed(2) : "0.00";
    doc.setDrawColor(...LINE);
    doc.line(lx, y + 38, ox + boxW - 4, y + 38);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6);
    doc.setTextColor(...MUTED);
    doc.text("Wealth Multiplier", lx, y + 42);
    doc.setTextColor(...INK);
    doc.text(`${mult}x`, ox + boxW - 4, y + 42, { align: "right" });
  };

  drawBreakdown(
    "Standard SIP Architecture",
    14,
    data.stdInvested,
    data.stdGain,
    data.stdTax,
    data.stdCorpus,
  );
  drawBreakdown(
    "Step-Up SIP Architecture",
    14 + (usable - 4) / 2 + 4,
    data.stepInvested,
    data.stepGain,
    data.stepTax,
    data.stepCorpus,
  );
  y += 50;

  // Cost of delay
  y = ensureSpace(doc, y, 42);
  doc.setFillColor(...ROSE_BG);
  doc.setDrawColor(254, 205, 211);
  doc.roundedRect(14, y, usable, 36, 2, 2, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(136, 19, 55);
  doc.text("ACTUARIAL COST OF INACTION / PROCRASTINATION DELAY", 18, y + 6);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(...MUTED);
  doc.text(
    `Delaying SIP inception raises the monthly commitment needed for the same ${money(data.targetGoal)} corpus.`,
    18,
    y + 11,
  );

  const delayW = (usable - 12) / 4;
  data.delays.slice(0, 4).forEach((d, i) => {
    const dx = 18 + i * (delayW + 3);
    const severe = d.mo >= 12;
    doc.setFillColor(...SURFACE);
    doc.setDrawColor(severe ? 254 : 254, severe ? 205 : 226, severe ? 211 : 232);
    doc.roundedRect(dx, y + 14, delayW, 18, 1.2, 1.2, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6);
    doc.setTextColor(...INK);
    doc.text(`${d.mo} Months`, dx + 2, y + 19);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(5.5);
    doc.setTextColor(...MUTED);
    doc.text("SIP Needed", dx + 2, y + 24);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...INK);
    doc.text(`${money(d.sip)}/mo`, dx + 2, y + 28.5);
    doc.setFontSize(5.5);
    doc.setTextColor(...ROSE);
    doc.text(`Penalty +${money(d.extra)}`, dx + 2, y + 32.5);
  });
  y += 42;

  // Schedule
  y = ensureSpace(doc, y, 50);
  y = sectionTitle(doc, "Yearly Accumulation & Portfolio Growth Schedule", y);

  const body = data.stdSchedule.map((std, i) => {
    const step = data.stepSchedule[i];
    const isLast = std.year === data.tenure;
    return [
      String(std.year),
      money(std.monthly),
      money(std.yearEnd),
      money(step?.monthly ?? 0),
      money(step?.yearEnd ?? 0),
      isLast ? "Goal Achieved" : std.year === 1 ? "Initiation" : "—",
    ];
  });

  autoTable(doc, {
    startY: y,
    head: [
      [
        "Yr",
        "Std SIP (Mo)",
        "Standard Corpus",
        "Step-Up SIP",
        "Step-Up Corpus",
        "Milestone",
      ],
    ],
    body,
    theme: "grid",
    styles: {
      font: "helvetica",
      fontSize: 7,
      cellPadding: 1.8,
      lineColor: LINE as unknown as RGB,
      lineWidth: 0.2,
      textColor: INK as unknown as RGB,
    },
    headStyles: {
      fillColor: HEAD_BG as unknown as RGB,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 6.5,
    },
    alternateRowStyles: { fillColor: ALT_ROW as unknown as RGB },
    columnStyles: {
      0: { halign: "center", cellWidth: 10 },
      1: { halign: "right" },
      2: { halign: "right" },
      3: { halign: "right" },
      4: { halign: "right" },
      5: { halign: "right", cellWidth: 28 },
    },
    didParseCell: (hook) => {
      if (hook.section !== "body") return;
      const raw = hook.row.raw as string[] | undefined;
      const year = Number(raw?.[0]);
      if (year === data.tenure) {
        hook.cell.styles.fillColor = GAIN_SOFT as unknown as RGB;
        hook.cell.styles.fontStyle = "bold";
      } else if (year === Math.ceil(data.tenure / 2) || year === 10) {
        hook.cell.styles.fillColor = AMBER_BG as unknown as RGB;
      }
    },
    margin: { left: 14, right: 14 },
  });
  y = lastY(doc) + 8;

  // Playbook
  y = ensureSpace(doc, y, 40);
  y = sectionTitle(doc, "Advisor Strategic Mandate & Execution Playbook", y);
  const playbook = getReportPlaybook("goal-sip").map((p) => {
    if (p.id === "02") {
      return {
        ...p,
        title: `Annual +${data.stepUp}% Escalation Review`,
        description: `Sync the +${data.stepUp}% top-up with appraisal cycles so ${money(data.stepUpSIP)}/mo scales without lifestyle strain.`,
      };
    }
    if (p.id === "03") {
      const start = Math.max(1, data.tenure - 2);
      return {
        ...p,
        title: `Glidepath De-risking at Yr ${start}`,
        description: `Shift equity to short-duration debt via STP during years ${start}–${data.tenure} to lock the target corpus.`,
      };
    }
    return p;
  });
  const pW = (usable - 6) / 3;
  playbook.slice(0, 3).forEach((p, i) => {
    const px = 14 + i * (pW + 3);
    doc.setFillColor(...SURFACE);
    doc.setDrawColor(...LINE);
    doc.roundedRect(px, y, pW, 28, 1.5, 1.5, "FD");
    doc.setFillColor(...(p.accent ? GAIN_SOFT : ALT_ROW));
    doc.roundedRect(px + 3, y + 3, 8, 4.5, 0.8, 0.8, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6);
    doc.setTextColor(p.accent ? GAIN[0] : MUTED[0], p.accent ? GAIN[1] : MUTED[1], p.accent ? GAIN[2] : MUTED[2]);
    doc.text(p.id, px + 7, y + 6.2, { align: "center" });
    doc.setTextColor(...INK);
    doc.setFontSize(7);
    doc.text(p.title, px + 3, y + 12);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(5.5);
    doc.setTextColor(...MUTED);
    doc.text(doc.splitTextToSize(p.description, pW - 6).slice(0, 4), px + 3, y + 16);
  });
  y += 34;

  // Disclaimer
  y = ensureSpace(doc, y, 20);
  doc.setDrawColor(...LINE);
  doc.line(14, y, pageW - 14, y);
  y += 5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  doc.setTextColor(...MUTED);
  doc.text("DISCLAIMER", 14, y);
  y += 4;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.setTextColor(...SUBTLE);
  doc.text(
    doc.splitTextToSize(
      "This report is for illustrative planning only. Return and inflation assumptions are not guaranteed. Mutual fund investments are subject to market risks. Please read all scheme-related documents carefully before investing.",
      pageW - 28,
    ),
    14,
    y,
  );

  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...SUBTLE);
    doc.text(`Page ${i} of ${pages}`, pageW / 2, 290, { align: "center" });
  }

  const safeName = (data.clientName || "client")
    .replace(/[^a-zA-Z0-9-_ ]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();
  doc.save(`goal-sip-planner-${safeName || "report"}.pdf`);
}
