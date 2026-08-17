import assert from "node:assert/strict";
import { test } from "node:test";
import { inflate } from "../src/inflation";
import {
  requiredSip,
  requiredStepUpSip,
  calculateGoalSipVsStepUp,
} from "../src/goal";
import { calculateSip } from "../src/sip";
import { calculateStepUpSip } from "../src/stepup";

const close = (actual: number, expected: number, rel = 1e-9) => {
  const tol = Math.max(1e-6, Math.abs(expected) * rel);
  assert.ok(
    Math.abs(actual - expected) <= tol,
    `expected ${expected}, got ${actual} (diff ${actual - expected})`,
  );
};

test("inflation-adjusted goal: Unprotected Goal SIP v3", () => {
  close(inflate(10_000_000, 0.0525, 15), 21544259.307314847);
});

test("required SIP with tax matches Goal sheet U27", () => {
  const target = inflate(10_000_000, 0.0525, 15);
  close(
    requiredSip({
      target,
      years: 15,
      annualReturn: 0.12,
      taxRate: 0.125,
    }),
    49082.47270047578,
  );
});

test("required step-up start matches Goal sheet SU_Amt cache", () => {
  const target = inflate(10_000_000, 0.0525, 15);
  close(
    requiredStepUpSip({
      target,
      years: 15,
      annualReturn: 0.12,
      stepUpRate: 0.1,
      taxRate: 0.125,
    }),
    27918.04577208791,
    1e-6,
  );
});

test("goal SIP vs step-up: net after tax meets the chosen target", () => {
  const result = calculateGoalSipVsStepUp({
    goalAmount: 10_000_000,
    tenureYears: 15,
    annualReturn: 0.12,
    inflationRate: 0.0525,
    taxRate: 0.125,
    stepUpRate: 0.1,
    useInflationAdjustedGoal: true,
  });
  close(result.targetGoal, result.inflAdjGoal);
  close(result.standard.netAfterTax, result.targetGoal, 1e-8);
  close(result.stepUp.netAfterTax, result.targetGoal, 1e-8);
  assert.equal(result.schedule.length, 15);
  assert.equal(result.delays.length, 4);
});

test("required SIP without tax matches PMT type=1 and SIP engine FV", () => {
  const sip = requiredSip({
    target: 1_000_000,
    years: 15,
    annualReturn: 0.12,
    taxRate: 0,
  });
  const run = calculateSip({
    monthlyInvestment: sip,
    sipYears: 15,
    annualReturn: 0.12,
  });
  close(run.maturity, 1_000_000, 1e-8);
  const su = requiredStepUpSip({
    target: 1_000_000,
    years: 15,
    annualReturn: 0.12,
    stepUpRate: 0.1,
    taxRate: 0,
  });
  const suRun = calculateStepUpSip({
    startMonthly: su,
    sipYears: 15,
    annualReturn: 0.12,
    stepUpRate: 0.1,
  });
  close(suRun.maturity, 1_000_000, 1e-8);
});
