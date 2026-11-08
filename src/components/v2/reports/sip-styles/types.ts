/** Shared view-model for SIP dossier style templates (HTML + React mount). */

export type SipDossierScheduleRow = {
  year: number;
  monthly: number;
  invested: number;
  fullReturn: number;
  inflationAdjusted: number;
  milestone: string;
};

export type SipDossierData = {
  brand: string;
  monogram: string;
  footer: string;
  title: string;
  clientName: string;
  age: number;
  endAge: number;
  investYears: number;
  contactEmail: string;
  contactPhone: string;
  monthlySip: number;
  sipYears: number;
  tenure: number;
  returnCagr: number;
  inflation: number;
  taxOnGains: number;
  /** When 0, Cost of Delay must not render. */
  delayMonths: number;
  nominalMaturity: number;
  inflationAdjusted: number;
  totalInvested: number;
  preTaxGain: number;
  taxOnGain: number;
  netAfterTax: number;
  /** Positive shortfall vs invested (real purchasing power). */
  realGainShortfall: number;
  gainAfterTax: number;
  realCorpusAfterTax: number;
  capitalTaxToday: number;
  delayedOnTime: number;
  delayedMaturity: number;
  capitalPenalty: number;
  nominalInvestedPct: number;
  nominalGainAfterTaxPct: number;
  nominalCapitalTaxPct: number;
  realCorpusPct: number;
  realCapitalTaxPct: number;
  schedule: SipDossierScheduleRow[];
  disclaimer: string;
};

export type SipDossierStyleId =
  | "classic-memo"
  | "compact-brief"
  | "advisor-rail"
  | "factsheet"
  | "portfolio-desk";

export type SipDossierStyleOption = {
  id: SipDossierStyleId;
  name: string;
  description: string;
};

export type BuiltStyle = {
  fontLinks: string[];
  css: string;
  body: string;
  desktopBg: string;
};

export const SIP_DOSSIER_STYLES: SipDossierStyleOption[] = [
  {
    id: "classic-memo",
    name: "Classic Private Bank Memo",
    description: "Conservative planning letter with hairlines and calm whitespace",
  },
  {
    id: "compact-brief",
    name: "Compact Brief",
    description: "Tight header block. Minimal space above Advisory Reading",
  },
  {
    id: "advisor-rail",
    name: "Advisor Rail",
    description: "Dark left KPI rail with light main column. Factsheet cousin",
  },
  {
    id: "factsheet",
    name: "Institutional Fund Factsheet",
    description: "Two-column factsheet. Composition in the left panel",
  },
  {
    id: "portfolio-desk",
    name: "Portfolio Desk",
    description: "Top KPI band plus composition and schedule side by side",
  },
];
