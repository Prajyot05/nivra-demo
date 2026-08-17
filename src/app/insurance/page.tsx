import type { Metadata } from "next";
import { ComingSoonCalculator } from "@/components/calc/coming-soon";

export const metadata: Metadata = { title: "Insurance" };

export default function InsurancePage() {
  return (
    <ComingSoonCalculator
      title="Insurance Return & Switch"
      calculatorId="insurance-irr"
      modes={[
        { id: "irr", label: "IRR" },
        { id: "switch", label: "Term + Invest" },
      ]}
      description="Prajyot. Ask Yash to add IRR/XIRR to packages/finance if you are blocked — do not write it in the UI."
    />
  );
}
