import type { Metadata } from "next";
import { LoansCalculator } from "@/components/calc/loans";
import { requireCalculatorAccess } from "@/lib/require-signed-in";

export const metadata: Metadata = { title: "Loan EMI with Interest Recovery" };

export default async function LoansPage() {
  await requireCalculatorAccess();
  return <LoansCalculator />;
}
