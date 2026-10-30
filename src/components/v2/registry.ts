import type { ComponentType } from "react";

export type V2CalculatorMeta = {
  slug: string;
  label: string;
  shortLabel: string;
  description: string;
  /** Existing calculate() API id */
  calculateId: string;
  /** Original route for parity checks */
  classicHref: string;
  phase: 1 | "later";
};

/**
 * Phase 1: three calculators that validate the advisory design system across
 * growth, debt, and comparison patterns. Retirement / FIRE and the rest wait
 * for explicit Phase 2 approval.
 */
export const V2_PHASE1_CALCULATORS: V2CalculatorMeta[] = [
  {
    slug: "sip-calculator",
    label: "SIP Calculator",
    shortLabel: "SIP",
    description:
      "Project monthly SIP maturity with inflation, tax, and cost of delay.",
    calculateId: "growth-sip",
    classicHref: "/growth?mode=sip",
    phase: 1,
  },
  {
    slug: "loan-emi-calculator",
    label: "Loan EMI Calculator",
    shortLabel: "Loan EMI",
    description:
      "Calculate EMI, total interest, amortisation, and interest-recovery SIP.",
    calculateId: "loan-emi",
    classicHref: "/loans?mode=emi",
    phase: 1,
  },
  {
    slug: "mf-vs-fd-calculator",
    label: "MF vs FD Calculator",
    shortLabel: "MF vs FD",
    description:
      "Compare mutual fund and fixed deposit outcomes on a post-tax, day-count basis.",
    calculateId: "mf-fd",
    classicHref: "/mf-fd",
    phase: 1,
  },
];

export const V2_CALCULATOR_SLUGS = V2_PHASE1_CALCULATORS.map((c) => c.slug);

export function getV2Calculator(slug: string): V2CalculatorMeta | undefined {
  return V2_PHASE1_CALCULATORS.find((c) => c.slug === slug);
}

export type V2CalculatorComponent = ComponentType;
