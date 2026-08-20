import type { Metadata } from "next";
import { InsuranceCalculator } from "@/components/calc/insurance";

export const metadata: Metadata = { title: "Insurance" };

export default function InsurancePage() {
  return <InsuranceCalculator />;
}
