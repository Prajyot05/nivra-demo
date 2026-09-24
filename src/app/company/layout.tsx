import type { Metadata } from "next";
import type { ReactNode } from "react";
import { DashboardShell, type AdminNavItem } from "@/components/admin/dashboard-shell";
import { requireSignedIn } from "@/lib/require-signed-in";

export const metadata: Metadata = {
  title: "Company Admin",
};

const NAV: AdminNavItem[] = [
  { href: "/company", label: "Overview", icon: "layout-dashboard", exact: true },
  { href: "/company/users", label: "Users & seats", icon: "users" },
  { href: "/company/branding", label: "Branding", icon: "image" },
  { href: "/company/calculators", label: "Calculators", icon: "calculator" },
  { href: "/company/settings", label: "Settings", icon: "settings" },
];

export default async function CompanyAdminLayout({ children }: { children: ReactNode }) {
  await requireSignedIn();
  return (
    <DashboardShell
      brandSubtitle="Acme Wealth Advisors · Company admin"
      nav={NAV}
      switchLink={{ href: "/admin", label: "Open Nivra admin" }}
    >
      {children}
    </DashboardShell>
  );
}
