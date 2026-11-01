"use client";

import {
  createContext,
  useContext,
  type CSSProperties,
} from "react";
import {
  getColorTheme,
  type ColorTheme,
  type ColorThemeId,
} from "@nivra/ui";

function hexToRgba(hex: string, alpha: number): string {
  const raw = hex.replace("#", "").trim();
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => c + c)
          .join("")
      : raw.slice(0, 6);
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return `rgba(43, 108, 176, ${alpha})`;
  const n = Number.parseInt(full, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Map a classic COLOR_THEMES palette onto every --v2-* / --app-* token
 * the advisory suite and Recharts charts consume.
 */
export function buildV2ThemeStyle(themeId: ColorThemeId): CSSProperties {
  const theme = getColorTheme(themeId);
  const v = theme.vars;
  const primary = v["--app-primary"] ?? theme.chart.a;
  const gain = theme.chart.gain;
  const invested = theme.chart.invested;
  const tax = theme.chart.tax;
  const inflation = theme.chart.inflation;
  const chartA = theme.chart.a;
  const chartB = theme.chart.b;

  return {
    // Pass through full classic theme for shared UI kit charts/components
    ...v,
    ["--app-chart-invested" as string]: invested,
    ["--app-chart-gain" as string]: gain,
    ["--app-chart-tax" as string]: tax,
    ["--app-chart-inflation" as string]: inflation,
    ["--app-chart-a" as string]: chartA,
    ["--app-chart-b" as string]: chartB,

    // Advisory surface system
    ["--v2-bg" as string]: v["--app-bg"],
    ["--v2-surface" as string]: v["--app-surface"],
    ["--v2-surface-muted" as string]: v["--app-surface-muted"],
    ["--v2-ink" as string]: v["--app-text"],
    ["--v2-ink-soft" as string]: v["--app-text"],
    ["--v2-muted" as string]: v["--app-text-muted"],
    ["--v2-faint" as string]: v["--app-text-subtle"],
    ["--v2-border" as string]: v["--app-border"],
    ["--v2-border-strong" as string]: v["--app-text-subtle"],

    // Brand / actions (nav active, primary buttons)
    ["--v2-navy" as string]: primary,
    ["--v2-navy-hover" as string]: v["--app-primary-hover"] ?? primary,
    ["--v2-navy-soft" as string]:
      v["--app-primary-fg-muted"] ?? v["--app-std-bg"] ?? hexToRgba(primary, 0.12),
    ["--v2-navy-fg" as string]: v["--app-primary-fg"] ?? "#ffffff",

    // Input ready / focus (std / “blue” lane in classic palettes)
    ["--v2-input-blue" as string]: v["--app-std-text"] ?? primary,
    ["--v2-input-ready" as string]: hexToRgba(
      v["--app-std-text"] ?? primary,
      0.45,
    ),
    ["--v2-input-blue-soft" as string]:
      v["--app-std-bg"] ?? v["--app-std-bg-soft"] ?? hexToRgba(primary, 0.1),
    ["--v2-input-blue-ring" as string]: hexToRgba(
      v["--app-std-text"] ?? primary,
      0.22,
    ),

    // Valid / filled inputs (step-up / positive lane from classic palette)
    ["--v2-accent" as string]: v["--app-step-text"] ?? gain,
    ["--v2-accent-soft" as string]: v["--app-step-bg"] ?? hexToRgba(gain, 0.14),
    ["--v2-accent-text" as string]: v["--app-step-text-strong"] ?? v["--app-step-text"] ?? gain,

    // Warn / danger
    ["--v2-warn" as string]: v["--app-warn-text"],
    ["--v2-warn-soft" as string]: v["--app-warn-bg"],
    ["--v2-warn-border" as string]: v["--app-warn-border"],
    ["--v2-danger" as string]: v["--app-danger"],
    ["--v2-danger-soft" as string]: hexToRgba(v["--app-danger"] ?? "#ef4444", 0.12),
    ["--v2-danger-border" as string]: hexToRgba(v["--app-danger"] ?? "#ef4444", 0.35),

    // Chart aliases used by advisory pages
    ["--v2-chart-invested" as string]: invested,
    ["--v2-chart-gain" as string]: gain,
    ["--v2-chart-tax" as string]: tax,
    ["--v2-chart-inflation" as string]: inflation,
    ["--v2-chart-a" as string]: chartA,
    ["--v2-chart-b" as string]: chartB,

    // Keep kit chart CSS vars in sync for GrowthChart / CompositionChart grids
    ["--app-border" as string]: v["--app-border"],
    ["--app-surface" as string]: v["--app-surface"],
    ["--app-text" as string]: v["--app-text"],
    ["--app-text-muted" as string]: v["--app-text-muted"],
    ["--app-text-subtle" as string]: v["--app-text-subtle"],
    ["--app-bg" as string]: v["--app-bg"],
  } as CSSProperties;
}

export type V2ThemeContextValue = {
  themeId: ColorThemeId;
  theme: ColorTheme;
  chart: ColorTheme["chart"];
  setThemeId: (id: ColorThemeId) => void;
};

const V2ThemeContext = createContext<V2ThemeContextValue | null>(null);

export const V2ThemeProvider = V2ThemeContext.Provider;

export function useV2Theme(): V2ThemeContextValue {
  const ctx = useContext(V2ThemeContext);
  if (!ctx) {
    const theme = getColorTheme("classic");
    return {
      themeId: "classic",
      theme,
      chart: theme.chart,
      setThemeId: () => undefined,
    };
  }
  return ctx;
}
