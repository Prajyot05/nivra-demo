import type { Metadata } from "next";
import { LoansCalculator } from "@/components/calc/loans";

export const metadata: Metadata = { title: "Loan EMI with Interest Recovery" };

export default function LoansPage() {
  return <LoansCalculator />;
}
