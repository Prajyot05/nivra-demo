/**
 * Nivra Advisory (/2) design tokens.
 * Institutional wealth-management look for advisors serving clients aged 40–60.
 */
export const v2 = {
  bg: "#F5F6F8",
  surface: "#FFFFFF",
  ink: "#0B1F33",
  inkSoft: "#1E3348",
  muted: "#5C6B7A",
  faint: "#8A96A3",
  border: "#D5DCE3",
  borderStrong: "#B8C2CD",
  /** Ready / untouched input accent */
  inputBlue: "#2B6CB0",
  inputBlueSoft: "#EBF3FB",
  inputBlueRing: "rgba(43, 108, 176, 0.22)",
  navy: "#1A3654",
  navySoft: "#E8EEF4",
  /** Valid filled accent */
  accent: "#2F6B4F",
  accentSoft: "#F0F7F3",
  warn: "#8A5A12",
  warnSoft: "#F8F1E6",
  danger: "#9B2C2C",
  dangerSoft: "#F8EAEA",
  chartInvested: "#64748B",
  chartGain: "#2F6B4F",
  chartTax: "#9A6B2F",
  chartNet: "#0B1F33",
  chartSecondary: "#1A3654",
  chartMuted: "#94A3B8",
  radius: "6px",
  radiusSm: "4px",
  shadow: "none",
} as const;

export const V2_CONTENT_CLASS = "v2-root";

/** Advisory suite money cap: ₹100 Cr (classic UI still allows ₹999 Cr). */
export const V2_MONEY_INPUT_MAX = 100 * 1_00_00_000;

/**
 * Fixed field widths sized to the maximum displayable value.
 * Money max ₹100,00,00,000 → digit groups + ₹ prefix.
 * Age max 100 → 3 digits. Years max 100. Days max 36500.
 */
export const v2FieldWidth = {
  age: "w-[4.5rem]",
  years: "w-[5rem]",
  months: "w-[5.25rem]",
  percent: "w-[5.75rem]",
  days: "w-[6.25rem]",
  phone: "w-[10rem]",
  /** ₹100 Cr formatted: 100,00,00,000 */
  money: "w-[11rem]",
  moneyWide: "w-[11.5rem]",
  name: "w-[14rem]",
  email: "w-[16rem]",
  text: "w-[12rem]",
} as const;
