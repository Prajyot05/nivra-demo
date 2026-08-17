import assert from "node:assert/strict";
import { test } from "node:test";
import { capitalGain, capitalGainsTax, netAfterTax } from "../src/tax";

const close = (actual: number, expected: number, rel = 1e-12) => {
  const tol = Math.max(1e-9, Math.abs(expected) * rel);
  assert.ok(
    Math.abs(actual - expected) <= tol,
    `expected ${expected}, got ${actual} (diff ${actual - expected})`,
  );
};

test("capital-gains tax is rate × max(0, maturity − invested)", () => {
  close(capitalGain(121_655.41880029078, 90_000), 31_655.41880029078);
  close(capitalGainsTax(121_655.41880029078, 90_000, 0.125), 31_655.41880029078 * 0.125);
  close(netAfterTax(121_655.41880029078, 90_000, 0.125), 121_655.41880029078 - 31_655.41880029078 * 0.125);
});

test("capital-gains tax is zero when there is no gain or no rate", () => {
  assert.equal(capitalGainsTax(80_000, 90_000, 0.125), 0);
  assert.equal(capitalGainsTax(121_655, 90_000, 0), 0);
});
