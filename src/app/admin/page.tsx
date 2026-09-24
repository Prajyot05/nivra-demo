import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AdminPageHeader, Panel, StatStrip } from "@/components/admin/admin-ui";
import {
  CompanyLogoMark,
  CompanyStatusBadge,
  SoftLockBadge,
} from "@/components/admin/status-badges";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getPlatformStats, listCompanies } from "@/lib/admin/queries";
import { isDatabaseConfigured } from "@/lib/db";

export default async function AdminOverviewPage() {
  const stats = await getPlatformStats();
  const companies = await listCompanies();
  const attention = companies
    .filter((c) => c.status === "suspended" || c.softLock !== "none")
    .slice(0, 8);
  const attentionTotal = companies.filter(
    (c) => c.status === "suspended" || c.softLock !== "none",
  ).length;
  const recent = [...companies]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 6);
  const source = isDatabaseConfigured() ? "Neon" : "dummy fallback";

  return (
    <>
      <AdminPageHeader
        title="Overview"
        description={`${stats.totalCompanies.toLocaleString("en-IN")} tenants. Lists stay paginated; charts use aggregates and top-10 only. Source: ${source}.`}
        actions={
          <Button size="sm" className="h-8 px-3 text-[13px]" asChild>
            <Link href="/admin/analytics">
              Open analytics
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
            hint: `${stats.reportsTotal.toLocaleString("en-IN")} all time`,
            tone: "positive",
          },
          {
            label: "Needs attention",
            value: attentionTotal.toLocaleString("en-IN"),
            hint: "Suspended or soft-locked",
            tone: attentionTotal > 0 ? "warn" : "neutral",
          },
        ]}
      />

      <div className="grid gap-8 lg:grid-cols-5">
        <Panel
          className="lg:col-span-3"
          title="Recent companies"
          description="Newest tenants first"
          flush
          actions={
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-[12px] text-[var(--admin-muted)]"
              asChild
            >
              <Link href="/admin/companies">
                See all
                <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          }
        >
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-4">Company</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Users</TableHead>
                <TableHead className="pr-4 text-right">Reports</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recent.map((company) => (
                <TableRow
                  key={company.id}
                  className="border-[var(--admin-line)] hover:bg-[var(--admin-soft)]/60"
                >
                  <TableCell className="pl-4">
                    <Link
                      href={`/admin/companies/${company.id}`}
                      className="group flex items-center gap-2.5"
                    >
                      <CompanyLogoMark
                        initials={company.logoInitials}
                        color={company.logoColor}
                        size="sm"
                      />
                      <div>
                        <div className="text-[13px] font-medium group-hover:underline">
                          {company.name}
                        </div>
                        <div className="text-[11px] text-[var(--admin-faint)]">
                          {company.tier}
                        </div>
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <CompanyStatusBadge status={company.status} />
                  </TableCell>
                  <TableCell className="text-right text-[13px] tabular-nums">
                    {company.seatsUsed}
                  </TableCell>
                  <TableCell className="pr-4 text-right text-[13px] tabular-nums">
                    {company.reportsThisMonth.toLocaleString("en-IN")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Panel>

        <Panel
          className="lg:col-span-2"
          title="Attention"
          description={
            attentionTotal > attention.length
              ? `Showing ${attention.length} of ${attentionTotal.toLocaleString("en-IN")}`
              : "Suspended or locked"
          }
          actions={
            attentionTotal > 0 ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-[12px] text-[var(--admin-muted)]"
                asChild
              >
                <Link href="/admin/companies">
                  Browse all
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>
            ) : null
          }
        >
          {attentionTotal === 0 ? (
            <div className="rounded-[var(--admin-radius-sm)] border border-dashed border-[var(--admin-line)] px-4 py-10 text-center">
              <p className="text-[13px] font-medium">All clear</p>
              <p className="mt-1 text-[12px] text-[var(--admin-muted)]">
                No suspended or soft-locked companies.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-[var(--admin-line)] rounded-[var(--admin-radius-sm)] border border-[var(--admin-line)]">
              {attention.map((company) => (
                <li key={company.id}>
                  <Link
                    href={`/admin/companies/${company.id}`}
                    className="flex items-center justify-between gap-3 px-3 py-3 transition-colors hover:bg-[var(--admin-soft)]/60"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-[13px] font-medium">
                        {company.name}
                      </div>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        <CompanyStatusBadge status={company.status} />
                        <SoftLockBadge state={company.softLock} />
                      </div>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[var(--admin-faint)]" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
