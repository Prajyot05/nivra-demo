import { CompaniesTable } from "@/components/admin/companies-table";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { listCompanies } from "@/lib/admin/queries";
import { isDatabaseConfigured } from "@/lib/db";

export default async function AdminCompaniesPage() {
  const companies = await listCompanies();
  const source = isDatabaseConfigured() ? "Neon" : "dummy fallback";

  return (
    <>
      <AdminPageHeader
        title="Companies"
        description={`Active, trial, suspended, and inactive tenants. Source: ${source}.`}
      />
      <CompaniesTable companies={companies} />
    </>
  );
}
