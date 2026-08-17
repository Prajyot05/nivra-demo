import {
  calculateAmort,
  calculateGoalSipVsStepUp,
  calculateLumpsum,
  calculatePeriodic,
  calculateSip,
  calculateStepUpSip,
} from "@nivra/finance";
import type { CalculatorId } from "./calculate-schemas";
import {
  goalSipSchema,
  growthLumpsumSchema,
  growthPeriodicSchema,
  growthSipSchema,
  growthStepUpSchema,
  loanEmiSchema,
} from "./calculate-schemas";

const pct = (n: number) => n / 100;

export function dispatch(id: string, body: unknown) {
  switch (id as CalculatorId) {
    case "growth-sip": {
      const input = growthSipSchema.parse(body);
      return calculateSip(
        {
          monthlyInvestment: input.monthlyInvestment,
          sipYears: input.sipYears,
          investYears: input.investYears,
          annualReturn: pct(input.returnPct),
          inflationRate: pct(input.inflationPct),
          delayMonths: input.delayMonths,
        },
        pct(input.taxPct),
      );
    }
    case "growth-lumpsum": {
      const input = growthLumpsumSchema.parse(body);
      return calculateLumpsum({
        amount: input.amount,
        years: input.years,
        annualReturn: pct(input.returnPct),
        inflationRate: pct(input.inflationPct),
        delayMonths: input.delayMonths,
        taxRate: pct(input.taxPct),
      });
    }
    case "growth-stepup": {
      const input = growthStepUpSchema.parse(body);
      return calculateStepUpSip({
        startMonthly: input.startMonthly,
        sipYears: input.sipYears,
        annualReturn: pct(input.returnPct),
        stepUpRate: pct(input.stepUpPct),
        inflationRate: pct(input.inflationPct),
        taxRate: pct(input.taxPct),
      });
    }
    case "growth-periodic": {
      const input = growthPeriodicSchema.parse(body);
      return calculatePeriodic({
        amount: input.amount,
        timesPerYear: input.timesPerYear,
        years: input.years,
        annualReturn: pct(input.returnPct),
        taxRate: pct(input.taxPct),
      });
    }
    case "goal-sip": {
      const input = goalSipSchema.parse(body);
      return calculateGoalSipVsStepUp({
        goalAmount: input.goalAmount,
        tenureYears: input.tenureYears,
        annualReturn: pct(input.returnPct),
        inflationRate: pct(input.inflationPct),
        taxRate: pct(input.taxPct),
        stepUpRate: pct(input.stepUpPct),
        useInflationAdjustedGoal: input.useInflationAdjustedGoal,
        delayMonths: input.delayMonths,
      });
    }
    case "loan-emi": {
      const input = loanEmiSchema.parse(body);
      const result = calculateAmort({
        principal: input.principal,
        years: input.years,
        annualRate: pct(input.interestPct),
      });
      return {
        emi: result.emi,
        totalPrincipal: result.totalPrincipal,
        totalInterest: result.totalInterest,
        totalPaid: result.totalPaid,
        schedule: result.schedule,
      };
    }
    default:
      throw Object.assign(new Error(`Unknown calculator id: ${id}`), {
        status: 404,
      });
  }
}
