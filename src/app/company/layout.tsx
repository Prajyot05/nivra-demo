import type { Metadata } from "next";
import type { ReactNode } from "react";
import { DashboardShell, type AdminNavItem } from "@/components/admin/dashboard-shell";

export const metadata: Metadata = {
  title: "Company Admin",
};

const NAV: AdminNavItem[] = [
  { href: "/company", label: "Overview", icon: "layout-dashboard", exact: true },
  { href: "/company/analytics", label: "Analytics", icon: "chart-column" },
  { href: "/company/users", label: "Users & seats", icon: "users" },
  { href: "/company/branding", label: "Branding", icon: "image" },
  { href: "/company/calculators", label: "Calculators", icon: "calculator" },
  { href: "/company/settings", label: "Settings", icon: "settings" },
];

export default function CompanyAdminLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardShell
      brandSubtitle="Acme Wealth Advisors"
      nav={NAV}
      switchLink={{ href: "/admin", label: "Nivra admin" }}
    >
      {children}
    </DashboardShell>
  );
}
