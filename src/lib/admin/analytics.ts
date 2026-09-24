import { getPrisma, isDatabaseConfigured } from "@/lib/db";
import {
  platformStats as dummyPlatformStats,
  type Company,
  type CompanyUser,
  type NivraStaff,
} from "@/lib/admin/dummy-data";
import {
  getCompanyById,
  getPlatformStats,
  listCompanies,
  listCompanyUsers,
  listNivraStaff,
} from "@/lib/admin/queries";

export type MonthPoint = { month: string; label: string; value: number };

export type NamedCount = { name: string; value: number; fill?: string };

export type PlatformAnalytics = {
  stats: Awaited<ReturnType<typeof getPlatformStats>>;
  companiesByStatus: NamedCount[];
  companiesByTier: NamedCount[];
  reportsByCompany: NamedCount[];
  usersByCompany: NamedCount[];
  monthlyReports: MonthPoint[];
  companyRows: Company[];
  staffRows: NivraStaff[];
};

export type CompanyAnalytics = {
  company: Company;
  users: CompanyUser[];
  usersByRole: NamedCount[];
  usersByStatus: NamedCount[];
  monthlyReports: MonthPoint[];
  calculatorRows: Array<{ name: string; included: boolean }>;
};

const STATUS_COLORS: Record<string, string> = {
  active: "#0b7443",
  trial: "#0284c7",
  suspended: "#d97706",
  inactive: "#a3a3a3",
};

const TIER_COLORS: Record<string, string> = {
  Starter: "#a3a3a3",
  Growth: "#0284c7",
  Pro: "#0b7443",
  Enterprise: "#0a0a0a",
};

const ROLE_COLORS: Record<string, string> = {
  admin: "#0a0a0a",
  advisor: "#0b7443",
  viewer: "#737373",
};

function monthLabels(count: number): Array<{ key: string; label: string }> {
  const out: Array<{ key: string; label: string }> = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleString("en-IN", { month: "short", year: "2-digit" });
    out.push({ key, label });
  }
  return out;
}

/** Demo trend when ReportEvent history is missing. */
function synthesizeMonthly(totalThisMonth: number, months = 6): MonthPoint[] {
  const labels = monthLabels(months);
  return labels.map((m, i) => {
    const t = (i + 1) / labels.length;
    const noise = 0.72 + ((i * 17) % 7) / 20;
    const value = Math.max(0, Math.round(totalThisMonth * t * noise));
    return { month: m.key, label: m.label, value };
  });
}

async function monthlyReportsFromDb(organizationId?: string): Promise<MonthPoint[] | null> {
  if (!isDatabaseConfigured()) return null;
  const prisma = getPrisma();
  if (!prisma) return null;

  const labels = monthLabels(6);
  const start = new Date();
  start.setMonth(start.getMonth() - 5, 1);
  start.setHours(0, 0, 0, 0);

  const events = await prisma.reportEvent.findMany({
    where: {
      createdAt: { gte: start },
      ...(organizationId ? { organizationId } : {}),
    },
    select: { createdAt: true },
  });

  if (events.length === 0) return null;

  const buckets = new Map<string, number>();
  for (const m of labels) buckets.set(m.key, 0);
  for (const e of events) {
    const key = `${e.createdAt.getFullYear()}-${String(e.createdAt.getMonth() + 1).padStart(2, "0")}`;
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }

  return labels.map((m) => ({
    month: m.key,
    label: m.label,
    value: buckets.get(m.key) ?? 0,
  }));
}

export async function getPlatformAnalytics(): Promise<PlatformAnalytics> {
  const [stats, companies, staff] = await Promise.all([
    getPlatformStats(),
    listCompanies(),
    listNivraStaff(),
  ]);

  const statusKeys = ["active", "trial", "suspended", "inactive"] as const;
  const companiesByStatus: NamedCount[] = statusKeys.map((s) => ({
    name: s.charAt(0).toUpperCase() + s.slice(1),
    value: companies.filter((c) => c.status === s).length,
    fill: STATUS_COLORS[s],
  }));

  const tiers = ["Starter", "Growth", "Pro", "Enterprise"] as const;
  const companiesByTier: NamedCount[] = tiers.map((t) => ({
    name: t,
    value: companies.filter((c) => c.tier === t).length,
    fill: TIER_COLORS[t],
  }));

  const reportsByCompany: NamedCount[] = [...companies]
    .sort((a, b) => b.reportsThisMonth - a.reportsThisMonth)
    .slice(0, 10)
    .map((c) => ({
      name: c.name.length > 14 ? `${c.name.slice(0, 12)}…` : c.name,
      value: c.reportsThisMonth,
      fill: "#0b7443",
    }));

  const usersByCompany: NamedCount[] = [...companies]
    .sort((a, b) => b.seatsUsed - a.seatsUsed)
    .slice(0, 10)
    .map((c) => ({
      name: c.name.length > 14 ? `${c.name.slice(0, 12)}…` : c.name,
      value: c.seatsUsed,
      fill: "#0a0a0a",
    }));

  const fromDb = await monthlyReportsFromDb();
  const monthlyReports =
    fromDb ?? synthesizeMonthly(stats.reportsThisMonth || dummyPlatformStats().reportsThisMonth);

  return {
    stats,
    companiesByStatus,
    companiesByTier,
    reportsByCompany,
    usersByCompany,
    monthlyReports,
    companyRows: [...companies].sort(
      (a, b) => b.reportsThisMonth - a.reportsThisMonth,
    ),
    staffRows: staff,
  };
}

export async function getCompanyAnalytics(
  companyId: string,
): Promise<CompanyAnalytics | null> {
  const company = await getCompanyById(companyId);
  if (!company) return null;
  const users = await listCompanyUsers(company.id);

  const roleOrder = ["admin", "advisor", "viewer"] as const;
  const usersByRole: NamedCount[] = roleOrder.map((r) => ({
    name: r === "admin" ? "Admin" : r === "advisor" ? "Advisor" : "Viewer",
    value: users.filter((u) => u.role === r).length,
    fill: ROLE_COLORS[r],
  }));

  const statusOrder = ["active", "invited", "disabled"] as const;
  const usersByStatus: NamedCount[] = statusOrder.map((s) => ({
    name: s.charAt(0).toUpperCase() + s.slice(1),
    value: users.filter((u) => u.status === s).length,
    fill:
      s === "active" ? "#0b7443" : s === "invited" ? "#0284c7" : "#a3a3a3",
  }));

  const fromDb = await monthlyReportsFromDb(company.id);
  const monthlyReports =
    fromDb ?? synthesizeMonthly(company.reportsThisMonth || 12);

  const allCalcs = [
    "Goal SIP Planner",
    "Unified Goal Planner",
    "Investment Growth",
    "Child Education",
    "FIRE / Health",
    "MF vs FD",
    "Loans",
    "Insurance",
    "Multi-Goal",
  ];
  const included = new Set(company.calculators);
  const calculatorRows = allCalcs.map((name) => ({
    name,
    included: included.has(name),
  }));

  return {
    company,
    users,
    usersByRole,
    usersByStatus,
    monthlyReports,
    calculatorRows,
  };
}
