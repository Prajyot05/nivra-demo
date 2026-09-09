"use client";

import { useState } from "react";
import { AdminPageHeader, Panel } from "@/components/admin/admin-ui";
import { CompanyLogoMark } from "@/components/admin/status-badges";
import { PoweredByNivra } from "@/components/admin/branding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEMO_COMPANY_ID, getCompany } from "@/lib/admin/dummy-data";

export default function CompanyBrandingPage() {
  const company = getCompany(DEMO_COMPANY_ID)!;
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
        description="Admin and Advisor can edit company name, logo, phone, email, and disclaimer. App chrome stays Nivra-branded; company branding applies to PDF reports."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Company details" description="Editable by Admin & Advisor">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <CompanyLogoMark
                initials={company.logoInitials}
                color={company.logoColor}
              />
              <div>
                <p className="text-sm font-medium">Company logo</p>
                <p className="text-xs text-muted-foreground">
                  Upload via ImageKit later — placeholder mark for now.
                </p>
                <Button variant="outline" size="sm" className="mt-2" type="button" disabled>
                  Upload logo (soon)
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="co-name">Company name</Label>
              <Input
                id="co-name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="co-phone">Phone</Label>
              <Input
                id="co-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="co-email">Email</Label>
              <Input
                id="co-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="co-disclaimer">Disclaimer</Label>
              <textarea
                id="co-disclaimer"
                value={disclaimer}
                onChange={(e) => setDisclaimer(e.target.value)}
                rows={5}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <div className="flex items-center gap-3">
              <Button type="button" onClick={save}>
                Save changes
              </Button>
              {saved ? (
                <span className="text-sm text-muted-foreground">Saved (dummy).</span>
              ) : null}
            </div>
          </div>
        </Panel>

        <Panel title="Report preview" description="Company branding on PDF; Nivra on chrome + footer">
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <div className="flex items-center gap-3 border-b border-border pb-3">
              <CompanyLogoMark
                initials={company.logoInitials}
                color={company.logoColor}
                size="sm"
              />
              <div>
                <p className="text-sm font-semibold">{companyName}</p>
                <p className="text-xs text-muted-foreground">
                  {phone} · {email}
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">Sample client report body…</p>
            <p className="mt-6 text-[11px] leading-relaxed text-muted-foreground">
              {disclaimer}
            </p>
            <div className="mt-4 border-t border-border pt-3">
              <PoweredByNivra />
            </div>
          </div>
        </Panel>
      </div>
    </>
  );
}
