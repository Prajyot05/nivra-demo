/** Capital-gains tax on gain at maturity. No rounding. */

export function capitalGain(maturity: number, invested: number): number {
  return maturity - invested;
}

export function capitalGainsTax(
  maturity: number,
  invested: number,
  taxRate: number,
): number {
  const gain = capitalGain(maturity, invested);
  if (gain <= 0 || taxRate <= 0) return 0;
  return gain * taxRate;
}

export function netAfterTax(
  maturity: number,
  invested: number,
  taxRate: number,
): number {
  return maturity - capitalGainsTax(maturity, invested, taxRate);
}
