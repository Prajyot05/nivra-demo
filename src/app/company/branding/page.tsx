import { notFound } from "next/navigation";
import { CompanyBrandingForm } from "@/components/admin/company-branding-form";
import { getCompanyById, getDemoCompanyId } from "@/lib/admin/queries";
import { requireSignedIn } from "@/lib/require-signed-in";

export default async function CompanyBrandingPage() {
  await requireSignedIn();
  const companyId = await getDemoCompanyId();
  const company = await getCompanyById(companyId);
  if (!company) notFound();
  return <CompanyBrandingForm company={company} />;
}
