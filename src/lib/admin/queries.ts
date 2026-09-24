import {
  CompanyStatus,
  SoftLockState,
  UserRole,
  UserStatus,
  type Organization,
  type User,
} from "@prisma/client";
import { getPrisma, isDatabaseConfigured } from "@/lib/db";
import {
  DUMMY_COMPANY_USERS,
  DUMMY_NIVRA_STAFF,
  DEMO_COMPANY_ID,
  TIER_CALCULATORS,
  getAllDummyCompanies,
  getCompany as getDummyCompany,
  getCompanyUsers as getDummyCompanyUsers,
  platformStats as dummyPlatformStats,
  type Company,
  type CompanyUser,
  type NivraStaff,
  type SoftLockState as DummySoftLock,
  type SubscriptionTier,
} from "@/lib/admin/dummy-data";

function mapSoftLock(s: SoftLockState): DummySoftLock {
  if (s === SoftLockState.VIEW_ONLY) return "view_only";
  if (s === SoftLockState.HARD_LOCKED) return "hard_locked";
  return "none";
}

function mapStatus(s: CompanyStatus): Company["status"] {
  return s.toLowerCase() as Company["status"];
}

function tierNameFromPlan(name: string | undefined): SubscriptionTier {
  if (name === "Growth") return "Growth";
  if (name === "Pro") return "Pro";
  if (name === "Enterprise") return "Enterprise";
  return "Starter";
}

async function orgToCompany(org: Organization): Promise<Company> {
  const prisma = getPrisma()!;
  const sub = await prisma.subscription.findFirst({
    where: { organizationId: org.id, endedAt: null },
    include: { plan: true },
  });
  const users = await prisma.user.count({
    where: { organizationId: org.id, deletedAt: null, status: { not: UserStatus.DISABLED } },
  });
  const usage = sub
    ? await prisma.usagePeriod.findFirst({
        where: {
          subscriptionId: sub.id,
          periodStart: { lte: new Date() },
          periodEnd: { gt: new Date() },
        },
      })
    : null;
  const reportsAll = await prisma.reportEvent.count({
    where: { organizationId: org.id },
  });
  const tier = tierNameFromPlan(sub?.plan.name);

  return {
    id: org.id,
    name: org.name,
    logoInitials: org.logoInitials ?? org.name.slice(0, 2).toUpperCase(),
    logoColor: org.logoColor ?? "#0f172a",
    status: mapStatus(org.status),
    softLock: mapSoftLock(org.softLock),
    softLockEndsAt: org.softLockEndsAt?.toISOString().slice(0, 10) ?? null,
    tier,
    seats: 0,
    seatsUsed: users,
    reportsGenerated: reportsAll || (usage?.reportsGenerated ?? 0),
    reportsThisMonth: usage?.reportsGenerated ?? 0,
    renewsAt: sub?.currentPeriodEnd.toISOString().slice(0, 10) ?? "",
    ownerEmail: org.billingEmail ?? "",
    phone: org.phone ?? "",
    email: org.email ?? "",
    createdAt: org.createdAt.toISOString().slice(0, 10),
    defaultTheme: org.defaultTheme,
    calculators: TIER_CALCULATORS[tier],
  };
}

export async function listCompanies(): Promise<Company[]> {
  if (!isDatabaseConfigured()) return getAllDummyCompanies();
  const prisma = getPrisma()!;
  const orgs = await prisma.organization.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
  });
  return Promise.all(orgs.map(orgToCompany));
}

export async function getCompanyById(id: string): Promise<Company | undefined> {
  if (!isDatabaseConfigured()) return getDummyCompany(id);
  const prisma = getPrisma()!;
  const org = await prisma.organization.findFirst({
    where: { OR: [{ id }, { slug: id }], deletedAt: null },
  });
  if (!org) return undefined;
  return orgToCompany(org);
}

export async function listCompanyUsers(companyId: string): Promise<CompanyUser[]> {
  if (!isDatabaseConfigured()) return getDummyCompanyUsers(companyId);
  const prisma = getPrisma()!;
  const org = await prisma.organization.findFirst({
    where: { OR: [{ id: companyId }, { slug: companyId }], deletedAt: null },
  });
  if (!org) return [];
  const users = await prisma.user.findMany({
    where: { organizationId: org.id, deletedAt: null },
    orderBy: { name: "asc" },
  });
  return users.map((u: User) => ({
    id: u.id,
    companyId: org.id,
    name: u.name,
    email: u.email,
    role:
      u.role === UserRole.COMPANY_ADMIN
        ? ("admin" as const)
        : ("advisor" as const),
    status:
      u.status === UserStatus.INVITED
        ? ("invited" as const)
        : u.status === UserStatus.DISABLED
          ? ("disabled" as const)
          : ("active" as const),
    lastActiveAt: u.lastLoginAt?.toISOString().slice(0, 10) ?? "—",
  }));
}

export async function listNivraStaff(): Promise<NivraStaff[]> {
  if (!isDatabaseConfigured()) return DUMMY_NIVRA_STAFF;
  const prisma = getPrisma()!;
  const users = await prisma.user.findMany({
    where: { role: UserRole.NIVRA_ADMIN, deletedAt: null },
    orderBy: { name: "asc" },
  });
  return users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: "main_admin" as const,
    reportsThisMonth: 0,
    status: u.status === UserStatus.DISABLED ? ("inactive" as const) : ("active" as const),
  }));
}

export async function getPlatformStats() {
  if (!isDatabaseConfigured()) return dummyPlatformStats();
  const companies = await listCompanies();
  return {
    totalCompanies: companies.length,
    active: companies.filter((c) => c.status === "active").length,
    trial: companies.filter((c) => c.status === "trial").length,
    suspended: companies.filter((c) => c.status === "suspended").length,
    inactive: companies.filter((c) => c.status === "inactive").length,
    reportsTotal: companies.reduce((sum, c) => sum + c.reportsGenerated, 0),
    reportsThisMonth: companies.reduce((sum, c) => sum + c.reportsThisMonth, 0),
    seatsUsed: companies.reduce((sum, c) => sum + c.seatsUsed, 0),
    seatsTotal: companies.reduce((sum, c) => sum + Math.max(c.seats, c.seatsUsed), 0),
  };
}

export async function getDemoCompanyId(): Promise<string> {
  if (!isDatabaseConfigured()) return DEMO_COMPANY_ID;
  const prisma = getPrisma()!;
  const acme = await prisma.organization.findUnique({ where: { slug: "acme-wealth" } });
  return acme?.id ?? DEMO_COMPANY_ID;
}

export { DEMO_COMPANY_ID };
