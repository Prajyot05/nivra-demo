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
        description="Company admin can edit name, logo, phone, email, and disclaimer. App chrome stays Nivra-branded; company branding applies to PDF reports. Persist to Neon Organization in a follow-up."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Company details" description="Editable locally for now">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <CompanyLogoMark
                initials={company.logoInitials}
                color={company.logoColor}
              />
              <p className="text-xs text-muted-foreground">
                Logo upload via ImageKit comes later.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="co-name">Company name</Label>
              <Input
                id="co-name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="co-phone">Phone</Label>
              <Input
                id="co-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="co-email">Email</Label>
              <Input
                id="co-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="co-disclaimer">Disclaimer</Label>
              <textarea
                id="co-disclaimer"
                className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={disclaimer}
                onChange={(e) => setDisclaimer(e.target.value)}
              />
            </div>
            <Button onClick={save}>{saved ? "Saved (local)" : "Save"}</Button>
          </div>
        </Panel>

        <Panel title="Report preview chrome">
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="mb-4 flex items-center gap-3">
              <CompanyLogoMark
                initials={company.logoInitials}
                color={company.logoColor}
                size="sm"
              />
              <div>
                <p className="font-medium">{companyName}</p>
                <p className="text-xs text-muted-foreground">
                  {email} · {phone}
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{disclaimer}</p>
            <PoweredByNivra className="mt-4" />
          </div>
        </Panel>
      </div>
    </>
  );
}
