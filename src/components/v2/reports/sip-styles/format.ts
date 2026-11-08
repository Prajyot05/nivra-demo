/** Display helpers. Engine values stay unrounded until here. */

export function formatINR(value: number): string {
  const n = Math.round(Math.abs(value));
  return `₹${n.toLocaleString("en-IN")}`;
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
