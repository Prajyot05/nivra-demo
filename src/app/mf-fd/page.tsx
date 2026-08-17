import type { Metadata } from "next";
import { ComingSoonCalculator } from "@/components/calc/coming-soon";

export const metadata: Metadata = { title: "MF vs FD" };

export default function MfFdPage() {
  return (
    <ComingSoonCalculator
      title="MF vs FD"
      calculatorId="mf-fd"
      modes={[{ id: "compare", label: "Compare" }]}
      description="Prajyot · Day 6+. Copy Investment Growth’s page and call POST /api/calculate/:id. No custom pmt/EMI math."
    />
  );
}
