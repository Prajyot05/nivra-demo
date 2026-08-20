/** Unprotected Nivra MF vs FD v1 — short-horizon day-count compare. */

export type MfFdInput = {
  amount: number;
  days: number;
  mfRate: number;
  fdRate: number;
  mfTaxRate: number;
  fdTaxRate: number;
};

export type MfFdLeg = {
  annualizedReturn: number;
  returnPerDay: number;
  preTax: number;
  tax: number;
  postTax: number;
  invested: number;
  gain: number;
  net: number;
};

export function calculateMfVsFd(input: MfFdInput) {
  const mf = leg(input.amount, input.days, input.mfRate, input.mfTaxRate);
  const fd = leg(input.amount, input.days, input.fdRate, input.fdTaxRate);
  const mfAdvantage = Math.max(0, mf.postTax - fd.postTax);
  const fdAdvantage = Math.max(0, fd.postTax - mf.postTax);
  return {
    mf,
    fd,
    difference: mf.postTax - fd.postTax,
    mfAdvantage,
    fdAdvantage,
    compare: [
      { category: "Invested", mf: mf.invested, fd: fd.invested },
      { category: "Gain", mf: mf.gain, fd: fd.gain },
      { category: "Tax", mf: mf.tax, fd: fd.tax },
      { category: "Net", mf: mf.net, fd: fd.net },
    ],
  };
}

function leg(amount: number, days: number, rate: number, taxRate: number): MfFdLeg {
  const annualizedReturn = amount * rate;
  const returnPerDay = annualizedReturn / 365;
  const preTax = returnPerDay * days;
  const tax = preTax * taxRate;
  const postTax = preTax - tax;
  return {
    annualizedReturn,
    returnPerDay,
    preTax,
    tax,
    postTax,
    invested: amount,
    gain: preTax,
    net: amount + postTax,
  };
}
