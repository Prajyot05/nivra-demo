import { notFound } from "next/navigation";
import { CompanySettingsForm } from "@/components/admin/company-settings-form";
import {
  getCompanyById,
  getDemoCompanyId,
  listCompanyUsers,
} from "@/lib/admin/queries";
import { requireSignedIn } from "@/lib/require-signed-in";

export default async function CompanySettingsPage() {
  await requireSignedIn();
  const companyId = await getDemoCompanyId();
  const company = await getCompanyById(companyId);
  if (!company) notFound();
  const users = await listCompanyUsers(company.id);
  return <CompanySettingsForm company={company} users={users} />;
}
