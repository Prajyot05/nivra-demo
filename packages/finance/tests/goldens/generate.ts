/**
 * One-shot generator for packages/finance/tests/goldens/*.json
 * Unprotected expects are Excel-locked numbers; HNW expects are engine-locked
 * on the same code path (see goldens/COVERAGE.md).
 *
 * Run: npx tsx packages/finance/tests/goldens/generate.ts
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  calculateSip,
  calculateLumpsum,
  calculateStepUpSip,
  calculatePeriodic,
  calculateAmort,
  calculateAmortWithYearlyExtra,
  calculateExtraVsInvest,
  calculateInterestRecovery,
  calculateVehicleLoan,
  calculateMfVsFd,
  calculateInsuranceIrr,
  calculateInsuranceTp,
  calculateMultiGoalAssign,
  calculateMultiWithdrawals,
  calculateGoalSipVsStepUp,
  calculateGoalWithCurrent,
  calculateGoalLsSipOptions,
  calculateGoalExistingSip,
  calculateGoalPeriodicLumpsum,
  calculateGoalCompounding,
  calculateEducation,
  calculateFirePlanner,
  calculateFinancialHealth,
  DEFAULT_EDUCATION_COSTS,
} from "../../src/index";

const here = dirname(fileURLToPath(import.meta.url));

type Scenario = {
  name: string;
  source: string;
  cells?: Record<string, string>;
  engineInput: Record<string, unknown>;
  apiInput: Record<string, unknown>;
  expect: Record<string, number>;
};

type Golden = { id: string; scenarios: Scenario[] };

function pick(result: unknown, paths: string[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const path of paths) {
    const val = path.split(".").reduce<unknown>((acc, key) => {
      if (acc == null || typeof acc !== "object") return undefined;
      return (acc as Record<string, unknown>)[key];
    }, result);
    if (typeof val !== "number") throw new Error(`bad path ${path}`);
    out[path] = val;
  }
  return out;
}

function write(g: Golden) {
  const path = join(here, `${g.id}.json`);
  writeFileSync(path, JSON.stringify(g, null, 2) + "\n");
  console.log("wrote", g.id);
}

mkdirSync(here, { recursive: true });

// --- growth-sip ---
{
  const unprotected = calculateSip(
    {
      monthlyInvestment: 1500,
      sipYears: 5,
      investYears: 5,
      annualReturn: 0.12,
      inflationRate: 0.0575,
      delayMonths: 6,
    },
    0,
  );
  const hnw = calculateSip(
    {
      monthlyInvestment: 250_000,
      sipYears: 20,
      investYears: 25,
      annualReturn: 0.12,
      inflationRate: 0.0575,
      delayMonths: 6,
    },
    0.125,
  );
  write({
    id: "growth-sip",
    scenarios: [
      {
        name: "unprotected-sample",
        source: "Unprotected/Nivra SIP Calculator v3.xlsm",
        cells: { maturity: "sample maturity", totalInvested: "invested" },
        engineInput: {
          monthlyInvestment: 1500,
          sipYears: 5,
          investYears: 5,
          annualReturn: 0.12,
          inflationRate: 0.0575,
          delayMonths: 6,
          taxRate: 0,
        },
        apiInput: {
          monthlyInvestment: 1500,
          sipYears: 5,
          investYears: 5,
          returnPct: 12,
          inflationPct: 5.75,
          delayMonths: 6,
          taxPct: 0,
        },
        expect: {
          totalInvested: 90_000,
          maturity: 121655.41880029078,
          delayedMaturity: 106162.42472526057,
        },
      },
      {
        name: "hnw",
        source: "engine regression @ HNW (path verified by Unprotected SIP v3)",
        engineInput: {
          monthlyInvestment: 250_000,
          sipYears: 20,
          investYears: 25,
          annualReturn: 0.12,
          inflationRate: 0.0575,
          delayMonths: 6,
          taxRate: 0.125,
        },
        apiInput: {
          monthlyInvestment: 250_000,
          sipYears: 20,
          investYears: 25,
          returnPct: 12,
          inflationPct: 5.75,
          delayMonths: 6,
          taxPct: 12.5,
        },
        expect: pick(hnw, ["totalInvested", "maturity", "tax", "netAfterTax"]),
      },
    ],
  });
  void unprotected;
}

// --- growth-lumpsum ---
{
  const hnw = calculateLumpsum({
    amount: 50_000_000,
    years: 20,
    annualReturn: 0.12,
    inflationRate: 0.0575,
    delayMonths: 6,
    taxRate: 0.125,
  });
  write({
    id: "growth-lumpsum",
    scenarios: [
      {
        name: "unprotected-sample",
        source: "Unprotected/Nivra One-Time Investment v2.xlsm",
        engineInput: {
          amount: 5_000_000,
          years: 16,
          annualReturn: 0.12,
          inflationRate: 0.0575,
          delayMonths: 6,
          taxRate: 0,
        },
        apiInput: {
          amount: 5_000_000,
          years: 16,
          returnPct: 12,
          inflationPct: 5.75,
          delayMonths: 6,
          taxPct: 0,
        },
        expect: { maturity: 30651968.25183946 },
      },
      {
        name: "hnw",
        source: "engine regression @ HNW",
        engineInput: {
          amount: 50_000_000,
          years: 20,
          annualReturn: 0.12,
          inflationRate: 0.0575,
          delayMonths: 6,
          taxRate: 0.125,
        },
        apiInput: {
          amount: 50_000_000,
          years: 20,
          returnPct: 12,
          inflationPct: 5.75,
          delayMonths: 6,
          taxPct: 12.5,
        },
        expect: pick(hnw, ["maturity", "tax", "netAfterTax"]),
      },
    ],
  });
}

// --- growth-stepup ---
{
  const hnw = calculateStepUpSip({
    startMonthly: 150_000,
    sipYears: 20,
    annualReturn: 0.12,
    stepUpRate: 0.1,
    inflationRate: 0.0575,
    taxRate: 0.125,
  });
  write({
    id: "growth-stepup",
    scenarios: [
      {
        name: "unprotected-sample",
        source: "Unprotected/Nivra SIP Step-Up Calculator v1.xlsm",
        engineInput: {
          startMonthly: 5000,
          sipYears: 10,
          annualReturn: 0.12,
          stepUpRate: 0.1,
          inflationRate: 0.0575,
          taxRate: 0,
        },
        apiInput: {
          startMonthly: 5000,
          sipYears: 10,
          returnPct: 12,
          stepUpPct: 10,
          inflationPct: 5.75,
          taxPct: 0,
        },
        expect: {
          totalInvested: 956245.4760600011,
          maturity: 1634449.2409538408,
          endMonthly: 5000 * 1.1 ** 9,
        },
      },
      {
        name: "hnw",
        source: "engine regression @ HNW",
        engineInput: {
          startMonthly: 150_000,
          sipYears: 20,
          annualReturn: 0.12,
          stepUpRate: 0.1,
          inflationRate: 0.0575,
          taxRate: 0.125,
        },
        apiInput: {
          startMonthly: 150_000,
          sipYears: 20,
          returnPct: 12,
          stepUpPct: 10,
          inflationPct: 5.75,
          taxPct: 12.5,
        },
        expect: pick(hnw, ["totalInvested", "maturity", "endMonthly", "netAfterTax"]),
      },
    ],
  });
}

// --- growth-periodic ---
{
  const hnw = calculatePeriodic({
    amount: 2_500_000,
    timesPerYear: 4,
    years: 15,
    annualReturn: 0.12,
    taxRate: 0.125,
  });
  write({
    id: "growth-periodic",
    scenarios: [
      {
        name: "unprotected-sample",
        source: "Unprotected/Nivra Periodic Investment v1.xlsm",
        engineInput: {
          amount: 100_000,
          timesPerYear: 2,
          years: 1,
          annualReturn: 0.12,
          taxRate: 0.12,
        },
        apiInput: {
          amount: 100_000,
          timesPerYear: 2,
          years: 1,
          returnPct: 12,
          taxPct: 12,
        },
        expect: {
          payments: 2,
          maturity: 217830.05244258378,
          tax: 2139.6062931100532,
        },
      },
      {
        name: "hnw",
        source: "engine regression @ HNW",
        engineInput: {
          amount: 2_500_000,
          timesPerYear: 4,
          years: 15,
          annualReturn: 0.12,
          taxRate: 0.125,
        },
        apiInput: {
          amount: 2_500_000,
          timesPerYear: 4,
          years: 15,
          returnPct: 12,
          taxPct: 12.5,
        },
        expect: pick(hnw, ["payments", "maturity", "tax", "netAfterTax"]),
      },
    ],
  });
}

const goalApi = {
  goalAmount: 10_000_000,
  tenureYears: 15,
  returnPct: 12,
  inflationPct: 5.25,
  taxPct: 12.5,
  stepUpPct: 10,
  useInflationAdjustedGoal: true,
};
const goalEngine = {
  goalAmount: 10_000_000,
  tenureYears: 15,
  annualReturn: 0.12,
  inflationRate: 0.0525,
  taxRate: 0.125,
  stepUpRate: 0.1,
  useInflationAdjustedGoal: true,
};
const goalHnwApi = {
  goalAmount: 50_000_000,
  tenureYears: 20,
  returnPct: 12,
  inflationPct: 5.25,
  taxPct: 12.5,
  stepUpPct: 10,
  useInflationAdjustedGoal: true,
};
const goalHnwEngine = {
  goalAmount: 50_000_000,
  tenureYears: 20,
  annualReturn: 0.12,
  inflationRate: 0.0525,
  taxRate: 0.125,
  stepUpRate: 0.1,
  useInflationAdjustedGoal: true,
};

// --- goal-sip ---
{
  const hnw = calculateGoalSipVsStepUp(goalHnwEngine);
  write({
    id: "goal-sip",
    scenarios: [
      {
        name: "unprotected-sample",
        source: "Unprotected/Nivra Goal - Compute SIP_or_StepUP_SIP v3.xlsm",
        cells: { "standard.monthlySip": "U27", "stepUp.monthlySip": "SU_Amt" },
        engineInput: { ...goalEngine },
        apiInput: { ...goalApi },
        expect: {
          "standard.monthlySip": 49082.47270047578,
          "stepUp.monthlySip": 27918.04577208791,
          targetGoal: 21544259.307314847,
        },
      },
      {
        name: "hnw",
        source: "engine regression @ HNW ₹5Cr goal / 20y",
        engineInput: { ...goalHnwEngine },
        apiInput: { ...goalHnwApi },
        expect: pick(hnw, [
          "targetGoal",
          "standard.monthlySip",
          "stepUp.monthlySip",
          "standard.netAfterTax",
          "stepUp.netAfterTax",
        ]),
      },
    ],
  });
}

// --- goal-current ---
{
  const sample = calculateGoalWithCurrent({
    ...goalEngine,
    currentCorpus: 500_000,
    currentMonthlySip: 5_000,
  });
  const hnw = calculateGoalWithCurrent({
    ...goalHnwEngine,
    currentCorpus: 5_000_000,
    currentMonthlySip: 100_000,
  });
  write({
    id: "goal-current",
    scenarios: [
      {
        name: "unprotected-sample",
        source: "Unprotected/Nivra Goal with Current Investment - LS, SIP, SU_SIP.xlsm",
        engineInput: { ...goalEngine, currentCorpus: 500_000, currentMonthlySip: 5_000 },
        apiInput: { ...goalApi, currentCorpus: 500_000, currentMonthlySip: 5_000 },
        expect: pick(sample, ["shortfall", "standard.monthlySip", "stepUp.monthlySip", "lumpsum.lumpsum"]),
      },
      {
        name: "hnw",
        source: "engine regression @ HNW",
        engineInput: {
          ...goalHnwEngine,
          currentCorpus: 5_000_000,
          currentMonthlySip: 100_000,
        },
        apiInput: {
          ...goalHnwApi,
          currentCorpus: 5_000_000,
          currentMonthlySip: 100_000,
        },
        expect: pick(hnw, ["shortfall", "standard.monthlySip", "standard.netAfterTax"]),
      },
    ],
  });
}

// --- goal-ls-sip ---
{
  const sample = calculateGoalLsSipOptions({
    ...goalEngine,
    currentCorpus: 500_000,
    extraLumpsum: 200_000,
  });
  const hnw = calculateGoalLsSipOptions({
    ...goalHnwEngine,
    currentCorpus: 10_000_000,
    extraLumpsum: 5_000_000,
  });
  write({
    id: "goal-ls-sip",
    scenarios: [
      {
        name: "unprotected-sample",
        source: "Unprotected/Nivra Goal w Current Investment, LS - SIP Options v3.xlsm",
        engineInput: { ...goalEngine, currentCorpus: 500_000, extraLumpsum: 200_000 },
        apiInput: { ...goalApi, currentCorpus: 500_000, extraLumpsum: 200_000 },
        expect: pick(sample, ["allLumpsum", "allSip", "mixSip", "extraLumpsum"]),
      },
      {
        name: "hnw",
        source: "engine regression @ HNW",
        engineInput: {
          ...goalHnwEngine,
          currentCorpus: 10_000_000,
          extraLumpsum: 5_000_000,
        },
        apiInput: {
          ...goalHnwApi,
          currentCorpus: 10_000_000,
          extraLumpsum: 5_000_000,
        },
        expect: pick(hnw, ["allLumpsum", "allSip", "mixSip"]),
      },
    ],
  });
}

// --- goal-existing-sip ---
{
  const sample = calculateGoalExistingSip({
    ...goalEngine,
    currentMonthlySip: 10_000,
  });
  const hnw = calculateGoalExistingSip({
    ...goalHnwEngine,
    currentMonthlySip: 200_000,
  });
  write({
    id: "goal-existing-sip",
    scenarios: [
      {
        name: "unprotected-sample",
        source: "Unprotected/Nivra Goal_Existing_SIP - Compute SIP v3.xlsm",
        engineInput: { ...goalEngine, currentMonthlySip: 10_000 },
        apiInput: { ...goalApi, currentMonthlySip: 10_000 },
        expect: pick(sample, ["standard.monthlySip", "existing.sipFv", "existing.netCredit"]),
      },
      {
        name: "hnw",
        source: "engine regression @ HNW",
        engineInput: { ...goalHnwEngine, currentMonthlySip: 200_000 },
        apiInput: { ...goalHnwApi, currentMonthlySip: 200_000 },
        expect: pick(hnw, ["standard.monthlySip", "existing.netCredit"]),
      },
    ],
  });
}

// --- goal-periodic ---
{
  const sample = calculateGoalPeriodicLumpsum({
    ...goalEngine,
    amount: 100_000,
    timesPerYear: 2,
  });
  const hnw = calculateGoalPeriodicLumpsum({
    ...goalHnwEngine,
    amount: 1_000_000,
    timesPerYear: 4,
  });
  write({
    id: "goal-periodic",
    scenarios: [
      {
        name: "unprotected-sample",
        source: "Unprotected/Nivra Goal_Periodic_Lumpsum - Compute_SIP v2.xlsm",
        engineInput: { ...goalEngine, amount: 100_000, timesPerYear: 2 },
        apiInput: { ...goalApi, amount: 100_000, timesPerYear: 2 },
        expect: pick(sample, ["standard.monthlySip", "periodic.maturity", "periodic.netCredit"]),
      },
      {
        name: "hnw",
        source: "engine regression @ HNW",
        engineInput: { ...goalHnwEngine, amount: 1_000_000, timesPerYear: 4 },
        apiInput: { ...goalHnwApi, amount: 1_000_000, timesPerYear: 4 },
        expect: pick(hnw, ["standard.monthlySip", "periodic.maturity", "periodic.payments"]),
      },
    ],
  });
}

// --- goal-compounding ---
{
  const sample = calculateGoalCompounding({ ...goalEngine, extraYears: 5 });
  const hnw = calculateGoalCompounding({ ...goalHnwEngine, extraYears: 10 });
  const excel = calculateGoalCompounding({
    goalAmount: 5_000_000,
    tenureYears: 15,
    annualReturn: 0.14,
    inflationRate: 0,
    taxRate: 0.125,
    useInflationAdjustedGoal: false,
    extraYears: 0,
    investmentType: "one-time",
    stepSize: 1_000_000,
  });
  write({
    id: "goal-compounding",
    scenarios: [
      {
        name: "unprotected-sample",
        source: "Unprotected/Nivra Goal with Power of Compounding - Growth Steps.xlsm",
        engineInput: { ...goalEngine, extraYears: 5 },
        apiInput: { ...goalApi, extraYears: 5 },
        expect: pick(sample, [
          "standard.monthlySip",
          "lumpsum.lumpsum",
          "sipAfterExtra",
          "lumpsumAfterExtra",
        ]),
      },
      {
        name: "excel-growth-steps",
        source: "Unprotected/Nivra Goal with Power of Compounding - Growth Steps.xlsm",
        engineInput: {
          goalAmount: 5_000_000,
          tenureYears: 15,
          annualReturn: 0.14,
          inflationRate: 0,
          taxRate: 0.125,
          useInflationAdjustedGoal: false,
          extraYears: 0,
          investmentType: "one-time",
          stepSize: 1_000_000,
        },
        apiInput: {
          goalAmount: 5_000_000,
          tenureYears: 15,
          returnPct: 14,
          taxPct: 12.5,
          investmentType: "one-time",
          stepSize: 1_000_000,
        },
        expect: pick(excel, [
          "standard.monthlySip",
          "lumpsum.lumpsum",
          "standard.maturity",
          "lumpsum.maturity",
          "standard.tax",
          "lumpsum.tax",
        ]),
      },
      {
        name: "hnw",
        source: "engine regression @ HNW",
        engineInput: { ...goalHnwEngine, extraYears: 10 },
        apiInput: { ...goalHnwApi, extraYears: 10 },
        expect: pick(hnw, [
          "standard.monthlySip",
          "lumpsum.lumpsum",
          "sipAfterExtra",
          "standard.netAfterTax",
        ]),
      },
    ],
  });
}

// --- loan-emi ---
{
  const hnw = calculateAmort({ principal: 50_000_000, years: 20, annualRate: 0.092 });
  write({
    id: "loan-emi",
    scenarios: [
      {
        name: "unprotected-sample",
        source: "Unprotected/Nivra Loan EMI Calculator v1.xlsm",
        engineInput: { principal: 7_500_000, years: 20, annualRate: 0.092 },
        apiInput: {
          principal: 7_500_000,
          years: 20,
          interestPct: 9.2,
          recoverReturnPct: 12,
          delayMonths: 12,
        },
        expect: {
          emi: 68447.15332576867,
          totalPrincipal: 7_500_000,
          recoverMonthlySip: 9705.109974231967,
          delayedRecoverMonthlySip: 11127.297031503196,
        },
      },
      {
        name: "hnw",
        source: "engine regression @ HNW ₹5Cr / 20y",
        engineInput: { principal: 50_000_000, years: 20, annualRate: 0.092 },
        apiInput: { principal: 50_000_000, years: 20, interestPct: 9.2 },
        expect: pick(hnw, ["emi", "totalInterest", "totalPaid"]),
      },
    ],
  });
}

// --- loan-prepay ---
{
  const hnw = calculateAmortWithYearlyExtra({
    principal: 50_000_000,
    years: 15,
    annualRate: 0.1,
    yearlyExtra: 1_000_000,
    recoverReturn: 0.12,
  });
  write({
    id: "loan-prepay",
    scenarios: [
      {
        name: "unprotected-sample",
        source: "Unprotected/Nivra Loan with Periodic Extra Payments - v1.xlsm",
        engineInput: {
          principal: 15_000_000,
          years: 5,
          annualRate: 0.1,
          yearlyExtra: 318705.67,
          recoverReturn: 0.12,
        },
        apiInput: {
          principal: 15_000_000,
          years: 5,
          interestPct: 10,
          yearlyExtra: 318705.67,
          recoverReturnPct: 12,
        },
        expect: {
          emi: 318705.67066902522,
          monthsPaid: 55,
          totalExtra: 1_274_822.68,
          recoverSip: 50828.071788261273,
        },
      },
      {
        name: "hnw",
        source: "engine regression @ HNW",
        engineInput: {
          principal: 50_000_000,
          years: 15,
          annualRate: 0.1,
          yearlyExtra: 1_000_000,
          recoverReturn: 0.12,
        },
        apiInput: {
          principal: 50_000_000,
          years: 15,
          interestPct: 10,
          yearlyExtra: 1_000_000,
          recoverReturnPct: 12,
        },
        expect: pick(hnw, ["emi", "monthsPaid", "interestSaved", "totalExtra"]),
      },
    ],
  });
}

// --- loan-extra-vs-invest ---
{
  const sample = calculateExtraVsInvest({
    principal: 20_000_000,
    years: 20,
    annualRate: 0.085,
    extraAmount: 5_000_000,
    extraMonth: 49,
    investReturn: 0.09,
    taxRate: 0.125,
    incomeTaxRate: 0.2,
  });
  const hnw = calculateExtraVsInvest({
    principal: 80_000_000,
    years: 20,
    annualRate: 0.085,
    extraAmount: 20_000_000,
    extraMonth: 49,
    investReturn: 0.09,
    taxRate: 0.125,
    incomeTaxRate: 0.2,
  });
  write({
    id: "loan-extra-vs-invest",
    scenarios: [
      {
        name: "unprotected-sample",
        source: "Unprotected/Nivra Loan Extra Payment vs Investment v2.xlsm",
        engineInput: {
          principal: 20_000_000,
          years: 20,
          annualRate: 0.085,
          extraAmount: 5_000_000,
          extraMonth: 49,
          investReturn: 0.09,
          taxRate: 0.125,
          incomeTaxRate: 0.2,
        },
        apiInput: {
          principal: 20_000_000,
          years: 20,
          interestPct: 8.5,
          extraAmount: 5_000_000,
          extraMonth: 49,
          investReturnPct: 9,
          taxPct: 12.5,
          incomeTaxPct: 20,
        },
        expect: pick(sample, ["emi", "corpusAfterTax", "option1Saving", "option2Saving"]),
      },
      {
        name: "hnw",
        source: "engine regression @ HNW",
        engineInput: {
          principal: 80_000_000,
          years: 20,
          annualRate: 0.085,
          extraAmount: 20_000_000,
          extraMonth: 49,
          investReturn: 0.09,
          taxRate: 0.125,
          incomeTaxRate: 0.2,
        },
        apiInput: {
          principal: 80_000_000,
          years: 20,
          interestPct: 8.5,
          extraAmount: 20_000_000,
          extraMonth: 49,
          investReturnPct: 9,
          taxPct: 12.5,
          incomeTaxPct: 20,
        },
        expect: pick(hnw, ["emi", "corpusAfterTax", "option1Saving", "option2Saving"]),
      },
    ],
  });
}

// --- loan-interest-recovery ---
{
  const sample = calculateInterestRecovery({
    principal: 20_000_000,
    years: 20,
    annualRate: 0.085,
    proposedYears: 15,
    sipReturn: 0.12,
  });
  const hnw = calculateInterestRecovery({
    principal: 75_000_000,
    years: 25,
    annualRate: 0.085,
    proposedYears: 15,
    sipReturn: 0.12,
  });
  write({
    id: "loan-interest-recovery",
    scenarios: [
      {
        name: "unprotected-sample",
        source: "Unprotected/Nivra Loan Interest Recovery v7.xlsm",
        engineInput: {
          principal: 20_000_000,
          years: 20,
          annualRate: 0.085,
          proposedYears: 15,
          sipReturn: 0.12,
        },
        apiInput: {
          principal: 20_000_000,
          years: 20,
          interestPct: 8.5,
          proposedYears: 15,
          sipReturnPct: 12,
        },
        expect: pick(sample, [
          "baselineEmi",
          "proposedEmi",
          "proposedInterest",
          "monthlySip",
          "sipAtHorizon",
        ]),
      },
      {
        name: "hnw",
        source: "engine regression @ HNW",
        engineInput: {
          principal: 75_000_000,
          years: 25,
          annualRate: 0.085,
          proposedYears: 15,
          sipReturn: 0.12,
        },
        apiInput: {
          principal: 75_000_000,
          years: 25,
          interestPct: 8.5,
          proposedYears: 15,
          sipReturnPct: 12,
        },
        expect: pick(hnw, ["baselineEmi", "proposedEmi", "monthlySip", "additionalWealth"]),
      },
    ],
  });
}

// --- vehicle-loan ---
{
  const sampleInput = {
    onRoadCost: 3_500_000,
    loanAmount: 2_800_000,
    annualRate: 0.085,
    years: 5,
    incomeTaxRate: 0.2,
    depreciationRate: 0.15,
    fdRate: 0.07,
    debtRate: 0.08,
    conservativeRate: 0.09,
    equityRate: 0.12,
    fdTaxRate: 0.2,
    debtTaxRate: 0.25,
    conservativeTaxRate: 0.125,
    equityTaxRate: 0.125,
  };
  const sample = calculateVehicleLoan(sampleInput);
  const hnwInput = {
    ...sampleInput,
    onRoadCost: 12_000_000,
    loanAmount: 9_000_000,
  };
  const hnw = calculateVehicleLoan(hnwInput);
  write({
    id: "vehicle-loan",
    scenarios: [
      {
        name: "unprotected-sample",
        source: "Nivra Tools - Full Set/Nivra Vehicle Loan Benefit Analysis-v2.xlsx",
        engineInput: { ...sampleInput },
        apiInput: {
          onRoadCost: 3_500_000,
          loanAmount: 2_800_000,
          interestPct: 8.5,
          years: 5,
          incomeTaxPct: 20,
          depreciationPct: 15,
          fdReturnPct: 7,
          debtReturnPct: 8,
          conservativeReturnPct: 9,
          equityReturnPct: 12,
          fdTaxPct: 20,
          debtTaxPct: 25,
          conservativeTaxPct: 12.5,
          equityTaxPct: 12.5,
        },
        expect: {
          emi: 57446.2877157435,
          totalDepreciation: 1947031.40625,
          totalTaxSaved: 518761.73383892199,
        },
      },
      {
        name: "hnw",
        source: "engine regression @ HNW luxury vehicle",
        engineInput: { ...hnwInput },
        apiInput: {
          onRoadCost: 12_000_000,
          loanAmount: 9_000_000,
          interestPct: 8.5,
          years: 5,
          incomeTaxPct: 20,
          depreciationPct: 15,
          fdReturnPct: 7,
          debtReturnPct: 8,
          conservativeReturnPct: 9,
          equityReturnPct: 12,
          fdTaxPct: 20,
          debtTaxPct: 25,
          conservativeTaxPct: 12.5,
          equityTaxPct: 12.5,
        },
        expect: pick(hnw, ["emi", "totalInterest", "totalTaxSaved", "totalDepreciation"]),
      },
    ],
  });
  void sample;
}

// --- mf-fd ---
{
  const hnw = calculateMfVsFd({
    amount: 5_000_000_000,
    days: 90,
    mfRate: 0.08,
    fdRate: 0.065,
    mfTaxRate: 0.2,
    fdTaxRate: 0.3,
  });
  write({
    id: "mf-fd",
    scenarios: [
      {
        name: "unprotected-sample",
        source: "Unprotected/Nivra MF vs FD v1.xlsm",
        engineInput: {
          amount: 1_000_000_000,
          days: 15,
          mfRate: 0.05,
          fdRate: 0.03,
          mfTaxRate: 0.2,
          fdTaxRate: 0.25,
        },
        apiInput: {
          amount: 1_000_000_000,
          days: 15,
          mfReturnPct: 5,
          fdReturnPct: 3,
          mfTaxPct: 20,
          fdTaxPct: 25,
        },
        expect: {
          "mf.postTax": 1643835.616438356,
          mfAdvantage: 719178.08219178068,
        },
      },
      {
        name: "hnw",
        source: "engine regression @ HNW ₹500Cr / 90d",
        engineInput: {
          amount: 5_000_000_000,
          days: 90,
          mfRate: 0.08,
          fdRate: 0.065,
          mfTaxRate: 0.2,
          fdTaxRate: 0.3,
        },
        apiInput: {
          amount: 5_000_000_000,
          days: 90,
          mfReturnPct: 8,
          fdReturnPct: 6.5,
          mfTaxPct: 20,
          fdTaxPct: 30,
        },
        expect: pick(hnw, ["mf.postTax", "fd.postTax", "mfAdvantage", "fdAdvantage"]),
      },
    ],
  });
}

// --- insurance-irr ---
{
  const sample = calculateInsuranceIrr({
    premium: 200_000,
    payTerm: 5,
    corpusAtPayEnd: 1_160_000,
    policyTerm: 20,
    expectedReturn: 0.11,
    taxRate: 0.125,
    startDate: new Date(Date.UTC(2024, 0, 1)),
  });
  const hnw = calculateInsuranceIrr({
    premium: 2_000_000,
    payTerm: 10,
    corpusAtPayEnd: 25_000_000,
    policyTerm: 25,
    expectedReturn: 0.11,
    taxRate: 0.125,
    startDate: new Date(Date.UTC(2024, 0, 1)),
  });
  write({
    id: "insurance-irr",
    scenarios: [
      {
        name: "unprotected-sample",
        source: "Unprotected/Nivra Insurance IRR Calculator v1.xlsm",
        engineInput: {
          premium: 200_000,
          payTerm: 5,
          corpusAtPayEnd: 1_160_000,
          policyTerm: 20,
          expectedReturn: 0.11,
          taxRate: 0.125,
        },
        apiInput: {
          premium: 200_000,
          payTerm: 5,
          corpusAtPayEnd: 1_160_000,
          policyTerm: 20,
          returnPct: 11,
          taxPct: 12.5,
        },
        expect: {
          maturity: 5550123.806471712,
          tax: 568765.47580896399,
          xirr: 0.099275439977645874,
        },
      },
      {
        name: "hnw",
        source: "engine regression @ HNW",
        engineInput: {
          premium: 2_000_000,
          payTerm: 10,
          corpusAtPayEnd: 25_000_000,
          policyTerm: 25,
          expectedReturn: 0.11,
          taxRate: 0.125,
        },
        apiInput: {
          premium: 2_000_000,
          payTerm: 10,
          corpusAtPayEnd: 25_000_000,
          policyTerm: 25,
          returnPct: 11,
          taxPct: 12.5,
        },
        expect: pick(hnw, ["maturity", "gain", "tax", "net", "xirr"]),
      },
    ],
  });
  void sample;
}

// --- insurance-tp ---
{
  const sample = calculateInsuranceTp({
    premium: 300_000,
    payTerm: 5,
    yearsPaid: 3,
    policyTerm: 20,
    yearsToMaturity: 11,
    maturityValue: 5_000_000,
    taxRate: 0.2,
    surrenderValue: 3_000_000,
    termPremium: 10_000,
    termYears: 11,
    expectedReturn: 0.1188,
  });
  const hnw = calculateInsuranceTp({
    premium: 1_500_000,
    payTerm: 10,
    yearsPaid: 5,
    policyTerm: 25,
    yearsToMaturity: 15,
    maturityValue: 40_000_000,
    taxRate: 0.2,
    surrenderValue: 18_000_000,
    termPremium: 50_000,
    termYears: 15,
    expectedReturn: 0.12,
  });
  write({
    id: "insurance-tp",
    scenarios: [
      {
        name: "unprotected-sample",
        source: "Unprotected/Nivra Insurance - Convert to TP and Investment Planner v3.xlsm",
        engineInput: {
          premium: 300_000,
          payTerm: 5,
          yearsPaid: 3,
          policyTerm: 20,
          yearsToMaturity: 11,
          maturityValue: 5_000_000,
          taxRate: 0.2,
          surrenderValue: 3_000_000,
          termPremium: 10_000,
          termYears: 11,
          expectedReturn: 0.1188,
        },
        apiInput: {
          premium: 300_000,
          payTerm: 5,
          yearsPaid: 3,
          policyTerm: 20,
          yearsToMaturity: 11,
          maturityValue: 5_000_000,
          taxPct: 20,
          surrenderValue: 3_000_000,
          termPremium: 10_000,
          termYears: 11,
          returnPct: 11.88,
        },
        expect: {
          "keep.net": 4_000_000,
          "keep.irr": 0.073076365241983909,
          "switch.investMaturity": 10927767.16119045,
        },
      },
      {
        name: "hnw",
        source: "engine regression @ HNW",
        engineInput: {
          premium: 1_500_000,
          payTerm: 10,
          yearsPaid: 5,
          policyTerm: 25,
          yearsToMaturity: 15,
          maturityValue: 40_000_000,
          taxRate: 0.2,
          surrenderValue: 18_000_000,
          termPremium: 50_000,
          termYears: 15,
          expectedReturn: 0.12,
        },
        apiInput: {
          premium: 1_500_000,
          payTerm: 10,
          yearsPaid: 5,
          policyTerm: 25,
          yearsToMaturity: 15,
          maturityValue: 40_000_000,
          taxPct: 20,
          surrenderValue: 18_000_000,
          termPremium: 50_000,
          termYears: 15,
          returnPct: 12,
        },
        expect: pick(hnw, ["keep.net", "switch.investMaturity", "switch.termCost"]),
      },
    ],
  });
  void sample;
}

// --- multi-goal-assign ---
{
  const sampleGoals = [
    { name: "Education", amount: 5_000_000, years: 10 },
    { name: "House1", amount: 8_000_000, years: 8 },
    { name: "House2", amount: 130_000_000, years: 12 },
    { name: "Car", amount: 4_800_000, years: 5 },
    { name: "Marriage", amount: 50_000_000, years: 25 },
  ];
  const sample = calculateMultiGoalAssign({
    shortTermYears: 5,
    shortTermReturn: 0.07,
    longTermReturn: 0.15,
    inflationRate: 0,
    taxRate: 0,
    delayMonths: 12,
    currentCorpus: 0,
    goals: sampleGoals,
  });
  const hnwGoals = [
    { name: "Education", amount: 25_000_000, years: 12 },
    { name: "Home", amount: 150_000_000, years: 10 },
    { name: "Second home", amount: 80_000_000, years: 15 },
    { name: "Wedding", amount: 40_000_000, years: 8 },
    { name: "Legacy", amount: 200_000_000, years: 25 },
  ];
  const hnw = calculateMultiGoalAssign({
    shortTermYears: 5,
    shortTermReturn: 0.07,
    longTermReturn: 0.15,
    inflationRate: 0.05,
    taxRate: 0.125,
    delayMonths: 0,
    currentCorpus: 20_000_000,
    goals: hnwGoals,
  });
  write({
    id: "multi-goal-assign",
    scenarios: [
      {
        name: "unprotected-sample",
        source: "Nivra Tools - Full Set/Nivra Multiple Goals with Corpus Assignment v2.xlsm",
        engineInput: {
          shortTermYears: 5,
          shortTermReturn: 0.07,
          longTermReturn: 0.15,
          inflationRate: 0,
          taxRate: 0,
          delayMonths: 12,
          currentCorpus: 0,
          goals: sampleGoals,
        },
        apiInput: {
          shortTermYears: 5,
          shortTermReturnPct: 7,
          longTermReturnPct: 15,
          inflationPct: 0,
          taxPct: 0,
          delayMonths: 12,
          currentCorpus: 0,
          goals: sampleGoals,
        },
        expect: {
          "goals.0.monthlySip": 19010.092364804936,
          "goals.0.lumpsum": 1235923.5306093292,
          "goals.3.monthlySip": 67040.595382055923,
          totalMonthlySip: 495205.75655095006,
        },
      },
      {
        name: "hnw",
        source: "engine regression @ HNW multi-goal",
        engineInput: {
          shortTermYears: 5,
          shortTermReturn: 0.07,
          longTermReturn: 0.15,
          inflationRate: 0.05,
          taxRate: 0.125,
          delayMonths: 0,
          currentCorpus: 20_000_000,
          goals: hnwGoals,
        },
        apiInput: {
          shortTermYears: 5,
          shortTermReturnPct: 7,
          longTermReturnPct: 15,
          inflationPct: 5,
          taxPct: 12.5,
          delayMonths: 0,
          currentCorpus: 20_000_000,
          goals: hnwGoals,
        },
        expect: pick(hnw, ["totalMonthlySip", "totalLumpsum", "totalAssigned"]),
      },
    ],
  });
  void sample;
}

// --- multi-withdrawals ---
{
  const sampleWithdrawals = [
    { name: "Car", amount: 2_000_000, atAge: 33 },
    { name: "Education 1", amount: 2_000_000, atAge: 41 },
    { name: "Education 2", amount: 5_000_000, atAge: 54 },
    { name: "Education 3", amount: 3_500_000, atAge: 54 },
    { name: "Education 4", amount: 2_000_000, atAge: 41 },
    { name: "Marriage", amount: 2_000_000, atAge: 58 },
    { name: "OldAge Home", amount: 16_000_000, atAge: 60 },
  ];
  const sample = calculateMultiWithdrawals({
    age: 28,
    annualReturn: 0.12,
    taxRate: 0.125,
    withdrawals: sampleWithdrawals,
  });
  const hnwWithdrawals = [
    { name: "Car", amount: 8_000_000, atAge: 35 },
    { name: "Education", amount: 40_000_000, atAge: 45 },
    { name: "Wedding", amount: 25_000_000, atAge: 50 },
    { name: "Second home", amount: 100_000_000, atAge: 55 },
    { name: "Retirement boost", amount: 50_000_000, atAge: 60 },
  ];
  const hnw = calculateMultiWithdrawals({
    age: 30,
    annualReturn: 0.12,
    taxRate: 0.125,
    withdrawals: hnwWithdrawals,
  });
  write({
    id: "multi-withdrawals",
    scenarios: [
      {
        name: "unprotected-sample",
        source: "Unprotected/Nivra SIP for Multiple Withdrawals v2.xlsm",
        engineInput: {
          age: 28,
          annualReturn: 0.12,
          taxRate: 0.125,
          withdrawals: sampleWithdrawals,
        },
        apiInput: {
          age: 28,
          returnPct: 12,
          taxPct: 12.5,
          withdrawals: sampleWithdrawals,
        },
        expect: {
          "rows.0.monthlySip": 25488.856849689902,
          totalWithdrawn: 32_500_000,
          totalInvested: 6990620.3231626917,
        },
      },
      {
        name: "hnw",
        source: "engine regression @ HNW",
        engineInput: {
          age: 30,
          annualReturn: 0.12,
          taxRate: 0.125,
          withdrawals: hnwWithdrawals,
        },
        apiInput: {
          age: 30,
          returnPct: 12,
          taxPct: 12.5,
          withdrawals: hnwWithdrawals,
        },
        expect: pick(hnw, ["startMonthlySip", "totalWithdrawn", "totalInvested", "totalTax"]),
      },
    ],
  });
  void sample;
}

// --- education ---
{
  const costs = DEFAULT_EDUCATION_COSTS.filter((c) => c.age <= 21);
  const sample = calculateEducation({
    childAge: 5,
    annualReturn: 0.12,
    taxRate: 0.125,
    costs,
  });
  const hnwCosts = costs.map((row) =>
    row.age >= 18
      ? { ...row, cost: row.cost === 0 ? 0 : row.cost * 3 }
      : { ...row, cost: row.cost * 2 },
  );
  const hnw = calculateEducation({
    childAge: 3,
    annualReturn: 0.12,
    taxRate: 0.125,
    costs: hnwCosts,
  });
  write({
    id: "education",
    scenarios: [
      {
        name: "unprotected-sample",
        source: "Unprotected/Nivra Child Education Planner v4.xlsm",
        cells: { "lumpsum.lumpsum": "Q10", totalWithdrawal: "P36" },
        engineInput: { childAge: 5, annualReturn: 0.12, taxRate: 0.125, costs },
        apiInput: {
          childAge: 5,
          returnPct: 12,
          taxPct: 12.5,
          costs,
        },
        expect: {
          "lumpsum.lumpsum": 3231850.6890932065,
          totalWithdrawal: 16751587.5,
          lastFeeAge: 21,
        },
      },
      {
        name: "hnw",
        source: "engine regression @ HNW education costs",
        engineInput: { childAge: 3, annualReturn: 0.12, taxRate: 0.125, costs: hnwCosts },
        apiInput: { childAge: 3, returnPct: 12, taxPct: 12.5, costs: hnwCosts },
        expect: pick(hnw, [
          "lumpsum.lumpsum",
          "sip.monthlySip",
          "totalWithdrawal",
          "totalCost",
        ]),
      },
    ],
  });
  void sample;
}

// --- fire-planner ---
{
  const hnw = calculateFirePlanner({
    age: 35,
    retirementAge: 50,
    survivingAge: 95,
    monthlyExpenses: 500_000,
    lifestyleYearly: 5_000_000,
    inflationRate: 0.0575,
    annualReturn: 0.12,
    returnAfterRetirement: 0.08,
    taxRate: 0.125,
    corpusSlices: [
      { rate: 0.09, amount: 50_000_000 },
      { rate: 0.12, amount: 80_000_000 },
    ],
    currentSipMonthly: 200_000,
    currentSipReturn: 0.12,
    stepUpRate: 0.1,
    delayMonths: 6,
  });
  write({
    id: "fire-planner",
    scenarios: [
      {
        name: "unprotected-sample",
        source: "Unprotected/Nivra FIRE Planner v10 - Unprotected.xlsm",
        engineInput: {
          age: 40,
          retirementAge: 55,
          survivingAge: 90,
          monthlyExpenses: 150_000,
          lifestyleYearly: 1_500_000,
          inflationRate: 0.0575,
          annualReturn: 0.12,
          returnAfterRetirement: 0.08,
          taxRate: 0.125,
          corpusSlices: [
            { rate: 0.09, amount: 5_000_000 },
            { rate: 0.12, amount: 3_500_000 },
          ],
          currentSipMonthly: 10_000,
          currentSipReturn: 0.1,
          stepUpRate: 0.1,
          delayMonths: 3,
        },
        apiInput: {
          age: 40,
          retirementAge: 55,
          survivingAge: 90,
          monthlyExpenses: 150_000,
          lifestyleYearly: 1_500_000,
          monthlyExpenseFactorPct: 100,
          lifestyleFactorPct: 100,
          inflationPct: 5.75,
          returnPct: 12,
          returnAfterPct: 8,
          taxPct: 12.5,
          corpusSlices: [
            { returnPct: 9, amount: 5_000_000 },
            { returnPct: 12, amount: 3_500_000 },
          ],
          currentSipMonthly: 10_000,
          currentSipReturnPct: 10,
          stepUpPct: 10,
          delayMonths: 3,
        },
        expect: {
          corpusRequired: 210442136.92288274,
          monthlySip: 355210.9244250518,
          additionalLumpsum: 30885905.04278836,
        },
      },
      {
        name: "hnw",
        source: "engine regression @ HNW FIRE",
        engineInput: {
          age: 35,
          retirementAge: 50,
          survivingAge: 95,
          monthlyExpenses: 500_000,
          lifestyleYearly: 5_000_000,
          inflationRate: 0.0575,
          annualReturn: 0.12,
          returnAfterRetirement: 0.08,
          taxRate: 0.125,
          corpusSlices: [
            { rate: 0.09, amount: 50_000_000 },
            { rate: 0.12, amount: 80_000_000 },
          ],
          currentSipMonthly: 200_000,
          currentSipReturn: 0.12,
          stepUpRate: 0.1,
          delayMonths: 6,
        },
        apiInput: {
          age: 35,
          retirementAge: 50,
          survivingAge: 95,
          monthlyExpenses: 500_000,
          lifestyleYearly: 5_000_000,
          monthlyExpenseFactorPct: 100,
          lifestyleFactorPct: 100,
          inflationPct: 5.75,
          returnPct: 12,
          returnAfterPct: 8,
          taxPct: 12.5,
          corpusSlices: [
            { returnPct: 9, amount: 50_000_000 },
            { returnPct: 12, amount: 80_000_000 },
          ],
          currentSipMonthly: 200_000,
          currentSipReturnPct: 12,
          stepUpPct: 10,
          delayMonths: 6,
        },
        expect: pick(hnw, ["corpusRequired", "monthlySip", "additionalLumpsum", "balanceCorpus"]),
      },
    ],
  });
}

// --- financial-health ---
{
  const hnw = calculateFinancialHealth({
    currentCorpus: 800_000_000,
    monthlyExpenses: 800_000,
    monthlyInvestment: 500_000,
    lifestyleYearly: 8_000_000,
    age: 45,
    retirementAge: 55,
    survivingAge: 95,
    inflationRate: 0.0575,
    annualReturn: 0.12,
    returnAfterRetirement: 0.08,
    taxRate: 0.125,
    events: [{ age: 60, amount: 50_000_000, type: "Expense" }],
  });
  write({
    id: "financial-health",
    scenarios: [
      {
        name: "unprotected-sample",
        source: "Unprotected/Nivra Financial Health Analysis v4.xlsm",
        engineInput: {
          currentCorpus: 250_000_000,
          monthlyExpenses: 350_000,
          monthlyInvestment: 100_000,
          lifestyleYearly: 2_500_000,
          age: 59,
          retirementAge: 60,
          survivingAge: 90,
          inflationRate: 0.0575,
          annualReturn: 0.0975,
          returnAfterRetirement: 0.08,
          taxRate: 0.125,
          events: [{ age: 62, amount: 20_000_000, type: "Expense" }],
        },
        apiInput: {
          currentCorpus: 250_000_000,
          monthlyExpenses: 350_000,
          monthlyInvestment: 100_000,
          lifestyleYearly: 2_500_000,
          age: 59,
          retirementAge: 60,
          survivingAge: 90,
          inflationPct: 5.75,
          returnPct: 9.75,
          returnAfterPct: 8,
          taxPct: 12.5,
          events: [{ age: 62, amount: 20_000_000, type: "Expense" }],
        },
        expect: {
          corpusAtRetirement: 275637474.340114,
          remainingAtSurvival: 814285941.8433343,
          yearsLasting: 30,
        },
      },
      {
        name: "hnw",
        source: "engine regression @ HNW health",
        engineInput: {
          currentCorpus: 800_000_000,
          monthlyExpenses: 800_000,
          monthlyInvestment: 500_000,
          lifestyleYearly: 8_000_000,
          age: 45,
          retirementAge: 55,
          survivingAge: 95,
          inflationRate: 0.0575,
          annualReturn: 0.12,
          returnAfterRetirement: 0.08,
          taxRate: 0.125,
          events: [{ age: 60, amount: 50_000_000, type: "Expense" }],
        },
        apiInput: {
          currentCorpus: 800_000_000,
          monthlyExpenses: 800_000,
          monthlyInvestment: 500_000,
          lifestyleYearly: 8_000_000,
          age: 45,
          retirementAge: 55,
          survivingAge: 95,
          inflationPct: 5.75,
          returnPct: 12,
          returnAfterPct: 8,
          taxPct: 12.5,
          events: [{ age: 60, amount: 50_000_000, type: "Expense" }],
        },
        expect: pick(hnw, [
          "corpusAtRetirement",
          "remainingAtSurvival",
          "yearsLasting",
          "remainingPvToday",
        ]),
      },
    ],
  });
}

console.log("done");
