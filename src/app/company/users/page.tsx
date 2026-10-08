import { CompanyUsersPanel } from "@/components/admin/company-users-panel";
import { getCompanyById, getDemoCompanyId, listCompanyUsers } from "@/lib/admin/queries";
import { resolveCompanyAdminContext } from "@/lib/company-context";
import { isDatabaseConfigured } from "@/lib/db";
import { notFound } from "next/navigation";
import { requireSignedIn } from "@/lib/require-signed-in";
import { getSeatUsage, listPendingInvites } from "@/lib/seats";

export default async function CompanyUsersPage() {
  await requireSignedIn();

  if (!isDatabaseConfigured()) {
    const company = await getCompanyById(await getDemoCompanyId());
    if (!company) notFound();
    const users = await listCompanyUsers(company.id);
    return (
      <CompanyUsersPanel
        company={company}
        initialUsers={users}
        pendingInvites={[]}
        seats={{ limit: company.seats || null, used: company.seatsUsed }}
        currentUserId={null}
        canManage={false}
      />
    );
  }

  const ctx = await resolveCompanyAdminContext();
  if (!ctx) notFound();
  const company = await getCompanyById(ctx.organizationId);
  if (!company) notFound();

  const [users, invites, seats] = await Promise.all([
    listCompanyUsers(company.id),
    listPendingInvites(company.id),
    getSeatUsage(company.id),
  ]);

  return (
    <CompanyUsersPanel
      company={company}
      initialUsers={users}
      pendingInvites={invites.map((i) => ({
        id: i.id,
        email: i.email,
        name: i.name,
        role: i.role === "COMPANY_ADMIN" ? "admin" : "advisor",
        expiresAt: i.expiresAt.toISOString().slice(0, 10),
      }))}
      seats={{ limit: seats.limit, used: seats.used }}
      currentUserId={ctx.user.id}
      canManage
    />
  );
}
