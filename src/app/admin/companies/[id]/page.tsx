import Link from "next/link";
import { notFound } from "next/navigation";
import { Users, FileBarChart, BarChart3, Calendar } from "lucide-react";
import { AdminPageHeader, Panel, StatTile } from "@/components/admin/admin-ui";
import {
  CompanyLogoMark,
  CompanyRoleBadge,
  CompanyStatusBadge,
  SoftLockBadge,
} from "@/components/admin/status-badges";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getCompanyById, listCompanyUsers } from "@/lib/admin/queries";

export default async function AdminCompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const company = await getCompanyById(id);
  if (!company) notFound();

  const users = await listCompanyUsers(company.id);

  return (
    <>
      <AdminPageHeader
        title={company.name}
        description="Tenant detail — branding, subscription, users, and report volume."
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/companies">Back to list</Link>
          </Button>
        }
      />

      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center">
        <CompanyLogoMark initials={company.logoInitials} color={company.logoColor} />
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <CompanyStatusBadge status={company.status} />
            <SoftLockBadge state={company.softLock} />
            <Badge variant="outline">{company.tier}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {company.email} · {company.phone}
          </p>
          <p className="text-xs text-muted-foreground">
            Owner {company.ownerEmail} · Created {company.createdAt}
            {company.softLockEndsAt
              ? ` · Soft lock until ${company.softLockEndsAt}`
              : null}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Seats" value={`${company.seatsUsed}/${company.seats}`} icon={Users} />
        <StatTile
          label="Reports (all time)"
          value={company.reportsGenerated.toLocaleString("en-IN")}
          icon={FileBarChart}
        />
        <StatTile
          label="Reports this month"
          value={company.reportsThisMonth.toLocaleString("en-IN")}
          icon={BarChart3}
        />
        <StatTile label="Renews" value={company.renewsAt} hint={`Theme · ${company.defaultTheme}`} icon={Calendar} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Users" description={`${users.length} accounts on this tenant`}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-muted-foreground">
                    No users in dummy set for this company.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-xs text-muted-foreground">{user.email}</div>
                    </TableCell>
                    <TableCell>
                      <CompanyRoleBadge role={user.role} />
                    </TableCell>
                    <TableCell className="capitalize text-muted-foreground">
                      {user.status}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Panel>

        <Panel title="Calculator access" description="Included in current tier (placeholder names)">
          <ul className="grid gap-2 sm:grid-cols-1">
            {company.calculators.map((name) => (
              <li
                key={name}
                className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm"
              >
                {name}
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}
