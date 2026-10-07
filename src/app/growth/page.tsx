import type { Metadata } from "next";
import { InvestmentGrowth } from "@/components/calc/investment-growth";
import { requireCalculatorAccess } from "@/lib/require-signed-in";

export const metadata: Metadata = { title: "One-Time Investment" };

export default async function GrowthPage() {
  await requireCalculatorAccess();
  return <InvestmentGrowth />;
}
