"use client";

import { formatINRCurrency, formatPercent } from "@nivra/ui";

type Slice = {
  label: string;
  value: number;
  color: string;
  valueClass?: string;
};

type ReportCompositionDonutProps = {
  title: string;
  centerLabel: string;
  centerValue: number;
  invested: number;
  gain: number;
  tax: number;
  /** Gross line in header (invested + gain) */
  showGross?: boolean;
  /** Multiplier digits after decimal */
  multiplierDigits?: number;
  accent?: boolean;
  taxLabel?: string;
  /**
   * `stacked` = chart above legend (PDF-safe in narrow columns).
   * `row` = chart beside legend (needs ~420px+ width).
   */
  layout?: "row" | "stacked";
};

const CX = 50;
const CY = 50;
const R = 36;
const STROKE = 7;
const GAP_DEG = 2.5;

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

/** SVG arc path for a donut segment (angles in degrees, 0 = top, clockwise). */
function arcPath(
  startDeg: number,
  endDeg: number,
  r: number = R,
): string {
  const sweep = endDeg - startDeg;
  if (sweep <= 0.05) return "";
  const start = polar(CX, CY, r, startDeg);
  const end = polar(CX, CY, r, endDeg);
  const large = sweep > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${large} 1 ${end.x} ${end.y}`;
}

function buildSlices(invested: number, gain: number, tax: number, taxLabel: string): Slice[] {
  return [
    { label: "Invested", value: invested, color: "#152033" },
    {
      label: "Gain (Pre-tax)",
      value: gain,
      color: "#34d399",
      valueClass: "text-emerald-600",
    },
    {
      label: taxLabel,
      value: tax,
      color: "#f87171",
      valueClass: "text-rose-600",
    },
  ];
}

/**
 * Composition donut for executive PDF dossiers (invested / gain / tax).
 * Uses discrete arc paths with gaps for cleaner capture than stroke-dash circles.
 */
export function ReportCompositionDonut({
  title,
  centerLabel,
  centerValue,
  invested,
  gain,
  tax,
  showGross = true,
  multiplierDigits = 2,
  accent = false,
  taxLabel = "Tax on Profit",
  layout = "row",
}: ReportCompositionDonutProps) {
  const slices = buildSlices(invested, gain, tax, taxLabel);
  const total = Math.max(
    slices.reduce((sum, s) => sum + Math.max(0, s.value), 0),
    1,
  );
  const gross = invested + gain;
  const multiplier = invested > 0 ? centerValue / invested : 0;

  const usable = 360 - GAP_DEG * slices.filter((s) => s.value > 0).length;
  let cursor = 0;
  const arcs = slices
    .map((s) => {
      const portion = Math.max(0, s.value) / total;
      if (portion <= 0) return null;
      const sweep = portion * usable;
      const start = cursor;
      const end = cursor + sweep;
      cursor = end + GAP_DEG;
      return { ...s, start, end, pct: portion * 100 };
    })
    .filter(Boolean) as Array<Slice & { start: number; end: number; pct: number }>;

  const stacked = layout === "stacked";

  return (
    <div
      className={`min-w-0 overflow-hidden rounded-xl border p-4 ${
        accent
          ? "border-emerald-200 bg-emerald-50/30"
          : "border-slate-200 bg-slate-50/40"
      }`}
    >
      <div className="flex min-w-0 items-start justify-between gap-2 border-b border-slate-200 pb-2.5">
        <h4 className="min-w-0 flex-1 truncate text-xs font-bold uppercase tracking-wide text-slate-900">
          {title}
        </h4>
        {showGross ? (
          <span className="max-w-[55%] shrink-0 truncate text-right text-[10px] font-bold tabular-nums text-slate-700">
            Gross: {formatINRCurrency(gross)}
          </span>
        ) : null}
      </div>

      <div
        className={
          stacked
            ? "flex flex-col items-center gap-4 py-4"
            : "flex min-w-0 flex-col items-center gap-4 py-4 sm:flex-row sm:items-center sm:justify-center sm:gap-4"
        }
      >
        <div className="relative h-40 w-40 shrink-0">
          <svg className="h-full w-full" viewBox="0 0 100 100">
            <circle cx={CX} cy={CY} r={R} fill="none" stroke="#f1f5f9" strokeWidth={STROKE} />
            <circle cx={CX} cy={CY} r={R - STROKE / 2 - 1.5} fill="#ffffff" />
            {arcs.map((a) => (
              <path
                key={a.label}
                d={arcPath(a.start, a.end)}
                fill="none"
                stroke={a.color}
                strokeWidth={STROKE}
                strokeLinecap="butt"
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center px-5 text-center">
            <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400">
              {centerLabel}
            </span>
            <span className="mt-0.5 max-w-full break-all text-[11px] font-black leading-tight tabular-nums text-slate-900">
              {formatINRCurrency(centerValue)}
            </span>
          </div>
        </div>

        <div
          className={`min-w-0 space-y-2 text-xs ${
            stacked ? "w-full max-w-sm" : "w-full flex-1"
          }`}
        >
          {arcs.map((a) => (
            <div
              key={a.label}
              className="flex min-w-0 items-center justify-between gap-2"
            >
              <span className="flex min-w-0 items-center gap-1.5 text-slate-600">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: a.color }}
                />
                <span className="truncate">{a.label}</span>
              </span>
              <span className="flex shrink-0 items-baseline gap-1.5 tabular-nums">
                <span className={`text-[11px] font-bold ${a.valueClass ?? "text-slate-900"}`}>
                  {formatINRCurrency(a.value)}
                </span>
                <span className="text-[10px] font-semibold text-slate-400">
                  {formatPercent(a.pct, 1)}
                </span>
              </span>
            </div>
          ))}
          <div className="flex min-w-0 items-center justify-between gap-2 border-t border-slate-200 pt-2 text-[11px] font-bold">
            <span className="truncate text-slate-500">Wealth Multiplier</span>
            <span className="shrink-0 tabular-nums text-slate-900">
              {multiplier.toFixed(multiplierDigits)}x
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
