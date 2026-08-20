import {
  calculateAmort,
  calculateAmortWithYearlyExtra,
  calculateEducation,
  calculateExtraVsInvest,
  calculateGoalCompounding,
  calculateGoalExistingSip,
  calculateGoalLsSipOptions,
  calculateGoalPeriodicLumpsum,
  calculateGoalSipVsStepUp,
  calculateGoalWithCurrent,
  calculateInsuranceIrr,
  calculateInsuranceTp,
  calculateInterestRecovery,
  calculateLumpsum,
  calculateMfVsFd,
  calculateMultiGoalAssign,
  calculateMultiWithdrawals,
  calculatePeriodic,
  calculateSip,
  calculateStepUpSip,
  calculateVehicleLoan,
} from "@nivra/finance";
import type { CalculatorId } from "./calculate-schemas";
import {
  educationSchema,
  goalCompoundingSchema,
  goalCurrentSchema,
  goalExistingSipSchema,
  goalLsSipSchema,
  goalPeriodicSchema,
  goalSipSchema,
  growthLumpsumSchema,
  growthPeriodicSchema,
  growthSipSchema,
  growthStepUpSchema,
  insuranceIrrSchema,
  insuranceTpSchema,
  loanEmiSchema,
  loanExtraVsInvestSchema,
  loanInterestRecoverySchema,
  loanPrepaySchema,
  mfFdSchema,
  multiGoalAssignSchema,
  multiWithdrawalsSchema,
  vehicleLoanSchema,
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
    case "goal-current": {
      const input = goalCurrentSchema.parse(body);
      return calculateGoalWithCurrent({
        goalAmount: input.goalAmount,
        tenureYears: input.tenureYears,
        annualReturn: pct(input.returnPct),
        inflationRate: pct(input.inflationPct),
        taxRate: pct(input.taxPct),
        stepUpRate: pct(input.stepUpPct),
        useInflationAdjustedGoal: input.useInflationAdjustedGoal,
        currentCorpus: input.currentCorpus,
        currentMonthlySip: input.currentMonthlySip,
      });
    }
    case "goal-ls-sip": {
      const input = goalLsSipSchema.parse(body);
      return calculateGoalLsSipOptions({
        goalAmount: input.goalAmount,
        tenureYears: input.tenureYears,
        annualReturn: pct(input.returnPct),
        inflationRate: pct(input.inflationPct),
        taxRate: pct(input.taxPct),
        stepUpRate: pct(input.stepUpPct),
        useInflationAdjustedGoal: input.useInflationAdjustedGoal,
        currentCorpus: input.currentCorpus,
        extraLumpsum: input.extraLumpsum,
      });
    }
    case "goal-existing-sip": {
      const input = goalExistingSipSchema.parse(body);
      return calculateGoalExistingSip({
        goalAmount: input.goalAmount,
        tenureYears: input.tenureYears,
        annualReturn: pct(input.returnPct),
        inflationRate: pct(input.inflationPct),
        taxRate: pct(input.taxPct),
        stepUpRate: pct(input.stepUpPct),
        useInflationAdjustedGoal: input.useInflationAdjustedGoal,
        currentMonthlySip: input.currentMonthlySip,
      });
    }
    case "goal-periodic": {
      const input = goalPeriodicSchema.parse(body);
      return calculateGoalPeriodicLumpsum({
        goalAmount: input.goalAmount,
        tenureYears: input.tenureYears,
        annualReturn: pct(input.returnPct),
        inflationRate: pct(input.inflationPct),
        taxRate: pct(input.taxPct),
        stepUpRate: pct(input.stepUpPct),
        useInflationAdjustedGoal: input.useInflationAdjustedGoal,
        amount: input.amount,
        timesPerYear: input.timesPerYear,
      });
    }
    case "goal-compounding": {
      const input = goalCompoundingSchema.parse(body);
      return calculateGoalCompounding({
        goalAmount: input.goalAmount,
        tenureYears: input.tenureYears,
        annualReturn: pct(input.returnPct),
        inflationRate: pct(input.inflationPct),
        taxRate: pct(input.taxPct),
        useInflationAdjustedGoal: input.useInflationAdjustedGoal,
        extraYears: input.extraYears,
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
    case "loan-prepay": {
      const input = loanPrepaySchema.parse(body);
      return calculateAmortWithYearlyExtra({
        principal: input.principal,
        years: input.years,
        annualRate: pct(input.interestPct),
        yearlyExtra: input.yearlyExtra,
        recoverReturn: pct(input.recoverReturnPct),
      });
    }
    case "loan-extra-vs-invest": {
      const input = loanExtraVsInvestSchema.parse(body);
      return calculateExtraVsInvest({
        principal: input.principal,
        years: input.years,
        annualRate: pct(input.interestPct),
        extraAmount: input.extraAmount,
        extraMonth: input.extraMonth,
        investReturn: pct(input.investReturnPct),
        taxRate: pct(input.taxPct),
        incomeTaxRate: pct(input.incomeTaxPct),
      });
    }
    case "loan-interest-recovery": {
      const input = loanInterestRecoverySchema.parse(body);
      return calculateInterestRecovery({
        principal: input.principal,
        years: input.years,
        annualRate: pct(input.interestPct),
        proposedYears: input.proposedYears,
        sipReturn: pct(input.sipReturnPct),
      });
    }
    case "vehicle-loan": {
      const input = vehicleLoanSchema.parse(body);
      return calculateVehicleLoan({
        onRoadCost: input.onRoadCost,
        loanAmount: input.loanAmount,
        annualRate: pct(input.interestPct),
        years: input.years,
        incomeTaxRate: pct(input.incomeTaxPct),
        depreciationRate: pct(input.depreciationPct),
        fdRate: pct(input.fdReturnPct),
        debtRate: pct(input.debtReturnPct),
        conservativeRate: pct(input.conservativeReturnPct),
        equityRate: pct(input.equityReturnPct),
        fdTaxRate: pct(input.fdTaxPct),
        debtTaxRate: pct(input.debtTaxPct),
        conservativeTaxRate: pct(input.conservativeTaxPct),
        equityTaxRate: pct(input.equityTaxPct),
      });
    }
    case "mf-fd": {
      const input = mfFdSchema.parse(body);
      return calculateMfVsFd({
        amount: input.amount,
        days: input.days,
        mfRate: pct(input.mfReturnPct),
        fdRate: pct(input.fdReturnPct),
        mfTaxRate: pct(input.mfTaxPct),
        fdTaxRate: pct(input.fdTaxPct),
      });
    }
    case "insurance-irr": {
      const input = insuranceIrrSchema.parse(body);
      return calculateInsuranceIrr({
        premium: input.premium,
        payTerm: input.payTerm,
        corpusAtPayEnd: input.corpusAtPayEnd,
        policyTerm: input.policyTerm,
        expectedReturn: pct(input.returnPct),
        taxRate: pct(input.taxPct),
      });
    }
    case "insurance-tp": {
      const input = insuranceTpSchema.parse(body);
      return calculateInsuranceTp({
        premium: input.premium,
        payTerm: input.payTerm,
        yearsPaid: input.yearsPaid,
        policyTerm: input.policyTerm,
        yearsToMaturity: input.yearsToMaturity,
        maturityValue: input.maturityValue,
        taxRate: pct(input.taxPct),
        surrenderValue: input.surrenderValue,
        termPremium: input.termPremium,
        termYears: input.termYears,
        expectedReturn: pct(input.returnPct),
      });
    }
    case "multi-goal-assign": {
      const input = multiGoalAssignSchema.parse(body);
      return calculateMultiGoalAssign({
        shortTermYears: input.shortTermYears,
        shortTermReturn: pct(input.shortTermReturnPct),
        longTermReturn: pct(input.longTermReturnPct),
        inflationRate: pct(input.inflationPct),
        taxRate: pct(input.taxPct),
        delayMonths: input.delayMonths,
        currentCorpus: input.currentCorpus,
        corpusReturn: pct(input.corpusReturnPct ?? input.shortTermReturnPct),
        goals: input.goals,
      });
    }
    case "multi-withdrawals": {
      const input = multiWithdrawalsSchema.parse(body);
      return calculateMultiWithdrawals({
        age: input.age ?? 0,
        annualReturn: pct(input.returnPct),
        taxRate: pct(input.taxPct),
        withdrawals: input.withdrawals,
      });
    }
    case "education": {
      const input = educationSchema.parse(body);
      return calculateEducation({
        childAge: input.childAge,
        annualReturn: pct(input.returnPct),
        taxRate: pct(input.taxPct),
        costs: input.costs,
      });
    }
    default:
      throw Object.assign(new Error(`Unknown calculator id: ${id}`), {
        status: 404,
      });
  }
}
