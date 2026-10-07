import type { Metadata } from "next";
import { InsuranceCalculator } from "@/components/calc/insurance";
import { requireCalculatorAccess } from "@/lib/require-signed-in";

export const metadata: Metadata = { title: "Insurance IRR" };

export default async function InsurancePage() {
  await requireCalculatorAccess();
  return <InsuranceCalculator />;
}
