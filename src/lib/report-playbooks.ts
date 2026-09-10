/**
 * Per-calculator Advisor Strategic Mandate & Execution Playbook.
 * Each calculator ships three pillars tailored to its decision surface.
 */

export type PlaybookPillar = {
  id: string;
  title: string;
  description: string;
  /** Highlight the middle / recommended pillar */
  accent?: boolean;
};

export type CalculatorReportId =
  | "goal-sip"
  | "unified-goal"
  | "investment-growth"
  | "child-education"
  | "fire"
  | "health"
  | "mf-vs-fd"
  | "loan-emi"
  | "loan-extra"
  | "insurance"
  | "multi-goal"
  | "multi-withdrawals";

const PLAYBOOKS: Record<CalculatorReportId, PlaybookPillar[]> = {
  "goal-sip": [
    {
      id: "01",
      title: "Automated Systematic Inception",
      description:
        "Execute bank mandate with ECS / OTM auto-debit scheduled strictly for the 1st business day of each calendar month to minimize behavioral friction and capture optimal rupee-cost averaging.",
    },
    {
      id: "02",
      title: "Annual Step-Up Escalation Review",
      accent: true,
      description:
        "For the Step-Up path, sync the automated top-up with the annual appraisal cycle so the lower starting SIP scales without a noticeable hit to lifestyle expenses.",
    },
    {
      id: "03",
      title: "Glidepath De-risking Near Goal",
      description:
        "Transition accumulated equity exposure to short-duration debt or ultra-short hybrid instruments via STP in the final 2 to 3 years to lock in the target corpus safely.",
    },
  ],
  "unified-goal": [
    {
      id: "01",
      title: "Priority-Ordered Funding Stack",
      description:
        "Fund near-term, non-negotiable goals first (education, home down-payment), then allocate residual SIP capacity to longer-horizon wealth goals so liquidity risk stays contained.",
    },
    {
      id: "02",
      title: "Mode-Specific Contribution Cadence",
      accent: true,
      description:
        "Lock the chosen planner mode (SIP / step-up / lumpsum / hybrid) into standing instructions and revisit only on material income or goal-date changes.",
    },
    {
      id: "03",
      title: "Cross-Goal Contingency Buffer",
      description:
        "Maintain a 3 to 6 month emergency reserve outside goal SIPs so one-time shocks do not force premature redemption of earmarked goal corpuses.",
    },
  ],
  "investment-growth": [
    {
      id: "01",
      title: "Contribution Discipline Mandate",
      description:
        "Treat the modeled SIP / lumpsum / periodic amount as a non-discretionary outlay. Missed months permanently reduce terminal wealth under the same return path.",
    },
    {
      id: "02",
      title: "Step-Up Alignment With Income",
      accent: true,
      description:
        "Where step-up is enabled, align escalation with salary revision dates so contribution growth compounds without lifestyle compression.",
    },
    {
      id: "03",
      title: "Horizon-Matched Asset Mix",
      description:
        "Keep equity-heavy allocation only while the investment horizon exceeds 5+ years; begin de-risking via STP as the planned redemption window approaches.",
    },
  ],
  "child-education": [
    {
      id: "01",
      title: "Inflation-Indexed Corpus Target",
      description:
        "Re-price the education goal every 12 to 18 months against current fee inflation so the required SIP does not silently fall behind real costs.",
    },
    {
      id: "02",
      title: "Staged Disbursement Calendar",
      accent: true,
      description:
        "Map SIP maturity and partial withdrawals to application / semester fee dates rather than a single lumpsum, reducing idle cash and timing risk.",
    },
    {
      id: "03",
      title: "Pre-Admission De-risking Window",
      description:
        "From 24 to 36 months before the first major fee, shift a rising share of the corpus into debt / hybrid instruments to protect purchasing power at need.",
    },
  ],
  fire: [
    {
      id: "01",
      title: "Asset Glidepath Transition",
      description:
        "Shift equity allocation gradually as retirement approaches so sequence-of-returns risk does not impair the required corpus.",
    },
    {
      id: "02",
      title: "Systematic Funding Discipline",
      accent: true,
      description:
        "Prioritise the recommended monthly SIP (or equivalent lumpsum) and avoid funding gaps that compound into larger shortfalls.",
    },
    {
      id: "03",
      title: "Longevity Stress Review",
      description:
        "Re-validate surviving-age assumptions and post-retirement returns annually so withdrawals remain solvent through the plan horizon.",
    },
  ],
  health: [
    {
      id: "01",
      title: "Funding Gap Closure",
      description:
        "If longevity is short of surviving age, increase pre-retirement savings or lower lifestyle draw to restore solvency.",
    },
    {
      id: "02",
      title: "Event Buffer Planning",
      accent: true,
      description:
        "Ring-fence known event amounts so one-time cash needs do not force distressed withdrawals from the retirement corpus.",
    },
    {
      id: "03",
      title: "Annual Health Recalibration",
      description:
        "Re-run this model yearly with updated corpus, expenses, and return assumptions to keep the plan on track.",
    },
  ],
  "mf-vs-fd": [
    {
      id: "01",
      title: "Tax-Aware Vehicle Selection",
      description:
        "Compare post-tax MF and FD outcomes under the client's slab / LTCG regime. Headline pre-tax yields often reverse ranking after tax.",
    },
    {
      id: "02",
      title: "Liquidity vs Certainty Trade-off",
      accent: true,
      description:
        "Reserve FD / debt for known near-term cash needs; deploy equity MF only where the client can tolerate mark-to-market volatility.",
    },
    {
      id: "03",
      title: "Laddered Deployment Plan",
      description:
        "If rotating from FD to MF, use a phased STP rather than a single switch to average entry risk across market cycles.",
    },
  ],
  "loan-emi": [
    {
      id: "01",
      title: "EMI Affordability Guardrail",
      description:
        "Keep total EMIs within a sustainable share of take-home income so the loan does not crowd out emergency savings and goal SIPs.",
    },
    {
      id: "02",
      title: "Rate & Tenure Sensitivity Review",
      accent: true,
      description:
        "Stress-test EMI under +1 to 2% rate shocks and shorter/longer tenures before locking the sanction. Small rate moves change lifetime interest sharply.",
    },
    {
      id: "03",
      title: "Prepayment Optionality",
      description:
        "Where surplus cash appears, prefer principal prepayment on high-rate tranches after confirming foreclosure charges and tax benefits.",
    },
  ],
  "loan-extra": [
    {
      id: "01",
      title: "Extra-Payment Targeting Rules",
      description:
        "Direct surplus cash to principal first on the highest-rate loan; confirm the amortisation schedule updates after each prepayment.",
    },
    {
      id: "02",
      title: "Interest Saved vs Opportunity Cost",
      accent: true,
      description:
        "Compare interest saved from prepayment against expected post-tax return on investing the same cash. Prepay when the loan rate dominates.",
    },
    {
      id: "03",
      title: "Tenure Compression Mandate",
      description:
        "Prefer keeping EMI constant and cutting tenure when making extras, unless cash-flow relief is the explicit priority.",
    },
  ],
  insurance: [
    {
      id: "01",
      title: "Cover Adequacy First",
      description:
        "Size pure protection (term / health) to income replacement and liability needs before evaluating any investment-linked insurance IRR.",
    },
    {
      id: "02",
      title: "Premium Sustainability Check",
      accent: true,
      description:
        "Confirm premiums remain affordable under income stress for the full policy term. Lapses destroy both cover and projected returns.",
    },
    {
      id: "03",
      title: "Product Role Clarity",
      description:
        "Treat insurance and investments as separate jobs; do not substitute market-linked insurance for a dedicated goal SIP unless cover is also required.",
    },
  ],
  "multi-goal": [
    {
      id: "01",
      title: "Corpus Assignment Hierarchy",
      description:
        "Assign existing corpus to the earliest or highest-priority goals first, then size fresh SIPs for residual shortfalls.",
    },
    {
      id: "02",
      title: "Conflict Resolution Protocol",
      accent: true,
      description:
        "When goals compete for the same cashflow, defer or right-size the lowest-priority goal rather than underfunding all of them equally.",
    },
    {
      id: "03",
      title: "Annual Reallocation Review",
      description:
        "Re-run multi-goal allocation yearly after bonus / appraisal cycles so surplus capital is reassigned before lifestyle inflation absorbs it.",
    },
  ],
  "multi-withdrawals": [
    {
      id: "01",
      title: "Start Full SIP Stack Immediately",
      description:
        "Begin the combined opening SIP so every timed withdrawal has its own funding path compounding from day one.",
    },
    {
      id: "02",
      title: "Step Down After Each Payout",
      accent: true,
      description:
        "Reduce the mandate when a goal is funded. Continuing the full stack after a withdrawal overfunds later goals unnecessarily.",
    },
    {
      id: "03",
      title: "Protect Near-Term Buckets",
      description:
        "Keep goals within 3 to 5 years in lower-volatility debt or hybrid sleeves so a late drawdown does not force a forced redemption.",
    },
  ],
};

export function getReportPlaybook(id: CalculatorReportId): PlaybookPillar[] {
  return PLAYBOOKS[id];
}

/** Flat shape used by jsPDF `generateCalculatorReport`. */
export function playbookForPdf(
  id: CalculatorReportId,
): Array<{ title: string; description: string }> {
  return getReportPlaybook(id).map(({ title, description }) => ({ title, description }));
}
