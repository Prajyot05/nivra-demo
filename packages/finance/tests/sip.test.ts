import assert from "node:assert/strict";
import { test } from "node:test";
import { calculateSip, calculateLumpsum } from "../src/sip";

const close = (actual: number, expected: number, rel = 1e-9) => {
  const tol = Math.max(1e-6, Math.abs(expected) * rel);
  assert.ok(
    Math.abs(actual - expected) <= tol,
    `expected ${expected}, got ${actual} (diff ${actual - expected})`,
  );
};

test("flat SIP: Unprotected SIP Calculator v3 sample (1500, 5y, 12%)", () => {
  const result = calculateSip({
    monthlyInvestment: 1500,
    sipYears: 5,
    annualReturn: 0.12,
    investYears: 5,
    inflationRate: 0.0575,
    delayMonths: 6,
  });
  close(result.totalInvested, 90_000, 0);
  close(result.maturity, 121655.41880029078);
  close(result.gain, 31655.418800290776);
  close(result.inflationAdjusted, 91987.66139035183);
  close(result.delayedMaturity ?? 0, 106162.42472526057);
  close(result.costOfDelay ?? 0, result.maturity - (result.delayedMaturity ?? 0));
});

test("flat SIP with 40y horizon grows the 5y corpus at the annual yield", () => {
  const result = calculateSip({
    monthlyInvestment: 1500,
    sipYears: 5,
    annualReturn: 0.12,
    investYears: 40,
    inflationRate: 0.0575,
    delayMonths: 6,
  });
  close(result.maturity, 6423359.832392357);
  close(result.delayedMaturity ?? 0, 6069504.534997196);
  close(result.costOfDelay ?? 0, 353855.29739516135);
});

test("engine does not round intermediate SIP values", () => {
  const result = calculateSip({
    monthlyInvestment: 1500,
    sipYears: 5,
    annualReturn: 0.12,
  });
  assert.notEqual(result.maturity, Math.round(result.maturity));
});

test("lumpsum: Unprotected One-Time Investment v2 sample", () => {
  const result = calculateLumpsum({
    amount: 5_000_000,
    years: 16,
    annualReturn: 0.12,
    inflationRate: 0.0575,
    delayMonths: 6,
  });
  close(result.maturity, 30651968.25183946);
  close(result.totalInvested, 5_000_000, 0);
  close(result.inflationAdjusted, 12530613.952781675);
  close(result.delayedMaturity ?? 0, 28963387.567505162);
  close(result.costOfDelay ?? 0, 1688580.6843342967);
});
