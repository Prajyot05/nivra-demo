"use client";

import { useState } from "react";
import { FileBarChart, Briefcase } from "lucide-react";
import { AdminPageHeader, Panel, StatTile } from "@/components/admin/admin-ui";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DEMO_COMPANY_ID, getCompany, getCompanyUsers } from "@/lib/admin/dummy-data";

const THEMES = [
  "classic",
  "ocean",
  "forest",
  "sunset",
  "slate",
  "coral",
  "indigo",
  "mint",
  "rose",
  "amber",
  "wine",
  "sky",
];

export default function CompanySettingsPage() {
  const company = getCompany(DEMO_COMPANY_ID)!;
  const users = getCompanyUsers(company.id);
  const [theme, setTheme] = useState(company.defaultTheme);
  const [saved, setSaved] = useState(false);

  const reportsThisMonth = company.reportsThisMonth;
  const activeAdvisors = users.filter(
    (u) => u.role === "advisor" && u.status === "active",
  ).length;

  return (
    <>
      <AdminPageHeader
        title="Settings"
        description="Default calculator theme for the company. Usage below is read-only."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <StatTile
          label="Reports this month"
          value={reportsThisMonth.toLocaleString("en-IN")}
          hint="Read-only"
          icon={FileBarChart}
        />
        <StatTile label="Active advisors" value={activeAdvisors} hint="Read-only" icon={Briefcase} />
      </div>

      <Panel title="Default theme" description="Applied for advisors on calculator pages">
        <div className="max-w-sm space-y-3">
          <div className="space-y-1.5">
            <Label>Theme</Label>
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {THEMES.map((id) => (
                  <SelectItem key={id} value={id}>
                    {id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              onClick={() => {
                setSaved(true);
                window.setTimeout(() => setSaved(false), 2000);
              }}
            >
              Save default theme
            </Button>
            {saved ? (
              <span className="text-sm text-muted-foreground">Saved (dummy).</span>
            ) : null}
          </div>
        </div>
      </Panel>

      <Panel title="Org rules (confirmed)">
        <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
          <li>One organisation per user account.</li>
          <li>No client logins — advisors generate reports for clients.</li>
          <li>Shared app URL; branding swaps after login (no custom domain at launch).</li>
          <li>App chrome uses Nivra logo; reports use company branding + Powered by Nivra.</li>
        </ul>
      </Panel>
    </>
  );
}
