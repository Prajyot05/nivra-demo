import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Check } from "lucide-react";
import {
  AdminBarChart,
  AdminLineChart,
  AdminShareList,
} from "@/components/admin/admin-charts";
import { AdminPageHeader, Panel, StatStrip } from "@/components/admin/admin-ui";
import { CompanyRoleBadge } from "@/components/admin/status-badges";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getCompanyAnalytics } from "@/lib/admin/analytics";
import { getDemoCompanyId } from "@/lib/admin/queries";
import { isDatabaseConfigured } from "@/lib/db";
import { cn } from "@/lib/utils";

export default async function CompanyAnalyticsPage() {
  const companyId = await getDemoCompanyId();
  const data = await getCompanyAnalytics(companyId);
  if (!data) notFound();

  const { company, users } = data;
  const source = isDatabaseConfigured() ? "Neon" : "dummy fallback";
  const includedCount = data.calculatorRows.filter((c) => c.included).length;

  return (
    <>
      <AdminPageHeader
        title="Analytics"
        description={`Usage and team stats for ${company.name}. Charts and tables. Source: ${source}.`}
        actions={
          <Button
            variant="outline"
            size="sm"
            className="h-8 border-[var(--admin-line)] px-3 text-[13px] shadow-none"
            asChild
          >
            <Link href="/company/users">
              Manage users
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        }
      />

      <StatStrip
        items={[
          {
            label: "Users",
            value: company.seatsUsed,
            hint: `${users.filter((u) => u.status === "active").length} active`,
          },
          {
            label: "Plan",
            value: company.tier,
            hint: `Status · ${company.status}`,
          },
          {
            label: "Reports this month",
            value: company.reportsThisMonth.toLocaleString("en-IN"),
            tone: "positive",
          },
          {
            label: "Reports all time",
            value: company.reportsGenerated.toLocaleString("en-IN"),
          },
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <AdminLineChart
          title="Report volume (6 months)"
          description="PDF generations for this firm"
          data={data.monthlyReports.map((m) => ({
            label: m.label,
            value: m.value,
          }))}
        />
        <AdminShareList
          title="Team by role"
          description="Admin, advisor, viewer"
          data={data.usersByRole}
        />
        <AdminBarChart
          title="Team by status"
          description="Active, invited, disabled"
          data={data.usersByStatus}
          valueLabel="Users"
        />
        <AdminShareList
          title="Calculator access"
          description={`${includedCount} of ${data.calculatorRows.length} on ${company.tier}`}
          data={[
            {
              name: "Included",
              value: includedCount,
              fill: "#0b7443",
            },
            {
              name: "Upgrade",
              value: data.calculatorRows.length - includedCount,
              fill: "#a3a3a3",
            },
          ]}
        />
      </div>

      <Panel title="Team directory" description="Name and email for every seat" flush>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-4">Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="pr-4">Last active</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow
                key={user.id}
                className="border-[var(--admin-line)] hover:bg-[var(--admin-soft)]/60"
              >
                <TableCell className="pl-4 text-[13px] font-medium">
                  {user.name}
                </TableCell>
                <TableCell className="text-[13px] text-[var(--admin-muted)]">
                  {user.email}
                </TableCell>
                <TableCell>
                  <CompanyRoleBadge role={user.role} />
                </TableCell>
                <TableCell className="text-[13px] capitalize text-[var(--admin-muted)]">
                  {user.status}
                </TableCell>
                <TableCell className="pr-4 text-[13px] tabular-nums text-[var(--admin-muted)]">
                  {user.lastActiveAt}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Panel>

      <Panel title="Calculator suite" description="Plan entitlements">
        <ul className="divide-y divide-[var(--admin-line)] rounded-[var(--admin-radius-sm)] border border-[var(--admin-line)]">
          {data.calculatorRows.map((row) => (
            <li
              key={row.name}
              className="flex items-center justify-between gap-3 px-4 py-3 text-[13px]"
            >
              <span
                className={cn(
                  row.included
                    ? "font-medium text-[var(--admin-ink)]"
                    : "text-[var(--admin-faint)]",
                )}
              >
                {row.name}
              </span>
              {row.included ? (
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
          ))}
        </ul>
      </Panel>
    </>
  );
}
