import type { SipCalculatorReportData } from "@/components/reports/sip-calculator-dossier";
import type { SipDossierData, SipDossierScheduleRow } from "./types";

const DISCLAIMER =
  "This report is for illustrative planning purposes only. Projected returns are not guaranteed. Investments are subject to market risks, and actual outcomes may differ. Please consult your advisor before acting.";

/**
 * Exact DATA BLOCK values from the design brief. Do not recalculate these
 * for the standalone HTML samples.
 */
export const SAMPLE_SIP_DOSSIER_DATA: SipDossierData = {
  brand: "Nivra Private Wealth",
  monogram: "N",
  footer: "Powered by Nivra",
  title: "SIP Calculator Dossier",
  clientName: "Mr. Anshu Kaul",
  age: 45,
  endAge: 60,
  investYears: 15,
  contactEmail: "advisor@example.com",
  contactPhone: "+91 98765 43210",
  monthlySip: 25_000,
  sipYears: 15,
  tenure: 15,
  returnCagr: 12,
  inflation: 5.75,
  taxOnGains: 12.5,
  delayMonths: 0,
  nominalMaturity: 10_022_896,
  inflationAdjusted: 4_218_450,
  totalInvested: 4_500_000,
  preTaxGain: 5_522_896,
  taxOnGain: 690_362,
  netAfterTax: 9_332_534,
  realGainShortfall: 281_550,
  gainAfterTax: 4_832_534,
  realCorpusAfterTax: 3_927_895,
  capitalTaxToday: 290_555,
  delayedOnTime: 10_022_896,
  delayedMaturity: 8_940_000,
  capitalPenalty: 1_082_896,
  nominalInvestedPct: 44.9,
  nominalGainAfterTaxPct: 48.2,
  nominalCapitalTaxPct: 6.9,
  realCorpusPct: 93.1,
  realCapitalTaxPct: 6.9,
  schedule: [
    { year: 1, monthly: 25000, invested: 300000, fullReturn: 254444, inflationAdjusted: 240180, milestone: "Initiation" },
    { year: 2, monthly: 25000, invested: 600000, fullReturn: 541159, inflationAdjusted: 482184, milestone: "Compounding" },
    { year: 3, monthly: 25000, invested: 900000, fullReturn: 864236, inflationAdjusted: 726882, milestone: "Compounding" },
    { year: 4, monthly: 25000, invested: 1200000, fullReturn: 1228287, inflationAdjusted: 975160, milestone: "Compounding" },
    { year: 5, monthly: 25000, invested: 1500000, fullReturn: 1638509, inflationAdjusted: 1227916, milestone: "Compounding" },
    { year: 6, monthly: 25000, invested: 1800000, fullReturn: 2100757, inflationAdjusted: 1486072, milestone: "Compounding" },
    { year: 7, monthly: 25000, invested: 2100000, fullReturn: 2621630, inflationAdjusted: 1750569, milestone: "Compounding" },
    { year: 8, monthly: 25000, invested: 2400000, fullReturn: 3208563, inflationAdjusted: 2022378, milestone: "Midpoint" },
    { year: 9, monthly: 25000, invested: 2700000, fullReturn: 3869934, inflationAdjusted: 2302498, milestone: "Compounding" },
    { year: 10, monthly: 25000, invested: 3000000, fullReturn: 4615183, inflationAdjusted: 2591962, milestone: "Compounding" },
    { year: 11, monthly: 25000, invested: 3300000, fullReturn: 5454948, inflationAdjusted: 2891841, milestone: "Compounding" },
    { year: 12, monthly: 25000, invested: 3600000, fullReturn: 6401216, inflationAdjusted: 3203246, milestone: "Compounding" },
    { year: 13, monthly: 25000, invested: 3900000, fullReturn: 7467495, inflationAdjusted: 3527335, milestone: "Compounding" },
    { year: 14, monthly: 25000, invested: 4200000, fullReturn: 8669005, inflationAdjusted: 3865315, milestone: "Compounding" },
    { year: 15, monthly: 25000, invested: 4500000, fullReturn: 10022896, inflationAdjusted: 4218450, milestone: "Final year" },
  ],
  disclaimer: DISCLAIMER,
};

function pct(part: number, whole: number): number {
  if (!whole) return 0;
  return Math.round((part / whole) * 1000) / 10;
}

function milestoneFor(year: number, investYears: number, index: number): string {
  if (index === 0) return "Initiation";
  if (year === investYears) return "Final year";
  if (year === Math.ceil(investYears / 2)) return "Midpoint";
  return "Compounding";
}

/** Map live calculator report data into the dossier view-model. */
export function sipDossierFromReport(data: SipCalculatorReportData): SipDossierData {
  const endAge = data.age + data.investYears;
  const gainAfterTax = data.gain - data.tax;
  const maturity = data.maturity || 1;
  const inflationAdjusted = data.inflationAdjusted || 0;
  const capitalTaxToday =
    maturity > 0 ? data.tax * (inflationAdjusted / maturity) : data.tax;
  const realCorpusAfterTax = inflationAdjusted - capitalTaxToday;
  const realGain = inflationAdjusted - data.totalInvested;
  const realGainShortfall = realGain < 0 ? Math.abs(realGain) : 0;

  const schedule: SipDossierScheduleRow[] = data.schedule.map((row, i) => ({
    year: row.year,
    monthly: row.monthly,
    invested: row.investedToDate,
    fullReturn: row.yearEnd,
    inflationAdjusted: row.inflationAdjusted ?? row.yearEnd,
    milestone: milestoneFor(row.year, data.investYears, i),
  }));

  return {
    brand: "Nivra Private Wealth",
    monogram: "N",
    footer: "Powered by Nivra",
    title: "SIP Calculator Dossier",
    clientName: data.clientName || "Client",
    age: data.age,
    endAge,
    investYears: data.investYears,
    contactEmail: data.email || "advisor@example.com",
    contactPhone: data.phone || "+91 98765 43210",
    monthlySip: data.monthlyInvestment,
    sipYears: data.sipYears,
    tenure: data.investYears,
    returnCagr: data.returnPct,
    inflation: data.inflationPct,
    taxOnGains: data.taxPct,
    delayMonths: Math.max(0, data.delayMonths),
    nominalMaturity: data.maturity,
    inflationAdjusted,
    totalInvested: data.totalInvested,
    preTaxGain: data.gain,
    taxOnGain: data.tax,
    netAfterTax: data.netAfterTax,
    realGainShortfall,
    gainAfterTax,
    realCorpusAfterTax,
    capitalTaxToday,
    delayedOnTime: data.maturity,
    delayedMaturity: data.delayedMaturity ?? 0,
    capitalPenalty: data.costOfDelay ?? 0,
    nominalInvestedPct: pct(data.totalInvested, data.maturity),
    nominalGainAfterTaxPct: pct(gainAfterTax, data.maturity),
    nominalCapitalTaxPct: pct(data.tax, data.maturity),
    realCorpusPct: pct(realCorpusAfterTax, inflationAdjusted),
    realCapitalTaxPct: pct(capitalTaxToday, inflationAdjusted),
    schedule,
    disclaimer: DISCLAIMER,
  };
}

/** Clone sample data with an optional delay override (for HTML ?delay=12). */
export function withDelayMonths(data: SipDossierData, delayMonths: number): SipDossierData {
  return { ...data, delayMonths: Math.max(0, delayMonths) };
}
