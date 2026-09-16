import Link from "next/link";
import { notFound } from "next/navigation";
import { Gem, Users, FileBarChart, Briefcase } from "lucide-react";
import { AdminPageHeader, Panel, StatTile } from "@/components/admin/admin-ui";
import {
  CompanyLogoMark,
  CompanyStatusBadge,
  SoftLockBadge,
} from "@/components/admin/status-badges";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getCompanyById,
  getDemoCompanyId,
  listCompanyUsers,
} from "@/lib/admin/queries";
import { isDatabaseConfigured } from "@/lib/db";

export default async function CompanyOverviewPage() {
  const companyId = await getDemoCompanyId();
  const company = await getCompanyById(companyId);
  if (!company) notFound();
  const users = await listCompanyUsers(company.id);
  const activeEmployees = users.filter(
    (u) => u.role !== "admin" && u.status === "active",
  ).length;
  const source = isDatabaseConfigured() ? "Neon" : "dummy fallback";

  return (
    <>
      <AdminPageHeader
        title="Company overview"
        description={`Plan, users, renewal, and usage. Company admin is the subscriber. Source: ${source}.`}
        actions={
          <Button size="sm" asChild>
            <Link href="/company/users">Manage users</Link>
          </Button>
        }
      />

      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center">
        <CompanyLogoMark initials={company.logoInitials} color={company.logoColor} />
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold tracking-tight">{company.name}</h2>
            <CompanyStatusBadge status={company.status} />
            <SoftLockBadge state={company.softLock} />
            <Badge variant="outline">{company.tier}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Renews {company.renewsAt} · Default theme {company.defaultTheme}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Plan"
          value={company.tier}
          hint={`Status · ${company.status}`}
          icon={Gem}
        />
        <StatTile
          label="Users"
          value={`${company.seatsUsed} active`}
          hint="Member seat caps deferred for v1"
          icon={Users}
        />
        <StatTile
          label="Reports this month"
          value={company.reportsThisMonth.toLocaleString("en-IN")}
          hint="Read-only usage"
          icon={FileBarChart}
        />
        <StatTile
          label="Active employees"
          value={activeEmployees}
          hint="Company employees (non-admin)"
          icon={Briefcase}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Subscription" description="Renewal and access state">
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-4 border-b border-border pb-2">
              <dt className="text-muted-foreground">Tier</dt>
              <dd className="font-medium">{company.tier}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-border pb-2">
              <dt className="text-muted-foreground">Renewal date</dt>
              <dd className="font-medium tabular-nums">{company.renewsAt}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-border pb-2">
              <dt className="text-muted-foreground">Users</dt>
              <dd className="font-medium tabular-nums">{company.seatsUsed}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Soft lock</dt>
              <dd>
                <SoftLockBadge state={company.softLock} />
              </dd>
            </div>
          </dl>
          <p className="mt-4 text-xs text-muted-foreground">
            Expired or suspended tenants get a 3-day view-only soft lock, then hard lock.
            Razorpay billing is stubbed until gateway credentials land.
          </p>
        </Panel>

        <Panel title="Quick links">
          <div className="grid gap-2">
            <Button variant="outline" className="justify-start" asChild>
              <Link href="/company/users">Add or remove users</Link>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <Link href="/company/branding">Edit disclaimer, logo, contact</Link>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <Link href="/company/calculators">See calculators on this plan</Link>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <Link href="/">Open calculators</Link>
            </Button>
          </div>
        </Panel>
      </div>
    </>
  );
}
