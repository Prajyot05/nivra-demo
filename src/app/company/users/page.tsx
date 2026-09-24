import { CompanyUsersPanel } from "@/components/admin/company-users-panel";
import { getCompanyById, getDemoCompanyId, listCompanyUsers } from "@/lib/admin/queries";
import { notFound } from "next/navigation";
import { requireSignedIn } from "@/lib/require-signed-in";

export default async function CompanyUsersPage() {
  await requireSignedIn();
  const companyId = await getDemoCompanyId();
  const company = await getCompanyById(companyId);
  if (!company) notFound();
  const users = await listCompanyUsers(company.id);

  return <CompanyUsersPanel company={company} initialUsers={users} />;
}
