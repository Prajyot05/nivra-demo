import { formatINR, formatPct } from "./format";
import type { SipDossierData } from "./types";

export type AdvisoryBlock = { title: string; body: string; pullQuote?: string };

export function advisoryReading(data: SipDossierData): AdvisoryBlock[] {
  const purchasing = {
    title: "Purchasing power",
    pullQuote: `The headline maturity of ${formatINR(data.nominalMaturity)} is ${formatINR(data.inflationAdjusted)} in today's rupees.`,
    body: `Nominal maturity is ${formatINR(data.nominalMaturity)} at age ${data.endAge}. At ${formatPct(data.inflation)} inflation that is ${formatINR(data.inflationAdjusted)} in today's rupees. Lead with purchasing power, not the headline corpus.`,
  };

  const tax = {
    title: "Tax on the gain",
    body: `Pre-tax gain ${formatINR(data.preTaxGain)}. Tax at ${formatPct(data.taxOnGains)} is ${formatINR(data.taxOnGain)}, leaving ${formatINR(data.netAfterTax)} after tax. Real outcome shows a shortfall of ${formatINR(data.realGainShortfall)} versus invested capital.`,
  };

  const path = {
    title: "How the path is built",
    body: `${formatINR(data.monthlySip)} for ${data.sipYears} SIP years at ${formatPct(data.returnCagr)} CAGR from age ${data.age} to ${data.endAge}. Shift toward debt in the final 2 to 3 years before redemption.`,
  };

  return [purchasing, tax, path];
}

export function playbook(data: SipDossierData): Array<{ id: string; title: string; body: string }> {
  return [
    {
      id: "01",
      title: "Automate the Monthly SIP",
      body: `Lock ${formatINR(data.monthlySip)} per month on ECS or OTM for ${data.sipYears} contribution years. Missed months permanently reduce the ${data.tenure}-year terminal corpus under the same return path.`,
    },
    {
      id: "02",
      title: "Inflation Reality Check",
      body: `Headline maturity of ${formatINR(data.nominalMaturity)} is ${formatINR(data.inflationAdjusted)} in today's rupees at ${formatPct(data.inflation)} inflation. Anchor reviews to purchasing power.`,
    },
    {
      id: "03",
      title: "Glidepath Before Year 15",
      body: `Begin shifting equity exposure toward short-duration debt or hybrids via STP in the final 2 to 3 years so the planned redemption is not hostage to a late-cycle drawdown.`,
    },
  ];
}

export function delayCopy(data: SipDossierData): string {
  return `Delaying SIP inception by ${data.delayMonths} months shortens the compounding window and reduces terminal wealth under identical return assumptions. The capital penalty is the gap between the on-time and delayed maturity paths.`;
}

/** Cost of Delay panel copy. Samples bake in the 12-month variant text while hidden at delay 0. */
export function delaySectionCopy(data: SipDossierData): string {
  return delayCopy({
    ...data,
    delayMonths: data.delayMonths > 0 ? data.delayMonths : 12,
  });
}
