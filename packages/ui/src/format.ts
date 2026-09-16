export function formatINR(value: number, digits = 0): string {
  if (!Number.isFinite(value)) return "—";
  const n = digits === 0 ? Math.round(value) : value;
  // Math.round of tiny negatives yields -0; Intl then prints "₹-0".
  const normalized = Object.is(n, -0) ? 0 : n;
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(normalized);
}

export function formatINRCurrency(value: number, digits = 0): string {
  return `₹${formatINR(value, digits)}`;
}

export function formatPercent(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return "—";
  return `${value.toFixed(digits)}%`;
}

export function parseDigits(raw: string): number {
  const cleaned = raw.replace(/[^0-9.]/g, "");
  if (cleaned === "" || cleaned === ".") return 0;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

export function formatCompactINR(value: number): string {
  if (!Number.isFinite(value)) return "—";
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  if (abs >= 10_000_000) {
    const n = abs / 10_000_000;
    return `${sign}${n.toFixed(2).replace(/\.?0+$/, "")}Cr`;
  }
  if (abs >= 100_000) {
    // Lakh ticks: keep precision when needed, drop trailing zeros (₹1.4L not ₹1.40L).
    return `${sign}${(abs / 100_000).toFixed(2).replace(/\.?0+$/, "")}L`;
  }
  if (abs >= 1_000) {
    const k = abs / 1_000;
    if (Number.isInteger(k) || Math.abs(k - Math.round(k)) < 1e-9) {
      return `${sign}${Math.round(k)}K`;
    }
    return `${sign}${k.toFixed(1).replace(/\.0$/, "")}K`;
  }
  return `${sign}${Math.round(abs)}`;
}

/** Money tick for chart axes. Use this everywhere so axes read the same. */
export function formatAxisINR(value: number | string): string {
  return `₹${formatCompactINR(Number(value))}`;
}
