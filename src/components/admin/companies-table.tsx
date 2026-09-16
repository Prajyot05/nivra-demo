"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Panel } from "@/components/admin/admin-ui";
import {
  CompanyLogoMark,
  CompanyStatusBadge,
  SoftLockBadge,
} from "@/components/admin/status-badges";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Company, CompanyStatus } from "@/lib/admin/dummy-data";

const STATUS_FILTERS: Array<"all" | CompanyStatus> = [
  "all",
  "active",
  "trial",
  "suspended",
  "inactive",
];

export function CompaniesTable({ companies }: { companies: Company[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<(typeof STATUS_FILTERS)[number]>("all");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return companies.filter((c) => {
      if (status !== "all" && c.status !== status) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.ownerEmail.toLowerCase().includes(q) ||
        c.tier.toLowerCase().includes(q)
      );
    });
  }, [companies, query, status]);

  return (
    <Panel>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, email, tier…"
          className="sm:max-w-xs"
        />
        <Select
          value={status}
          onValueChange={(value) => setStatus(value as typeof status)}
        >
          <SelectTrigger className="sm:w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTERS.map((s) => (
              <SelectItem key={s} value={s}>
                {s === "all" ? "All statuses" : s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Company</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Soft lock</TableHead>
            <TableHead>Tier</TableHead>
            <TableHead className="text-right">Users</TableHead>
            <TableHead className="text-right">Reports</TableHead>
            <TableHead>Renewal</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((company) => (
            <TableRow key={company.id}>
              <TableCell>
                <Link
                  href={`/admin/companies/${company.id}`}
                  className="flex items-center gap-3 hover:underline"
                >
                  <CompanyLogoMark
                    initials={company.logoInitials}
                    color={company.logoColor}
                    size="sm"
                  />
                  <div>
                    <div className="font-medium">{company.name}</div>
                    <div className="text-xs text-muted-foreground">
                      Owner · {company.ownerEmail}
                    </div>
                  </div>
                </Link>
              </TableCell>
              <TableCell>
                <CompanyStatusBadge status={company.status} />
              </TableCell>
              <TableCell>
                <SoftLockBadge state={company.softLock} />
              </TableCell>
              <TableCell>
                <Badge variant="outline">{company.tier}</Badge>
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {company.seatsUsed}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {company.reportsGenerated.toLocaleString("en-IN")}
              </TableCell>
              <TableCell className="tabular-nums text-muted-foreground">
                {company.renewsAt}
              </TableCell>
            </TableRow>
          ))}
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                No companies match this filter.
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </Panel>
  );
}
