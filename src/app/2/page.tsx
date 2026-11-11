import type { Metadata } from "next";
import Link from "next/link";
import { V2_PHASE1_CALCULATORS } from "@/components/v2";

export const metadata: Metadata = {
  title: "Advisory Calculators",
};

export default function V2IndexPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-[24px] font-semibold tracking-tight text-[var(--v2-ink)]">
        Advisory calculators
      </h1>
      <p className="mt-2 text-[15px] leading-relaxed text-[var(--v2-muted)]">
        A quieter, denser planning interface for clients aged 40 to 60. Phase 1 ships three
        calculators on the new design system. Remaining tools stay on the classic UI until
        reviewed.
      </p>

      <ul className="mt-6 divide-y divide-[var(--v2-border)] rounded-[var(--v2-radius)] border border-[var(--v2-border)] bg-[var(--v2-surface)]">
        {V2_PHASE1_CALCULATORS.map((item) => (
          <li key={item.slug}>
            <Link
              href={`/2/${item.slug}`}
              className="flex flex-col gap-1 px-4 py-3.5 transition-colors hover:bg-[var(--v2-bg)] sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-[15px] font-semibold text-[var(--v2-ink)]">{item.label}</p>
                <p className="mt-0.5 text-[13px] text-[var(--v2-muted)]">{item.description}</p>
              </div>
              <span className="text-[12px] font-medium text-[var(--v2-navy)] sm:shrink-0">
                Open →
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <p className="mt-5 text-[13px] text-[var(--v2-faint)]">
        Classic suite routes are unchanged; use Classic UI on each calculator when you need the
        prior layout. Calculation engines are shared.
      </p>
    </div>
  );
}
