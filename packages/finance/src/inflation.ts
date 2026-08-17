/** Future / present value of a goal or expense. No rounding. */

export function inflate(present: number, inflationRate: number, years: number): number {
  return present * (1 + inflationRate) ** years;
}

export function deflate(future: number, inflationRate: number, years: number): number {
  return future / (1 + inflationRate) ** years;
}
