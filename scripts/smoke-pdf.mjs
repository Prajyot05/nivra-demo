/**
 * Smoke-test dossier PDF generation (Node). Writes sample PDFs to /tmp/nivra-pdf-smoke.
 * Run: node --experimental-strip-types scripts/smoke-pdf.mts
 * or: npx tsx scripts/smoke-pdf.mts
 */
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { mkdirSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const OUT = "/tmp/nivra-pdf-smoke";
mkdirSync(OUT, { recursive: true });

const INK = [15, 23, 42];
const MUTED = [100, 116, 139];
const LINE = [226, 232, 240];
const CARD_NAVY = [21, 32, 51];
const GAIN = [5, 150, 105];
const PAGE_BG = [250, 249, 246];

function money(n) {
  return `₹${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Math.round(n))}`;
}

function writeDossier({ filename, title, clientName, age, headlines, metrics, assumptions, table }) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();

  doc.setFillColor(...PAGE_BG);
  doc.rect(0, 0, pageW, doc.internal.pageSize.getHeight(), "F");

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
  doc.setFontSize(12);
  doc.text(title.toUpperCase(), 30, 21.5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...MUTED);
  doc.text(`${clientName} · Age ${age}`, 30, 26);

  let y = 38;
  doc.setDrawColor(...LINE);
  doc.line(14, y, pageW - 14, y);
  y += 8;

  // Headlines
  const cardW = (pageW - 28 - 4) / 2;
  headlines.forEach((h, i) => {
    const x = 14 + i * (cardW + 4);
    if (h.highlight) {
      doc.setFillColor(...CARD_NAVY);
      doc.roundedRect(x, y, cardW, 24, 2, 2, "F");
      doc.setTextColor(203, 213, 225);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      doc.text(h.label.toUpperCase(), x + 4, y + 7);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.text(money(h.value), x + 4, y + 16);
    } else {
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(52, 211, 153);
      doc.setLineWidth(0.8);
      doc.roundedRect(x, y, cardW, 24, 2, 2, "FD");
      doc.setTextColor(...MUTED);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      doc.text(h.label.toUpperCase(), x + 4, y + 7);
      doc.setTextColor(...INK);
      doc.setFontSize(14);
      doc.text(money(h.value), x + 4, y + 16);
    }
  });
  y += 32;

  // Metrics
  const mW = (pageW - 28 - 9) / 4;
  metrics.forEach((m, i) => {
    const x = 14 + i * (mW + 3);
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.4);
    doc.roundedRect(x, y, mW, 16, 1.5, 1.5, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(5.5);
    doc.setTextColor(...MUTED);
    doc.text(m.label.toUpperCase(), x + 3, y + 5);
    doc.setFontSize(9);
    doc.setTextColor(...INK);
    doc.text(typeof m.value === "number" ? money(m.value) : String(m.value), x + 3, y + 11);
  });
  y += 24;

  autoTable(doc, {
    startY: y,
    head: [assumptions.map((a) => a[0])],
    body: [assumptions.map((a) => (typeof a[1] === "number" && a[2] ? money(a[1]) : String(a[1])))],
    theme: "grid",
    styles: { fontSize: 7, textColor: INK },
    headStyles: { fillColor: INK, textColor: [255, 255, 255], fontSize: 6 },
    margin: { left: 14, right: 14 },
  });

  y = doc.lastAutoTable.finalY + 8;
  autoTable(doc, {
    startY: y,
    head: [table.head],
    body: table.body,
    theme: "grid",
    styles: { fontSize: 7.5, textColor: INK },
    headStyles: { fillColor: INK, textColor: [255, 255, 255], fontSize: 6.5 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14 },
  });

  const buf = Buffer.from(doc.output("arraybuffer"));
  const path = join(OUT, `${filename}.pdf`);
  writeFileSync(path, buf);
  return path;
}

const samples = [
  {
    filename: "mf-vs-fd-sample",
    title: "MF vs FD Comparison Dossier",
    clientName: "Mr. Anshu Kaul",
    age: 30,
    headlines: [
      { label: "MF Post-Tax", value: 1_001_643_836, highlight: true },
      { label: "FD Post-Tax", value: 1_000_924_658 },
    ],
    metrics: [
      { label: "Principal", value: 1_000_000_000 },
      { label: "MF Net", value: 1_643_836 },
      { label: "FD Net", value: 924_658 },
      { label: "Advantage", value: 719_178 },
    ],
    assumptions: [
      ["Amount", 1_000_000_000, true],
      ["Days", "15"],
      ["MF Return", "5%"],
      ["FD Return", "3%"],
    ],
    table: {
      head: ["Category", "Pre-Tax", "Tax", "Net"],
      body: [
        ["Mutual Fund", money(2_054_795), money(410_959), money(1_643_836)],
        ["Fixed Deposit", money(1_232_877), money(308_219), money(924_658)],
      ],
    },
  },
  {
    filename: "child-education-sample",
    title: "Child Education Funding Dossier",
    clientName: "Mr. Anshu Kaul",
    age: 35,
    headlines: [
      { label: "Lumpsum Today", value: 8_450_000, highlight: true },
      { label: "Monthly SIP", value: 42_500 },
    ],
    metrics: [
      { label: "Total Cost", value: 18_200_000 },
      { label: "Tax Drag", value: 1_100_000 },
      { label: "Withdrawals", value: 19_300_000 },
      { label: "SIP Years", value: "13 yrs" },
    ],
    assumptions: [
      ["Child", "Jitender"],
      ["Child Age", "5"],
      ["Return", "12%"],
      ["Tax", "12.5%"],
    ],
    table: {
      head: ["Age", "Class", "Cost", "Withdrawal"],
      body: [
        ["5", "UKG", money(24_000), money(27_000)],
        ["18", "College-1", money(2_500_000), money(2_812_500)],
      ],
    },
  },
  {
    filename: "loan-emi-sample",
    title: "Loan Analysis Dossier",
    clientName: "Mr. Anshu Kaul",
    age: 40,
    headlines: [
      { label: "Monthly EMI", value: 68_742, highlight: true },
      { label: "Total Interest", value: 8_998_080 },
    ],
    metrics: [
      { label: "Principal", value: 7_500_000 },
      { label: "Tenure", value: "20 yrs" },
      { label: "Rate", value: "9.2%" },
      { label: "Total Paid", value: 16_498_080 },
    ],
    assumptions: [
      ["Mode", "EMI"],
      ["Principal", 7_500_000, true],
      ["Years", "20"],
      ["Interest", "9.2%"],
    ],
    table: {
      head: ["Month", "EMI", "Principal", "Interest", "Balance"],
      body: [
        ["1", money(68_742), money(11_242), money(57_500), money(7_488_758)],
        ["2", money(68_742), money(11_328), money(57_414), money(7_477_430)],
      ],
    },
  },
  {
    filename: "investment-growth-sample",
    title: "Investment Growth Dossier",
    clientName: "Mr. Anshu Kaul",
    age: 30,
    headlines: [
      { label: "Maturity", value: 30_463_857, highlight: true },
      { label: "Net After Tax", value: 30_463_857 },
    ],
    metrics: [
      { label: "Invested", value: 5_000_000 },
      { label: "Gain", value: 25_463_857 },
      { label: "Tax", value: 0 },
      { label: "Years", value: "16" },
    ],
    assumptions: [
      ["Mode", "Lumpsum"],
      ["Amount", 5_000_000, true],
      ["Return", "12%"],
      ["Inflation", "5.75%"],
    ],
    table: {
      head: ["Year", "Invested", "Year End"],
      body: [
        ["1", money(5_000_000), money(5_600_000)],
        ["16", money(5_000_000), money(30_463_857)],
      ],
    },
  },
];

const written = samples.map(writeDossier);
console.log("Wrote PDF samples:");
for (const p of written) {
  const s = statSync(p);
  console.log(`  ${p}  (${s.size} bytes)`);
}
console.log(`Total files in ${OUT}:`, readdirSync(OUT).length);
if (written.some((p) => statSync(p).size < 1000)) {
  console.error("FAIL: a PDF looks too small");
  process.exit(1);
}
console.log("OK — dossier smoke PDFs generated");
