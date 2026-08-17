import type { Metadata } from "next";
import { ComingSoonCalculator } from "@/components/calc/coming-soon";

export const metadata: Metadata = { title: "Child Education" };

export default function EducationPage() {
  return (
    <ComingSoonCalculator
      title="Child Education Planner"
      calculatorId="education"
      modes={[{ id: "plan", label: "Education" }]}
      description="Days 15–16. Reuse goal + SIP + tax. Age/class cost grid uses ScheduleTable."
    />
  );
}
