"use client";

import { WealthFieldShell } from "./wealth-field";
import { cn } from "@/lib/utils";

/** Native select styled like wealth inputs. */
export function WealthSelectField({
  label,
  value,
  onChange,
  options,
  hint,
  error,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  hint?: string;
  error?: string;
  className?: string;
}) {
  return (
    <WealthFieldShell label={label} helper={hint} error={error} className={className}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "h-auto w-full appearance-none rounded-lg border-0 bg-transparent px-3 py-2.5 text-sm text-slate-900 outline-none",
          "bg-[length:1rem] bg-[right_0.75rem_center] bg-no-repeat pr-9",
          "bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 24 24%27 stroke=%27%2394a3b8%27%3E%3Cpath stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%271.5%27 d=%27m6 9 6 6 6-6%27/%3E%3C/svg%3E')]",
        )}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </WealthFieldShell>
  );
}
