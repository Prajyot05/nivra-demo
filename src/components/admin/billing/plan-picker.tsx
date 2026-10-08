"use client";

import { formatINRCurrency } from "@nivra/ui/format";
import { Check, Clock, Mail, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { SubscriptionTier } from "@/lib/admin/dummy-data";
import {
  ANNUAL_SAVINGS_LABEL,
  BILLING_CONTACT_EMAIL,
  BILLING_PLANS,
  TIER_ORDER,
  priceFor,
  type BillingCycle,
  type BillingPlan,
} from "@/lib/billing/plans";
import { cn } from "@/lib/utils";

export function PlanPicker({
  currentTier,
  companyName,
}: {
  currentTier: SubscriptionTier;
  companyName: string;
}) {
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  const [selected, setSelected] = useState<BillingPlan | null>(null);
  const currentRank = TIER_ORDER.indexOf(currentTier);

  return (
    <section id="plans" className="admin-card scroll-mt-6 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold tracking-tight text-[var(--admin-ink)]">
            Plans
          </h2>
          <p className="mt-0.5 text-[12px] text-[var(--admin-muted)]">
            Every plan includes unlimited team members and branded PDF reports.
          </p>
        </div>
        <CycleToggle value={cycle} onChange={setCycle} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {BILLING_PLANS.map((plan) => {
          const rank = TIER_ORDER.indexOf(plan.tier);
          return (
            <PlanCard
              key={plan.tier}
              plan={plan}
              cycle={cycle}
              current={plan.tier === currentTier}
              direction={rank > currentRank ? "up" : "down"}
              onChoose={() => setSelected(plan)}
            />
          );
        })}
      </div>

      {selected ? (
        <ChangePlanDialog
          plan={selected}
          cycle={cycle}
          direction={TIER_ORDER.indexOf(selected.tier) > currentRank ? "up" : "down"}
          companyName={companyName}
          onClose={() => setSelected(null)}
        />
      ) : null}
    </section>
  );
}

function CycleToggle({
  value,
  onChange,
}: {
  value: BillingCycle;
  onChange: (value: BillingCycle) => void;
}) {
  const options: Array<{ id: BillingCycle; label: string; hint?: string }> = [
    { id: "monthly", label: "Monthly" },
    { id: "annual", label: "Annual", hint: ANNUAL_SAVINGS_LABEL },
  ];
  return (
    <div
      role="radiogroup"
      aria-label="Billing cycle"
      className="inline-flex shrink-0 rounded-[var(--admin-radius-sm)] border border-[var(--admin-line)] bg-[var(--admin-soft)] p-0.5"
    >
      {options.map((option) => {
        const active = value === option.id;
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.id)}
            className={cn(
              "flex h-7 items-center gap-1.5 rounded-md px-3 text-[12px] font-medium transition-colors",
              active
                ? "bg-white text-[var(--admin-ink)] shadow-[0_1px_2px_rgba(10,10,10,0.08)]"
                : "text-[var(--admin-muted)] hover:text-[var(--admin-ink)]",
            )}
          >
            {option.label}
            {option.hint ? (
              <span
                className={cn(
                  "rounded px-1.5 py-px text-[10px] font-semibold",
                  active
                    ? "bg-[var(--admin-brand-soft)] text-[var(--admin-brand)]"
                    : "bg-white text-[var(--admin-muted)]",
                )}
              >
                {option.hint}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

function PriceLine({ plan, cycle }: { plan: BillingPlan; cycle: BillingCycle }) {
  const price = priceFor(plan, cycle);
  if (price == null) {
    return (
      <div>
        <p className="text-[1.75rem] font-semibold leading-none tracking-tight text-[var(--admin-ink)]">
          Custom
        </p>
        <p className="mt-2 text-[12px] text-[var(--admin-muted)]">Volume pricing, billed annually</p>
      </div>
    );
  }
  return (
    <div>
      <p className="flex items-baseline gap-1">
        <span className="text-[1.75rem] font-semibold leading-none tracking-tight tabular-nums text-[var(--admin-ink)]">
          {formatINRCurrency(price)}
        </span>
        <span className="text-[13px] text-[var(--admin-muted)]">
          /{cycle === "annual" ? "year" : "month"}
        </span>
      </p>
      <p className="mt-2 text-[12px] text-[var(--admin-muted)]">
        {cycle === "annual" ? `Billed yearly, ${ANNUAL_SAVINGS_LABEL}` : "Billed monthly"} · plus GST
      </p>
    </div>
  );
}

function PlanCard({
  plan,
  cycle,
  current,
  direction,
  onChoose,
}: {
  plan: BillingPlan;
  cycle: BillingCycle;
  current: boolean;
  direction: "up" | "down";
  onChoose: () => void;
}) {
  const custom = plan.monthlyPrice == null;
  return (
    <article
      className={cn(
        "relative flex flex-col rounded-[var(--admin-radius)] border bg-white",
        current
          ? "border-[var(--admin-ink)] shadow-[0_0_0_1px_var(--admin-ink)]"
          : "border-[var(--admin-line)]",
      )}
      aria-current={current ? "true" : undefined}
    >
      {current ? (
        <div className="rounded-t-[calc(var(--admin-radius)-1px)] bg-[var(--admin-ink)] px-5 py-1.5 text-[11px] font-medium text-white">
          Your current plan
        </div>
      ) : null}
      <div className="flex flex-1 flex-col gap-5 p-5">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-[15px] font-semibold tracking-tight text-[var(--admin-ink)]">
              {plan.tier}
            </h3>
            {plan.highlight && !current ? (
              <span className="rounded-full border border-[var(--admin-line)] bg-[var(--admin-soft)] px-2 py-0.5 text-[10px] font-medium text-[var(--admin-ink)]">
                {plan.highlight}
              </span>
            ) : null}
          </div>
          <p className="min-h-[2.5rem] text-[12px] leading-relaxed text-[var(--admin-muted)] text-pretty">
            {plan.tagline}
          </p>
        </div>

        <PriceLine plan={plan} cycle={cycle} />

        {current ? (
          <Button
            variant="outline"
            disabled
            className="h-9 w-full border-[var(--admin-line)] text-[13px] shadow-none"
          >
            Current plan
          </Button>
        ) : custom ? (
          <Button
            variant="outline"
            className="h-9 w-full border-[var(--admin-line)] bg-white text-[13px] text-[var(--admin-ink)] shadow-none hover:bg-[var(--admin-soft)]"
            asChild
          >
            <a
              href={`mailto:${BILLING_CONTACT_EMAIL}?subject=${encodeURIComponent("Nivra Enterprise plan enquiry")}`}
            >
              Talk to Nivra
            </a>
          </Button>
        ) : (
          <Button
            variant={direction === "up" ? "default" : "outline"}
            onClick={onChoose}
            className={cn(
              "h-9 w-full text-[13px] shadow-none",
              direction === "up"
                ? "bg-[var(--admin-ink)] text-white hover:bg-[#262626]"
                : "border-[var(--admin-line)] bg-white text-[var(--admin-ink)] hover:bg-[var(--admin-soft)]",
            )}
          >
            {direction === "up" ? `Upgrade to ${plan.tier}` : `Switch to ${plan.tier}`}
          </Button>
        )}

        <ul className="space-y-2 border-t border-[var(--admin-line)] pt-4">
          {plan.features.map((feature) => (
            <li key={feature} className="flex gap-2 text-[12.5px] leading-snug text-[var(--admin-ink)]">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--admin-brand)]" aria-hidden />
              {feature}
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}

function ChangePlanDialog({
  plan,
  cycle,
  direction,
  companyName,
  onClose,
}: {
  plan: BillingPlan;
  cycle: BillingCycle;
  direction: "up" | "down";
  companyName: string;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const price = priceFor(plan, cycle);
  const title = direction === "up" ? `Upgrade to ${plan.tier}` : `Switch to ${plan.tier}`;
  const subject = `${title} (${cycle === "annual" ? "annual" : "monthly"}) for ${companyName}`;

  useEffect(() => {
    closeRef.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const rows: Array<[string, string]> = [
    ["Workspace", companyName],
    ["Plan", plan.tier],
    ["Billing cycle", cycle === "annual" ? "Annual" : "Monthly"],
    [
      cycle === "annual" ? "Price per year" : "Price per month",
      price == null ? "Custom" : formatINRCurrency(price),
    ],
    ["Reports per month", plan.reportLimit == null ? "Unlimited" : plan.reportLimit.toLocaleString("en-IN")],
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-[rgba(10,10,10,0.4)] backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="change-plan-title"
        className="relative w-full max-w-md rounded-t-[var(--admin-radius)] bg-white shadow-[0_24px_64px_rgba(10,10,10,0.18)] sm:rounded-[var(--admin-radius)]"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[var(--admin-line)] px-5 py-4">
          <div>
            <h2 id="change-plan-title" className="text-[15px] font-semibold tracking-tight text-[var(--admin-ink)]">
              {title}
            </h2>
            <p className="mt-0.5 text-[12px] text-[var(--admin-muted)]">Review your new plan before payment.</p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="-mr-1 rounded-md p-1 text-[var(--admin-muted)] outline-none hover:bg-[var(--admin-soft)] hover:text-[var(--admin-ink)] focus-visible:ring-2 focus-visible:ring-[var(--admin-line)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          <dl className="rounded-[var(--admin-radius-sm)] border border-[var(--admin-line)] text-[13px]">
            {rows.map(([label, value], i) => (
              <div
                key={label}
                className={cn(
                  "flex justify-between gap-4 px-4 py-2.5",
                  i > 0 && "border-t border-[var(--admin-line)]",
                )}
              >
                <dt className="text-[var(--admin-muted)]">{label}</dt>
                <dd className="text-right font-medium tabular-nums text-[var(--admin-ink)]">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="text-[12px] text-[var(--admin-muted)]">GST is added at checkout. The new plan starts once payment is confirmed.</p>

          <div className="flex gap-3 rounded-[var(--admin-radius-sm)] bg-[var(--admin-soft)] px-4 py-3">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[var(--admin-muted)]" aria-hidden />
            <p className="text-[12px] leading-relaxed text-[var(--admin-ink)]">
              Online payments are coming soon. Until then, email Nivra billing and the team will
              switch your plan for you.
            </p>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-[var(--admin-line)] px-5 py-4 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            disabled
            className="h-9 border-[var(--admin-line)] text-[13px] shadow-none"
          >
            Continue to payment
          </Button>
          <Button className="h-9 bg-[var(--admin-ink)] text-[13px] text-white shadow-none hover:bg-[#262626]" asChild>
            <a href={`mailto:${BILLING_CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}`}>
              <Mail className="h-3.5 w-3.5" />
              Email Nivra billing
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
