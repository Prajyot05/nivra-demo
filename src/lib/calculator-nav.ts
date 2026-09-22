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
  /** Shorter label for mobile chip strip / compact sidebar */
  shortLabel: string;
  /** One-line page description under the title. */
  description: string;
  /** Local Excel source for parity testing (dev checklist). */
  excelFile: string;
  /** Set to false to hide and block this calculator. Defaults to true. */
  enabled?: boolean;
  /**
   * Shipped for client login. Client profiles only see `completed: true` items.
   * Dev team still sees every enabled calculator.
   */
  completed?: boolean;
  /**
   * Wealth UI polish owned by Yash (Goals / Growth / FIRE-Health + kit).
   * Unchecked items are open for Prajyot. See docs/UI_HANDOFF.md.
   */
  uiPolished?: boolean;
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
 * Calculators grouped for advisor flow: Goals → Growth → Retirement → Family → Loans → Insurance.
 * Set `enabled: false` on an item to hide it; middleware blocks the route
 * when every item for that path is disabled.
 * Set `completed: true` for client-visible calculators (Excel QA / UI shipped).
 * Set `uiPolished: true` when wealth redesign is done (see docs/UI_HANDOFF.md).
 */
export const CALCULATOR_CATEGORIES: NavCategory[] = [
  {
    id: "goal",
    label: "Goals",
    items: [
      {
        id: "goal-ls-sip",
        to: "/goals",
        mode: "ls-sip",
        label: "Goal with Current Lumpsum",
        shortLabel: "Goal LS + SIP",
        description: "Blend current lumpsum with a new SIP so the goal is fully funded.",
        excelFile:
          "calculator-tests/Nivra Goal w Current Investment, LS - SIP Options v3.xlsm",
        completed: true,
        uiPolished: true,
      },
      {
        id: "goal-current",
        to: "/goals",
        mode: "current",
        label: "Goal with Current Investments",
        shortLabel: "Goal Current",
        description: "Use existing investments, then solve the extra SIP or lumpsum still required.",
        excelFile:
          "calculator-tests/Nivra Goal with Current Investment - LS, SIP, SU_SIP.xlsm",
        completed: true,
        uiPolished: true,
      },
      {
        id: "multi-goal-assign",
        to: "/multi-goal",
        mode: "assign",
        label: "Multiple Goals – Corpus Assignment",
        shortLabel: "Multi-Goal",
        description: "Assign one corpus across several goals and see what remains for each.",
        excelFile:
          "calculator-tests/Nivra Multiple Goals with Corpus Assignment v2.xlsm",
        completed: true,
        uiPolished: true,
      },
      {
        id: "goal-periodic",
        to: "/goals",
        mode: "periodic",
        label: "Goal with Periodic Lumpsum",
        shortLabel: "Goal Periodic",
        description: "Fund a goal with periodic lumpsums and the SIP that closes any gap.",
        excelFile: "Unprotected/Nivra Goal_Periodic_Lumpsum - Compute_SIP v2.xlsm",
        uiPolished: true,
        completed: true,
      },
      {
        id: "goal-sip",
        to: "/",
        label: "Goal – SIP & Step-Up SIP",
        shortLabel: "Goal SIP",
        description: "Compare a level SIP against a step-up SIP for the same goal.",
        excelFile: "Unprotected/Nivra Goal - Compute SIP_or_StepUP_SIP v3.xlsm",
        uiPolished: true,
        completed: true,
      },
      {
        id: "goal-existing",
        to: "/goals",
        mode: "existing",
        label: "Goal with Existing SIP",
        shortLabel: "Goal Existing",
        description: "Keep an existing SIP and calculate the top-up needed for the goal.",
        excelFile: "Unprotected/Nivra Goal_Existing_SIP - Compute SIP v3.xlsm",
        uiPolished: true,
        completed: true,
      },
      {
        id: "goal-compounding",
        to: "/goals",
        mode: "compounding",
        label: "Goal – Power of Compounding",
        shortLabel: "Compounding",
        description: "Map wealth steps and the SIP or lumpsum that hits each milestone.",
        excelFile:
          "Unprotected/Nivra Goal with Power of Compounding - Growth Steps.xlsm",
        completed: true,
        uiPolished: true,
      },
    ],
  },
  {
    id: "standard",
    label: "Growth",
    items: [
      {
        id: "mf-fd",
        to: "/mf-fd",
        label: "Mutual Fund vs Fixed Deposit",
        shortLabel: "MF vs FD",
        description: "Post-tax mutual fund versus fixed deposit over a short horizon.",
        excelFile: "calculator-tests/Nivra MF vs FD v1.xlsm",
        completed: true,
        uiPolished: true,
      },
      {
        id: "growth-lumpsum",
        to: "/growth",
        mode: "lumpsum",
        label: "One-Time Investment",
        shortLabel: "One-Time",
        description: "See how a one-time investment compounds after inflation and tax.",
        excelFile: "calculator-tests/Nivra One-Time Investment v2.xlsm",
        uiPolished: true,
        completed: true,
      },
      {
        id: "growth-periodic",
        to: "/growth",
        mode: "periodic",
        label: "Periodic Lumpsum Investment",
        shortLabel: "Periodic LS",
        description: "Model recurring lumpsums and the corpus they build over time.",
        excelFile: "Unprotected/Nivra Periodic Investment v1.xlsm",
        uiPolished: true,
        completed: true,
      },
      {
        id: "growth-sip",
        to: "/growth",
        mode: "sip",
        label: "SIP Calculator",
        shortLabel: "SIP",
        description: "Project monthly SIP growth, invested capital, and net maturity.",
        excelFile: "Unprotected/Nivra SIP Calculator v3.xlsm",
        uiPolished: true,
        completed: true,
      },
      {
        id: "growth-stepup",
        to: "/growth",
        mode: "stepup",
        label: "SIP Step-Up Calculator",
        shortLabel: "Step-Up SIP",
        description: "SIP with an annual step-up to keep pace with income growth.",
        excelFile: "Unprotected/Nivra SIP Step-Up Calculator v1.xlsm",
        uiPolished: true,
        completed: true,
      },
      {
        id: "multi-withdrawals",
        to: "/multi-goal",
        mode: "withdrawals",
        label: "SIP Required for Multiple Withdrawals",
        shortLabel: "Multi Withdrawals",
        description: "Solve the SIP needed when several withdrawals hit at different ages.",
        excelFile: "Unprotected/Nivra SIP for Multiple Withdrawals v2.xlsm",
        completed: true,
        uiPolished: true,
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
        description: "Check whether today's savings cover retirement spending through survival age.",
        excelFile: "Unprotected/Nivra Financial Health Analysis v4.xlsm",
        uiPolished: true,
        completed: true,
      },
      {
        id: "fire-planner",
        to: "/fire",
        mode: "fire",
        label: "FIRE Planner",
        shortLabel: "FIRE",
        description: "Size the corpus and SIP path to financial independence, including life events.",
        excelFile: "Unprotected/Nivra FIRE Planner v10 - Unprotected.xlsm",
        uiPolished: true,
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
        description: "Plan school and college fees with inflation, corpus, and funding options.",
        excelFile: "Unprotected/Nivra Child Education Planner v4.xlsm",
        completed: true,
        uiPolished: true,
      },
      {
        id: "vehicle-loan",
        to: "/loans",
        mode: "vehicle",
        label: "Vehicle Loan Benefit Analysis",
        shortLabel: "Vehicle Loan",
        description: "Weigh buying with a vehicle loan versus paying cash or investing the difference.",
        completed: true,
        uiPolished: true,
        excelFile:
          "Nivra Tools - Full Set/Nivra Vehicle Loan Benefit Analysis-v2.xlsx",
      },
    ],
  },
  {
    id: "loan",
    label: "Loans",
    items: [
      {
        id: "loan-emi",
        to: "/loans",
        mode: "emi",
        label: "Loan EMI with Interest Recovery",
        shortLabel: "Loan EMI",
        description: "Standard EMI with an optional interest-recovery investment overlay.",
        excelFile: "Unprotected/Nivra Loan EMI Calculator v1.xlsm",
        completed: true,
        uiPolished: true,
      },
      {
        id: "loan-extra-vs-invest",
        to: "/loans",
        mode: "extra-vs-invest",
        label: "Loan – One Extra Payment vs Investment",
        shortLabel: "Extra vs Invest",
        description: "Compare one extra loan payment against investing the same cash.",
        excelFile: "Unprotected/Nivra Loan Extra Payment vs Investment v2.xlsm",
        completed: true,
        uiPolished: true,
      },
      {
        id: "loan-recovery",
        to: "/loans",
        mode: "recovery",
        label: "Loan Restructuring with Interest Recovery",
        shortLabel: "Interest Recovery",
        description: "Restructure EMI and recover interest drag through a parallel SIP.",
        excelFile: "Unprotected/Nivra Loan Interest Recovery v7.xlsm",
        completed: true,
        uiPolished: true,
      },
      {
        id: "loan-prepay",
        to: "/loans",
        mode: "prepay",
        label: "Loan with Extra Yearly Payments",
        shortLabel: "Yearly Extra",
        description: "See the impact of yearly extra payments on tenure and interest.",
        excelFile: "Unprotected/Nivra Loan with Periodic Extra Payments - v1.xlsm",
        completed: true,
        uiPolished: true,
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
        label: "Insurance IRR Calculator",
        shortLabel: "Ins. IRR",
        description: "Measure traditional policy maturity, tax drag, and full-term XIRR.",
        completed: true,
        uiPolished: true,
        excelFile: "Unprotected/Nivra Insurance IRR Calculator v1.xlsm",
      },
      {
        id: "insurance-tp",
        to: "/insurance",
        mode: "switch",
        label: "Insurance – Convert to Term Plan + Investment",
        shortLabel: "Term + Invest",
        description: "Compare keeping the policy versus switching to term cover plus investment.",
        completed: true,
        uiPolished: true,
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


/** Page support line = nav description (source of truth). */
export function getCalculatorPageDescription(
  pathname: string,
  mode: string | null | undefined = null,
): string {
  if (pathname === "/" || (pathname === "/goals" && mode === "sip")) {
    return (
      CALCULATOR_NAV.find((item) => item.id === "goal-sip")?.description ??
      "Compare a level SIP against a step-up SIP for the same goal."
    );
  }

  const withMode = CALCULATOR_NAV.find(
    (item) => item.to === pathname && item.mode != null && item.mode === mode,
  );
  if (withMode) return withMode.description;

  const withoutMode = CALCULATOR_NAV.find((item) => item.to === pathname && !item.mode);
  if (withoutMode) return withoutMode.description;

  const fallback = CALCULATOR_NAV.find((item) => item.to === pathname);
  return fallback?.description ?? "Advisor calculator for client planning.";
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

/** Client login only sees completed calculators; dev sees every enabled item. */
export function getVisibleCalculators(
  profileId: "dev" | "client" | null | undefined = "dev",
): NavItem[] {
  const enabled = getEnabledCalculators();
  if (profileId === "client") {
    return enabled.filter((item) => item.completed === true);
  }
  return enabled;
}

export function getVisibleCategories(
  profileId: "dev" | "client" | null | undefined = "dev",
): NavCategory[] {
  const visibleIds = new Set(getVisibleCalculators(profileId).map((item) => item.id));
  return CALCULATOR_CATEGORIES.map((category) => ({
    ...category,
    items: category.items.filter(
      (item) => item.enabled !== false && visibleIds.has(item.id),
    ),
  })).filter((category) => category.items.length > 0);
}

export function isCalculatorEnabled(
  path: string,
  profileId: "dev" | "client" | null | undefined = "dev",
): boolean {
  return getVisibleCalculators(profileId).some((item) => item.to === path);
}

/** Path + optional ?mode= must match a visible nav item for this profile. */
export function isCalculatorAccessAllowed(
  path: string,
  mode: string | null,
  profileId: "dev" | "client" | null | undefined = "dev",
): boolean {
  const visible = getVisibleCalculators(profileId);
  const matches = visible.filter((item) => item.to === path);
  if (matches.length === 0) return false;

  if (mode) {
    return matches.some((item) => item.mode === mode || !item.mode);
  }

  // No mode in URL: allow if any single-mode item exists, or any mode on that path.
  return matches.some((item) => !item.mode) || matches.length > 0;
}

export function getFirstEnabledRoute(
  profileId: "dev" | "client" | null | undefined = "dev",
): string {
  const first = getVisibleCalculators(profileId)[0];
  return first ? hrefFor(first) : "/mf-fd";
}

export const CALCULATOR_ROUTES = Array.from(
  new Set(CALCULATOR_NAV.map((item) => item.to)),
) as CalculatorRoute[];
