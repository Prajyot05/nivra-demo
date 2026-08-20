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

/**
 * Excel NPER(rate, pmt, pv, [fv], [type])
 */
export function nper(
  rate: number,
  payment: number,
  presentValue: number,
  futureValue = 0,
  type: PaymentType = 0,
): number {
  if (rate === 0) {
    if (payment === 0) return NaN;
    return -(presentValue + futureValue) / payment;
  }
  const pmtAdj = payment * (1 + rate * type);
  const num = pmtAdj - futureValue * rate;
  const den = pmtAdj + presentValue * rate;
  if (num === 0 || den === 0 || num / den <= 0) return NaN;
  return Math.log(num / den) / Math.log(1 + rate);
}

/** Excel IRR(values, [guess]) on equally spaced periods. */
export function irr(values: number[], guess = 0.1): number {
  const flows = [...values];
  while (flows.length > 1 && flows[flows.length - 1] === 0) flows.pop();
  if (flows.length < 2) return NaN;
  let r = guess;
  for (let i = 0; i < 80; i += 1) {
    let npv = 0;
    let deriv = 0;
    for (let t = 0; t < flows.length; t += 1) {
      const df = (1 + r) ** t;
      npv += flows[t] / df;
      if (t > 0) deriv -= (t * flows[t]) / ((1 + r) ** (t + 1));
    }
    if (Math.abs(deriv) < 1e-18) break;
    const next = r - npv / deriv;
    if (!Number.isFinite(next)) break;
    if (Math.abs(next - r) < 1e-14) return next;
    r = next;
  }
  return r;
}

export type XirrCashflow = { amount: number; date: Date };

function dayCount(a: Date, b: Date): number {
  const ms = Date.UTC(b.getUTCFullYear(), b.getUTCMonth(), b.getUTCDate()) -
    Date.UTC(a.getUTCFullYear(), a.getUTCMonth(), a.getUTCDate());
  return ms / 86_400_000;
}

/** Excel XIRR(values, dates, [guess]) using Actual/365. */
export function xirr(cashflows: XirrCashflow[], guess = 0.1): number {
  const flows = cashflows.filter((cf) => cf.amount !== 0);
  if (flows.length < 2) return NaN;
  const t0 = flows[0].date;
  let r = guess;
  for (let i = 0; i < 80; i += 1) {
    let npv = 0;
    let deriv = 0;
    for (const cf of flows) {
      const years = dayCount(t0, cf.date) / 365;
      const den = (1 + r) ** years;
      npv += cf.amount / den;
      deriv -= (years * cf.amount) / ((1 + r) ** (years + 1));
    }
    if (Math.abs(deriv) < 1e-18) break;
    const next = r - npv / deriv;
    if (!Number.isFinite(next)) break;
    if (Math.abs(next - r) < 1e-14) return next;
    r = next;
  }
  return r;
}
