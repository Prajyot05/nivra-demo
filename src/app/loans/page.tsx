import type { Metadata } from "next";
import { ComingSoonCalculator } from "@/components/calc/coming-soon";

export const metadata: Metadata = { title: "Loans" };

export default function LoansPage() {
  return (
    <ComingSoonCalculator
      title="Loan EMI + Prepayment"
      calculatorId="loan-emi"
      modes={[
        { id: "emi", label: "EMI" },
        { id: "prepay", label: "Prepay" },
        { id: "strategy", label: "Strategy" },
      ]}
      description="Prajyot. POST /api/calculate/loan-emi is already live. Do not reimplement EMI in the frontend."
    />
  );
}
