"use client";

import Link from "next/link";
import { Building2, ShieldCheck } from "lucide-react";
import { LinkPendingIcon } from "@/components/layout/link-pending-icon";
import { Button } from "@/components/ui/button";

const LINKS = {
  NIVRA_ADMIN: [
    { href: "/admin", label: "Admin dashboard", icon: ShieldCheck },
    { href: "/company", label: "Company dashboard", icon: Building2 },
  ],
  COMPANY_ADMIN: [{ href: "/company", label: "Company dashboard", icon: Building2 }],
} as const;

export function AdminDashboardLinks({
  role,
  onNavigate,
}: {
  role: string | null;
  onNavigate?: () => void;
}) {
  const links = role && role in LINKS ? LINKS[role as keyof typeof LINKS] : null;
  if (!links) return null;

  return (
    <>
      {links.map(({ href, label, icon: Icon }) => (
        <Button
          key={href}
          asChild
          variant="outline"
          size="sm"
          className="w-full justify-start text-slate-700"
        >
          <Link href={href} onClick={onNavigate}>
            <LinkPendingIcon icon={Icon} />
            {label}
          </Link>
        </Button>
      ))}
    </>
  );
}
