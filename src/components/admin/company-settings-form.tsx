"use client";

import { useState } from "react";
import { AdminPageHeader, Panel, StatStrip } from "@/components/admin/admin-ui";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Company, CompanyUser } from "@/lib/admin/dummy-data";

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

export function CompanySettingsForm({
  company,
  users,
}: {
  company: Company;
  users: CompanyUser[];
}) {
  const [theme, setTheme] = useState(company.defaultTheme);
  const [saved, setSaved] = useState(false);

  const activeEmployees = users.filter(
    (u) => u.role !== "admin" && u.status === "active",
  ).length;

  function save() {
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  }

  return (
    <>
      <AdminPageHeader
        title="Settings"
        description="Default calculator theme and read-only usage for this firm."
      />

      <StatStrip
        items={[
          {
            label: "Reports this month",
            value: company.reportsThisMonth.toLocaleString("en-IN"),
            tone: "positive",
          },
          {
            label: "Active employees",
            value: activeEmployees,
          },
        ]}
        className="lg:grid-cols-2 sm:grid-cols-2"
      />

      <Panel
        title="Default theme"
        description="Applied when advisors open calculators"
      >
        <div className="max-w-xs space-y-1.5">
          <Label className="text-[12px]">Theme</Label>
          <Select value={theme} onValueChange={setTheme}>
            <SelectTrigger className="h-9 border-[var(--admin-line)] shadow-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {THEMES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button className="mt-3 h-8 px-3 text-[13px]" onClick={save}>
            {saved ? "Saved (local)" : "Save theme"}
          </Button>
        </div>
      </Panel>
    </>
  );
}
