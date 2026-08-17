import assert from "node:assert/strict";
import { test } from "node:test";
import { calculateStepUpSip, stepUpProjection } from "../src/stepup";

const close = (actual: number, expected: number, rel = 1e-9) => {
  const tol = Math.max(1e-6, Math.abs(expected) * rel);
  assert.ok(
    Math.abs(actual - expected) <= tol,
    `expected ${expected}, got ${actual} (diff ${actual - expected})`,
  );
};

test("step-up SIP: Unprotected SIP Step-Up v1 sample (5000, 10%, 10y, 12%)", () => {
  const result = calculateStepUpSip({
    startMonthly: 5000,
    sipYears: 10,
    annualReturn: 0.12,
    stepUpRate: 0.1,
    inflationRate: 0.0575,
  });
  close(result.totalInvested, 956245.4760600011);
  close(result.maturity, 1634449.2409538408);
  close(result.startMonthly, 5000, 0);
  close(result.endMonthly, 5000 * 1.1 ** 9);
});

test("step-up projection is linear in starting SIP", () => {
  const a = stepUpProjection({
    startMonthly: 1,
    sipYears: 15,
    annualReturn: 0.12,
    stepUpRate: 0.1,
  });
  const b = stepUpProjection({
    startMonthly: 27918.04577208791,
    sipYears: 15,
    annualReturn: 0.12,
    stepUpRate: 0.1,
  });
  close(b.maturity, a.maturity * 27918.04577208791);
  close(b.totalInvested, a.totalInvested * 27918.04577208791);
});
