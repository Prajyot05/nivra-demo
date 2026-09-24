import { Check } from "lucide-react";
import { notFound } from "next/navigation";
import { AdminPageHeader, Panel, StatStrip } from "@/components/admin/admin-ui";
import { getCompanyById, getDemoCompanyId } from "@/lib/admin/queries";
import { requireSignedIn } from "@/lib/require-signed-in";
import { cn } from "@/lib/utils";

const ALL_CALCULATORS = [
  "Goal SIP Planner",
  "Unified Goal Planner",
  "Investment Growth",
  "Child Education",
  "FIRE / Health",
  "MF vs FD",
  "Loans",
  "Insurance",
  "Multi-Goal",
];

export default async function CompanyCalculatorsPage() {
  await requireSignedIn();
  const companyId = await getDemoCompanyId();
  const company = await getCompanyById(companyId);
  if (!company) notFound();
  const included = new Set(company.calculators);

  return (
    <>
      <AdminPageHeader
        title="Calculators"
        description="Access follows the subscription plan tier (minTierLevel on Calculator rows)."
      />

      <StatStrip
        items={[
          { label: "Current plan", value: company.tier },
          {
            label: "Calculators included",
            value: `${company.calculators.length} / ${ALL_CALCULATORS.length}`,
            tone: "positive",
          },
        ]}
        className="lg:grid-cols-2 sm:grid-cols-2"
      />

      <Panel title="Suite" description="What this plan unlocks">
        <ul className="divide-y divide-[var(--admin-line)] rounded-[var(--admin-radius-sm)] border border-[var(--admin-line)]">
          {ALL_CALCULATORS.map((name) => {
            const on = included.has(name);
            return (
              <li
                key={name}
                className="flex items-center justify-between gap-3 px-4 py-3 text-[13px]"
              >
                <span
                  className={cn(
                    on ? "font-medium text-[var(--admin-ink)]" : "text-[var(--admin-faint)]",
                  )}
                >
                  {name}
                </span>
                {on ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--admin-brand)]">
                    <Check className="h-3 w-3" />
                    Included
                  </span>
                ) : (
                  <span className="text-[11px] font-medium text-[var(--admin-faint)]">
                    Upgrade
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </Panel>
    </>
  );
}
