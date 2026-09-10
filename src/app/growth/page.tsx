import type { Metadata } from "next";
import { InvestmentGrowth } from "@/components/calc/investment-growth";

export const metadata: Metadata = { title: "One-Time Investment" };

export default function GrowthPage() {
  return <InvestmentGrowth />;
}
