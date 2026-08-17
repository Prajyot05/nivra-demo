export type NavItem = {
  to:
    | "/"
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
};

export const CALCULATOR_NAV: NavItem[] = [
  { to: "/", label: "Goal SIP Planner", owner: "Yash", ready: true },
  { to: "/growth", label: "Investment Growth", owner: "Yash" },
  { to: "/education", label: "Child Education", owner: "Yash" },
  { to: "/fire", label: "FIRE / Health", owner: "Yash" },
  { to: "/mf-fd", label: "MF vs FD", owner: "Prajyot" },
  { to: "/loans", label: "Loans", owner: "Prajyot" },
  { to: "/insurance", label: "Insurance", owner: "Prajyot" },
  { to: "/multi-goal", label: "Multi-Goal", owner: "Prajyot" },
];
