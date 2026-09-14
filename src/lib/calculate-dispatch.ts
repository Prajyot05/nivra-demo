import {
  calculateAmort,
  calculateAmortWithYearlyExtra,
  calculateEducation,
  calculateExtraVsInvest,
  calculateFinancialHealth,
  calculateFirePlanner,
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
  financialHealthSchema,
  firePlannerSchema,
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
        investmentType: input.investmentType,
        stepSize: input.stepSize,
      });
    }
    case "loan-emi": {
      const input = loanEmiSchema.parse(body);
      const result = calculateAmort({
        principal: input.principal,
        years: input.years,
        annualRate: pct(input.interestPct),
        recoverReturn: pct(input.recoverReturnPct),
        delayMonths: input.delayMonths,
      });
      return {
        emi: result.emi,
        totalPrincipal: result.totalPrincipal,
        totalInterest: result.totalInterest,
        totalPaid: result.totalPaid,
        schedule: result.schedule,
        recoverReturnPct: input.recoverReturnPct,
        delayMonths: result.delayMonths,
        recoverMonths: result.recoverMonths,
        delayedRecoverMonths: result.delayedRecoverMonths,
        recoverMonthlySip: result.recoverMonthlySip,
        recoverInvested: result.recoverInvested,
        delayedRecoverMonthlySip: result.delayedRecoverMonthlySip,
        delayedRecoverInvested: result.delayedRecoverInvested,
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
        termCover: input.termCover,
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
    case "fire-planner": {
      const input = firePlannerSchema.parse(body);
      return calculateFirePlanner({
        age: input.age,
        retirementAge: input.retirementAge,
        survivingAge: input.survivingAge,
        monthlyExpenses: input.monthlyExpenses,
        lifestyleYearly: input.lifestyleYearly,
        monthlyExpenseFactor: pct(input.monthlyExpenseFactorPct),
        lifestyleFactor: pct(input.lifestyleFactorPct),
        inflationRate: pct(input.inflationPct),
        annualReturn: pct(input.returnPct),
        returnAfterRetirement: pct(input.returnAfterPct),
        taxRate: pct(input.taxPct),
        corpusSlices: input.corpusSlices.map((s) => ({
          rate: pct(s.returnPct),
          amount: s.amount,
        })),
        currentSipMonthly: input.currentSipMonthly,
        currentSipReturn: pct(input.currentSipReturnPct),
        limitSipYears: input.limitSipYears,
        stepUpRate: pct(input.stepUpPct),
        delayMonths: input.delayMonths,
      });
    }
    case "financial-health": {
      const input = financialHealthSchema.parse(body);
      return calculateFinancialHealth({
        currentCorpus: input.currentCorpus,
        monthlyExpenses: input.monthlyExpenses,
        monthlyInvestment: input.monthlyInvestment,
        lifestyleYearly: input.lifestyleYearly,
        age: input.age,
        retirementAge: input.retirementAge,
        survivingAge: input.survivingAge,
        inflationRate: pct(input.inflationPct),
        annualReturn: pct(input.returnPct),
        returnAfterRetirement: pct(input.returnAfterPct),
        taxRate: pct(input.taxPct),
        monthlyExpenseFactor: pct(input.monthlyExpenseFactorPct),
        lifestyleFactor: pct(input.lifestyleFactorPct),
        retirementBenefit: input.retirementBenefit,
        savingsGrowthRate: pct(input.savingsGrowthPct),
        events: input.events,
      });
    }
    default:
      throw Object.assign(new Error(`Unknown calculator id: ${id}`), {
        status: 404,
      });
  }
}
