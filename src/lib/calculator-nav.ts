export type CalculatorRoute =
  | "/"
  | "/goals"
  | "/growth"
  | "/education"
  | "/fire"
  | "/mf-fd"
  | "/loans"
  | "/insurance"
  | "/multi-goal";

export type NavItem = {
  /** Stable id for React keys */
  id: string;
  to: CalculatorRoute;
  /** Mode tab on multi-mode pages (`?mode=`) */
  mode?: string;
  label: string;
  /** Shorter label for mobile chip strip */
  shortLabel: string;
  /** Local Excel source for parity testing (dev checklist). */
  excelFile: string;
  /** Set to false to hide and block this calculator. Defaults to true. */
  enabled?: boolean;
};

/** Basename only — for compact sidebar labels. */
export function excelBasename(excelFile: string): string {
  const slash = excelFile.lastIndexOf("/");
  return slash >= 0 ? excelFile.slice(slash + 1) : excelFile;
}

export type NavCategory = {
  id: string;
  label: string;
  items: NavItem[];
};

/**
 * Calculators grouped by product category (STANDARD → INSURANCE).
 * Set `enabled: false` on an item to hide it; middleware blocks the route
 * when every item for that path is disabled.
 */
export const CALCULATOR_CATEGORIES: NavCategory[] = [
  {
    id: "standard",
    label: "Standard",
    items: [
      {
        id: "mf-fd",
        to: "/mf-fd",
        label: "Mutual Fund vs Fixed Deposit",
        shortLabel: "MF vs FD",
        excelFile: "calculator-tests/Nivra MF vs FD v1.xlsm",
      },
      {
        id: "growth-lumpsum",
        to: "/growth",
        mode: "lumpsum",
        label: "One-Time Investment",
        shortLabel: "One-Time",
        excelFile: "calculator-tests/Nivra One-Time Investment v2.xlsm",
      },
      {
        id: "growth-periodic",
        to: "/growth",
        mode: "periodic",
        label: "Periodic Lumpsum Investment",
        shortLabel: "Periodic LS",
        excelFile: "Unprotected/Nivra Periodic Investment v1.xlsm",
      },
      {
        id: "growth-sip",
        to: "/growth",
        mode: "sip",
        label: "SIP Calculator",
        shortLabel: "SIP",
        excelFile: "Unprotected/Nivra SIP Calculator v3.xlsm",
      },
      {
        id: "growth-stepup",
        to: "/growth",
        mode: "stepup",
        label: "SIP Step-Up Calculator",
        shortLabel: "Step-Up SIP",
        excelFile: "Unprotected/Nivra SIP Step-Up Calculator v1.xlsm",
      },
      {
        id: "multi-withdrawals",
        to: "/multi-goal",
        mode: "withdrawals",
        label: "SIP Required for Multiple Withdrawals",
        shortLabel: "Multi Withdrawals",
        excelFile: "Unprotected/Nivra SIP for Multiple Withdrawals v2.xlsm",
      },
    ],
  },
  {
    id: "goal",
    label: "Goal",
    items: [
      {
        id: "goal-ls-sip",
        to: "/goals",
        mode: "ls-sip",
        label: "Goal with Current Lumpsum",
        shortLabel: "Goal LS + SIP",
        excelFile:
          "Unprotected/Nivra Goal w Current Investment, LS - SIP Options v3.xlsm",
      },
      {
        id: "goal-current",
        to: "/goals",
        mode: "current",
        label: "Goal with Current Investments",
        shortLabel: "Goal Current",
        excelFile:
          "Unprotected/Nivra Goal with Current Investment - LS, SIP, SU_SIP.xlsm",
      },
      {
        id: "multi-goal-assign",
        to: "/multi-goal",
        mode: "assign",
        label: "Multiple Goals – Corpus Assignment",
        shortLabel: "Multi-Goal",
        excelFile:
          "Nivra Tools - Full Set/Nivra Multiple Goals with Corpus Assignment v2.xlsm",
      },
      {
        id: "goal-periodic",
        to: "/goals",
        mode: "periodic",
        label: "Goal with Periodic Lumpsum",
        shortLabel: "Goal Periodic",
        excelFile: "Unprotected/Nivra Goal_Periodic_Lumpsum - Compute_SIP v2.xlsm",
      },
      {
        id: "goal-sip",
        to: "/",
        label: "Goal – SIP & Step-Up SIP",
        shortLabel: "Goal SIP",
        excelFile: "Unprotected/Nivra Goal - Compute SIP_or_StepUP_SIP v3.xlsm",
      },
      {
        id: "goal-existing",
        to: "/goals",
        mode: "existing",
        label: "Goal with Existing SIP",
        shortLabel: "Goal Existing",
        excelFile: "Unprotected/Nivra Goal_Existing_SIP - Compute SIP v3.xlsm",
      },
      {
        id: "goal-compounding",
        to: "/goals",
        mode: "compounding",
        label: "Goal – Power of Compounding",
        shortLabel: "Compounding",
        excelFile:
          "Unprotected/Nivra Goal with Power of Compounding - Growth Steps.xlsm",
      },
    ],
  },
  {
    id: "retirement",
    label: "Retirement",
    items: [
      {
        id: "financial-health",
        to: "/fire",
        mode: "health",
        label: "Financial Health Analysis",
        shortLabel: "Health",
        excelFile: "Unprotected/Nivra Financial Health Analysis v4.xlsm",
      },
      {
        id: "fire-planner",
        to: "/fire",
        mode: "fire",
        label: "FIRE Planner",
        shortLabel: "FIRE",
        excelFile: "Unprotected/Nivra FIRE Planner v10 - Unprotected.xlsm",
      },
    ],
  },
  {
    id: "loan",
    label: "Loan",
    items: [
      {
        id: "loan-emi",
        to: "/loans",
        mode: "emi",
        label: "Loan EMI with Interest Recovery",
        shortLabel: "Loan EMI",
        excelFile: "Unprotected/Nivra Loan EMI Calculator v1.xlsm",
      },
      {
        id: "loan-extra-vs-invest",
        to: "/loans",
        mode: "extra-vs-invest",
        label: "Loan – One Extra Payment vs Investment",
        shortLabel: "Extra vs Invest",
        excelFile: "Unprotected/Nivra Loan Extra Payment vs Investment v2.xlsm",
      },
      {
        id: "loan-recovery",
        to: "/loans",
        mode: "recovery",
        label: "Loan Restructuring with Interest Recovery",
        shortLabel: "Interest Recovery",
        excelFile: "Unprotected/Nivra Loan Interest Recovery v7.xlsm",
      },
      {
        id: "loan-prepay",
        to: "/loans",
        mode: "prepay",
        label: "Loan with Extra Yearly Payments",
        shortLabel: "Yearly Extra",
        excelFile: "Unprotected/Nivra Loan with Periodic Extra Payments - v1.xlsm",
      },
    ],
  },
  {
    id: "family",
    label: "Family",
    items: [
      {
        id: "education",
        to: "/education",
        label: "Child Education Planner",
        shortLabel: "Education",
        excelFile: "Unprotected/Nivra Child Education Planner v4.xlsm",
      },
      {
        id: "vehicle-loan",
        to: "/loans",
        mode: "vehicle",
        label: "Vehicle Loan Benefit Analysis",
        shortLabel: "Vehicle Loan",
        excelFile:
          "Nivra Tools - Full Set/Nivra Vehicle Loan Benefit Analysis-v2.xlsx",
      },
    ],
  },
  {
    id: "insurance",
    label: "Insurance",
    items: [
      {
        id: "insurance-irr",
        to: "/insurance",
        mode: "irr",
        label: "Insurance IRR",
        shortLabel: "Ins. IRR",
        excelFile: "Unprotected/Nivra Insurance IRR Calculator v1.xlsm",
      },
      {
        id: "insurance-tp",
        to: "/insurance",
        mode: "switch",
        label: "Insurance – Convert to Term Plan + Investment",
        shortLabel: "Term + Invest",
        excelFile:
          "Unprotected/Nivra Insurance - Convert to TP and Investment Planner v3.xlsm",
      },
    ],
  },
];

/** Flat list kept for callers that do not need categories. */
export const CALCULATOR_NAV: NavItem[] = CALCULATOR_CATEGORIES.flatMap(
  (category) => category.items,
);

export function hrefFor(item: NavItem): string {
  return item.mode ? `${item.to}?mode=${item.mode}` : item.to;
}

/** Page header title = sidebar label (source of truth). */
export function getCalculatorPageTitle(
  pathname: string,
  mode: string | null | undefined = null,
): string {
  // Goal SIP lives on `/`; keep the same label if opened as legacy `/goals?mode=sip`.
  if (pathname === "/" || (pathname === "/goals" && mode === "sip")) {
    return (
      CALCULATOR_NAV.find((item) => item.id === "goal-sip")?.label ??
      "Goal – SIP & Step-Up SIP"
    );
  }

  const withMode = CALCULATOR_NAV.find(
    (item) => item.to === pathname && item.mode != null && item.mode === mode,
  );
  if (withMode) return withMode.label;

  const withoutMode = CALCULATOR_NAV.find((item) => item.to === pathname && !item.mode);
  if (withoutMode) return withoutMode.label;

  const fallback = CALCULATOR_NAV.find((item) => item.to === pathname);
  return fallback?.label ?? "Calculator";
}

export function isNavItemActive(
  item: NavItem,
  pathname: string,
  mode: string | null,
): boolean {
  if (pathname !== item.to) return false;
  if (item.mode) return mode === item.mode;
  // Root Goal SIP has no mode; other single-mode pages ignore stray ?mode=
  return item.to === "/" || !mode;
}

export function getEnabledCategories(): NavCategory[] {
  return CALCULATOR_CATEGORIES.map((category) => ({
    ...category,
    items: category.items.filter((item) => item.enabled !== false),
  })).filter((category) => category.items.length > 0);
}

export function getEnabledCalculators(): NavItem[] {
  return CALCULATOR_NAV.filter((item) => item.enabled !== false);
}

export function isCalculatorEnabled(path: string): boolean {
  return getEnabledCalculators().some((item) => item.to === path);
}

export function getFirstEnabledRoute(): string {
  const first = getEnabledCalculators()[0];
  return first ? hrefFor(first) : "/";
}

export const CALCULATOR_ROUTES = Array.from(
  new Set(CALCULATOR_NAV.map((item) => item.to)),
) as CalculatorRoute[];
