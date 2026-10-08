import { TIER_CALCULATORS, type SubscriptionTier } from "@/lib/admin/dummy-data";

/**
 * Plan catalogue for the subscription UI.
 * Prices, limits and copy are placeholders until final pricing is confirmed.
 * Report limits mirror `prisma/seed.ts` (`reportLimitPerPeriod`).
 */

export type BillingCycle = "monthly" | "annual";

export type BillingPlan = {
  tier: SubscriptionTier;
  tagline: string;
  /** INR per month on monthly billing; null = custom pricing. */
  monthlyPrice: number | null;
  /** INR per year when billed annually; null = custom pricing. */
  annualPrice: number | null;
  reportLimit: number | null;
  highlight?: string;
  features: string[];
};

export const ANNUAL_SAVINGS_LABEL = "2 months free";

export const BILLING_CONTACT_EMAIL = "billing@nivrafintech.com";

export const BILLING_PLANS: BillingPlan[] = [
  {
    tier: "Starter",
    tagline: "For independent advisors getting started with client reports.",
    monthlyPrice: 999,
    annualPrice: 9990,
    reportLimit: 50,
    features: [
      "50 client reports per month",
      "Goal SIP, investment growth and loan calculators",
      "Branded PDF reports",
      "Email support",
    ],
  },
  {
    tier: "Growth",
    tagline: "For small advisory teams planning goals and education.",
    monthlyPrice: 2499,
    annualPrice: 24990,
    reportLimit: 200,
    features: [
      "200 client reports per month",
      "Everything in Starter",
      "Unified goal planner and child education",
      "MF vs FD comparison",
    ],
  },
  {
    tier: "Pro",
    tagline: "For established firms that need the full planning suite.",
    monthlyPrice: 4999,
    annualPrice: 49990,
    reportLimit: 1000,
    highlight: "Most chosen",
    features: [
      "1,000 client reports per month",
      "Everything in Growth",
      "FIRE, financial health and multi-goal planning",
      "Insurance analysis",
      "Priority support",
    ],
  },
  {
    tier: "Enterprise",
    tagline: "For large distributors with custom volume and onboarding.",
    monthlyPrice: null,
    annualPrice: null,
    reportLimit: null,
    features: [
      "Unlimited client reports",
      "Every calculator in the suite",
      "Dedicated account manager",
      "Custom onboarding and invoicing",
    ],
  },
];

export const ALL_SUITE_CALCULATORS = TIER_CALCULATORS.Enterprise;

export type ComparisonRow = {
  label: string;
  values: Record<SubscriptionTier, string | boolean>;
};

export type ComparisonGroup = { title: string; rows: ComparisonRow[] };

function byTier(fn: (tier: SubscriptionTier) => string | boolean): Record<SubscriptionTier, string | boolean> {
  return {
    Starter: fn("Starter"),
    Growth: fn("Growth"),
    Pro: fn("Pro"),
    Enterprise: fn("Enterprise"),
  };
}

export const COMPARISON_GROUPS: ComparisonGroup[] = [
  {
    title: "Usage",
    rows: [
      {
        label: "Client reports per month",
        values: byTier((tier) => {
          const limit = BILLING_PLANS.find((p) => p.tier === tier)?.reportLimit;
          return limit == null ? "Unlimited" : limit.toLocaleString("en-IN");
        }),
      },
      { label: "Team members", values: byTier(() => "Unlimited") },
      { label: "Free trial", values: byTier(() => "14 days") },
    ],
  },
  {
    title: "Calculators",
    rows: ALL_SUITE_CALCULATORS.map((name) => ({
      label: name,
      values: byTier((tier) => TIER_CALCULATORS[tier].includes(name)),
    })),
  },
  {
    title: "Reports and support",
    rows: [
      { label: "Branded PDF reports", values: byTier(() => true) },
      {
        label: "Priority support",
        values: byTier((tier) => tier === "Pro" || tier === "Enterprise"),
      },
      { label: "Dedicated account manager", values: byTier((tier) => tier === "Enterprise") },
    ],
  },
];

export function planFor(tier: SubscriptionTier): BillingPlan {
  return BILLING_PLANS.find((p) => p.tier === tier) ?? BILLING_PLANS[0]!;
}

/** Amount charged per billing period (month or year); null = custom pricing. */
export function priceFor(plan: BillingPlan, cycle: BillingCycle): number | null {
  return cycle === "annual" ? plan.annualPrice : plan.monthlyPrice;
}

export const TIER_ORDER: SubscriptionTier[] = ["Starter", "Growth", "Pro", "Enterprise"];
