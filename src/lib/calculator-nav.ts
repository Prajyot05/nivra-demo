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
  owner: "Yash" | "Prajyot";
  ready?: boolean;
  /** Set to false to hide and block this calculator. Defaults to true. */
  enabled?: boolean;
};

export const CALCULATOR_NAV: NavItem[] = [
  { to: "/", label: "Goal SIP Planner", owner: "Yash", ready: true },
  { to: "/goals", label: "Unified Goal Planner", owner: "Yash", ready: true },
  { to: "/growth", label: "Investment Growth", owner: "Yash", ready: true },
  { to: "/education", label: "Child Education", owner: "Yash", ready: true },
  { to: "/fire", label: "FIRE / Health", owner: "Yash", ready: true },
  { to: "/mf-fd", label: "MF vs FD", owner: "Prajyot", ready: true },
  { to: "/loans", label: "Loans", owner: "Prajyot", ready: true },
  { to: "/insurance", label: "Insurance", owner: "Prajyot", ready: true },
  { to: "/multi-goal", label: "Multi-Goal", owner: "Prajyot", ready: true },
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
