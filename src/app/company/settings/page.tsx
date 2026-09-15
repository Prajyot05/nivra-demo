import { notFound } from "next/navigation";
import { CompanySettingsForm } from "@/components/admin/company-settings-form";
import {
  getCompanyById,
  getDemoCompanyId,
  listCompanyUsers,
} from "@/lib/admin/queries";

export default async function CompanySettingsPage() {
  const companyId = await getDemoCompanyId();
  const company = await getCompanyById(companyId);
  if (!company) notFound();
  const users = await listCompanyUsers(company.id);
  return <CompanySettingsForm company={company} users={users} />;
}
