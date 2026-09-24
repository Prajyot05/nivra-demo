import assert from "node:assert/strict";
import { test } from "node:test";
import { calculateAmort, loanEmi } from "../src/amort";

const close = (actual: number, expected: number, rel = 1e-9) => {
  const tol = Math.max(1e-6, Math.abs(expected) * rel);
  assert.ok(
    Math.abs(actual - expected) <= tol,
    `expected ${expected}, got ${actual} (diff ${actual - expected})`,
  );
};

test("EMI: Unprotected Loan EMI v1 sample (75L, 20y, 9.2%) uses r/12", () => {
  const emi = loanEmi(7_500_000, 20, 0.092);
  close(emi, 68447.15332576867);
});

test("amort schedule: first month interest is principal * r/12", () => {
  const result = calculateAmort({
    principal: 7_500_000,
    years: 20,
    annualRate: 0.092,
  });
  close(result.emi, 68447.15332576867);
  close(result.schedule[0].interest, (7_500_000 * 0.092) / 12);
  close(result.schedule[0].principal, result.emi - result.schedule[0].interest);
  close(result.schedule[0].balance, 7_500_000 - result.schedule[0].principal);
  assert.equal(result.schedule.length, 240);
  close(result.schedule[239].balance, 0, 1e-6);
  close(result.totalPrincipal, 7_500_000, 1e-8);
});

test("amort: investment to recover interest matches Unprotected Loan EMI v1", () => {
  const result = calculateAmort({
    principal: 7_500_000,
    years: 20,
    annualRate: 0.092,
    recoverReturn: 0.12,
    delayMonths: 12,
  });
  close(result.totalInterest, 8_927_316.798184574, 1e-9);
  close(result.recoverMonthlySip, 9705.109974231967, 1e-9);
  close(result.recoverInvested, result.recoverMonthlySip * 240, 1e-9);
  close(result.delayedRecoverMonthlySip, 11127.297031503196, 1e-9);
  assert.equal(result.recoverMonths, 240);
  assert.equal(result.delayedRecoverMonths, 228);
  assert.equal(result.delayMonths, 12);
});

test("amort: delay equal to term leaves zero delayed SIP window", () => {
  const result = calculateAmort({
    principal: 7_500_000,
    years: 20,
    annualRate: 0.092,
    recoverReturn: 0.12,
    delayMonths: 240,
  });
  assert.equal(result.delayedRecoverMonths, 0);
  assert.equal(result.delayedRecoverMonthlySip, 0);
  assert.equal(result.delayedRecoverInvested, 0);
  close(result.recoverMonthlySip, 9705.109974231967, 1e-9);
});
