import type { Metadata } from "next";
import { LoansCalculator } from "@/components/calc/loans";

export const metadata: Metadata = { title: "Loans" };

export default function LoansPage() {
  return <LoansCalculator />;
}
