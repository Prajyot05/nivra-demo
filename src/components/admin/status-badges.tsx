import { Badge } from "@/components/ui/badge";
import type {
  CompanyStatus,
  CompanyUserRole,
  NivraStaffRole,
  SoftLockState,
} from "@/lib/admin/dummy-data";
import { cn } from "@/lib/utils";

const statusStyles: Record<CompanyStatus, string> = {
  active: "border-transparent bg-emerald-100 text-emerald-800",
  trial: "border-transparent bg-sky-100 text-sky-800",
  suspended: "border-transparent bg-amber-100 text-amber-900",
  inactive: "border-transparent bg-slate-100 text-slate-700",
};

export function CompanyStatusBadge({ status }: { status: CompanyStatus }) {
  return (
    <Badge variant="outline" className={cn("capitalize", statusStyles[status])}>
      {status}
    </Badge>
  );
}

export function SoftLockBadge({ state }: { state: SoftLockState }) {
  if (state === "none") {
    return <span className="text-xs text-muted-foreground">—</span>;
  }
  return (
    <Badge
      variant="outline"
      className={cn(
        state === "view_only"
          ? "border-transparent bg-amber-100 text-amber-900"
          : "border-transparent bg-rose-100 text-rose-800",
      )}
    >
      {state === "view_only" ? "Soft lock (view-only)" : "Hard locked"}
    </Badge>
  );
}

export function CompanyRoleBadge({ role }: { role: CompanyUserRole }) {
  const label =
    role === "admin" ? "Admin (Owner)" : role === "advisor" ? "Advisor" : "Viewer";
  return (
    <Badge variant="secondary" className="font-medium">
      {label}
    </Badge>
  );
}

export function NivraRoleBadge({ role }: { role: NivraStaffRole }) {
  return (
    <Badge variant="secondary" className="font-medium">
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
  size?: "sm" | "md";
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-md font-semibold text-white",
        size === "sm" ? "h-8 w-8 text-[10px]" : "h-10 w-10 text-xs",
      )}
      style={{ backgroundColor: color }}
      aria-hidden
    >
      {initials}
    </span>
  );
}
