import Link from "next/link";
import { Building2, FileBarChart, Users, AlertTriangle } from "lucide-react";
import { AdminPageHeader, Panel, StatTile } from "@/components/admin/admin-ui";
import {
  CompanyLogoMark,
  CompanyStatusBadge,
  SoftLockBadge,
} from "@/components/admin/status-badges";
import { Badge } from "@/components/ui/badge";
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
import { requireSignedIn } from "@/lib/require-signed-in";

export default async function AdminOverviewPage() {
  await requireSignedIn();
  const stats = await getPlatformStats();
  const companies = await listCompanies();
  const recent = [...companies].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const source = isDatabaseConfigured() ? "Neon" : "dummy fallback (set DATABASE_URL)";

  return (
    <>
      <AdminPageHeader
        title="Platform overview"
        description={`All tenant companies, report volume, and subscription health. Data source: ${source}.`}
        actions={
          <Button size="sm" asChild>
            <Link href="/admin/companies">View companies</Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Companies" value={stats.totalCompanies} hint={`${stats.active} active · ${stats.trial} trial`} icon={Building2} />
        <StatTile
          label="Reports (all time)"
          value={stats.reportsTotal.toLocaleString("en-IN")}
          hint={`${stats.reportsThisMonth.toLocaleString("en-IN")} this month`}
          icon={FileBarChart}
        />
        <StatTile
          label="Seats used"
          value={`${stats.seatsUsed}/${stats.seatsTotal}`}
          hint="Across all tenants (member count; seat caps deferred)"
          icon={Users}
        />
        <StatTile
          label="Attention"
          value={stats.suspended + stats.inactive}
          hint={`${stats.suspended} suspended · ${stats.inactive} inactive`}
          icon={AlertTriangle}
        />
      </div>

      <Panel title="Companies" description="Latest tenants — status, tier, usage">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Soft lock</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead className="text-right">Users</TableHead>
              <TableHead className="text-right">Reports</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recent.map((company) => (
              <TableRow key={company.id}>
                <TableCell>
                  <Link
                    href={`/admin/companies/${company.id}`}
                    className="flex items-center gap-3 hover:underline"
                  >
                    <CompanyLogoMark
                      initials={company.logoInitials}
                      color={company.logoColor}
                      size="sm"
                    />
                    <div>
                      <div className="font-medium text-foreground">{company.name}</div>
                      <div className="text-xs text-muted-foreground">{company.email}</div>
                    </div>
                  </Link>
                </TableCell>
                <TableCell>
                  <CompanyStatusBadge status={company.status} />
                </TableCell>
                <TableCell>
                  <SoftLockBadge state={company.softLock} />
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{company.tier}</Badge>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {company.seatsUsed}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {company.reportsGenerated.toLocaleString("en-IN")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Panel>
    </>
  );
}
