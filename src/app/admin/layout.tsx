import type { Metadata } from "next";
import type { ReactNode } from "react";
import { DashboardShell, type AdminNavItem } from "@/components/admin/dashboard-shell";

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

export default function AdminLayout({ children }: { children: ReactNode }) {
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
