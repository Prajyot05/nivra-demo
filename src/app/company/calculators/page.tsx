import { Gem, Calculator } from "lucide-react";
import { notFound } from "next/navigation";
import { AdminPageHeader, Panel, StatTile } from "@/components/admin/admin-ui";
import { Badge } from "@/components/ui/badge";
import { getCompanyById, getDemoCompanyId } from "@/lib/admin/queries";

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
  const companyId = await getDemoCompanyId();
  const company = await getCompanyById(companyId);
  if (!company) notFound();
  const included = new Set(company.calculators);

  return (
    <>
      <AdminPageHeader
        title="Calculator access"
        description="Access follows the subscription plan tier (minTierLevel on Calculator rows)."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <StatTile label="Current plan" value={company.tier} icon={Gem} />
        <StatTile
          label="Calculators included"
          value={`${company.calculators.length} / ${ALL_CALCULATORS.length}`}
          icon={Calculator}
        />
      </div>

      <Panel title="Suite">
        <ul className="divide-y divide-border">
          {ALL_CALCULATORS.map((name) => {
            const on = included.has(name);
            return (
              <li
                key={name}
                className="flex items-center justify-between gap-3 py-3 text-sm"
              >
                <span className={on ? "font-medium" : "text-muted-foreground"}>
                  {name}
                </span>
                <Badge variant={on ? "default" : "outline"}>
                  {on ? "Included" : "Upgrade"}
                </Badge>
              </li>
            );
          })}
        </ul>
      </Panel>
    </>
  );
}
