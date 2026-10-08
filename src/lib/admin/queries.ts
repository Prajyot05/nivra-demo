import {
  CompanyStatus,
  SoftLockState,
  UserRole,
  UserStatus,
  type Organization,
  type Prisma,
  type User,
} from "@prisma/client";
import { unstable_cache } from "next/cache";
import { cache } from "react";
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

/** Cross-request cache window for admin reads (seconds). */
const ADMIN_CACHE_SECONDS = 60;
export const ADMIN_CACHE_TAG = "admin-data";

type OrgWithRelations = Organization & {
  subscriptions: Array<{
    id: string;
    currentPeriodEnd: Date;
    plan: { name: string; seatLimit: number | null };
  }>;
  _count: { users: number };
};

/**
 * Loads companies in a fixed number of round trips (no per-org queries):
 * orgs + active plan + user counts, then report counts and current usage in parallel.
 */
async function loadCompanies(where: Prisma.OrganizationWhereInput): Promise<Company[]> {
  const prisma = getPrisma()!;
  const orgs = (await prisma.organization.findMany({
    where: { deletedAt: null, ...where },
    orderBy: { createdAt: "desc" },
    include: {
      subscriptions: {
        where: { endedAt: null },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          id: true,
          currentPeriodEnd: true,
          plan: { select: { name: true, seatLimit: true } },
        },
      },
      _count: {
        select: {
          users: { where: { deletedAt: null, status: { not: UserStatus.DISABLED } } },
        },
      },
    },
  })) as OrgWithRelations[];
  if (orgs.length === 0) return [];

  const orgIds = orgs.map((o) => o.id);
  const subIds = orgs.flatMap((o) => o.subscriptions.map((s) => s.id));
  const now = new Date();

  const [reportCounts, usages] = await Promise.all([
    prisma.reportEvent.groupBy({
      by: ["organizationId"],
      where: { organizationId: { in: orgIds } },
      _count: { _all: true },
    }),
    subIds.length
      ? prisma.usagePeriod.findMany({
          where: {
            subscriptionId: { in: subIds },
            periodStart: { lte: now },
            periodEnd: { gt: now },
          },
          select: { subscriptionId: true, reportsGenerated: true },
        })
      : Promise.resolve([]),
  ]);

  const reportsByOrg = new Map(reportCounts.map((r) => [r.organizationId, r._count._all]));
  const usageBySub = new Map(usages.map((u) => [u.subscriptionId, u.reportsGenerated]));

  return orgs.map((org) => {
    const sub = org.subscriptions[0];
    return orgToCompany(org, {
      planName: sub?.plan.name,
      seatLimit: sub?.plan.seatLimit ?? null,
      renewsAt: sub?.currentPeriodEnd,
      users: org._count.users,
      reportsAll: reportsByOrg.get(org.id) ?? 0,
      reportsThisMonth: sub ? (usageBySub.get(sub.id) ?? 0) : 0,
    });
  });
}

function orgToCompany(
  org: Organization,
  facts: {
    planName?: string;
    seatLimit: number | null;
    renewsAt?: Date;
    users: number;
    reportsAll: number;
    reportsThisMonth: number;
  },
): Company {
  const tier = tierNameFromPlan(facts.planName);
  const users = facts.users;
  const reportsAll = facts.reportsAll;
  const usage = { reportsGenerated: facts.reportsThisMonth };
  const sub = facts.renewsAt ? { currentPeriodEnd: facts.renewsAt } : null;

  return {
    id: org.id,
    name: org.name,
    logoInitials: org.logoInitials ?? org.name.slice(0, 2).toUpperCase(),
    logoColor: org.logoColor ?? "#0f172a",
    status: mapStatus(org.status),
    softLock: mapSoftLock(org.softLock),
    softLockEndsAt: org.softLockEndsAt?.toISOString().slice(0, 10) ?? null,
    tier,
    seats: facts.seatLimit ?? 0,
    seatsUsed: users,
    reportsGenerated: reportsAll || usage.reportsGenerated,
    reportsThisMonth: usage.reportsGenerated,
    renewsAt: sub?.currentPeriodEnd.toISOString().slice(0, 10) ?? "",
    ownerEmail: org.billingEmail ?? "",
    phone: org.phone ?? "",
    email: org.email ?? "",
    createdAt: org.createdAt.toISOString().slice(0, 10),
    defaultTheme: org.defaultTheme,
    calculators: TIER_CALCULATORS[tier],
  };
}

const listCompaniesCached = unstable_cache(
  () => loadCompanies({}),
  ["admin-companies"],
  { revalidate: ADMIN_CACHE_SECONDS, tags: [ADMIN_CACHE_TAG] },
);

export const listCompanies = cache(async (): Promise<Company[]> => {
  if (!isDatabaseConfigured()) return getAllDummyCompanies();
  return listCompaniesCached();
});

const getCompanyCached = unstable_cache(
  async (id: string) => (await loadCompanies({ OR: [{ id }, { slug: id }] }))[0] ?? null,
  ["admin-company"],
  { revalidate: ADMIN_CACHE_SECONDS, tags: [ADMIN_CACHE_TAG] },
);

export const getCompanyById = cache(async (id: string): Promise<Company | undefined> => {
  if (!isDatabaseConfigured()) return getDummyCompany(id);
  return (await getCompanyCached(id)) ?? undefined;
});

const listCompanyUsersCached = unstable_cache(
  async (companyId: string) => {
    const prisma = getPrisma()!;
    const users = await prisma.user.findMany({
      where: {
        deletedAt: null,
        organization: { OR: [{ id: companyId }, { slug: companyId }], deletedAt: null },
      },
      orderBy: { name: "asc" },
    });
    return users.map(toCompanyUser);
  },
  ["admin-company-users"],
  { revalidate: ADMIN_CACHE_SECONDS, tags: [ADMIN_CACHE_TAG] },
);

export const listCompanyUsers = cache(async (companyId: string): Promise<CompanyUser[]> => {
  if (!isDatabaseConfigured()) return getDummyCompanyUsers(companyId);
  return listCompanyUsersCached(companyId);
});

function toCompanyUser(u: User): CompanyUser {
  return {
    id: u.id,
    companyId: u.organizationId ?? "",
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
  };
}

const listNivraStaffCached = unstable_cache(
  async () => {
    const prisma = getPrisma()!;
    return prisma.user.findMany({
      where: { role: UserRole.NIVRA_ADMIN, deletedAt: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true, status: true },
    });
  },
  ["admin-staff"],
  { revalidate: ADMIN_CACHE_SECONDS, tags: [ADMIN_CACHE_TAG] },
);

export const listNivraStaff = cache(async (): Promise<NivraStaff[]> => {
  if (!isDatabaseConfigured()) return DUMMY_NIVRA_STAFF;
  const users = await listNivraStaffCached();
  return users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: "main_admin" as const,
    reportsThisMonth: 0,
    status: u.status === UserStatus.DISABLED ? ("inactive" as const) : ("active" as const),
  }));
});

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

/** Per-request only: a persisted id goes stale when the database is re-seeded. */
export const getDemoCompanyId = cache(async (): Promise<string> => {
  if (!isDatabaseConfigured()) return DEMO_COMPANY_ID;
  const acme = await getPrisma()!.organization.findUnique({
    where: { slug: "acme-wealth" },
    select: { id: true },
  });
  return acme?.id ?? DEMO_COMPANY_ID;
});

export { DEMO_COMPANY_ID };
