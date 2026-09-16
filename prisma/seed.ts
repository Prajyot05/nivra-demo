import {
  CompanyStatus,
  OrgType,
  PlanInterval,
  PrismaClient,
  SoftLockState,
  SubscriptionStatus,
  UserRole,
  UserStatus,
} from "@prisma/client";

const prisma = new PrismaClient();

const PLANS = [
  {
    code: "starter-monthly",
    name: "Starter",
    tierLevel: 1,
    priceMinor: 0,
    interval: PlanInterval.MONTHLY,
    reportLimitPerPeriod: 50,
    trialDays: 14,
    trialReportLimit: 10,
    sortOrder: 1,
  },
  {
    code: "growth-monthly",
    name: "Growth",
    tierLevel: 2,
    priceMinor: 0,
    interval: PlanInterval.MONTHLY,
    reportLimitPerPeriod: 200,
    trialDays: 14,
    trialReportLimit: 20,
    sortOrder: 2,
  },
  {
    code: "pro-monthly",
    name: "Pro",
    tierLevel: 3,
    priceMinor: 0,
    interval: PlanInterval.MONTHLY,
    reportLimitPerPeriod: 1000,
    trialDays: 14,
    trialReportLimit: 50,
    sortOrder: 3,
  },
  {
    code: "enterprise-monthly",
    name: "Enterprise",
    tierLevel: 4,
    priceMinor: 0,
    interval: PlanInterval.MONTHLY,
    reportLimitPerPeriod: null as number | null,
    trialDays: 14,
    trialReportLimit: 100,
    sortOrder: 4,
  },
];

/** minTierLevel: 1=Starter, 2=Growth, 3=Pro, 4=Enterprise */
const CALCULATORS: Array<{
  id: string;
  name: string;
  category: string;
  route: string;
  mode?: string;
  minTierLevel: number;
  sortOrder: number;
}> = [
  { id: "mf-fd", name: "Mutual Fund vs Fixed Deposit", category: "standard", route: "/mf-fd", minTierLevel: 1, sortOrder: 1 },
  { id: "growth-lumpsum", name: "One-Time Investment", category: "standard", route: "/growth", mode: "lumpsum", minTierLevel: 1, sortOrder: 2 },
  { id: "growth-periodic", name: "Periodic Lumpsum Investment", category: "standard", route: "/growth", mode: "periodic", minTierLevel: 1, sortOrder: 3 },
  { id: "growth-sip", name: "SIP Calculator", category: "standard", route: "/growth", mode: "sip", minTierLevel: 1, sortOrder: 4 },
  { id: "growth-stepup", name: "SIP Step-Up Calculator", category: "standard", route: "/growth", mode: "stepup", minTierLevel: 1, sortOrder: 5 },
  { id: "multi-withdrawals", name: "SIP for Multiple Withdrawals", category: "standard", route: "/multi-goal", mode: "withdrawals", minTierLevel: 3, sortOrder: 6 },
  { id: "goal-sip", name: "Goal – SIP & Step-Up SIP", category: "goal", route: "/", minTierLevel: 1, sortOrder: 10 },
  { id: "goal-ls-sip", name: "Goal with Current Lumpsum", category: "goal", route: "/goals", mode: "ls-sip", minTierLevel: 2, sortOrder: 11 },
  { id: "goal-current", name: "Goal with Current Investments", category: "goal", route: "/goals", mode: "current", minTierLevel: 2, sortOrder: 12 },
  { id: "goal-periodic", name: "Goal with Periodic Lumpsum", category: "goal", route: "/goals", mode: "periodic", minTierLevel: 2, sortOrder: 13 },
  { id: "goal-existing-sip", name: "Goal with Existing SIP", category: "goal", route: "/goals", mode: "existing", minTierLevel: 2, sortOrder: 14 },
  { id: "goal-compounding", name: "Goal – Power of Compounding", category: "goal", route: "/goals", mode: "compounding", minTierLevel: 2, sortOrder: 15 },
  { id: "multi-goal-assign", name: "Multiple Goals – Corpus Assignment", category: "goal", route: "/multi-goal", mode: "assign", minTierLevel: 3, sortOrder: 16 },
  { id: "financial-health", name: "Financial Health Analysis", category: "retirement", route: "/fire", mode: "health", minTierLevel: 3, sortOrder: 20 },
  { id: "fire-planner", name: "FIRE Planner", category: "retirement", route: "/fire", mode: "fire", minTierLevel: 3, sortOrder: 21 },
  { id: "loan-emi", name: "Loan EMI", category: "loan", route: "/loans", mode: "emi", minTierLevel: 1, sortOrder: 30 },
  { id: "loan-extra-vs-invest", name: "Loan Extra vs Investment", category: "loan", route: "/loans", mode: "extra-vs-invest", minTierLevel: 1, sortOrder: 31 },
  { id: "loan-interest-recovery", name: "Loan Interest Recovery", category: "loan", route: "/loans", mode: "recovery", minTierLevel: 1, sortOrder: 32 },
  { id: "loan-prepay", name: "Loan Yearly Extra Payments", category: "loan", route: "/loans", mode: "prepay", minTierLevel: 1, sortOrder: 33 },
  { id: "vehicle-loan", name: "Vehicle Loan Benefit Analysis", category: "family", route: "/loans", mode: "vehicle", minTierLevel: 3, sortOrder: 40 },
  { id: "education", name: "Child Education Planner", category: "family", route: "/education", minTierLevel: 2, sortOrder: 41 },
  { id: "insurance-irr", name: "Insurance IRR", category: "insurance", route: "/insurance", mode: "irr", minTierLevel: 3, sortOrder: 50 },
  { id: "insurance-tp", name: "Insurance Convert to Term Plan", category: "insurance", route: "/insurance", mode: "switch", minTierLevel: 3, sortOrder: 51 },
];

async function main() {
  for (const plan of PLANS) {
    await prisma.plan.upsert({
      where: { code: plan.code },
      create: plan,
      update: {
        name: plan.name,
        tierLevel: plan.tierLevel,
        reportLimitPerPeriod: plan.reportLimitPerPeriod,
        trialDays: plan.trialDays,
        trialReportLimit: plan.trialReportLimit,
        sortOrder: plan.sortOrder,
      },
    });
  }

  for (const calc of CALCULATORS) {
    await prisma.calculator.upsert({
      where: { id: calc.id },
      create: calc,
      update: {
        name: calc.name,
        category: calc.category,
        route: calc.route,
        mode: calc.mode ?? null,
        minTierLevel: calc.minTierLevel,
        sortOrder: calc.sortOrder,
        isActive: true,
      },
    });
  }

  const pro = await prisma.plan.findUniqueOrThrow({ where: { code: "pro-monthly" } });
  const growth = await prisma.plan.findUniqueOrThrow({ where: { code: "growth-monthly" } });
  const starter = await prisma.plan.findUniqueOrThrow({ where: { code: "starter-monthly" } });
  const enterprise = await prisma.plan.findUniqueOrThrow({
    where: { code: "enterprise-monthly" },
  });

  const orgs = [
    {
      slug: "acme-wealth",
      name: "Acme Wealth Advisors",
      status: CompanyStatus.ACTIVE,
      softLock: SoftLockState.NONE,
      logoInitials: "AW",
      logoColor: "#0f172a",
      billingEmail: "priya@acmewealth.in",
      phone: "+91 98765 43210",
      email: "hello@acmewealth.in",
      defaultTheme: "classic",
      planId: pro.id,
      subStatus: SubscriptionStatus.ACTIVE,
      reportsThisMonth: 96,
      reportLimit: 1000,
    },
    {
      slug: "horizon-finserve",
      name: "Horizon Finserve",
      status: CompanyStatus.TRIAL,
      softLock: SoftLockState.NONE,
      logoInitials: "HF",
      logoColor: "#1d4ed8",
      billingEmail: "ravi@horizonfinserve.com",
      phone: "+91 98111 22334",
      email: "support@horizonfinserve.com",
      defaultTheme: "ocean",
      planId: growth.id,
      subStatus: SubscriptionStatus.TRIALING,
      reportsThisMonth: 12,
      reportLimit: 20,
    },
    {
      slug: "sagar-capital",
      name: "Sagar Capital",
      status: CompanyStatus.SUSPENDED,
      softLock: SoftLockState.VIEW_ONLY,
      softLockEndsAt: new Date("2026-09-16"),
      logoInitials: "SC",
      logoColor: "#047857",
      billingEmail: "admin@sagarcapital.in",
      phone: "+91 90000 11122",
      email: "ops@sagarcapital.in",
      defaultTheme: "forest",
      planId: starter.id,
      subStatus: SubscriptionStatus.EXPIRED,
      reportsThisMonth: 0,
      reportLimit: 50,
    },
    {
      slug: "nimbus-advisors",
      name: "Nimbus Advisors LLP",
      status: CompanyStatus.INACTIVE,
      softLock: SoftLockState.HARD_LOCKED,
      logoInitials: "NA",
      logoColor: "#7c2d12",
      billingEmail: "meera@nimbusadvisors.com",
      phone: "+91 98200 44556",
      email: "contact@nimbusadvisors.com",
      defaultTheme: "slate",
      planId: growth.id,
      subStatus: SubscriptionStatus.CANCELLED,
      reportsThisMonth: 0,
      reportLimit: 200,
    },
    {
      slug: "lotus-portfolio",
      name: "Lotus Portfolio Partners",
      status: CompanyStatus.ACTIVE,
      softLock: SoftLockState.NONE,
      logoInitials: "LP",
      logoColor: "#6d28d9",
      billingEmail: "owner@lotuspp.in",
      phone: "+91 99887 76655",
      email: "desk@lotuspp.in",
      defaultTheme: "indigo",
      planId: enterprise.id,
      subStatus: SubscriptionStatus.ACTIVE,
      reportsThisMonth: 412,
      reportLimit: null as number | null,
    },
    {
      slug: "zenith-moneyworks",
      name: "Zenith Moneyworks",
      status: CompanyStatus.ACTIVE,
      softLock: SoftLockState.NONE,
      logoInitials: "ZM",
      logoColor: "#be123c",
      billingEmail: "karan@zenithmw.in",
      phone: "+91 97654 32100",
      email: "hello@zenithmw.in",
      defaultTheme: "coral",
      planId: starter.id,
      subStatus: SubscriptionStatus.ACTIVE,
      reportsThisMonth: 18,
      reportLimit: 50,
    },
  ];

  const periodStart = new Date();
  periodStart.setUTCDate(1);
  periodStart.setUTCHours(0, 0, 0, 0);
  const periodEnd = new Date(periodStart);
  periodEnd.setUTCMonth(periodEnd.getUTCMonth() + 1);

  for (const o of orgs) {
    const org = await prisma.organization.upsert({
      where: { slug: o.slug },
      create: {
        name: o.name,
        slug: o.slug,
        type: OrgType.COMPANY,
        status: o.status,
        softLock: o.softLock,
        softLockEndsAt: "softLockEndsAt" in o ? o.softLockEndsAt : null,
        logoInitials: o.logoInitials,
        logoColor: o.logoColor,
        billingEmail: o.billingEmail,
        phone: o.phone,
        email: o.email,
        defaultTheme: o.defaultTheme,
      },
      update: {
        name: o.name,
        status: o.status,
        softLock: o.softLock,
        softLockEndsAt: "softLockEndsAt" in o ? o.softLockEndsAt : null,
        logoInitials: o.logoInitials,
        logoColor: o.logoColor,
        billingEmail: o.billingEmail,
        phone: o.phone,
        email: o.email,
        defaultTheme: o.defaultTheme,
      },
    });

    const existingLive = await prisma.subscription.findFirst({
      where: { organizationId: org.id, endedAt: null },
    });

    let subscriptionId = existingLive?.id;
    if (!existingLive) {
      const sub = await prisma.subscription.create({
        data: {
          organizationId: org.id,
          planId: o.planId,
          status: o.subStatus,
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
          trialEndsAt:
            o.subStatus === SubscriptionStatus.TRIALING
              ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
              : null,
        },
      });
      subscriptionId = sub.id;
    } else {
      await prisma.subscription.update({
        where: { id: existingLive.id },
        data: {
          planId: o.planId,
          status: o.subStatus,
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
        },
      });
    }

    await prisma.usagePeriod.upsert({
      where: {
        subscriptionId_periodStart: {
          subscriptionId: subscriptionId!,
          periodStart,
        },
      },
      create: {
        organizationId: org.id,
        subscriptionId: subscriptionId!,
        periodStart,
        periodEnd,
        reportsGenerated: o.reportsThisMonth,
        reportLimit: o.reportLimit,
      },
      update: {
        reportsGenerated: o.reportsThisMonth,
        reportLimit: o.reportLimit,
        periodEnd,
      },
    });
  }

  const acme = await prisma.organization.findUniqueOrThrow({
    where: { slug: "acme-wealth" },
  });

  const seedUsers: Array<{
    clerkUserId: string;
    email: string;
    name: string;
    role: UserRole;
    organizationId: string | null;
  }> = [
    {
      clerkUserId: "seed_nivra_admin",
      email: process.env.PLATFORM_ADMIN_EMAIL?.trim() || "yashurade27@gmail.com",
      name: "Yash Urade",
      role: UserRole.NIVRA_ADMIN,
      organizationId: null,
    },
    {
      clerkUserId: "seed_acme_admin",
      email: "priya@acmewealth.in",
      name: "Priya Sharma",
      role: UserRole.COMPANY_ADMIN,
      organizationId: acme.id,
    },
    {
      clerkUserId: "seed_acme_emp_1",
      email: "amit@acmewealth.in",
      name: "Amit Desai",
      role: UserRole.COMPANY_EMPLOYEE,
      organizationId: acme.id,
    },
    {
      clerkUserId: "seed_acme_emp_2",
      email: "neha@acmewealth.in",
      name: "Neha Kapoor",
      role: UserRole.COMPANY_EMPLOYEE,
      organizationId: acme.id,
    },
  ];

  for (const u of seedUsers) {
    await prisma.user.upsert({
      where: { clerkUserId: u.clerkUserId },
      create: {
        ...u,
        status: UserStatus.ACTIVE,
      },
      update: {
        email: u.email,
        name: u.name,
        role: u.role,
        organizationId: u.organizationId,
        status: UserStatus.ACTIVE,
      },
    });
  }

  console.log("Seed complete: plans, calculators, orgs, subscriptions, users");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
