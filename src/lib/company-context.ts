import { UserRole } from "@prisma/client";
import { getDemoCompanyId } from "@/lib/admin/queries";
import { getCurrentAppUser, type AppUser } from "@/lib/auth";

export type CompanyContext = { user: AppUser; organizationId: string };

/**
 * Org the signed-in user may administer: Company Admin gets their own org,
 * Nivra admin previews the demo company. Everyone else gets null.
 */
export async function resolveCompanyAdminContext(): Promise<CompanyContext | null> {
  const user = await getCurrentAppUser();
  if (!user) return null;
  if (user.role === UserRole.COMPANY_ADMIN && user.organizationId) {
    return { user, organizationId: user.organizationId };
  }
  if (user.role === UserRole.NIVRA_ADMIN) {
    return { user, organizationId: await getDemoCompanyId() };
  }
  return null;
}
