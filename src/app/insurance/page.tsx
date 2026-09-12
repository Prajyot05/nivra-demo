import type { Metadata } from "next";
import { InsuranceCalculator } from "@/components/calc/insurance";

export const metadata: Metadata = { title: "Insurance IRR" };

export default function InsurancePage() {
  return <InsuranceCalculator />;
}
