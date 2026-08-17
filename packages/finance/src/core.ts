/** Excel-compatible time-value helpers. No rounding. */

export type PaymentType = 0 | 1;

/** Effective monthly rate from an annual effective rate: (1 + r)^(1/12) - 1 */
export function monthlyRate(annualRate: number): number {
  return (1 + annualRate) ** (1 / 12) - 1;
}

/** Nominal monthly rate used by Indian EMI sheets: r / 12 */
export function nominalMonthlyRate(annualRate: number): number {
  return annualRate / 12;
}

/**
 * Excel FV(rate, nper, pmt, [pv], [type])
 * type 0 = end of period, type 1 = beginning (annuity due).
 */
export function fv(
  rate: number,
  nper: number,
  pmt: number,
  pv = 0,
  type: PaymentType = 0,
): number {
  if (nper === 0) return -pv;
  if (rate === 0) return -(pv + pmt * nper);
  const factor = (1 + rate) ** nper;
  const annuity = ((factor - 1) / rate) * pmt;
  if (type === 1) return -pv * factor - annuity * (1 + rate);
  return -pv * factor - annuity;
}

/** Excel PV(rate, nper, pmt, [fv], [type]) */
export function pv(
  rate: number,
  nper: number,
  pmt: number,
  futureValue = 0,
  type: PaymentType = 0,
): number {
  if (nper === 0) return -futureValue;
  if (rate === 0) return -(futureValue + pmt * nper);
  const factor = (1 + rate) ** nper;
  const annuity = ((factor - 1) / rate) * pmt;
  if (type === 1) return (-futureValue - annuity * (1 + rate)) / factor;
  return (-futureValue - annuity) / factor;
}

/** Excel PMT(rate, nper, pv, [fv], [type]) */
export function pmt(
  rate: number,
  nper: number,
  presentValue: number,
  futureValue = 0,
  type: PaymentType = 0,
): number {
  if (nper === 0) return 0;
  if (rate === 0) return -(presentValue + futureValue) / nper;
  const factor = (1 + rate) ** nper;
  const denom =
    type === 1
      ? ((factor - 1) / rate) * (1 + rate)
      : (factor - 1) / rate;
  return -(presentValue * factor + futureValue) / denom;
}

/**
 * Excel RATE(nper, pmt, pv, [fv], [type], [guess])
 * Newton-Raphson; no rounding.
 */
export function rate(
  nper: number,
  payment: number,
  presentValue: number,
  futureValue = 0,
  type: PaymentType = 0,
  guess = 0.1,
): number {
  if (nper <= 0) return NaN;
  let r = guess;
  for (let i = 0; i < 50; i += 1) {
    const f0 = fv(r, nper, payment, presentValue, type) - futureValue;
    const h = Math.max(1e-9, Math.abs(r) * 1e-6);
    const f1 = fv(r + h, nper, payment, presentValue, type) - futureValue;
    const deriv = (f1 - f0) / h;
    if (Math.abs(deriv) < 1e-18) break;
    const next = r - f0 / deriv;
    if (!Number.isFinite(next)) break;
    if (Math.abs(next - r) < 1e-14) return next;
    r = next;
  }
  return r;
}
