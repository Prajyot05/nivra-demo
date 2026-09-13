"use client";

export {
  formatINR,
  formatINRCurrency,
  formatPercent,
  formatCompactINR,
  formatAxisINR,
  parseDigits,
} from "./format";
export { Field, TextInput, SelectInput } from "./field";
export { MoneyInput } from "./money-input";
export { PercentInput } from "./percent-input";
export { YearInput, AgeInput } from "./year-input";
export { ClientHeader } from "./client-header";
export { ModeTabs } from "./mode-tabs";
export type { ModeTab } from "./mode-tabs";
export { ResultCard } from "./result-card";
export type { ResultItem, ResultTone } from "./result-card";
export { StatCard } from "./stat-card";
export { ScheduleTable } from "./schedule-table";
export type { ScheduleColumn } from "./schedule-table";
export { GrowthChart } from "./growth-chart";
export type { GrowthPoint, GrowthReferenceLine } from "./growth-chart";
export { CompareChart } from "./compare-chart";
export type { ComparePoint } from "./compare-chart";
export { WithdrawalPathChart } from "./withdrawal-path-chart";
export type { WithdrawalMilestone, WithdrawalPathPoint } from "./withdrawal-path-chart";
export { CompositionChart } from "./composition-chart";
export type { CompositionSlice } from "./composition-chart";
export { StackedBarChart } from "./stacked-bar-chart";
export type { StackedBarPoint } from "./stacked-bar-chart";
export { WaterfallChart } from "./waterfall-chart";
export type { WaterfallStep } from "./waterfall-chart";
export { StackedAreaChart } from "./stacked-area-chart";
export type { StackedAreaPoint } from "./stacked-area-chart";
export { ComboChart } from "./combo-chart";
export type { ComboPoint, ComboAgeMarker } from "./combo-chart";
export { Disclaimer } from "./disclaimer";
export { CalculatorPage } from "./calculator-page";
export { CalculatorPageHeader } from "./calculator-page-header";
export { COLOR_THEMES, getColorTheme } from "./color-themes";
export type { ColorTheme, ColorThemeId } from "./color-themes";

/* Design system */
export { Card, SectionTitle, SectionHeader } from "./card";
export type { CardVariant, CardPadding } from "./card";
export { StatusNote } from "./status-note";
export type { StatusTone } from "./status-note";
export { FormGrid, StatGrid, Stack, ResultsSplit } from "./layout";
export {
  BODY_TEXT,
  BUTTON_DANGER,
  BUTTON_PRIMARY,
  BUTTON_SECONDARY,
  CARD,
  CARD_EMPTY,
  CARD_MUTED,
  CARD_PAD,
  CARD_PAD_TIGHT,
  CARD_WARN,
  CHIP,
  CHIP_OFF,
  CHIP_ON,
  FORM_GRID,
  ICON_BUTTON,
  META_TEXT,
  MICRO_LABEL,
  NUMERIC,
  PILL,
  RESULTS_LEFT,
  RESULTS_RIGHT,
  RESULTS_SPLIT,
  ROW_PAD_X,
  SECTION_TITLE,
  SECTION_TITLE_STRONG,
  STACK,
  STACK_INNER,
  STACK_TIGHT,
  statGridClass,
} from "./tokens";
