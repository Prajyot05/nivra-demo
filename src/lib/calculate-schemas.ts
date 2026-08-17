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

export const growthSipSchema = z.object({
  ...clientFields,
  monthlyInvestment: money,
  sipYears: years,
  investYears: years.optional(),
  returnPct: pct,
  inflationPct: pct.optional().default(0),
  delayMonths: months.optional().default(0),
  taxPct: pct.optional().default(0),
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
  timesPerYear: z.number().int().min(1).max(12),
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

export const loanEmiSchema = z.object({
  ...clientFields,
  principal: money,
  years,
  interestPct: pct,
});

export const CALCULATOR_IDS = [
  "growth-sip",
  "growth-lumpsum",
  "growth-stepup",
  "growth-periodic",
  "goal-sip",
  "loan-emi",
] as const;

export type CalculatorId = (typeof CALCULATOR_IDS)[number];
