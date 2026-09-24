"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils";

type BarRow = { name: string; value: number; fill?: string };
type LineRow = { label: string; value: number };

const TOOLTIP_STYLE = {
  background: "#fff",
  border: "1px solid #e5e5e5",
  borderRadius: 8,
  fontSize: 12,
  color: "#0a0a0a",
  boxShadow: "none",
};

function ChartCard({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[var(--admin-radius-sm)] border border-[var(--admin-line)] p-4",
        className,
      )}
    >
      <div className="mb-3">
        <h3 className="text-[13px] font-semibold text-[var(--admin-ink)]">{title}</h3>
        {description ? (
          <p className="mt-0.5 text-[12px] text-[var(--admin-muted)]">{description}</p>
        ) : null}
      </div>
      {children}
    </div>
  );
}

export function AdminBarChart({
  title,
  description,
  data,
  valueLabel = "Count",
  className,
}: {
  title: string;
  description?: string;
  data: BarRow[];
  valueLabel?: string;
  className?: string;
}) {
  const clean = data.filter((d) => d.value > 0);
  return (
    <ChartCard title={title} description={description} className={className}>
      {clean.length === 0 ? (
        <p className="py-10 text-center text-[12px] text-[var(--admin-faint)]">
          No data yet
        </p>
      ) : (
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={clean} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
              <CartesianGrid stroke="#f0f0f0" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fill: "#a3a3a3", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                interval={0}
                angle={clean.length > 5 ? -20 : 0}
                textAnchor={clean.length > 5 ? "end" : "middle"}
                height={clean.length > 5 ? 48 : 28}
              />
              <YAxis
                tick={{ fill: "#a3a3a3", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                width={36}
              />
              <Tooltip
                cursor={{ fill: "#f5f5f5" }}
                contentStyle={TOOLTIP_STYLE}
                formatter={(value: number) => [value.toLocaleString("en-IN"), valueLabel]}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={44}>
                {clean.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill ?? "#0b7443"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartCard>
  );
}

export function AdminLineChart({
  title,
  description,
  data,
  valueLabel = "Reports",
  className,
}: {
  title: string;
  description?: string;
  data: LineRow[];
  valueLabel?: string;
  className?: string;
}) {
  return (
    <ChartCard title={title} description={description} className={className}>
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
            <CartesianGrid stroke="#f0f0f0" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: "#a3a3a3", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fill: "#a3a3a3", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              width={36}
            />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              formatter={(value: number) => [value.toLocaleString("en-IN"), valueLabel]}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#0b7443"
              strokeWidth={2}
              dot={{ r: 3, fill: "#0b7443", strokeWidth: 0 }}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

/** Simple horizontal share bars (Fingerprint-style breakdown). */
export function AdminShareList({
  title,
  description,
  data,
  className,
}: {
  title: string;
  description?: string;
  data: BarRow[];
  className?: string;
}) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  return (
    <ChartCard title={title} description={description} className={className}>
      <ul className="space-y-3">
        {data.map((row) => {
          const pct = Math.round((row.value / total) * 100);
          return (
            <li key={row.name}>
              <div className="mb-1 flex items-center justify-between gap-2 text-[12px]">
                <span className="font-medium text-[var(--admin-ink)]">{row.name}</span>
                <span className="tabular-nums text-[var(--admin-muted)]">
                  {row.value.toLocaleString("en-IN")} · {pct}%
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-[var(--admin-soft)]">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: row.fill ?? "#0b7443",
                  }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </ChartCard>
  );
}
