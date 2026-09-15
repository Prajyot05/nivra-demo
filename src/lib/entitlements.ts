import {
  SoftLockState,
  SubscriptionStatus,
  UserRole,
  type Organization,
  type Plan,
  type Subscription,
} from "@prisma/client";
import { getPrisma, isDatabaseConfigured } from "@/lib/db";

export type LockMode = "none" | "view_only" | "hard_locked";

export type Entitlements = {
  role: UserRole;
  organizationId: string | null;
  organization: Pick<
    Organization,
    "id" | "name" | "slug" | "status" | "softLock" | "softLockEndsAt" | "defaultTheme"
  > | null;
  tierLevel: number;
  tierName: string;
  subscriptionStatus: SubscriptionStatus | null;
  lockMode: LockMode;
  softLockEndsAt: Date | null;
  canUseCalculators: boolean;
  canGenerateReports: boolean;
  allowedCalculatorIds: string[];
  reportsGenerated: number;
  reportLimit: number | null;
  /** Display only — never use for authorization of the next report. */
  reportsRemaining: number | null;
};

const SOFT_LOCK_DAYS = Number(process.env.SOFT_LOCK_DAYS ?? "3");

function resolveLockMode(org: Organization | null, now = new Date()): LockMode {
  if (!org) return "none";
  if (org.softLock === SoftLockState.HARD_LOCKED) return "hard_locked";
  if (org.softLock === SoftLockState.VIEW_ONLY) {
    if (org.softLockEndsAt && org.softLockEndsAt.getTime() <= now.getTime()) {
      return "hard_locked";
    }
    return "view_only";
  }
  return "none";
}

/** Apply soft-lock when a subscription expires/suspends; promote VIEW_ONLY → HARD after window. */
export async function refreshOrganizationLock(organizationId: string): Promise<void> {
  const prisma = getPrisma();
  if (!prisma) return;

  const org = await prisma.organization.findUnique({ where: { id: organizationId } });
  if (!org || org.deletedAt) return;

  const live = await prisma.subscription.findFirst({
    where: { organizationId, endedAt: null },
    orderBy: { startedAt: "desc" },
  });

  const now = new Date();
  const inactive =
    !live ||
    live.status === SubscriptionStatus.EXPIRED ||
    live.status === SubscriptionStatus.CANCELLED ||
    org.status === "SUSPENDED" ||
    org.status === "INACTIVE";

  if (!inactive) {
    if (org.softLock !== SoftLockState.NONE) {
      await prisma.organization.update({
        where: { id: organizationId },
        data: { softLock: SoftLockState.NONE, softLockEndsAt: null },
      });
    }
    return;
  }

  if (org.softLock === SoftLockState.NONE) {
    const ends = new Date(now);
    ends.setUTCDate(ends.getUTCDate() + SOFT_LOCK_DAYS);
    await prisma.organization.update({
      where: { id: organizationId },
      data: { softLock: SoftLockState.VIEW_ONLY, softLockEndsAt: ends },
    });
    return;
  }

  if (
    org.softLock === SoftLockState.VIEW_ONLY &&
    org.softLockEndsAt &&
    org.softLockEndsAt.getTime() <= now.getTime()
  ) {
    await prisma.organization.update({
      where: { id: organizationId },
      data: { softLock: SoftLockState.HARD_LOCKED },
    });
  }
}

export async function getEntitlements(input: {
  role: UserRole;
  organizationId: string | null;
}): Promise<Entitlements> {
  const empty: Entitlements = {
    role: input.role,
    organizationId: input.organizationId,
    organization: null,
    tierLevel: input.role === UserRole.NIVRA_ADMIN ? 99 : 0,
    tierName: input.role === UserRole.NIVRA_ADMIN ? "Platform" : "None",
    subscriptionStatus: null,
    lockMode: "none",
    softLockEndsAt: null,
    canUseCalculators: input.role === UserRole.NIVRA_ADMIN,
    canGenerateReports: input.role === UserRole.NIVRA_ADMIN,
    allowedCalculatorIds: [],
    reportsGenerated: 0,
    reportLimit: null,
    reportsRemaining: null,
  };

  if (input.role === UserRole.NIVRA_ADMIN) {
    if (!isDatabaseConfigured()) {
      return { ...empty, canUseCalculators: true, canGenerateReports: true, allowedCalculatorIds: ["*"] };
    }
    const prisma = getPrisma()!;
    const all = await prisma.calculator.findMany({
      where: { isActive: true },
      select: { id: true },
    });
    return {
      ...empty,
      canUseCalculators: true,
      canGenerateReports: true,
      allowedCalculatorIds: all.map((c) => c.id),
    };
  }

  if (!input.organizationId || !isDatabaseConfigured()) {
    // No Neon yet: allow calculator use so local Clerk-only testing still works.
    return {
      ...empty,
      canUseCalculators: true,
      canGenerateReports: true,
      allowedCalculatorIds: ["*"],
      tierName: isDatabaseConfigured() ? "None" : "Dev (no DB)",
      tierLevel: 99,
    };
  }

  await refreshOrganizationLock(input.organizationId);

  const prisma = getPrisma()!;
  const org = await prisma.organization.findFirst({
    where: { id: input.organizationId, deletedAt: null },
  });
  if (!org) return empty;

  const subscription = await prisma.subscription.findFirst({
    where: { organizationId: org.id, endedAt: null },
    include: { plan: true },
    orderBy: { startedAt: "desc" },
  });

  const plan: Plan | null = subscription?.plan ?? null;
  const tierLevel = plan?.tierLevel ?? 0;
  const lockMode = resolveLockMode(org);

  const calculators = await prisma.calculator.findMany({
    where: { isActive: true, minTierLevel: { lte: tierLevel } },
    select: { id: true },
  });

  const usage = subscription
    ? await prisma.usagePeriod.findFirst({
        where: {
          subscriptionId: subscription.id,
          periodStart: { lte: new Date() },
          periodEnd: { gt: new Date() },
        },
      })
    : null;

  const reportsGenerated = usage?.reportsGenerated ?? 0;
  const reportLimit = usage?.reportLimit ?? plan?.reportLimitPerPeriod ?? null;
  const reportsRemaining =
    reportLimit == null ? null : Math.max(0, reportLimit - reportsGenerated);

  const subActive =
    subscription?.status === SubscriptionStatus.ACTIVE ||
    subscription?.status === SubscriptionStatus.TRIALING;

  // Soft-lock: browse OK; hard lock: blocked. Active/trial also OK.
  const canUseCalculators =
    lockMode === "none" ? subActive : lockMode === "view_only";
  const canGenerateReports =
    lockMode === "none" &&
    subActive &&
    (reportLimit == null || reportsGenerated < reportLimit);

  return {
    role: input.role,
    organizationId: org.id,
    organization: {
      id: org.id,
      name: org.name,
      slug: org.slug,
      status: org.status,
      softLock: org.softLock,
      softLockEndsAt: org.softLockEndsAt,
      defaultTheme: org.defaultTheme,
    },
    tierLevel,
    tierName: plan?.name ?? "None",
    subscriptionStatus: subscription?.status ?? null,
    lockMode,
    softLockEndsAt: org.softLockEndsAt,
    canUseCalculators,
    canGenerateReports,
    allowedCalculatorIds: calculators.map((c) => c.id),
    reportsGenerated,
    reportLimit,
    reportsRemaining,
  };
}

/** Atomic report quota consume. Returns false if blocked. */
export async function tryConsumeReportQuota(input: {
  organizationId: string;
  userId: string;
  calculatorId: string;
}): Promise<{ ok: true } | { ok: false; reason: string }> {
  const prisma = getPrisma();
  if (!prisma) return { ok: false, reason: "Database not configured" };

  await refreshOrganizationLock(input.organizationId);
  const org = await prisma.organization.findUnique({ where: { id: input.organizationId } });
  if (!org) return { ok: false, reason: "Organization not found" };
  if (resolveLockMode(org) !== "none") {
    return { ok: false, reason: "Organization is locked" };
  }

  const subscription = await prisma.subscription.findFirst({
    where: {
      organizationId: input.organizationId,
      endedAt: null,
      status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING] },
    },
  });
  if (!subscription) return { ok: false, reason: "No active subscription" };

  const usage = await prisma.usagePeriod.findFirst({
    where: {
      subscriptionId: subscription.id,
      periodStart: { lte: new Date() },
      periodEnd: { gt: new Date() },
    },
  });
  if (!usage) return { ok: false, reason: "No usage period" };

  return prisma.$transaction(async (tx) => {
    const updated = await tx.$executeRaw`
      UPDATE "UsagePeriod"
      SET "reportsGenerated" = "reportsGenerated" + 1, "updatedAt" = now()
      WHERE id = ${usage.id}::uuid
        AND ("reportLimit" IS NULL OR "reportsGenerated" < "reportLimit")
    `;
    if (updated === 0) {
      return { ok: false as const, reason: "Report quota exhausted" };
    }
    await tx.reportEvent.create({
      data: {
        organizationId: input.organizationId,
        userId: input.userId,
        calculatorId: input.calculatorId,
        usagePeriodId: usage.id,
      },
    });
    return { ok: true as const };
  });
}

export type { Organization, Plan, Subscription };
