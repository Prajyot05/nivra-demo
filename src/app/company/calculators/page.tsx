import { Gem, Calculator } from "lucide-react";
import { AdminPageHeader, Panel, StatTile } from "@/components/admin/admin-ui";
import { Badge } from "@/components/ui/badge";
import {
  DEMO_COMPANY_ID,
  TIER_CALCULATORS,
  getCompany,
} from "@/lib/admin/dummy-data";

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

export default function CompanyCalculatorsPage() {
  const company = getCompany(DEMO_COMPANY_ID)!;
  const included = new Set(company.calculators);

  return (
    <>
      <AdminPageHeader
        title="Calculator access"
        description="Access follows the subscription plan. Tier names are placeholders until launch tiers are confirmed."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <StatTile label="Current plan" value={company.tier} icon={Gem} />
        <StatTile
          label="Calculators included"
          value={`${company.calculators.length} / ${ALL_CALCULATORS.length}`}
          icon={Calculator}
        />
      </div>

      <Panel title="On this plan">
        <ul className="grid gap-2 sm:grid-cols-2">
          {ALL_CALCULATORS.map((name) => {
            const on = included.has(name);
            return (
              <li
                key={name}
                className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
              >
                <span className={on ? "font-medium" : "text-muted-foreground"}>{name}</span>
                <Badge variant={on ? "default" : "outline"}>{on ? "Included" : "Locked"}</Badge>
              </li>
            );
          })}
        </ul>
      </Panel>

      <Panel title="Plan comparison (placeholder)" description="Awaiting Sasmith confirmation">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(Object.keys(TIER_CALCULATORS) as Array<keyof typeof TIER_CALCULATORS>).map(
            (tier) => (
              <div
                key={tier}
                className="rounded-lg border border-border bg-muted/30 p-3"
              >
                <p className="text-sm font-semibold">{tier}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {TIER_CALCULATORS[tier].length} calculators
                </p>
              </div>
            ),
          )}
        </div>
      </Panel>
    </>
  );
}
