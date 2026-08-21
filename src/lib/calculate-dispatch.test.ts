import assert from "node:assert/strict";
import { test } from "node:test";
import { ZodError } from "zod";
import { dispatch } from "./calculate-dispatch";
import {
  assertExpect,
  close,
} from "../../packages/finance/tests/goldens/assert";
import {
  CALCULATOR_IDS,
  loadAllGoldens,
} from "../../packages/finance/tests/goldens/load";

test("dispatch golden catalog covers all calculator ids", () => {
  const goldens = loadAllGoldens();
  assert.equal(goldens.length, CALCULATOR_IDS.length);
  for (const id of CALCULATOR_IDS) {
    assert.ok(goldens.some((g) => g.id === id), `missing golden for ${id}`);
  }
});

for (const golden of loadAllGoldens()) {
  for (const scenario of golden.scenarios) {
    test(`dispatch ${golden.id} · ${scenario.name}`, () => {
      const result = dispatch(golden.id, scenario.apiInput);
      const expect = { ...scenario.expect };
      if ("xirr" in expect) {
        assertExpect(result, { xirr: expect.xirr }, 1e-4);
        delete expect.xirr;
      }
      // loan-prepay totalExtra is rounded in Unprotected sample notes
      const rel =
        golden.id === "loan-prepay" && scenario.name === "unprotected-sample"
          ? 1e-8
          : 1e-9;
      assertExpect(result, expect, rel);
    });
  }
}

test("dispatch converts API percents to engine decimals", () => {
  const at12 = dispatch("growth-lumpsum", {
    amount: 100_000,
    years: 1,
    returnPct: 12,
    taxPct: 0,
  }) as { maturity: number };
  close(at12.maturity, 100_000 * 1.12);
});

test("dispatch rejects periodic timesPerYear that do not divide 12", () => {
  assert.throws(
    () =>
      dispatch("growth-periodic", {
        amount: 100_000,
        timesPerYear: 5,
        years: 1,
        returnPct: 12,
      }),
    ZodError,
  );
});

test("dispatch rejects SIP horizon shorter than SIP years", () => {
  assert.throws(
    () =>
      dispatch("growth-sip", {
        monthlyInvestment: 1500,
        sipYears: 10,
        investYears: 5,
        returnPct: 12,
      }),
    ZodError,
  );
});

test("dispatch unknown id is 404", () => {
  try {
    dispatch("not-a-calculator", {});
    assert.fail("expected throw");
  } catch (error) {
    assert.equal((error as { status?: number }).status, 404);
  }
});
