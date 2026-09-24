/** Dummy data for admin dashboards until auth + Neon land. */

export type CompanyStatus = "active" | "inactive" | "suspended" | "trial";
export type SoftLockState = "none" | "view_only" | "hard_locked";

export type SubscriptionTier = "Starter" | "Growth" | "Pro" | "Enterprise"; // names TBD — Sasmith

export type NivraStaffRole = "main_admin" | "support";
export type CompanyUserRole = "admin" | "advisor" | "viewer";

export type Company = {
  id: string;
  name: string;
  logoInitials: string;
  logoColor: string;
  status: CompanyStatus;
  softLock: SoftLockState;
  softLockEndsAt: string | null;
  tier: SubscriptionTier;
  seats: number;
  seatsUsed: number;
  reportsGenerated: number;
  reportsThisMonth: number;
  renewsAt: string;
  ownerEmail: string;
  phone: string;
  email: string;
  createdAt: string;
  defaultTheme: string;
  calculators: string[];
};

export type CompanyUser = {
  id: string;
  companyId: string;
  name: string;
  email: string;
  role: CompanyUserRole;
  status: "active" | "invited" | "disabled";
  lastActiveAt: string;
};

export type NivraStaff = {
  id: string;
  name: string;
  email: string;
  role: NivraStaffRole;
  reportsThisMonth: number;
  status: "active" | "inactive";
};

export const TIER_CALCULATORS: Record<SubscriptionTier, string[]> = {
  Starter: ["Goal SIP Planner", "Investment Growth", "Loans"],
  Growth: [
    "Goal SIP Planner",
    "Unified Goal Planner",
    "Investment Growth",
    "Child Education",
    "Loans",
    "MF vs FD",
  ],
  Pro: [
    "Goal SIP Planner",
    "Unified Goal Planner",
    "Investment Growth",
    "Child Education",
    "FIRE / Health",
    "Loans",
    "MF vs FD",
    "Insurance",
    "Multi-Goal",
  ],
  Enterprise: [
    "Goal SIP Planner",
    "Unified Goal Planner",
    "Investment Growth",
    "Child Education",
    "FIRE / Health",
    "Loans",
    "MF vs FD",
    "Insurance",
    "Multi-Goal",
  ],
};

export const DUMMY_COMPANIES: Company[] = [
  {
    id: "co_acme",
    name: "Acme Wealth Advisors",
    logoInitials: "AW",
    logoColor: "#0f172a",
    status: "active",
    softLock: "none",
    softLockEndsAt: null,
    tier: "Pro",
    seats: 12,
    seatsUsed: 8,
    reportsGenerated: 1842,
    reportsThisMonth: 96,
    renewsAt: "2026-11-14",
    ownerEmail: "priya@acmewealth.in",
    phone: "+91 98765 43210",
    email: "hello@acmewealth.in",
    createdAt: "2025-06-02",
    defaultTheme: "classic",
    calculators: TIER_CALCULATORS.Pro,
  },
  {
    id: "co_horizon",
    name: "Horizon Finserve",
    logoInitials: "HF",
    logoColor: "#1d4ed8",
    status: "trial",
    softLock: "none",
    softLockEndsAt: null,
    tier: "Growth",
    seats: 5,
    seatsUsed: 3,
    reportsGenerated: 48,
    reportsThisMonth: 12,
    renewsAt: "2026-09-20",
    ownerEmail: "ravi@horizonfinserve.com",
    phone: "+91 98111 22334",
    email: "support@horizonfinserve.com",
    createdAt: "2026-08-21",
    defaultTheme: "ocean",
    calculators: TIER_CALCULATORS.Growth,
  },
  {
    id: "co_sagar",
    name: "Sagar Capital",
    logoInitials: "SC",
    logoColor: "#047857",
    status: "suspended",
    softLock: "view_only",
    softLockEndsAt: "2026-09-16",
    tier: "Starter",
    seats: 3,
    seatsUsed: 2,
    reportsGenerated: 210,
    reportsThisMonth: 0,
    renewsAt: "2026-08-01",
    ownerEmail: "admin@sagarcapital.in",
    phone: "+91 90000 11122",
    email: "ops@sagarcapital.in",
    createdAt: "2025-11-10",
    defaultTheme: "forest",
    calculators: TIER_CALCULATORS.Starter,
  },
  {
    id: "co_nimbus",
    name: "Nimbus Advisors LLP",
    logoInitials: "NA",
    logoColor: "#7c2d12",
    status: "inactive",
    softLock: "hard_locked",
    softLockEndsAt: null,
    tier: "Growth",
    seats: 8,
    seatsUsed: 0,
    reportsGenerated: 640,
    reportsThisMonth: 0,
    renewsAt: "2026-07-01",
    ownerEmail: "meera@nimbusadvisors.com",
    phone: "+91 98200 44556",
    email: "contact@nimbusadvisors.com",
    createdAt: "2025-03-18",
    defaultTheme: "slate",
    calculators: TIER_CALCULATORS.Growth,
  },
  {
    id: "co_lotus",
    name: "Lotus Portfolio Partners",
    logoInitials: "LP",
    logoColor: "#6d28d9",
    status: "active",
    softLock: "none",
    softLockEndsAt: null,
    tier: "Enterprise",
    seats: 40,
    seatsUsed: 27,
    reportsGenerated: 9120,
    reportsThisMonth: 412,
    renewsAt: "2027-01-05",
    ownerEmail: "owner@lotuspp.in",
    phone: "+91 99887 76655",
    email: "desk@lotuspp.in",
    createdAt: "2024-12-01",
    defaultTheme: "indigo",
    calculators: TIER_CALCULATORS.Enterprise,
  },
  {
    id: "co_zenith",
    name: "Zenith Moneyworks",
    logoInitials: "ZM",
    logoColor: "#be123c",
    status: "active",
    softLock: "none",
    softLockEndsAt: null,
    tier: "Starter",
    seats: 3,
    seatsUsed: 3,
    reportsGenerated: 155,
    reportsThisMonth: 18,
    renewsAt: "2026-10-02",
    ownerEmail: "karan@zenithmw.in",
    phone: "+91 97654 32100",
    email: "hello@zenithmw.in",
    createdAt: "2026-04-12",
    defaultTheme: "coral",
    calculators: TIER_CALCULATORS.Starter,
  },
];

/** Target demo corpus size for list/analytics UX at multi-tenant scale. */
export const DUMMY_SCALE_TARGET = 720;

const FIRM_PREFIXES = [
  "Aarohan",
  "Beacon",
  "Crest",
  "Dhan",
  "Elevate",
  "Forge",
  "Granite",
  "Harbor",
  "Indigo",
  "Jade",
  "Keystone",
  "Lumen",
  "Meridian",
  "Northstar",
  "Oak",
  "Pinnacle",
  "Quantum",
  "Ridge",
  "Summit",
  "TrueNorth",
  "Unity",
  "Vertex",
  "Willow",
  "Yatra",
  "Zephyr",
];

const FIRM_SUFFIXES = [
  "Wealth",
  "Advisors",
  "Capital",
  "Finserve",
  "Partners",
  "Portfolio",
  "Moneyworks",
  "Advisory",
  "Wealth Desk",
  "Financial",
];

const LOGO_COLORS = [
  "#0f172a",
  "#1d4ed8",
  "#047857",
  "#7c2d12",
  "#6d28d9",
  "#be123c",
  "#0b7443",
  "#0369a1",
  "#854d0e",
  "#334155",
];

const STATUSES: CompanyStatus[] = ["active", "active", "active", "active", "trial", "suspended", "inactive"];
const TIERS: SubscriptionTier[] = ["Starter", "Growth", "Growth", "Pro", "Pro", "Enterprise"];

function padDate(n: number): string {
  return String(n).padStart(2, "0");
}

/**
 * Synthesize a large tenant corpus so admin UX can be validated at
 * 500–1000 company scale without hand-authoring rows.
 */
export function buildScaledCompanies(target = DUMMY_SCALE_TARGET): Company[] {
  const seed = DUMMY_COMPANIES;
  const out: Company[] = [...seed];
  let i = 0;
  while (out.length < target) {
    const prefix = FIRM_PREFIXES[i % FIRM_PREFIXES.length]!;
    const suffix = FIRM_SUFFIXES[Math.floor(i / FIRM_PREFIXES.length) % FIRM_SUFFIXES.length]!;
    const n = i + 1;
    const name = `${prefix} ${suffix} ${n}`;
    const status = STATUSES[i % STATUSES.length]!;
    const tier = TIERS[i % TIERS.length]!;
    const seats = tier === "Enterprise" ? 40 : tier === "Pro" ? 16 : tier === "Growth" ? 8 : 4;
    const seatsUsed = Math.max(1, Math.min(seats, (i % seats) + 1));
    const reportsThisMonth =
      status === "inactive" || status === "suspended" ? 0 : 4 + ((i * 13) % 180);
    const reportsGenerated = reportsThisMonth * (8 + (i % 20)) + (i % 50);
    const softLock: SoftLockState =
      status === "suspended" ? "view_only" : status === "inactive" ? "hard_locked" : "none";
    const slug = `${prefix.toLowerCase()}${n}`;
    const y = 2024 + (i % 3);
    const m = 1 + (i % 12);
    const d = 1 + (i % 27);

    out.push({
      id: `co_scale_${n}`,
      name,
      logoInitials: `${prefix[0]}${suffix[0]}`.toUpperCase(),
      logoColor: LOGO_COLORS[i % LOGO_COLORS.length]!,
      status,
      softLock,
      softLockEndsAt: softLock === "view_only" ? "2026-10-01" : null,
      tier,
      seats,
      seatsUsed,
      reportsGenerated,
      reportsThisMonth,
      renewsAt: `${2026 + (i % 2)}-${padDate(1 + (i % 12))}-${padDate(1 + (i % 28))}`,
      ownerEmail: `owner@${slug}.in`,
      phone: `+91 9${String(800000000 + (i % 99999999)).slice(0, 9)}`,
      email: `hello@${slug}.in`,
      createdAt: `${y}-${padDate(m)}-${padDate(d)}`,
      defaultTheme: "classic",
      calculators: TIER_CALCULATORS[tier],
    });
    i += 1;
  }
  return out;
}

let _scaledCache: Company[] | null = null;

/** Full dummy tenant list (seed + scaled). Prefer this over DUMMY_COMPANIES for admin lists. */
export function getAllDummyCompanies(): Company[] {
  if (!_scaledCache) _scaledCache = buildScaledCompanies();
  return _scaledCache;
}

export const DUMMY_COMPANY_USERS: CompanyUser[] = [
  {
    id: "u1",
    companyId: "co_acme",
    name: "Priya Sharma",
    email: "priya@acmewealth.in",
    role: "admin",
    status: "active",
    lastActiveAt: "2026-09-09",
  },
  {
    id: "u2",
    companyId: "co_acme",
    name: "Amit Desai",
    email: "amit@acmewealth.in",
    role: "advisor",
    status: "active",
    lastActiveAt: "2026-09-09",
  },
  {
    id: "u3",
    companyId: "co_acme",
    name: "Neha Kapoor",
    email: "neha@acmewealth.in",
    role: "advisor",
    status: "active",
    lastActiveAt: "2026-09-08",
  },
  {
    id: "u4",
    companyId: "co_acme",
    name: "Vikram Rao",
    email: "vikram@acmewealth.in",
    role: "advisor",
    status: "active",
    lastActiveAt: "2026-09-07",
  },
  {
    id: "u5",
    companyId: "co_acme",
    name: "Sana Iqbal",
    email: "sana@acmewealth.in",
    role: "viewer",
    status: "active",
    lastActiveAt: "2026-09-05",
  },
  {
    id: "u6",
    companyId: "co_acme",
    name: "Rohan Mehta",
    email: "rohan@acmewealth.in",
    role: "advisor",
    status: "invited",
    lastActiveAt: "—",
  },
  {
    id: "u7",
    companyId: "co_acme",
    name: "Ananya Iyer",
    email: "ananya@acmewealth.in",
    role: "viewer",
    status: "active",
    lastActiveAt: "2026-09-01",
  },
  {
    id: "u8",
    companyId: "co_acme",
    name: "Deepak Nair",
    email: "deepak@acmewealth.in",
    role: "advisor",
    status: "disabled",
    lastActiveAt: "2026-08-12",
  },
  {
    id: "u9",
    companyId: "co_horizon",
    name: "Ravi Menon",
    email: "ravi@horizonfinserve.com",
    role: "admin",
    status: "active",
    lastActiveAt: "2026-09-09",
  },
  {
    id: "u10",
    companyId: "co_horizon",
    name: "Leena Bose",
    email: "leena@horizonfinserve.com",
    role: "advisor",
    status: "active",
    lastActiveAt: "2026-09-08",
  },
  {
    id: "u11",
    companyId: "co_horizon",
    name: "Arjun Seth",
    email: "arjun@horizonfinserve.com",
    role: "viewer",
    status: "invited",
    lastActiveAt: "—",
  },
];

export const DUMMY_NIVRA_STAFF: NivraStaff[] = [
  {
    id: "ns1",
    name: "Yash (Platform)",
    email: "yash@nivra.app",
    role: "main_admin",
    reportsThisMonth: 0,
    status: "active",
  },
  {
    id: "ns2",
    name: "Sasmith Support",
    email: "sasmith@nivra.app",
    role: "main_admin",
    reportsThisMonth: 4,
    status: "active",
  },
  {
    id: "ns3",
    name: "Support — Kavya",
    email: "kavya.support@nivra.app",
    role: "support",
    reportsThisMonth: 38,
    status: "active",
  },
  {
    id: "ns4",
    name: "Support — Imran",
    email: "imran.support@nivra.app",
    role: "support",
    reportsThisMonth: 22,
    status: "active",
  },
  {
    id: "ns5",
    name: "Support — (inactive)",
    email: "alumni@nivra.app",
    role: "support",
    reportsThisMonth: 0,
    status: "inactive",
  },
];

/** Demo company context for `/company` dashboard (Acme). */
export const DEMO_COMPANY_ID = "co_acme";

export function getCompany(id: string): Company | undefined {
  return getAllDummyCompanies().find((c) => c.id === id);
}

export function getCompanyUsers(companyId: string): CompanyUser[] {
  return DUMMY_COMPANY_USERS.filter((u) => u.companyId === companyId);
}

export function platformStats() {
  const companies = getAllDummyCompanies();
  return {
    totalCompanies: companies.length,
    active: companies.filter((c) => c.status === "active").length,
    trial: companies.filter((c) => c.status === "trial").length,
    suspended: companies.filter((c) => c.status === "suspended").length,
    inactive: companies.filter((c) => c.status === "inactive").length,
    reportsTotal: companies.reduce((sum, c) => sum + c.reportsGenerated, 0),
    reportsThisMonth: companies.reduce((sum, c) => sum + c.reportsThisMonth, 0),
    seatsUsed: companies.reduce((sum, c) => sum + c.seatsUsed, 0),
    seatsTotal: companies.reduce((sum, c) => sum + c.seats, 0),
  };
}
