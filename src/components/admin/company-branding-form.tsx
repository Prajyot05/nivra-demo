"use client";

import { useState } from "react";
import { AdminPageHeader, Panel } from "@/components/admin/admin-ui";
import { CompanyLogoMark } from "@/components/admin/status-badges";
import { PoweredByNivra } from "@/components/admin/branding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Company } from "@/lib/admin/dummy-data";

export function CompanyBrandingForm({ company }: { company: Company }) {
  const [companyName, setCompanyName] = useState(company.name);
  const [phone, setPhone] = useState(company.phone);
  const [email, setEmail] = useState(company.email);
  const [disclaimer, setDisclaimer] = useState(
    "This report is for illustrative purposes only and does not constitute investment advice. Past performance is not indicative of future results. Please consult your advisor before making financial decisions.",
  );
  const [saved, setSaved] = useState(false);

  function save() {
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  }

  return (
    <>
      <AdminPageHeader
        title="Branding"
        description="Edit name, logo, phone, email, and disclaimer for PDF reports. App chrome stays Nivra-branded."
      />

      <div className="grid gap-8 lg:grid-cols-2">
        <Panel title="Company details" description="Editable locally for now">
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-[var(--admin-radius-sm)] border border-dashed border-[var(--admin-line)] bg-[var(--admin-soft)]/50 p-3">
              <CompanyLogoMark
                initials={company.logoInitials}
                color={company.logoColor}
              />
              <p className="text-[12px] leading-relaxed text-[var(--admin-muted)]">
                Logo upload via ImageKit comes later. Initials mark is used until then.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="co-name" className="text-[12px]">
                Company name
              </Label>
              <Input
                id="co-name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="h-9 border-[var(--admin-line)] shadow-none"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="co-phone" className="text-[12px]">
                Phone
              </Label>
              <Input
                id="co-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-9 border-[var(--admin-line)] shadow-none"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="co-email" className="text-[12px]">
                Email
              </Label>
              <Input
                id="co-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-9 border-[var(--admin-line)] shadow-none"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="co-disclaimer" className="text-[12px]">
                Disclaimer
              </Label>
              <textarea
                id="co-disclaimer"
                className="min-h-28 w-full rounded-[var(--admin-radius-sm)] border border-[var(--admin-line)] bg-white px-3 py-2 text-[13px] text-[var(--admin-ink)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--admin-ink)]/20"
                value={disclaimer}
                onChange={(e) => setDisclaimer(e.target.value)}
              />
            </div>
            <Button className="h-8 px-3 text-[13px]" onClick={save}>
              {saved ? "Saved (local)" : "Save"}
            </Button>
          </div>
        </Panel>

        <Panel title="Report preview" description="How branding appears on PDFs">
          <div className="rounded-[var(--admin-radius-sm)] border border-[var(--admin-line)] bg-[var(--admin-soft)]/40 p-5">
            <div className="mb-4 flex items-center gap-3 border-b border-[var(--admin-line)] pb-4">
              <CompanyLogoMark
                initials={company.logoInitials}
                color={company.logoColor}
                size="sm"
              />
              <div>
                <p className="text-[13px] font-semibold">{companyName}</p>
                <p className="text-[11px] text-[var(--admin-muted)]">
                  {email} · {phone}
                </p>
              </div>
            </div>
            <p className="text-[12px] leading-relaxed text-[var(--admin-muted)]">
              {disclaimer}
            </p>
            <PoweredByNivra className="mt-5" />
          </div>
        </Panel>
      </div>
    </>
  );
}
