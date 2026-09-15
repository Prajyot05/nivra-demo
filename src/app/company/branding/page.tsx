import { notFound } from "next/navigation";
import { CompanyBrandingForm } from "@/components/admin/company-branding-form";
import { getCompanyById, getDemoCompanyId } from "@/lib/admin/queries";

export default async function CompanyBrandingPage() {
  const companyId = await getDemoCompanyId();
  const company = await getCompanyById(companyId);
  if (!company) notFound();
  return <CompanyBrandingForm company={company} />;
}
