import assert from "node:assert/strict";

/** Relative tolerance compare for Excel / engine floats. */
export function close(actual: number, expected: number, rel = 1e-9) {
  const tol = Math.max(1e-6, Math.abs(expected) * rel);
  assert.ok(
    Math.abs(actual - expected) <= tol,
    `expected ${expected}, got ${actual} (diff ${actual - expected})`,
  );
}

/** Resolve dotted paths like `standard.monthlySip` on a result object. */
export function getPath(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc == null || typeof acc !== "object") return undefined;
    return (acc as Record<string, unknown>)[key];
  }, obj);
}

export function assertExpect(
  result: unknown,
  expect: Record<string, number>,
  rel = 1e-9,
) {
  for (const [path, expected] of Object.entries(expect)) {
    const actual = getPath(result, path);
    assert.equal(typeof actual, "number", `missing number at ${path}`);
    close(actual as number, expected, rel);
  }
}
