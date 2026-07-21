import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(
    Math.round(n),
  );

const money = (n: number) => `Rs. ${fmt(n)}`;

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

const INK = [15, 23, 42] as const;
const MUTED = [100, 116, 139] as const;
const LINE = [226, 232, 240] as const;
const HEAD_BG = [15, 23, 42] as const;
const ALT_ROW = [248, 250, 252] as const;

type RGB = [number, number, number];

function sectionTitle(doc: jsPDF, text: string, y: number) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...INK);
  doc.text(text.toUpperCase(), 14, y);
  doc.setDrawColor(...LINE);
  doc.setLineWidth(0.4);
  doc.line(14, y + 2, 196, y + 2);
  return y + 8;
}

function lastY(doc: jsPDF) {
  return (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable
    .finalY;
}

function drawDonutChart(
  invested: number,
  gain: number,
  tax: number,
  corpus: number,
): string {
  const size = 440;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);

  const cx = size / 2;
  const cy = size / 2;
  const outerR = 150;
  const innerR = 95;
  const total = Math.max(invested + gain + tax, 1);

  const slices: { value: number; color: string }[] = [
    { value: invested, color: "#152033" },
    { value: gain, color: "#34d399" },
    { value: tax, color: "#f87171" },
  ];

  let start = -Math.PI / 2;
  for (const slice of slices) {
    const angle = (slice.value / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, outerR, start, start + angle);
    ctx.closePath();
    ctx.fillStyle = slice.color;
    ctx.fill();
    start += angle;
  }

  ctx.beginPath();
  ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();

  ctx.fillStyle = "#64748b";
  ctx.font = "600 18px Helvetica, Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("CORPUS", cx, cy - 8);
  ctx.fillStyle = "#0f172a";
  ctx.font = "700 28px Helvetica, Arial, sans-serif";
  ctx.fillText(fmt(corpus), cx, cy + 24);

  return canvas.toDataURL("image/png");
}

function drawBarChart(
  stdInvested: number,
  stepInvested: number,
  stdTax: number,
  stepTax: number,
  stdCorpus: number,
  stepCorpus: number,
): string {
  const width = 1000;
  const height = 480;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  const groups = [
    { label: "Invested", sip: stdInvested, step: stepInvested },
    { label: "Tax Liability", sip: stdTax, step: stepTax },
    { label: "Final Corpus", sip: stdCorpus, step: stepCorpus },
  ];
  const max = Math.max(...groups.flatMap((g) => [g.sip, g.step]), 1);

  const left = 150;
  const right = 130;
  const top = 36;
  const bottom = 50;
  const chartW = width - left - right;
  const chartH = height - top - bottom;
  const groupH = chartH / groups.length;

  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const x = left + (chartW * i) / 4;
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x, top + chartH);
    ctx.stroke();
  }

  groups.forEach((g, i) => {
    const y0 = top + i * groupH + 20;
    ctx.fillStyle = "#475569";
    ctx.font = "600 18px Helvetica, Arial, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(g.label, left - 16, y0 + 24);

    const barH = 18;
    const sipW = (g.sip / max) * chartW;
    const stepW = (g.step / max) * chartW;

    ctx.fillStyle = "#0f172a";
    ctx.fillRect(left, y0, Math.max(sipW, 2), barH);
    ctx.fillStyle = "#94a3b8";
    ctx.fillRect(left, y0 + barH + 10, Math.max(stepW, 2), barH);

    // Value labels at end of bars
    ctx.font = "600 16px Helvetica, Arial, sans-serif";
    ctx.textAlign = "left";
    ctx.fillStyle = "#0f172a";
    ctx.fillText(fmt(g.sip), left + Math.max(sipW, 2) + 10, y0 + 14);
    ctx.fillStyle = "#64748b";
    ctx.fillText(fmt(g.step), left + Math.max(stepW, 2) + 10, y0 + barH + 24);
  });

  ctx.fillStyle = "#94a3b8";
  ctx.font = "14px Helvetica, Arial, sans-serif";
  ctx.textAlign = "center";
  for (let i = 0; i <= 4; i++) {
    const x = left + (chartW * i) / 4;
    const val = (max * i) / 4;
    let label = fmt(val);
    if (val >= 10000000) label = `${(val / 10000000).toFixed(1)}Cr`;
    else if (val >= 100000) label = `${(val / 100000).toFixed(1)}L`;
    else if (val >= 1000) label = `${(val / 1000).toFixed(1)}K`;
    ctx.fillText(label, x, height - 18);
  }

  ctx.fillStyle = "#0f172a";
  ctx.fillRect(left, 10, 12, 12);
  ctx.fillStyle = "#334155";
  ctx.font = "14px Helvetica, Arial, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("SIP", left + 18, 20);
  ctx.fillStyle = "#94a3b8";
  ctx.fillRect(left + 70, 10, 12, 12);
  ctx.fillStyle = "#334155";
  ctx.fillText("Step-Up", left + 88, 20);

  return canvas.toDataURL("image/png");
}

function drawDonutBreakdown(
  title: string,
  invested: number,
  gain: number,
  tax: number,
): string {
  const width = 420;
  const height = 140;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "#0f172a";
  ctx.font = "700 18px Helvetica, Arial, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(title, 0, 22);

  const rows: { label: string; value: number; color: string }[] = [
    { label: "Invested", value: invested, color: "#152033" },
    { label: "Gain (Pre-Tax)", value: gain, color: "#34d399" },
    { label: "Capital Gain Tax", value: tax, color: "#f87171" },
  ];

  rows.forEach((row, i) => {
    const y = 48 + i * 30;
    ctx.beginPath();
    ctx.arc(8, y - 4, 6, 0, Math.PI * 2);
    ctx.fillStyle = row.color;
    ctx.fill();

    ctx.fillStyle = "#64748b";
    ctx.font = "500 16px Helvetica, Arial, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(row.label, 24, y);

    ctx.fillStyle = "#0f172a";
    ctx.font = "700 16px Helvetica, Arial, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(fmt(row.value), width - 8, y);
  });

  return canvas.toDataURL("image/png");
}

export function downloadSipPdf(data: SipPdfData) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  let y = 0;

  doc.setFillColor(...HEAD_BG);
  doc.rect(0, 0, pageW, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Goal SIP Planner", 14, 12);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225);
  doc.text("Standard vs Step-Up SIP comparison", 14, 19);

  const dateStr = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  doc.text(dateStr, pageW - 14, 12, { align: "right" });

  y = 36;

  doc.setTextColor(...INK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(data.clientName || "Client", 14, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text(`Age ${data.age}`, 14, y + 5);
  y += 14;

  y = sectionTitle(doc, "Assumptions", y);

  const assumptionRows: [string, string][] = [
    ["Target Goal", money(data.goal)],
    ...(data.useInflAdj
      ? ([
          ["Inflation Adj. Goal", money(data.inflAdjGoal)],
          ["Goal Used", money(data.targetGoal)],
        ] as [string, string][])
      : []),
    ["Tenure", `${data.tenure} years`],
    ["Expected Return", `${data.returnPct}%`],
    ["Inflation", `${data.inflation}%`],
    ["Capital Gains Tax", `${data.tax}%`],
    ["Step-Up", `${data.stepUp}% p.a.`],
  ];

  autoTable(doc, {
    startY: y,
    body: assumptionRows,
    theme: "plain",
    styles: {
      font: "helvetica",
      fontSize: 9,
      cellPadding: { top: 2.2, bottom: 2.2, left: 2, right: 2 },
      textColor: INK as unknown as RGB,
    },
    columnStyles: {
      0: { cellWidth: 50, textColor: MUTED as unknown as RGB },
      1: { cellWidth: 45, halign: "right", fontStyle: "bold" },
    },
    margin: { left: 14, right: 14 },
  });

  y = lastY(doc) + 10;

  // Charts
  if (y > 120) {
    doc.addPage();
    y = 18;
  }
  y = sectionTitle(doc, "Corpus Breakdown", y);

  const stdPie = drawDonutChart(
    data.stdInvested,
    data.stdGain,
    data.stdTax,
    data.stdCorpus,
  );
  const stepPie = drawDonutChart(
    data.stepInvested,
    data.stepGain,
    data.stepTax,
    data.stepCorpus,
  );
  const stdBreakdown = drawDonutBreakdown(
    "Standard SIP",
    data.stdInvested,
    data.stdGain,
    data.stdTax,
  );
  const stepBreakdown = drawDonutBreakdown(
    "Step-Up SIP",
    data.stepInvested,
    data.stepGain,
    data.stepTax,
  );

  if (stdPie) doc.addImage(stdPie, "PNG", 18, y, 42, 42);
  if (stepPie) doc.addImage(stepPie, "PNG", 110, y, 42, 42);

  if (stdBreakdown) doc.addImage(stdBreakdown, "PNG", 14, y + 44, 85, 28);
  if (stepBreakdown) doc.addImage(stepBreakdown, "PNG", 108, y + 44, 85, 28);

  y += 78;

  if (y > 200) {
    doc.addPage();
    y = 18;
  }
  y = sectionTitle(doc, "Standard vs Step-Up Comparison", y);

  const barImg = drawBarChart(
    data.stdInvested,
    data.stepInvested,
    data.stdTax,
    data.stepTax,
    data.stdCorpus,
    data.stepCorpus,
  );
  if (barImg) {
    doc.addImage(barImg, "PNG", 14, y, 182, 72);
    y += 78;
  }

  if (y > 230) {
    doc.addPage();
    y = 18;
  }
  y = sectionTitle(doc, "Comparison Summary", y);

  autoTable(doc, {
    startY: y,
    head: [["", "Standard SIP", "Step-Up SIP"]],
    body: [
      ["Monthly SIP", money(data.standardSIP), money(data.stepUpSIP)],
      ["Total Invested", money(data.stdInvested), money(data.stepInvested)],
      ["Gain (Pre-Tax)", money(data.stdGain), money(data.stepGain)],
      ["Capital Gain Tax", money(data.stdTax), money(data.stepTax)],
      ["Final Corpus", money(data.stdCorpus), money(data.stepCorpus)],
    ],
    theme: "grid",
    styles: {
      font: "helvetica",
      fontSize: 9,
      cellPadding: 3,
      lineColor: LINE as unknown as RGB,
      lineWidth: 0.2,
      textColor: INK as unknown as RGB,
    },
    headStyles: {
      fillColor: HEAD_BG as unknown as RGB,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
      halign: "center",
    },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 42 },
      1: { halign: "right", cellWidth: 50 },
      2: { halign: "right", cellWidth: 50 },
    },
    alternateRowStyles: {
      fillColor: ALT_ROW as unknown as RGB,
    },
    margin: { left: 14, right: 14 },
  });

  y = lastY(doc) + 10;

  if (y > 230) {
    doc.addPage();
    y = 18;
  }
  y = sectionTitle(doc, "Cost of Delay", y);

  autoTable(doc, {
    startY: y,
    head: [["Delay", "SIP Required", "Extra Cost"]],
    body: data.delays.map((d) => [
      `${d.mo} months`,
      money(d.sip),
      money(d.extra),
    ]),
    theme: "grid",
    styles: {
      font: "helvetica",
      fontSize: 9,
      cellPadding: 2.8,
      lineColor: LINE as unknown as RGB,
      lineWidth: 0.2,
      textColor: INK as unknown as RGB,
    },
    headStyles: {
      fillColor: HEAD_BG as unknown as RGB,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
    },
    columnStyles: {
      0: { cellWidth: 35 },
      1: {halign: "right", cellWidth: 50 },
      2: {
        halign: "right",
        cellWidth: 50,
        textColor: [220, 38, 38] as unknown as RGB,
        fontStyle: "bold",
      },
    },
    alternateRowStyles: {
      fillColor: ALT_ROW as unknown as RGB,
    },
    margin: { left: 14, right: 14 },
  });

  y = lastY(doc) + 10;

  if (y > 180) {
    doc.addPage();
    y = 18;
  }

  y = sectionTitle(doc, "Yearly Schedule — Standard SIP", y);

  autoTable(doc, {
    startY: y,
    head: [["Year", "Monthly SIP", "Year-End Corpus"]],
    body: data.stdSchedule.map((r) => [
      String(r.year),
      money(r.monthly),
      money(r.yearEnd),
    ]),
    theme: "grid",
    styles: {
      font: "helvetica",
      fontSize: 8,
      cellPadding: 2,
      lineColor: LINE as unknown as RGB,
      lineWidth: 0.2,
      textColor: INK as unknown as RGB,
    },
    headStyles: {
      fillColor: HEAD_BG as unknown as RGB,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
    },
    columnStyles: {
      0: { cellWidth: 20, halign: "center" },
      1: {halign: "right", cellWidth: 50 },
      2: {halign: "right", cellWidth: 55 },
    },
    alternateRowStyles: {
      fillColor: ALT_ROW as unknown as RGB,
    },
    margin: { left: 14, right: 14 },
  });

  y = lastY(doc) + 10;

  if (y > 200) {
    doc.addPage();
    y = 18;
  }

  y = sectionTitle(doc, "Yearly Schedule — Step-Up SIP", y);

  autoTable(doc, {
    startY: y,
    head: [["Year", "Monthly SIP", "Year-End Corpus"]],
    body: data.stepSchedule.map((r) => [
      String(r.year),
      money(r.monthly),
      money(r.yearEnd),
    ]),
    theme: "grid",
    styles: {
      font: "helvetica",
      fontSize: 8,
      cellPadding: 2,
      lineColor: LINE as unknown as RGB,
      lineWidth: 0.2,
      textColor: INK as unknown as RGB,
    },
    headStyles: {
      fillColor: HEAD_BG as unknown as RGB,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
    },
    columnStyles: {
      0: { cellWidth: 20, halign: "center" },
      1: {halign: "right", cellWidth: 50 },
      2: {halign: "right", cellWidth: 55 },
    },
    alternateRowStyles: {
      fillColor: ALT_ROW as unknown as RGB,
    },
    margin: { left: 14, right: 14 },
  });

  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(`Page ${i} of ${pages}`, pageW / 2, 287, { align: "center" });
  }

  const safeName = (data.clientName || "client")
    .replace(/[^a-zA-Z0-9-_ ]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();
  doc.save(`goal-sip-planner-${safeName || "report"}.pdf`);
}
