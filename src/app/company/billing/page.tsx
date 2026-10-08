import { formatINRCurrency } from "@nivra/ui/format";
import { ArrowDown, Check, CreditCard, FileText, Minus } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { AdminPageHeader, Panel } from "@/components/admin/admin-ui";
import { PlanPicker } from "@/components/admin/billing/plan-picker";
import { CompanyStatusBadge } from "@/components/admin/status-badges";
import { Button } from "@/components/ui/button";
import { getCompanyById, getDemoCompanyId } from "@/lib/admin/queries";
import {
  ALL_SUITE_CALCULATORS,
  BILLING_CONTACT_EMAIL,
  COMPARISON_GROUPS,
  TIER_ORDER,
  planFor,
} from "@/lib/billing/plans";
import { requireSignedIn } from "@/lib/require-signed-in";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Plan & billing" };

function formatDate(iso: string): string {
  if (!iso) return "Not scheduled";
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function UsageMeter({
  label,
  used,
  limit,
  unit,
  note,
  warnNearLimit = false,
}: {
  label: string;
  used: number;
  limit: number | null;
  unit: string;
  note: string;
  warnNearLimit?: boolean;
}) {
  const ratio = limit ? Math.min(used / limit, 1) : 0;
  const tone = warnNearLimit && ratio >= 0.9 ? "bg-amber-600" : "bg-[var(--admin-ink)]";
  return (
    <div className="space-y-2 px-4 py-4">
      <p className="text-[11px] font-medium text-[var(--admin-faint)]">{label}</p>
      <p className="text-[13px] text-[var(--admin-muted)]">
        <span className="text-[1.125rem] font-semibold tabular-nums tracking-tight text-[var(--admin-ink)]">
          {used.toLocaleString("en-IN")}
        </span>{" "}
        {limit == null ? unit : `of ${limit.toLocaleString("en-IN")} ${unit}`}
      </p>
      <div
        className="h-1.5 overflow-hidden rounded-full bg-[var(--admin-soft)]"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={limit ?? undefined}
        aria-valuenow={used}
      >
        {limit ? (
          <div className={cn("h-full rounded-full", tone)} style={{ width: `${Math.max(ratio * 100, 2)}%` }} />
        ) : (
          <div className="h-full w-full rounded-full bg-[var(--admin-brand-soft)]" />
        )}
      </div>
      <p className="text-[11.5px] text-[var(--admin-muted)]">{note}</p>
    </div>
  );
}

export default async function CompanyBillingPage() {
  await requireSignedIn();
  const companyId = await getDemoCompanyId();
  const company = await getCompanyById(companyId);
  if (!company) notFound();

  const plan = planFor(company.tier);
  const trial = company.status === "trial";
  const reportsLeft =
    plan.reportLimit == null ? null : Math.max(plan.reportLimit - company.reportsThisMonth, 0);

  return (
    <>
      <AdminPageHeader
        title="Plan & billing"
        description="Your subscription, monthly usage and invoices."
        actions={
          <Button
            variant="outline"
            size="sm"
            className="h-8 border-[var(--admin-line)] px-3 text-[13px] shadow-none"
            asChild
          >
            <a href={`mailto:${BILLING_CONTACT_EMAIL}`}>Contact billing</a>
          </Button>
        }
      />

      <section className="overflow-hidden rounded-[var(--admin-radius)] border border-[var(--admin-line)] bg-white">
        <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-1.5">
            <p className="text-[11px] font-medium text-[var(--admin-faint)]">Current plan</p>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[1.375rem] font-semibold tracking-tight text-[var(--admin-ink)]">
                {plan.tier}
              </h2>
              <CompanyStatusBadge status={company.status} />
            </div>
            <p className="text-[13px] text-[var(--admin-muted)]">
              {plan.monthlyPrice == null
                ? "Custom pricing"
                : `${formatINRCurrency(plan.monthlyPrice)} per month, plus GST`}
              <span aria-hidden> · </span>
              {trial ? "Trial ends" : "Renews"} on{" "}
              <span className="font-medium text-[var(--admin-ink)]">{formatDate(company.renewsAt)}</span>
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            {company.tier !== TIER_ORDER[TIER_ORDER.length - 1] ? (
              <Button
                size="sm"
                className="h-8 bg-[var(--admin-ink)] px-3 text-[13px] text-white shadow-none hover:bg-[#262626]"
                asChild
              >
                <Link href="#plans">
                  {trial ? "Choose a plan" : "Change plan"}
                  <ArrowDown className="h-3.5 w-3.5" />
                </Link>
              </Button>
            ) : null}
          </div>
        </div>

        <div className="grid border-t border-[var(--admin-line)] sm:grid-cols-3 sm:divide-x sm:divide-[var(--admin-line)] max-sm:divide-y max-sm:divide-[var(--admin-line)]">
          <UsageMeter
            label="Client reports this month"
            used={company.reportsThisMonth}
            limit={plan.reportLimit}
            unit="reports"
            warnNearLimit
            note={
              reportsLeft == null
                ? "Unlimited on your plan"
                : `${reportsLeft.toLocaleString("en-IN")} left, resets ${formatDate(company.renewsAt)}`
            }
          />
          <UsageMeter
            label="Team members"
            used={company.seatsUsed}
            limit={null}
            unit="active"
            note="No seat limit on any plan"
          />
          <UsageMeter
            label="Calculators included"
            used={company.calculators.length}
            limit={ALL_SUITE_CALCULATORS.length}
            unit="in suite"
            note={
              company.calculators.length >= ALL_SUITE_CALCULATORS.length
                ? "Full suite unlocked"
                : "Upgrade to unlock more planners"
            }
          />
        </div>

        <div className="flex flex-col gap-2 border-t border-[var(--admin-line)] bg-[var(--admin-soft)] px-5 py-3 text-[12.5px] sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-2 text-[var(--admin-muted)]">
            <CreditCard className="h-3.5 w-3.5" aria-hidden />
            <span>
              Payment method: <span className="text-[var(--admin-ink)]">not added</span>. Online
              payments are coming soon.
            </span>
          </p>
          <p className="text-[var(--admin-muted)]">
            Invoices sent to{" "}
            <span className="text-[var(--admin-ink)]">{company.ownerEmail || company.email || "your billing email"}</span>
          </p>
        </div>
      </section>

      <PlanPicker currentTier={company.tier} companyName={company.name} />

      <Panel title="Compare plans" description="What each plan includes" flush>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[40rem] border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-[var(--admin-line)] bg-[var(--admin-soft)]">
                <th scope="col" className="w-[34%] px-4 py-2.5 text-left text-[11px] font-medium text-[var(--admin-faint)]">
                  Feature
                </th>
                {TIER_ORDER.map((tier) => (
                  <th
                    key={tier}
                    scope="col"
                    className={cn(
                      "px-3 py-2.5 text-center text-[12px] font-semibold",
                      tier === company.tier ? "text-[var(--admin-ink)]" : "text-[var(--admin-muted)]",
                    )}
                  >
                    {tier}
                    {tier === company.tier ? (
                      <span className="ml-1.5 rounded bg-[var(--admin-ink)] px-1.5 py-px text-[9.5px] font-medium text-white">
                        Current
                      </span>
                    ) : null}
                  </th>
                ))}
              </tr>
            </thead>
            {COMPARISON_GROUPS.map((group) => (
              <tbody key={group.title}>
                <tr>
                  <th
                    scope="rowgroup"
                    colSpan={TIER_ORDER.length + 1}
                    className="border-b border-[var(--admin-line)] px-4 pb-2 pt-5 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--admin-ink)]"
                  >
                    {group.title}
                  </th>
                </tr>
                {group.rows.map((row) => (
                  <tr key={row.label} className="border-b border-[var(--admin-line)] last:border-b-0">
                    <th scope="row" className="px-4 py-2.5 text-left font-normal text-[var(--admin-ink)]">
                      {row.label}
                    </th>
                    {TIER_ORDER.map((tier) => {
                      const value = row.values[tier];
                      return (
                        <td
                          key={tier}
                          className={cn(
                            "px-3 py-2.5 text-center tabular-nums",
                            tier === company.tier && "bg-[var(--admin-soft)]/60",
                          )}
                        >
                          {value === true ? (
                            <Check className="mx-auto h-4 w-4 text-[var(--admin-brand)]" aria-label="Included" />
                          ) : value === false ? (
                            <Minus className="mx-auto h-4 w-4 text-[var(--admin-line)]" aria-label="Not included" />
                          ) : (
                            <span className="text-[var(--admin-ink)]">{value}</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            ))}
          </table>
        </div>
      </Panel>

      <Panel title="Invoices" description="Download past invoices for your records" flush>
        <div className="grid grid-cols-[1fr_auto_auto] gap-x-6 border-b border-[var(--admin-line)] bg-[var(--admin-soft)] px-4 py-2.5 text-[11px] font-medium text-[var(--admin-faint)] max-sm:hidden">
          <span>Invoice</span>
          <span>Amount</span>
          <span>Status</span>
        </div>
        <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--admin-line)] bg-white">
            <FileText className="h-4 w-4 text-[var(--admin-muted)]" aria-hidden />
          </span>
          <p className="text-[13px] font-medium text-[var(--admin-ink)]">No invoices yet</p>
          <p className="max-w-sm text-[12px] leading-relaxed text-[var(--admin-muted)] text-pretty">
            Invoices with GST details will appear here after your first online payment.
          </p>
        </div>
      </Panel>
    </>
  );
}
