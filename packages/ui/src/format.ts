export function formatINR(value: number, digits = 0): string {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(digits === 0 ? Math.round(value) : value);
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
    // Keep two decimals for Lakh ticks (₹1.05L, ₹1.40L).
    return `${sign}${(abs / 100_000).toFixed(2)}L`;
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
