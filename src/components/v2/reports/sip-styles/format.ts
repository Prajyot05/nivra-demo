/** Display helpers. Engine values stay unrounded until here. */

export function formatINR(value: number): string {
  const n = Math.round(Math.abs(value));
  return `₹${n.toLocaleString("en-IN")}`;
}

export type AmountScaleRole =
  | "hero"
  | "stat"
  | "kpi"
  | "side"
  | "delay"
  | "meta"
  | "ass"
  | "legend"
  | "bar";

/** Step-down class for long full-INR strings (see MONEY_OUTPUT_MAX in @nivra/ui limits). */
export function amountScaleClass(inrText: string, role: AmountScaleRole): string {
  const len = inrText.length;
  if (len < 14) return "";
  if (len < 16) {
    return role === "hero"
      ? "amt-hero-md"
      : role === "stat"
        ? "amt-stat-md"
        : role === "kpi"
          ? "amt-kpi-md"
          : role === "side"
            ? "amt-side-md"
            : role === "delay"
              ? "amt-delay-md"
              : role === "meta"
                ? "amt-meta-md"
                : role === "ass"
                  ? "amt-ass-md"
                  : role === "legend"
                    ? "amt-legend-md"
                    : "amt-bar-md";
  }
  if (len < 18) {
    return role === "hero"
      ? "amt-hero-sm"
      : role === "stat"
        ? "amt-stat-sm"
        : role === "kpi"
          ? "amt-kpi-sm"
          : role === "side"
            ? "amt-side-sm"
            : role === "delay"
              ? "amt-delay-sm"
              : role === "meta"
                ? "amt-meta-sm"
                : role === "ass"
                  ? "amt-ass-sm"
                  : role === "legend"
                    ? "amt-legend-sm"
                    : "amt-bar-sm";
  }
  if (role === "hero") return "amt-hero-xs";
  if (role === "stat") return "amt-stat-sm";
  if (role === "kpi") return "amt-kpi-sm";
  if (role === "side") return "amt-side-sm";
  if (role === "delay") return "amt-delay-sm";
  if (role === "meta") return "amt-meta-sm";
  if (role === "ass") return "amt-ass-sm";
  if (role === "legend") return "amt-legend-sm";
  return "amt-bar-sm";
}

export function amountClass(base: string, value: number, role: AmountScaleRole): string {
  const text = formatINR(value);
  const scale = amountScaleClass(text, role);
  return scale ? `${base} ${scale}` : base;
}

/** Per-style CSS block: scales hero / stat / kpi from each template's base px. */
export function amountScaleCssBlock(bases: {
  hero?: number;
  stat?: number;
  kpi?: number;
}): string {
  const lines: string[] = [];
  const step = (base: number) => ({
    md: (base * 0.82).toFixed(1),
    sm: (base * 0.72).toFixed(1),
    xs: (base * 0.62).toFixed(1),
  });
  if (bases.hero != null) {
    const s = step(bases.hero);
    lines.push(
      `.hero-val.amt-hero-md { font-size: ${s.md}px; line-height: 1.1; }`,
      `.hero-val.amt-hero-sm { font-size: ${s.sm}px; line-height: 1.12; letter-spacing: -0.02em; }`,
      `.hero-val.amt-hero-xs { font-size: ${s.xs}px; line-height: 1.15; letter-spacing: -0.02em; }`,
    );
  }
  if (bases.stat != null) {
    const s = step(bases.stat);
    lines.push(
      `.stat-val.amt-stat-md { font-size: ${s.md}px; }`,
      `.stat-val.amt-stat-sm { font-size: ${s.sm}px; letter-spacing: -0.01em; }`,
    );
  }
  if (bases.kpi != null) {
    const s = step(bases.kpi);
    lines.push(
      `.kpi-val.amt-kpi-md { font-size: ${s.md}px; }`,
      `.kpi-val.amt-kpi-sm { font-size: ${s.sm}px; letter-spacing: -0.01em; }`,
    );
  }
  return lines.join("\n");
}

/** Human percent: 12 → 12%, 5.75 → 5.75%, 12.5 → 12.5% */
export function formatPct(value: number): string {
  if (!Number.isFinite(value)) return "0%";
  const cleaned = Number(value.toPrecision(6));
  return `${cleaned}%`;
}

export function formatPctLabel(value: number, digits = 1): string {
  return `${value.toFixed(digits)}%`;
}

export function esc(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
