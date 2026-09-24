import type { Metadata } from "next";
import type { ReactNode } from "react";
import { DashboardShell, type AdminNavItem } from "@/components/admin/dashboard-shell";
import { requireSignedIn } from "@/lib/require-signed-in";

export const metadata: Metadata = {
  title: "Nivra Admin",
};

const NAV: AdminNavItem[] = [
  { href: "/admin", label: "Overview", icon: "layout-dashboard", exact: true },
  { href: "/admin/analytics", label: "Analytics", icon: "chart-column" },
  { href: "/admin/companies", label: "Companies", icon: "building-2" },
  { href: "/admin/staff", label: "Staff & roles", icon: "shield-check" },
  { href: "/admin/reports", label: "Reports", icon: "file-bar-chart" },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireSignedIn();
  return (
    <DashboardShell
      brandSubtitle="Platform"
      nav={NAV}
      switchLink={{ href: "/company", label: "Company admin" }}
    >
      {children}
    </DashboardShell>
  );
}
