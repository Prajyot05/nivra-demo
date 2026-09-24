import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import {
  AdminIdentityCard,
  AdminPageHeader,
  Panel,
  StatStrip,
} from "@/components/admin/admin-ui";
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
import { requireSignedIn } from "@/lib/require-signed-in";

export default async function CompanyOverviewPage() {
  await requireSignedIn();
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
        title="Overview"
        description={`Plan, users, renewal, and usage for your firm. Source: ${source}.`}
        actions={
          <Button size="sm" className="h-8 px-3 text-[13px]" asChild>
            <Link href="/company/analytics">
              Open analytics
              <ArrowRight className="h-3.5 w-3.5" />
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
          <p>
            Renews {company.renewsAt} · Default theme {company.defaultTheme}
          </p>
        }
      />

      <StatStrip
        items={[
          {
            label: "Plan",
            value: company.tier,
            hint: `Status · ${company.status}`,
          },
          {
            label: "Users",
            value: `${company.seatsUsed} active`,
            hint: "Member seat caps deferred for v1",
          },
          {
            label: "Reports this month",
            value: company.reportsThisMonth.toLocaleString("en-IN"),
            hint: "Read-only usage",
            tone: "positive",
          },
          {
            label: "Active employees",
            value: activeEmployees,
            hint: "Company employees (non-admin)",
          },
        ]}
      />

      <div className="grid gap-8 lg:grid-cols-2">
        <Panel title="Subscription" description="Renewal and access state">
          <dl className="rounded-[var(--admin-radius-sm)] border border-[var(--admin-line)] text-[13px]">
            {(
              [
                ["Tier", company.tier],
                ["Renewal date", company.renewsAt],
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
                <dd className="font-medium tabular-nums">{value}</dd>
              </div>
            ))}
            <div className="flex justify-between gap-4 border-t border-[var(--admin-line)] px-4 py-2.5">
              <dt className="text-[var(--admin-muted)]">Soft lock</dt>
              <dd>
                <SoftLockBadge state={company.softLock} />
              </dd>
            </div>
          </dl>
          <p className="mt-3 text-[12px] leading-relaxed text-[var(--admin-muted)]">
            Expired or suspended tenants get a 3-day view-only soft lock, then hard
            lock. Razorpay billing is stubbed until gateway credentials land.
          </p>
        </Panel>

        <Panel title="Quick links" description="Common company admin tasks">
          <div className="grid gap-1.5">
            {[
              { href: "/company/users", label: "Add or remove users" },
              { href: "/company/branding", label: "Edit disclaimer, logo, contact" },
              { href: "/company/calculators", label: "See calculators on this plan" },
              { href: "/", label: "Open calculators" },
            ].map((item) => (
              <Button
                key={item.href}
                variant="outline"
                className="h-9 justify-between border-[var(--admin-line)] bg-white text-[13px] font-normal text-[var(--admin-ink)] shadow-none hover:bg-[var(--admin-soft)]"
                asChild
              >
                <Link href={item.href}>
                  {item.label}
                  <ArrowRight className="h-3.5 w-3.5 text-[var(--admin-faint)]" />
                </Link>
              </Button>
            ))}
          </div>
        </Panel>
      </div>
    </>
  );
}
