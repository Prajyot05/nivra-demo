import { BarChart3, FileBarChart } from "lucide-react";
import { AdminPageHeader, Panel, StatTile } from "@/components/admin/admin-ui";
import { CompanyLogoMark, CompanyStatusBadge } from "@/components/admin/status-badges";
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

export default async function AdminReportsPage() {
  const stats = await getPlatformStats();
  const companies = await listCompanies();
  const byVolume = [...companies].sort(
    (a, b) => b.reportsThisMonth - a.reportsThisMonth,
  );
  const source = isDatabaseConfigured() ? "Neon" : "dummy fallback";

  return (
    <>
      <AdminPageHeader
        title="Reports"
        description={`Aggregate report generation across tenants. Soft-lock: 3 days view-only, then hard lock. Source: ${source}.`}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <StatTile
          label="Reports this month"
          value={stats.reportsThisMonth.toLocaleString("en-IN")}
          icon={BarChart3}
        />
        <StatTile
          label="Reports all time"
          value={stats.reportsTotal.toLocaleString("en-IN")}
          icon={FileBarChart}
        />
      </div>

      <Panel title="By company">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">This month</TableHead>
              <TableHead className="text-right">All time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {byVolume.map((company) => (
              <TableRow key={company.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <CompanyLogoMark
                      initials={company.logoInitials}
                      color={company.logoColor}
                      size="sm"
                    />
                    <span className="font-medium">{company.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <CompanyStatusBadge status={company.status} />
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {company.reportsThisMonth.toLocaleString("en-IN")}
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
