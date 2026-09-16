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
        description="Default theme and read-only usage. Theme persist to Organization.defaultTheme comes next."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <StatTile
          label="Reports this month"
          value={company.reportsThisMonth.toLocaleString("en-IN")}
          icon={FileBarChart}
        />
        <StatTile
          label="Active employees"
          value={activeEmployees}
          icon={Briefcase}
        />
      </div>

      <Panel title="Default theme">
        <div className="max-w-xs space-y-2">
          <Label>Theme</Label>
          <Select value={theme} onValueChange={setTheme}>
            <SelectTrigger>
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
          <Button className="mt-3" onClick={save}>
            {saved ? "Saved (local)" : "Save theme"}
          </Button>
        </div>
      </Panel>
    </>
  );
}
