import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getV2Calculator,
  V2_CALCULATOR_SLUGS,
  V2LoanEmiCalculator,
  V2MfVsFdCalculator,
  V2SipCalculator,
} from "@/components/v2";

type Props = { params: Promise<{ calculator: string }> };

export function generateStaticParams() {
  return V2_CALCULATOR_SLUGS.map((calculator) => ({ calculator }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { calculator } = await params;
  const meta = getV2Calculator(calculator);
  return { title: meta?.label ?? "Calculator" };
}

export default async function V2CalculatorPage({ params }: Props) {
  const { calculator } = await params;
  const meta = getV2Calculator(calculator);
  if (!meta) notFound();

  switch (meta.slug) {
    case "sip-calculator":
      return <V2SipCalculator />;
    case "loan-emi-calculator":
      return <V2LoanEmiCalculator />;
    case "mf-vs-fd-calculator":
      return <V2MfVsFdCalculator />;
    default:
      notFound();
  }
}
