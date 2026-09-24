import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  AdminIdentityCard,
  AdminPageHeader,
  Panel,
  StatStrip,
} from "@/components/admin/admin-ui";
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
import { requireSignedIn } from "@/lib/require-signed-in";

export default async function AdminCompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSignedIn();
  const { id } = await params;
  const company = await getCompanyById(id);
  if (!company) notFound();

  const users = await listCompanyUsers(company.id);

  return (
    <>
      <AdminPageHeader
        title={company.name}
        description="Branding, subscription, users, and report volume."
        actions={
          <Button
            variant="outline"
            size="sm"
            className="h-8 border-[var(--admin-line)] px-3 text-[13px] shadow-none"
            asChild
          >
            <Link href="/admin/companies">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </Link>
          </Button>
        }
      />

      <AdminIdentityCard
        mark={
          <CompanyLogoMark
            initials={company.logoInitials}
            color={company.logoColor}
          />
        }
        title={company.name}
        badges={
          <>
            <CompanyStatusBadge status={company.status} />
            <SoftLockBadge state={company.softLock} />
            <Badge
              variant="outline"
              className="rounded-full border-[var(--admin-line)] text-[11px] font-medium"
            >
              {company.tier}
            </Badge>
          </>
        }
        meta={
          <>
            <p>
              {company.email} · {company.phone}
            </p>
            <p className="mt-0.5 text-[12px] text-[var(--admin-faint)]">
              Owner {company.ownerEmail} · Created {company.createdAt}
              {company.softLockEndsAt
                ? ` · Soft lock until ${company.softLockEndsAt}`
                : null}
            </p>
          </>
        }
      />

      <StatStrip
        items={[
          {
            label: "Users",
            value: `${company.seatsUsed}/${company.seats}`,
          },
          {
            label: "Reports (all time)",
            value: company.reportsGenerated.toLocaleString("en-IN"),
          },
          {
            label: "Reports this month",
            value: company.reportsThisMonth.toLocaleString("en-IN"),
            tone: "positive",
          },
          {
            label: "Renews",
            value: company.renewsAt,
            hint: `Theme · ${company.defaultTheme}`,
          },
        ]}
      />

      <div className="grid gap-8 lg:grid-cols-2">
        <Panel title="Subscription" description="Access and renewal">
          <dl className="rounded-[var(--admin-radius-sm)] border border-[var(--admin-line)] text-[13px]">
            {(
              [
                ["Tier", company.tier],
                ["Status", company.status],
                ["Renewal", company.renewsAt],
                ["Users", String(company.seatsUsed)],
              ] as const
            ).map(([label, value], i, arr) => (
              <div
                key={label}
                className={`flex justify-between gap-4 px-4 py-2.5 ${
                  i < arr.length - 1 ? "border-b border-[var(--admin-line)]" : ""
                }`}
              >
                <dt className="text-[var(--admin-muted)]">{label}</dt>
                <dd className="font-medium capitalize">{value}</dd>
              </div>
            ))}
            <div className="flex justify-between gap-4 border-t border-[var(--admin-line)] px-4 py-2.5">
              <dt className="text-[var(--admin-muted)]">Soft lock</dt>
              <dd>
                <SoftLockBadge state={company.softLock} />
              </dd>
            </div>
          </dl>
        </Panel>

        <Panel title="Team" description="Users on this tenant" flush>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-4">Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="pr-4">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} className="border-[var(--admin-line)]">
                  <TableCell className="pl-4">
                    <div className="text-[13px] font-medium">{user.name}</div>
                    <div className="text-[11px] text-[var(--admin-faint)]">
                      {user.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    <CompanyRoleBadge role={user.role} />
                  </TableCell>
                  <TableCell className="pr-4 text-[13px] capitalize text-[var(--admin-muted)]">
                    {user.status}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Panel>
      </div>
    </>
  );
}
