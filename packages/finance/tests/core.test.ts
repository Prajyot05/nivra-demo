import assert from "node:assert/strict";
import { test } from "node:test";
import { fv, pv, pmt, rate, monthlyRate } from "../src/core";

const close = (actual: number, expected: number, rel = 1e-9) => {
  const tol = Math.max(1e-9, Math.abs(expected) * rel);
  assert.ok(
    Math.abs(actual - expected) <= tol,
    `expected ${expected}, got ${actual} (diff ${actual - expected})`,
  );
};

test("monthlyRate is (1+r)^(1/12)-1", () => {
  close(monthlyRate(0.12), (1.12) ** (1 / 12) - 1);
});

test("fv annuity-due matches Excel FV(rate,nper,pmt,pv,1)", () => {
  const r = monthlyRate(0.12);
  // Unprotected SIP v3: 1500/mo, 60 months, type=1
  close(fv(r, 60, -1500, 0, 1), 121655.41880029078, 1e-12);
});

test("fv lumpsum matches Excel FV(yield, years, 0, -invest, 1)", () => {
  close(fv(0.12, 16, 0, -5_000_000, 1), 30651968.25183946, 1e-12);
});

test("pmt is inverse of fv (type=1)", () => {
  const r = monthlyRate(0.12);
  const n = 180;
  const target = 10_000_000;
  const sip = pmt(r, n, 0, -target, 1);
  close(fv(r, n, -sip, 0, 1), target, 1e-10);
});

test("pv is inverse of fv", () => {
  const future = 30651968.25183946;
  close(pv(0.12, 16, 0, -future, 1), 5_000_000, 1e-10);
});

test("rate recovers monthly rate from sip cashflows", () => {
  const r = monthlyRate(0.12);
  const n = 60;
  const payment = -1500;
  const future = fv(r, n, payment, 0, 1);
  close(rate(n, payment, 0, future, 1, 0.01), r, 1e-8);
});
