import { z } from "zod";

const pct = z.number().min(0).max(100);
/** Expense/lifestyle multipliers at retirement (100 = same as current; UI allows up to 200%). */
const factorPct = z.number().min(0).max(200);
const money = z.number().min(0);
const years = z.number().positive().max(100);
const age = z.number().int().min(0).max(120);
const months = z.number().int().min(0).max(1200);

export const clientFields = {
  clientName: z.string().optional(),
  age: age.optional(),
};

export const growthSipSchema = z
  .object({
    ...clientFields,
    monthlyInvestment: money,
    sipYears: years,
    investYears: years.optional(),
    returnPct: pct,
    inflationPct: pct.optional().default(0),
    delayMonths: months.optional().default(0),
    taxPct: pct.optional().default(0),
  })
  .refine((d) => d.investYears == null || d.investYears >= d.sipYears, {
    message: "investYears must be >= sipYears",
    path: ["investYears"],
  });

export const growthLumpsumSchema = z.object({
  ...clientFields,
  amount: money,
  years,
  returnPct: pct,
  inflationPct: pct.optional().default(0),
  delayMonths: months.optional().default(0),
  taxPct: pct.optional().default(0),
});

export const growthStepUpSchema = z.object({
  ...clientFields,
  startMonthly: money,
  sipYears: years,
  returnPct: pct,
  stepUpPct: pct,
  inflationPct: pct.optional().default(0),
  taxPct: pct.optional().default(0),
});

export const growthPeriodicSchema = z.object({
  ...clientFields,
  amount: money,
  timesPerYear: z
    .number()
    .int()
    .min(1)
    .max(12)
    .refine((n) => 12 % n === 0, {
      message: "timesPerYear must be 1, 2, 3, 4, 6, or 12",
    }),
  years: z.number().positive().max(50),
  returnPct: pct,
  taxPct: pct.optional().default(0),
});

export const goalSipSchema = z.object({
  ...clientFields,
  goalAmount: money,
  tenureYears: z.number().positive().max(75),
  returnPct: pct,
  inflationPct: pct,
  taxPct: pct,
  stepUpPct: pct,
  useInflationAdjustedGoal: z.boolean().default(false),
  delayMonths: months.optional().default(0),
});

const goalPlannerBase = {
  ...clientFields,
  goalAmount: money,
  tenureYears: z.number().positive().max(75),
  returnPct: pct,
  inflationPct: pct,
  taxPct: pct,
  useInflationAdjustedGoal: z.boolean().default(false),
};

export const goalCurrentSchema = z.object({
  ...goalPlannerBase,
  stepUpPct: pct,
  currentCorpus: money.optional().default(0),
  currentMonthlySip: money.optional().default(0),
});

export const goalLsSipSchema = z.object({
  ...goalPlannerBase,
  stepUpPct: pct,
  currentCorpus: money.optional().default(0),
  extraLumpsum: money.optional().default(0),
});

export const goalExistingSipSchema = z.object({
  ...goalPlannerBase,
  stepUpPct: pct,
  currentMonthlySip: money,
});

export const goalPeriodicSchema = z.object({
  ...goalPlannerBase,
  stepUpPct: pct,
  amount: money,
  timesPerYear: z
    .number()
    .int()
    .min(1)
    .max(12)
    .refine((n) => 12 % n === 0, {
      message: "timesPerYear must be 1, 2, 3, 4, 6, or 12",
    }),
});

export const compoundingStepSizeSchema = z.union([
  z.literal(10_000),
  z.literal(100_000),
  z.literal(1_000_000),
  z.literal(10_000_000),
]);

export const goalCompoundingSchema = z.object({
  ...clientFields,
  goalAmount: z.number().positive(),
  tenureYears: z.number().positive().max(50),
  returnPct: z.number().gt(0).max(100),
  inflationPct: pct.optional().default(0),
  taxPct: pct,
  useInflationAdjustedGoal: z.boolean().optional().default(false),
  extraYears: z.number().min(0).max(50).optional().default(0),
  investmentType: z.enum(["one-time", "sip"]).optional().default("one-time"),
  stepSize: compoundingStepSizeSchema.optional().default(1_000_000),
});

export const loanEmiSchema = z
  .object({
    ...clientFields,
    principal: z.number().positive(),
    years: z.number().positive().max(50),
    interestPct: z.number().positive().max(100),
    recoverReturnPct: z.number().positive().max(100).optional().default(12),
    delayMonths: z.number().int().min(0).max(1199).optional().default(12),
  })
  .superRefine((val, ctx) => {
    if (val.delayMonths >= val.years * 12) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Delay must leave at least one investment month within the loan term.",
        path: ["delayMonths"],
      });
    }
  });

export const mfFdSchema = z.object({
  ...clientFields,
  amount: money,
  days: z.number().int().positive().max(36500),
  mfReturnPct: pct,
  fdReturnPct: pct,
  mfTaxPct: pct,
  fdTaxPct: pct,
});

export const loanPrepaySchema = z.object({
  ...clientFields,
  principal: money,
  years,
  interestPct: pct,
  yearlyExtra: money.optional().default(0),
  recoverReturnPct: pct.optional().default(12),
});

export const loanExtraVsInvestSchema = z
  .object({
    ...clientFields,
    principal: money,
    years,
    interestPct: pct,
    extraAmount: money,
    extraMonth: z.number().int().positive().max(1200),
    investReturnPct: pct,
    taxPct: pct,
    incomeTaxPct: pct,
  })
  .superRefine((data, ctx) => {
    const maxMonth = Math.round(data.years * 12);
    if (data.extraMonth > maxMonth) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["extraMonth"],
        message: `Extra payment month cannot exceed the loan term (${maxMonth} months).`,
      });
    }
    if (data.extraAmount > data.principal) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["extraAmount"],
        message: "Extra payment cannot exceed the loan principal.",
      });
    }
  });

export const loanInterestRecoverySchema = z
  .object({
    ...clientFields,
    principal: money,
    years,
    interestPct: pct,
    proposedYears: years,
    sipReturnPct: pct,
  })
  .superRefine((data, ctx) => {
    if (data.proposedYears >= data.years) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["proposedYears"],
        message: "Proposed tenure must be shorter than the baseline tenure.",
      });
    }
  });

export const vehicleLoanSchema = z
  .object({
    ...clientFields,
    onRoadCost: money,
    loanAmount: money,
    interestPct: pct,
    years,
    incomeTaxPct: pct,
    depreciationPct: pct.optional().default(15),
    fdReturnPct: pct,
    debtReturnPct: pct,
    conservativeReturnPct: pct,
    equityReturnPct: pct,
    fdTaxPct: pct,
    debtTaxPct: pct,
    conservativeTaxPct: pct,
    equityTaxPct: pct,
  })
  .superRefine((data, ctx) => {
    if (!(data.onRoadCost > 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["onRoadCost"],
        message: "On-road cost must be greater than 0.",
      });
    }
    if (data.loanAmount > data.onRoadCost) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["loanAmount"],
        message: "Loan amount cannot exceed on-road cost.",
      });
    }
    if (!(data.interestPct > 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["interestPct"],
        message: "Loan interest rate must be above 0%.",
      });
    }
  });

export const insuranceIrrSchema = z
  .object({
    ...clientFields,
    premium: money,
    payTerm: years,
    corpusAtPayEnd: money,
    policyTerm: z.number().positive().max(50),
    returnPct: pct,
    taxPct: pct,
  })
  .superRefine((data, ctx) => {
    if (!(data.premium > 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["premium"],
        message: "Annual premium must be greater than 0.",
      });
    }
    if (!(data.corpusAtPayEnd > 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["corpusAtPayEnd"],
        message: "Corpus at payment end must be greater than 0.",
      });
    }
    if (!(data.returnPct > 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["returnPct"],
        message: "Expected return must be above 0%.",
      });
    }
    if (data.payTerm > data.policyTerm) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["payTerm"],
        message: "Premium payment term cannot exceed the policy term.",
      });
    }
  });

export const insuranceTpSchema = z
  .object({
    ...clientFields,
    premium: money,
    payTerm: years,
    yearsPaid: z.number().min(0).max(50),
    policyTerm: z.number().positive().max(50),
    yearsToMaturity: years,
    maturityValue: money,
    taxPct: pct,
    surrenderValue: money,
    termPremium: money,
    termYears: years,
    returnPct: pct,
    termCover: money.optional(),
  })
  .superRefine((data, ctx) => {
    if (!(data.premium > 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["premium"],
        message: "Annual premium must be greater than 0.",
      });
    }
    if (data.yearsPaid > data.payTerm) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["yearsPaid"],
        message: "Years paid cannot exceed the premium payment term.",
      });
    }
    if (data.payTerm > data.policyTerm) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["payTerm"],
        message: "Premium payment term cannot exceed the policy term.",
      });
    }
    if (data.yearsToMaturity > data.policyTerm) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["yearsToMaturity"],
        message: "Years to maturity cannot exceed the policy term.",
      });
    }
    if (!(data.returnPct > 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["returnPct"],
        message: "Expected investment return must be above 0%.",
      });
    }
    if (data.surrenderValue < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["surrenderValue"],
        message: "Surrender value cannot be negative.",
      });
    }
  });

export const multiGoalAssignSchema = z.object({
  ...clientFields,
  shortTermYears: z.number().positive().max(20).default(5),
  shortTermReturnPct: pct,
  longTermReturnPct: pct,
  inflationPct: pct,
  taxPct: pct,
  delayMonths: months.optional().default(0),
  currentCorpus: money.optional().default(0),
  corpusReturnPct: pct.optional(),
  goals: z
    .array(
      z.object({
        name: z.string().min(1),
        amount: money,
        years: z.number().min(0).max(75),
      }),
    )
    .min(1)
    .max(10),
});

export const multiWithdrawalsSchema = z.object({
  ...clientFields,
  returnPct: pct,
  taxPct: pct,
  withdrawals: z
    .array(
      z.object({
        name: z.string().min(1),
        amount: money,
        atAge: age,
      }),
    )
    .min(1)
    .max(20),
}).refine((d) => d.age != null, { message: "age is required", path: ["age"] });

export const educationSchema = z.object({
  ...clientFields,
  childName: z.string().optional(),
  childAge: age,
  returnPct: pct,
  taxPct: pct,
  costs: z
    .array(
      z.object({
        age: age,
        classLabel: z.string().min(1),
        cost: money,
      }),
    )
    .min(1)
    .max(80),
});

export const firePlannerSchema = z
  .object({
    ...clientFields,
    age,
    retirementAge: age,
    survivingAge: age,
    monthlyExpenses: money,
    lifestyleYearly: money,
    monthlyExpenseFactorPct: factorPct.optional().default(100),
    lifestyleFactorPct: factorPct.optional().default(100),
    inflationPct: pct,
    returnPct: pct,
    returnAfterPct: pct,
    taxPct: pct,
    corpusSlices: z
      .array(
        z.object({
          returnPct: pct,
          amount: money,
        }),
      )
      .max(3)
      .optional()
      .default([]),
    currentSipMonthly: money.optional().default(0),
    currentSipReturnPct: pct.optional().default(0),
    limitSipYears: z.number().min(0).max(50).optional().default(0),
    stepUpPct: pct.optional().default(10),
    delayMonths: months.optional().default(0),
  })
  .refine((d) => d.retirementAge >= d.age, {
    message: "retirementAge must be >= age",
    path: ["retirementAge"],
  })
  .refine((d) => d.survivingAge >= d.retirementAge, {
    message: "survivingAge must be >= retirementAge",
    path: ["survivingAge"],
  });

export const financialHealthSchema = z
  .object({
    ...clientFields,
    currentCorpus: money,
    monthlyExpenses: money,
    monthlyInvestment: money,
    lifestyleYearly: money,
    age,
    retirementAge: age,
    survivingAge: age,
    inflationPct: pct,
    returnPct: pct,
    returnAfterPct: pct,
    taxPct: pct,
    monthlyExpenseFactorPct: factorPct.optional().default(100),
    lifestyleFactorPct: factorPct.optional().default(100),
    retirementBenefit: money.optional().default(0),
    savingsGrowthPct: pct.optional().default(0),
    events: z
      .array(
        z.object({
          age,
          amount: money,
          type: z.enum(["Expense", "Income"]),
        }),
      )
      .max(5)
      .optional()
      .default([]),
  })
  .refine((d) => d.retirementAge >= d.age, {
    message: "Retirement age must be on or after current age",
    path: ["retirementAge"],
  })
  .refine((d) => d.survivingAge >= d.retirementAge, {
    message: "Survival age must be on or after retirement age",
    path: ["survivingAge"],
  })
  .refine((d) => d.returnPct > 0, {
    message: "Pre-retirement return must be greater than 0%",
    path: ["returnPct"],
  })
  .refine((d) => d.returnAfterPct > 0, {
    message: "Post-retirement return must be greater than 0%",
    path: ["returnAfterPct"],
  })
  .superRefine((d, ctx) => {
    for (let i = 0; i < (d.events?.length ?? 0); i += 1) {
      const ev = d.events![i]!;
      if (ev.age <= d.retirementAge) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Event age must be after retirement age",
          path: ["events", i, "age"],
        });
      }
      if (ev.age > d.survivingAge) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Event age must be on or before survival age",
          path: ["events", i, "age"],
        });
      }
    }
  });

export const CALCULATOR_IDS = [
  "growth-sip",
  "growth-lumpsum",
  "growth-stepup",
  "growth-periodic",
  "goal-sip",
  "goal-current",
  "goal-ls-sip",
  "goal-existing-sip",
  "goal-periodic",
  "goal-compounding",
  "loan-emi",
  "loan-prepay",
  "loan-extra-vs-invest",
  "loan-interest-recovery",
  "vehicle-loan",
  "education",
  "mf-fd",
  "insurance-irr",
  "insurance-tp",
  "multi-goal-assign",
  "multi-withdrawals",
  "fire-planner",
  "financial-health",
] as const;

export type CalculatorId = (typeof CALCULATOR_IDS)[number];
