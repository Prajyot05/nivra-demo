import { Badge } from "@/components/ui/badge";
import type {
  CompanyStatus,
  CompanyUserRole,
  NivraStaffRole,
  SoftLockState,
} from "@/lib/admin/dummy-data";
import { cn } from "@/lib/utils";

const statusStyles: Record<CompanyStatus, string> = {
  active: "border-transparent bg-[var(--admin-brand-soft)] text-[var(--admin-brand)]",
  trial: "border-transparent bg-sky-50 text-sky-800",
  suspended: "border-transparent bg-amber-50 text-amber-900",
  inactive: "border-transparent bg-[var(--admin-soft)] text-[var(--admin-muted)]",
};

const statusDot: Record<CompanyStatus, string> = {
  active: "bg-[var(--admin-brand)]",
  trial: "bg-sky-500",
  suspended: "bg-amber-500",
  inactive: "bg-[var(--admin-faint)]",
};

export function CompanyStatusBadge({ status }: { status: CompanyStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium capitalize",
        statusStyles[status],
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", statusDot[status])} aria-hidden />
      {status}
    </Badge>
  );
}

export function SoftLockBadge({ state }: { state: SoftLockState }) {
  if (state === "none") {
    return <span className="text-[12px] text-[var(--admin-faint)]">None</span>;
  }
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full px-2 py-0.5 text-[11px] font-medium",
        state === "view_only"
          ? "border-transparent bg-amber-50 text-amber-900"
          : "border-transparent bg-rose-50 text-rose-800",
      )}
    >
      {state === "view_only" ? "Soft lock" : "Hard locked"}
    </Badge>
  );
}

export function CompanyRoleBadge({ role }: { role: CompanyUserRole }) {
  const label =
    role === "admin" ? "Admin (Owner)" : role === "advisor" ? "Advisor" : "Viewer";
  return (
    <Badge
      variant="outline"
      className="rounded-full border-[var(--admin-line)] bg-[var(--admin-soft)] px-2 py-0.5 text-[11px] font-medium text-[var(--admin-ink)]"
    >
      {label}
    </Badge>
  );
}

export function NivraRoleBadge({ role }: { role: NivraStaffRole }) {
  return (
    <Badge
      variant="outline"
      className="rounded-full border-transparent bg-[var(--admin-brand-soft)] px-2 py-0.5 text-[11px] font-medium text-[var(--admin-brand)]"
    >
      {role === "main_admin" ? "Main admin" : "Support staff"}
    </Badge>
  );
}

export function CompanyLogoMark({
  initials,
  color,
  size = "md",
}: {
  initials: string;
  color: string;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white",
        size === "sm" && "h-7 w-7 text-[10px]",
        size === "md" && "h-10 w-10 text-xs",
        size === "lg" && "h-12 w-12 text-sm",
      )}
      style={{ backgroundColor: color }}
      aria-hidden
    >
      {initials}
    </span>
  );
}
