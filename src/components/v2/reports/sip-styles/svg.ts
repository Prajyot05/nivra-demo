import { amountScaleClass } from "./format";
import type { SipDossierScheduleRow } from "./types";

type Slice = { pct: number; color: string };

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
  const sweep = endDeg - startDeg;
  if (sweep <= 0.05) return "";
  const start = polar(cx, cy, r, startDeg);
  const end = polar(cx, cy, r, endDeg);
  const large = sweep > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${large} 1 ${end.x} ${end.y}`;
}

/** Estimate whether a string fits inside the donut hole at a given font size. */
function fitsInHole(text: string, fontPx: number, holeDiameter: number): boolean {
  // Tabular INR glyphs are roughly 0.58em wide in sans fonts.
  return text.length * fontPx * 0.58 <= holeDiameter * 0.92;
}

/**
 * Build center-label lines for a donut that may hold large INR strings.
 * Returns label (optional) + value, with font sizes that fit the hole.
 * Crore-scale amounts auto-shrink and may split across two lines.
 */
export function donutCenterLines(
  holeDiameter: number,
  opts: { label?: string; value: string },
): Array<{ text: string; fontPx: number; weight: number }> {
  const { label, value } = opts;
  const lines: Array<{ text: string; fontPx: number; weight: number }> = [];
  const floorPx = 6;

  if (label) {
    lines.push({
      text: label,
      fontPx: Math.max(6.5, Math.min(8.5, holeDiameter * 0.1)),
      weight: 600,
    });
  }

  // Prefer a single-line value; shrink until it fits.
  let valuePx = label ? holeDiameter * 0.15 : holeDiameter * 0.18;
  valuePx = Math.min(13, Math.max(7, valuePx));
  while (valuePx > floorPx && !fitsInHole(value, valuePx, holeDiameter)) {
    valuePx -= 0.35;
  }

  // If still too wide, split amount across two lines (prefer after a comma).
  if (!fitsInHole(value, valuePx, holeDiameter) && value.length > 8) {
    const mid = Math.ceil(value.length / 2);
    let splitAt = value.lastIndexOf(",", mid + 2);
    if (splitAt < 3) {
      const nextComma = value.indexOf(",", Math.max(3, mid - 2));
      splitAt = nextComma > 0 ? nextComma : mid;
    }
    const a = value.slice(0, splitAt + 1).trimEnd();
    const b = value.slice(splitAt + 1).trimStart();
    let splitPx = Math.max(floorPx, Math.min(valuePx, holeDiameter * 0.13));
    while (
      splitPx > floorPx &&
      (!fitsInHole(a, splitPx, holeDiameter) || !fitsInHole(b, splitPx, holeDiameter))
    ) {
      splitPx -= 0.3;
    }
    lines.push({ text: a, fontPx: splitPx, weight: 700 });
    lines.push({ text: b, fontPx: splitPx, weight: 700 });
  } else {
    lines.push({ text: value, fontPx: Math.max(floorPx, valuePx), weight: 700 });
  }

  return lines;
}

export function donutSvg(
  slices: Slice[],
  opts: {
    size: number;
    stroke: number;
    /** Legacy simple strings. Prefer label + value for large INR. */
    centerLines?: string[];
    label?: string;
    value?: string;
    textFill?: string;
    /** Explicit hole fill. Prevents PDF capture from painting transparency white. */
    holeFill?: string;
    gapDeg?: number;
  },
): string {
  const { size, stroke, gapDeg = 2, textFill = "#0F172A", holeFill = "transparent" } = opts;
  const cx = size / 2;
  const cy = size / 2;
  const r = (size - stroke) / 2 - 1;
  const holeR = Math.max(10, r - stroke / 2 - 1);
  const holeDiameter = holeR * 2;

  let angle = 0;
  const paths = slices
    .filter((s) => s.pct > 0)
    .map((s) => {
      const sweep = (s.pct / 100) * 360;
      const start = angle + gapDeg / 2;
      const end = angle + sweep - gapDeg / 2;
      angle += sweep;
      const d = arcPath(cx, cy, r, start, Math.max(start, end));
      return d
        ? `<path d="${d}" fill="none" stroke="${s.color}" stroke-width="${stroke}" stroke-linecap="butt" />`
        : "";
    })
    .join("");

  let center: Array<{ text: string; fontPx: number; weight: number }>;
  if (opts.value) {
    center = donutCenterLines(holeDiameter, { label: opts.label, value: opts.value });
  } else {
    const raw = opts.centerLines ?? [];
    center = raw.map((text, i) => ({
      text,
      fontPx: i === 0 ? 9 : 8,
      weight: i === 0 ? 600 : 500,
    }));
    // If any legacy line is a long INR string, reflow it.
    if (raw.some((t) => t.includes("₹") && t.length > 10)) {
      const label = raw.find((t) => !t.includes("₹"));
      const value = raw.find((t) => t.includes("₹")) ?? raw[raw.length - 1];
      center = donutCenterLines(holeDiameter, { label, value });
    }
  }

  const totalH = center.reduce((sum, line, i) => sum + line.fontPx + (i > 0 ? 2 : 0), 0);
  let y = cy - totalH / 2;
  const text = center
    .map((line) => {
      const baseline = y + line.fontPx / 2;
      y += line.fontPx + 2;
      return `<text x="${cx}" y="${baseline}" text-anchor="middle" dominant-baseline="middle" fill="${textFill}" font-size="${line.fontPx.toFixed(1)}" font-weight="${line.weight}" font-family="inherit" font-variant-numeric="tabular-nums">${line.text}</text>`;
    })
    .join("");

  const hole =
    holeFill && holeFill !== "transparent"
      ? `<circle cx="${cx}" cy="${cy}" r="${holeR}" fill="${holeFill}" />`
      : "";

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-hidden="true">${hole}${paths}${text}</svg>`;
}

export function stackedBarSvg(
  segments: Array<{ pct: number; color: string; label: string }>,
  width = 780,
  height = 16,
): string {
  let x = 0;
  const rects = segments
    .filter((s) => s.pct > 0)
    .map((s) => {
      const w = (s.pct / 100) * width;
      const rect = `<rect x="${x}" y="0" width="${w}" height="${height}" fill="${s.color}" />`;
      x += w;
      return rect;
    })
    .join("");
  return `<svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" role="img" aria-hidden="true">${rects}</svg>`;
}

function chartTickLabel(value: number): string {
  const n = Math.round(Math.abs(value));
  if (n >= 1_00_00_000) {
    const cr = n / 1_00_00_000;
    if (cr >= 100) return `₹${Math.round(cr)}Cr`;
    if (cr >= 10) return `₹${cr.toFixed(0)}Cr`;
    return `₹${cr.toFixed(1).replace(/\.0$/, "")}Cr`;
  }
  if (n >= 1_00_000) {
    const lac = n / 1_00_000;
    return lac >= 10 ? `₹${Math.round(lac)}L` : `₹${lac.toFixed(1).replace(/\.0$/, "")}L`;
  }
  if (n === 0) return "₹0";
  return `₹${n.toLocaleString("en-IN")}`;
}

export function factsheetColumnsSvg(rows: SipDossierScheduleRow[], width = 560, height = 150): string {
  const padL = 52;
  const padR = 8;
  const padT = 12;
  const padB = 28;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;
  const maxY = Math.max(
    1,
    ...rows.map((r) => Math.max(r.invested, r.fullReturn, r.inflationAdjusted)),
  );
  const n = rows.length;
  const groupW = plotW / n;
  const barW = Math.max(3, groupW * 0.28);

  const yScale = (v: number) => padT + plotH - (Math.min(v, maxY) / maxY) * plotH;
  const tickVals = [0, maxY / 2, maxY];
  const tickLabel = chartTickLabel;
  const grid = tickVals
    .map((v) => {
      const y = yScale(v);
      return `<line x1="${padL}" y1="${y}" x2="${width - padR}" y2="${y}" stroke="#D5DBE3" stroke-width="1" />
        <text x="${padL - 6}" y="${y + 3}" text-anchor="end" font-size="8" fill="#64748B" font-variant-numeric="tabular-nums">${tickLabel(v)}</text>`;
    })
    .join("");

  const bars = rows
    .map((row, i) => {
      const cx = padL + groupW * i + groupW / 2;
      const yInv = yScale(row.invested);
      const yFull = yScale(row.fullReturn);
      const hInv = padT + plotH - yInv;
      const hFull = padT + plotH - yFull;
      const yInfl = yScale(row.inflationAdjusted);
      return `
        <rect x="${cx - barW - 1}" y="${yInv}" width="${barW}" height="${hInv}" fill="#12223F" />
        <rect x="${cx + 1}" y="${yFull}" width="${barW}" height="${hFull}" fill="#0B7A5B" />
        <circle cx="${cx}" cy="${yInfl}" r="1.8" fill="#94A3B8" />
        <text x="${cx}" y="${height - 8}" text-anchor="middle" font-size="8" fill="#64748B">${row.year}</text>`;
    })
    .join("");

  const inflPath = rows
    .map((row, i) => {
      const cx = padL + groupW * i + groupW / 2;
      const y = yScale(row.inflationAdjusted);
      return `${i === 0 ? "M" : "L"} ${cx} ${y}`;
    })
    .join(" ");

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="Yearly invested versus full return">
    ${grid}
    <path d="${inflPath}" fill="none" stroke="#94A3B8" stroke-width="1.5" stroke-dasharray="4 3" />
    ${bars}
  </svg>`;
}

export function legendRow(
  swatch: string,
  label: string,
  value: string,
  swatchSize = 10,
): string {
  const scale = amountScaleClass(value, "legend");
  return `<div class="legend-row">
    <span class="swatch" style="width:${swatchSize}px;height:${swatchSize}px;background:${swatch}"></span>
    <span class="legend-label">${label}</span>
    <span class="legend-value${scale ? ` ${scale}` : ""}">${value}</span>
  </div>`;
}
