import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  AdminBarChart,
  AdminLineChart,
  AdminShareList,
} from "@/components/admin/admin-charts";
import { AdminPageHeader, Panel, StatStrip } from "@/components/admin/admin-ui";
import { CompaniesMetricsTable } from "@/components/admin/companies-metrics-table";
import { NivraRoleBadge } from "@/components/admin/status-badges";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getPlatformAnalytics } from "@/lib/admin/analytics";
import { isDatabaseConfigured } from "@/lib/db";

export default async function AdminAnalyticsPage() {
  const data = await getPlatformAnalytics();
  const { stats } = data;
  const source = isDatabaseConfigured() ? "Neon" : "dummy fallback";

  return (
    <>
      <AdminPageHeader
        title="Analytics"
        description={`Built for 500–1000 tenants: aggregate KPIs, top-10 charts, paginated tables. Source: ${source}.`}
        actions={
          <Button
            variant="outline"
            size="sm"
            className="h-8 border-[var(--admin-line)] px-3 text-[13px] shadow-none"
            asChild
          >
            <Link href="/admin/companies">
              Browse companies
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        }
      />

      <StatStrip
        items={[
          {
            label: "Companies",
            value: stats.totalCompanies.toLocaleString("en-IN"),
            hint: `${stats.active.toLocaleString("en-IN")} active · ${stats.trial.toLocaleString("en-IN")} trial`,
          },
          {
            label: "Users",
            value: stats.seatsUsed.toLocaleString("en-IN"),
            hint: "Active seats across tenants",
          },
          {
            label: "Reports this month",
            value: stats.reportsThisMonth.toLocaleString("en-IN"),
            tone: "positive",
          },
          {
            label: "Reports all time",
            value: stats.reportsTotal.toLocaleString("en-IN"),
          },
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <AdminLineChart
          title="Report volume (6 months)"
          description="Platform totals over time"
          data={data.monthlyReports.map((m) => ({
            label: m.label,
            value: m.value,
          }))}
        />
        <AdminBarChart
          title="Top 10 by reports (this month)"
          description="Never charts every company"
          data={data.reportsByCompany}
          valueLabel="Reports"
        />
        <AdminShareList
          title="Companies by status"
          description="Aggregate mix across the full corpus"
          data={data.companiesByStatus}
        />
        <AdminBarChart
          title="Top 10 by users"
          description="Largest teams by active seats"
          data={data.usersByCompany}
          valueLabel="Users"
        />
        <AdminShareList
          title="Companies by plan"
          description="Subscription tier mix"
          data={data.companiesByTier}
          className="lg:col-span-2"
        />
      </div>

      <CompaniesMetricsTable
        companies={data.companyRows}
        title="Company metrics"
        description={`${data.companyRows.length.toLocaleString("en-IN")} tenants · search + pagination`}
      />

      <Panel title="Nivra staff" description="Platform admins (name + email)" flush>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-4">Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="pr-4">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.staffRows.map((person) => (
              <TableRow
                key={person.id}
                className="border-[var(--admin-line)] hover:bg-[var(--admin-soft)]/60"
              >
                <TableCell className="pl-4 text-[13px] font-medium">
                  {person.name}
                </TableCell>
                <TableCell className="text-[13px] text-[var(--admin-muted)]">
                  {person.email}
                </TableCell>
                <TableCell>
                  <NivraRoleBadge role={person.role} />
                </TableCell>
                <TableCell className="pr-4 text-[13px] capitalize text-[var(--admin-muted)]">
                  {person.status}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Panel>
    </>
  );
}
