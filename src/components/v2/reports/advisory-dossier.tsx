"use client";

import { type CSSProperties, type ReactNode } from "react";
import { formatINRCurrency, formatPercent, inrAmountTextClass } from "@nivra/ui";
import {
  DUMMY_REPORT_CONTACT,
  type ExecutiveContact,
} from "@/components/reports/executive-dossier";

/**
 * V2 PDF dossiers — corporate wealth-planning document system.
 *
 * Design lock:
 * - White paper letterhead, not a SaaS card stack
 * - Typography + hairlines for structure; cards only when comparison needs contrast
 * - Fixed 900px export canvas; data-pdf-keep-together on logical blocks
 * - V1 executive dossiers are untouched
 */

export type AdvisoryMetaCell = {
  label: string;
  value: ReactNode;
  accent?: boolean;
};

type AdvisoryDossierSheetProps = {
  id: string;
  title: string;
  brandLine?: string;
  subtitle?: string;
  meta: AdvisoryMetaCell[];
  contact?: ExecutiveContact;
  children: ReactNode;
  disclaimer?: string | false;
};

const DEFAULT_DISCLAIMER =
  "This report is for illustrative planning only. Return and inflation assumptions are not guaranteed. Mutual fund investments are subject to market risks. Please read all scheme-related documents carefully before investing.";

/** Document tokens */
const PAGE = "#ffffff";
const INK = "#0f172a";
const MUTED = "#64748b";
const RULE = "#e2e8f0";
const RULE_STRONG = "#cbd5e1";
const NAVY = "#0f172a";
const ACCENT = "#0f3d32";
const FRICTION = "#9f1239";
const FINAL_BG = "#f0fdf4";
const MID_BG = "#fffbeb";
const ZEBRA = "#f8fafc";

const SHEET_FONT: CSSProperties = {
  fontFamily: "var(--font-v2-inter), Inter, ui-sans-serif, system-ui, sans-serif",
};

export function AdvisoryDossierSheet({
  id,
  title,
  brandLine = "Nivra Private Wealth",
  subtitle,
  meta,
  contact = DUMMY_REPORT_CONTACT,
  children,
  disclaimer = DEFAULT_DISCLAIMER,
}: AdvisoryDossierSheetProps) {
  const email = contact.email?.trim() || DUMMY_REPORT_CONTACT.email;
  const phone = contact.phone?.trim() || DUMMY_REPORT_CONTACT.phone;

  return (
    <div
      id={id}
      data-v2-report="true"
      className="pointer-events-none fixed flex w-[900px] flex-col"
      style={{
        left: "-10000px",
        top: 0,
        zIndex: -1,
        isolation: "isolate",
        ...SHEET_FONT,
        backgroundColor: PAGE,
        color: INK,
        padding: "40px 48px 48px",
        boxSizing: "border-box",
      }}
      aria-hidden
    >
      <header className="mb-7" data-pdf-keep-together>
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0 flex items-start gap-3.5">
            <div
              className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center text-[15px] font-semibold tracking-tight text-white"
              style={{ backgroundColor: NAVY }}
            >
              N
            </div>
            <div className="min-w-0 pt-0.5">
              <p
                className="text-[10px] font-semibold uppercase tracking-[0.18em]"
                style={{ color: ACCENT }}
              >
                {brandLine}
              </p>
              <h1 className="mt-1 text-[22px] font-semibold leading-tight tracking-tight text-slate-950">
                {title}
              </h1>
              {subtitle ? (
                <p className="mt-1 text-[13px] leading-snug" style={{ color: MUTED }}>
                  {subtitle}
                </p>
              ) : null}
            </div>
          </div>
          <div className="shrink-0 pt-1 text-right text-[12px] leading-relaxed" style={{ color: MUTED }}>
            <p className="tabular-nums">{email}</p>
            <p className="mt-0.5 tabular-nums">{phone}</p>
          </div>
        </div>

        <div className="mt-5" style={{ borderTop: `2px solid ${NAVY}` }} />
        <div style={{ borderTop: `1px solid ${RULE}`, marginTop: 3 }} />

        {meta.length > 0 ? (
          <div
            className="mt-4 grid gap-0"
            style={{
              gridTemplateColumns: `repeat(${Math.min(meta.length, 5)}, minmax(0, 1fr))`,
            }}
          >
            {meta.map((cell, index) => (
              <div
                key={`${cell.label}-${index}`}
                className="min-w-0 py-2.5 pr-4"
                style={{
                  borderRight:
                    index < meta.length - 1 && index < 4 ? `1px solid ${RULE}` : undefined,
                  paddingLeft: index === 0 ? 0 : 16,
                }}
              >
                <p
                  className="text-[10px] font-medium uppercase tracking-[0.12em]"
                  style={{ color: MUTED }}
                >
                  {cell.label}
                </p>
                <p
                  className={`mt-1.5 break-words font-semibold leading-snug tabular-nums ${
                    typeof cell.value === "string"
                      ? `${inrAmountTextClass(cell.value, "compact")} text-[13px]`
                      : "text-[13px]"
                  }`}
                  style={{ color: cell.accent ? ACCENT : INK }}
                >
                  {cell.value}
                </p>
              </div>
            ))}
          </div>
        ) : null}
      </header>

      <div className="flex flex-col gap-7">{children}</div>

      {disclaimer !== false ? (
        <footer className="mt-10" data-pdf-keep-together>
          <div style={{ borderTop: `1px solid ${RULE}` }} className="pt-5">
            <p
              className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: MUTED }}
            >
              Disclaimer
            </p>
            <p className="text-[11.5px] leading-relaxed" style={{ color: MUTED }}>
              {disclaimer}
            </p>
            <div className="mt-6 flex flex-col items-center gap-2">
              <span
                className="block h-0.5 w-10 rounded-sm"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, #0f3d32 20%, #0f3d32 80%, transparent)",
                }}
                aria-hidden
              />
              <p
                className="m-0 text-center text-[10px] font-medium uppercase tracking-[0.14em]"
                style={{ color: "#94a3b8" }}
              >
                Powered by{" "}
                <span className="text-[11px] font-bold normal-case tracking-wide text-slate-700">
                  Nivra
                </span>
              </p>
            </div>
          </div>
        </footer>
      ) : null}
    </div>
  );
}

export function AdvisorySection({
  title,
  hint,
  children,
  keepTogether = false,
}: {
  title: string;
  hint?: ReactNode;
  children: ReactNode;
  keepTogether?: boolean;
}) {
  return (
    <section className="flex flex-col gap-3" data-pdf-keep-together={keepTogether ? "" : undefined}>
      <div className="flex items-baseline justify-between gap-4">
        <h2
          className="text-[11px] font-semibold uppercase tracking-[0.14em]"
          style={{ color: INK }}
        >
          {title}
        </h2>
        {hint ? (
          <span className="text-[11.5px]" style={{ color: MUTED }}>
            {hint}
          </span>
        ) : null}
      </div>
      <div style={{ borderTop: `1px solid ${RULE}` }} />
      {children}
    </section>
  );
}

export function AdvisoryHero({
  left,
  right,
}: {
  left: { label: string; value: ReactNode; hint?: ReactNode };
  right: { label: string; value: ReactNode; hint?: ReactNode };
}) {
  return (
    <div className="grid grid-cols-2 gap-0" data-pdf-keep-together>
      <div
        className="min-w-0 pr-6"
        style={{ borderRight: `1px solid ${RULE_STRONG}` }}
      >
        <p
          className="text-[10px] font-medium uppercase tracking-[0.14em]"
          style={{ color: MUTED }}
        >
          {left.label}
        </p>
        <p
          className={`mt-2.5 break-words font-semibold leading-none tracking-tight tabular-nums text-slate-950 ${
            typeof left.value === "string"
              ? inrAmountTextClass(left.value, "hero")
              : "text-[28px]"
          }`}
        >
          {left.value}
        </p>
        {left.hint ? (
          <p className="mt-2.5 text-[12px] leading-snug" style={{ color: MUTED }}>
            {left.hint}
          </p>
        ) : null}
      </div>
      <div className="min-w-0 pl-6">
        <p
          className="text-[10px] font-medium uppercase tracking-[0.14em]"
          style={{ color: ACCENT }}
        >
          {right.label}
        </p>
        <p
          className={`mt-2.5 break-words font-semibold leading-none tracking-tight tabular-nums ${
            typeof right.value === "string"
              ? inrAmountTextClass(right.value, "hero")
              : "text-[28px]"
          }`}
          style={{ color: ACCENT }}
        >
          {right.value}
        </p>
        {right.hint ? (
          <p className="mt-2.5 text-[12px] leading-snug" style={{ color: MUTED }}>
            {right.hint}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function AdvisoryStatRow({
  items,
}: {
  items: Array<{ label: string; value: ReactNode }>;
}) {
  const cols = Math.min(items.length, 4);
  return (
    <div
      className="grid gap-0"
      style={{
        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        borderTop: `1px solid ${RULE}`,
        borderBottom: `1px solid ${RULE}`,
      }}
      data-pdf-keep-together
    >
      {items.slice(0, cols).map((item, index) => (
        <div
          key={item.label}
          className="min-w-0 py-3.5"
          style={{
            paddingLeft: index === 0 ? 0 : 16,
            paddingRight: 16,
            borderRight: index < cols - 1 ? `1px solid ${RULE}` : undefined,
          }}
        >
          <p
            className="text-[10px] font-medium uppercase tracking-[0.1em]"
            style={{ color: MUTED }}
          >
            {item.label}
          </p>
          <p
            className={`mt-1.5 break-words font-semibold leading-tight tabular-nums text-slate-950 ${
              typeof item.value === "string"
                ? `${inrAmountTextClass(item.value, "stat")} text-[15px]`
                : "text-[15px]"
            }`}
          >
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}

/** @deprecated Prefer AdvisoryHero. Kept so older call sites still render. */
export function AdvisoryFigures({
  items,
}: {
  items: Array<{
    label: string;
    value: ReactNode;
    hint?: ReactNode;
    detail?: Array<{ label: string; value: ReactNode; tone?: "muted" | "positive" | "negative" }>;
    emphasize?: boolean;
  }>;
}) {
  if (items.length === 2) {
    return (
      <div className="flex flex-col gap-5">
        <AdvisoryHero
          left={{ label: items[0]!.label, value: items[0]!.value, hint: items[0]!.hint }}
          right={{ label: items[1]!.label, value: items[1]!.value, hint: items[1]!.hint }}
        />
        <AdvisoryStatRow
          items={items.flatMap((item) =>
            (item.detail ?? []).map((d) => ({ label: d.label, value: d.value })),
          )}
        />
      </div>
    );
  }
  return (
    <AdvisoryStatRow items={items.map((item) => ({ label: item.label, value: item.value }))} />
  );
}

export function AdvisoryAssumptions({
  items,
}: {
  items: Array<{ label: string; value: string; accent?: boolean }>;
}) {
  return (
    <div
      className="grid"
      style={{ gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}
    >
      {items.map((item, index) => (
        <div
          key={item.label}
          className="min-w-0 py-2.5"
          style={{
            borderBottom: `1px solid ${RULE}`,
            paddingRight: 12,
            paddingLeft: index % 4 === 0 ? 0 : 12,
            borderRight: index % 4 === 3 ? undefined : `1px solid ${RULE}`,
          }}
        >
          <p className="text-[11px]" style={{ color: MUTED }}>
            {item.label}
          </p>
          <p
            className={`mt-1 break-words text-[13px] font-semibold tabular-nums ${
              item.value.startsWith("₹")
                ? inrAmountTextClass(item.value, "compact")
                : ""
            }`}
            style={{ color: item.accent ? ACCENT : INK }}
            title={item.value}
          >
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}

export function AdvisoryReading({
  items,
}: {
  items: Array<{ title: string; body: ReactNode }>;
}) {
  return (
    <section className="flex flex-col gap-3" data-pdf-keep-together>
      <h2
        className="text-[11px] font-semibold uppercase tracking-[0.14em]"
        style={{ color: INK }}
      >
        Reading
      </h2>
      <div style={{ borderTop: `1px solid ${RULE}` }} />
      <div className="flex flex-col gap-4">
        {items.map((item, index) => (
          <div key={item.title} className="flex gap-3.5">
            <span
              className="w-7 shrink-0 pt-0.5 text-[12px] font-semibold tabular-nums"
              style={{ color: MUTED }}
            >
              {String(index + 1).padStart(2, "0")}
            </span>
            <div className="min-w-0">
              <h3 className="text-[13px] font-semibold text-slate-950">{item.title}</h3>
              <p className="mt-1 text-[13px] leading-[1.55]" style={{ color: "#475569" }}>
                {item.body}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function AdvisoryNote({
  title,
  children,
  tone = "info",
}: {
  title: string;
  children: ReactNode;
  tone?: "info" | "friction";
}) {
  const isFriction = tone === "friction";
  return (
    <div
      className="py-3.5 pl-4"
      style={{
        borderLeft: `3px solid ${isFriction ? FRICTION : NAVY}`,
        backgroundColor: isFriction ? "#fff1f2" : ZEBRA,
      }}
      data-pdf-keep-together
    >
      <p
        className="text-[11px] font-semibold uppercase tracking-[0.12em]"
        style={{ color: isFriction ? FRICTION : INK }}
      >
        {title}
      </p>
      <div className="mt-1.5 text-[13px] leading-[1.55]" style={{ color: "#475569" }}>
        {children}
      </div>
    </div>
  );
}

export function AdvisoryTable({
  columns,
  rows,
  caption,
}: {
  columns: Array<{ key: string; header: string; align?: "left" | "right" | "center" }>;
  rows: Array<Record<string, ReactNode> & { _tone?: "default" | "mid" | "final" | "highlight" }>;
  caption?: ReactNode;
}) {
  return (
    <div className="w-full">
      {caption ? (
        <div className="mb-2 text-right text-[11.5px]" style={{ color: MUTED }}>
          {caption}
        </div>
      ) : null}
      <table
        className="w-full border-collapse text-left text-[12.5px] tabular-nums"
        style={{ tableLayout: "fixed" }}
      >
        <thead data-pdf-keep-together>
          <tr style={{ backgroundColor: NAVY }}>
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-[0.08em]"
                style={{ color: "#f8fafc", textAlign: col.align ?? "left" }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const tone = row._tone ?? "default";
            const bg =
              tone === "final"
                ? FINAL_BG
                : tone === "mid"
                  ? MID_BG
                  : tone === "highlight"
                    ? "#f1f5f9"
                    : i % 2 === 1
                      ? ZEBRA
                      : "#ffffff";
            const weight = tone === "final" || tone === "highlight" ? 600 : 500;
            return (
              <tr
                key={i}
                data-pdf-keep-together
                style={{
                  backgroundColor: bg,
                  borderBottom: `1px solid ${RULE}`,
                }}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className="px-3 py-2.5 align-middle"
                    style={{
                      textAlign: col.align ?? "left",
                      fontWeight: weight,
                      color: tone === "final" ? "#064e3b" : "#1e293b",
                      wordBreak: "break-word",
                    }}
                  >
                    {row[col.key]}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function AdvisoryComposition({
  title,
  centerLabel,
  centerValue,
  invested,
  gain,
  tax,
  taxLabel = "Tax",
}: {
  title: string;
  centerLabel: string;
  centerValue: number;
  invested: number;
  gain: number;
  tax: number;
  taxLabel?: string;
}) {
  const parts = [
    { label: "Invested", value: Math.max(0, invested) },
    { label: "Gain", value: Math.max(0, gain) },
    { label: taxLabel, value: Math.max(0, tax) },
  ];
  const total = Math.max(
    parts.reduce((s, p) => s + p.value, 0),
    1,
  );
  const multiplier = invested > 0 ? centerValue / invested : 0;

  return (
    <div className="min-w-0" data-pdf-keep-together>
      <div className="mb-2.5 flex items-baseline justify-between gap-3">
        <p className="text-[13px] font-semibold text-slate-950">{title}</p>
        <p
          className={`break-words tabular-nums ${inrAmountTextClass(formatINRCurrency(centerValue), "compact")} text-[11.5px]`}
          style={{ color: MUTED }}
        >
          {centerLabel} {formatINRCurrency(centerValue)} · {multiplier.toFixed(2)}x
        </p>
      </div>
      <AdvisoryTable
        columns={[
          { key: "label", header: "Category", align: "left" },
          { key: "value", header: "Amount", align: "right" },
          { key: "share", header: "Share", align: "right" },
        ]}
        rows={parts.map((p) => ({
          label: p.label,
          value: formatINRCurrency(p.value),
          share: formatPercent((p.value / total) * 100, 1),
        }))}
      />
    </div>
  );
}

export function AdvisoryPlaybook({
  pillars,
}: {
  pillars: Array<{ id: string; title: string; description: string }>;
}) {
  return (
    <section className="flex flex-col gap-3" data-pdf-keep-together>
      <h2
        className="text-[11px] font-semibold uppercase tracking-[0.14em]"
        style={{ color: INK }}
      >
        Next steps
      </h2>
      <div style={{ borderTop: `1px solid ${RULE}` }} />
      <div className="flex flex-col">
        {pillars.map((p, index) => (
          <div
            key={p.id}
            className="flex gap-3.5 py-3.5"
            style={{
              borderBottom: index < pillars.length - 1 ? `1px solid ${RULE}` : undefined,
            }}
          >
            <span
              className="w-7 shrink-0 text-[12px] font-semibold tabular-nums"
              style={{ color: MUTED }}
            >
              {String(index + 1).padStart(2, "0")}
            </span>
            <div className="min-w-0">
              <h3 className="text-[13px] font-semibold text-slate-950">{p.title}</h3>
              <p className="mt-1 text-[13px] leading-[1.55]" style={{ color: "#475569" }}>
                {p.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function AdvisoryInsightRow({ children }: { children: ReactNode }) {
  return (
    <p className="text-[13px] leading-[1.55]" style={{ color: "#475569" }}>
      {children}
    </p>
  );
}
