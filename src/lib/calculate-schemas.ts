import { z } from "zod";

const pct = z.number().min(0).max(100);
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

export const goalCompoundingSchema = z.object({
  ...goalPlannerBase,
  extraYears: z.number().min(0).max(50).optional().default(5),
});

export const loanEmiSchema = z.object({
  ...clientFields,
  principal: money,
  years,
  interestPct: pct,
});

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
  "education",
] as const;

export type CalculatorId = (typeof CALCULATOR_IDS)[number];
