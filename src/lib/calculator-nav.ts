export type NavItem = {
  to:
    | "/"
    | "/goals"
    | "/growth"
    | "/education"
    | "/fire"
    | "/mf-fd"
    | "/loans"
    | "/insurance"
    | "/multi-goal";
  label: string;
  /** Set to false to hide and block this calculator. Defaults to true. */
  enabled?: boolean;
};

export const CALCULATOR_NAV: NavItem[] = [
  { to: "/", label: "Goal SIP Planner" },
  { to: "/goals", label: "Unified Goal Planner" },
  { to: "/growth", label: "Investment Growth" },
  { to: "/education", label: "Child Education", enabled: false },
  { to: "/fire", label: "FIRE / Health", enabled: false },
  { to: "/mf-fd", label: "MF vs FD", enabled: false },
  { to: "/loans", label: "Loans", enabled: false },
  { to: "/insurance", label: "Insurance", enabled: false },
  { to: "/multi-goal", label: "Multi-Goal", enabled: false },
];

export function getEnabledCalculators(): NavItem[] {
  return CALCULATOR_NAV.filter((item) => item.enabled !== false);
}

export function isCalculatorEnabled(path: string): boolean {
  return getEnabledCalculators().some((item) => item.to === path);
}

export function getFirstEnabledRoute(): string {
  const first = getEnabledCalculators()[0];
  return first?.to ?? "/";
}

export const CALCULATOR_ROUTES = CALCULATOR_NAV.map((item) => item.to);
