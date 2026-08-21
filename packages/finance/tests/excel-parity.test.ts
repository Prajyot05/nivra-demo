import assert from "node:assert/strict";
import { test } from "node:test";
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
} from "../src/index";
import { assertExpect } from "./goldens/assert";
import { CALCULATOR_IDS, loadAllGoldens, type CalculatorId } from "./goldens/load";

function runEngine(id: CalculatorId, engineInput: Record<string, unknown>) {
  switch (id) {
    case "growth-sip": {
      const { taxRate, ...rest } = engineInput as {
        taxRate?: number;
        monthlyInvestment: number;
        sipYears: number;
        investYears?: number;
        annualReturn: number;
        inflationRate?: number;
        delayMonths?: number;
      };
      return calculateSip(rest, taxRate ?? 0);
    }
    case "growth-lumpsum":
      return calculateLumpsum(engineInput as Parameters<typeof calculateLumpsum>[0]);
    case "growth-stepup":
      return calculateStepUpSip(engineInput as Parameters<typeof calculateStepUpSip>[0]);
    case "growth-periodic":
      return calculatePeriodic(engineInput as Parameters<typeof calculatePeriodic>[0]);
    case "goal-sip":
      return calculateGoalSipVsStepUp(engineInput as Parameters<typeof calculateGoalSipVsStepUp>[0]);
    case "goal-current":
      return calculateGoalWithCurrent(engineInput as Parameters<typeof calculateGoalWithCurrent>[0]);
    case "goal-ls-sip":
      return calculateGoalLsSipOptions(engineInput as Parameters<typeof calculateGoalLsSipOptions>[0]);
    case "goal-existing-sip":
      return calculateGoalExistingSip(engineInput as Parameters<typeof calculateGoalExistingSip>[0]);
    case "goal-periodic":
      return calculateGoalPeriodicLumpsum(
        engineInput as Parameters<typeof calculateGoalPeriodicLumpsum>[0],
      );
    case "goal-compounding":
      return calculateGoalCompounding(engineInput as Parameters<typeof calculateGoalCompounding>[0]);
    case "loan-emi":
      return calculateAmort(engineInput as Parameters<typeof calculateAmort>[0]);
    case "loan-prepay":
      return calculateAmortWithYearlyExtra(
        engineInput as Parameters<typeof calculateAmortWithYearlyExtra>[0],
      );
    case "loan-extra-vs-invest":
      return calculateExtraVsInvest(engineInput as Parameters<typeof calculateExtraVsInvest>[0]);
    case "loan-interest-recovery":
      return calculateInterestRecovery(
        engineInput as Parameters<typeof calculateInterestRecovery>[0],
      );
    case "vehicle-loan":
      return calculateVehicleLoan(engineInput as Parameters<typeof calculateVehicleLoan>[0]);
    case "mf-fd":
      return calculateMfVsFd(engineInput as Parameters<typeof calculateMfVsFd>[0]);
    case "insurance-irr":
      return calculateInsuranceIrr({
        ...(engineInput as Parameters<typeof calculateInsuranceIrr>[0]),
        startDate: new Date(Date.UTC(2024, 0, 1)),
      });
    case "insurance-tp":
      return calculateInsuranceTp(engineInput as Parameters<typeof calculateInsuranceTp>[0]);
    case "multi-goal-assign":
      return calculateMultiGoalAssign(engineInput as Parameters<typeof calculateMultiGoalAssign>[0]);
    case "multi-withdrawals":
      return calculateMultiWithdrawals(
        engineInput as Parameters<typeof calculateMultiWithdrawals>[0],
      );
    case "education":
      return calculateEducation(engineInput as Parameters<typeof calculateEducation>[0]);
    case "fire-planner":
      return calculateFirePlanner(engineInput as Parameters<typeof calculateFirePlanner>[0]);
    case "financial-health":
      return calculateFinancialHealth(
        engineInput as Parameters<typeof calculateFinancialHealth>[0],
      );
    default: {
      const _exhaustive: never = id;
      throw new Error(`unhandled id ${_exhaustive}`);
    }
  }
}

test("golden catalog covers all 23 calculator ids", () => {
  const goldens = loadAllGoldens();
  assert.equal(goldens.length, CALCULATOR_IDS.length);
  for (const id of CALCULATOR_IDS) {
    assert.ok(goldens.some((g) => g.id === id), `missing golden for ${id}`);
  }
});

for (const golden of loadAllGoldens()) {
  for (const scenario of golden.scenarios) {
    test(`finance ${golden.id} · ${scenario.name}`, () => {
      const result = runEngine(golden.id as CalculatorId, scenario.engineInput);
      const rel = golden.id === "insurance-irr" && scenario.name === "unprotected-sample" ? 1e-4 : 1e-9;
      // xirr alone needs looser tol; others stay tight via path-specific override below
      const expect = { ...scenario.expect };
      if ("xirr" in expect) {
        assertExpect(result, { xirr: expect.xirr }, 1e-4);
        delete expect.xirr;
      }
      assertExpect(result, expect, rel > 1e-9 ? 1e-9 : rel);
    });
  }
}
