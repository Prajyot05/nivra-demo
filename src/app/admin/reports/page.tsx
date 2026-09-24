import { AdminPageHeader, StatStrip } from "@/components/admin/admin-ui";
import { CompaniesMetricsTable } from "@/components/admin/companies-metrics-table";
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
        description={`PDF volume across tenants. Soft-lock: 3 days view-only, then hard lock. Paginated for large corpora. Source: ${source}.`}
      />

      <StatStrip
        items={[
          {
            label: "Reports this month",
            value: stats.reportsThisMonth.toLocaleString("en-IN"),
            tone: "positive",
          },
          {
            label: "Reports all time",
            value: stats.reportsTotal.toLocaleString("en-IN"),
          },
          {
            label: "Companies",
            value: stats.totalCompanies.toLocaleString("en-IN"),
            hint: `${stats.active.toLocaleString("en-IN")} active`,
          },
        ]}
        className="lg:grid-cols-3 sm:grid-cols-3"
      />

      <CompaniesMetricsTable
        companies={byVolume}
        title="By company"
        description="Sorted by this month · search and page through the full list"
      />
    </>
  );
}
