"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AdminPagination, Panel } from "@/components/admin/admin-ui";
import {
  CompanyLogoMark,
  CompanyStatusBadge,
  SoftLockBadge,
} from "@/components/admin/status-badges";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Company } from "@/lib/admin/dummy-data";
import { Search } from "lucide-react";

/**
 * Paginated company metrics table for analytics / reports.
 * Never mounts all 500–1000 rows at once.
 */
export function CompaniesMetricsTable({
  companies,
  title = "Company metrics",
  description = "Search and page. Full corpus stays off-screen.",
}: {
  companies: Company[];
  title?: string;
  description?: string;
}) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return companies;
    return companies.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.ownerEmail.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q),
    );
  }, [companies, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const rows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <Panel
      title={title}
      description={description}
      actions={
        <div className="relative w-full sm:w-52">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--admin-faint)]" />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search…"
            className="h-8 border-[var(--admin-line)] bg-white pl-8 text-[13px] shadow-none"
          />
        </div>
      }
      flush
    >
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-4">Company</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Soft lock</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead className="text-right">Users</TableHead>
              <TableHead className="text-right">This month</TableHead>
              <TableHead className="pr-4 text-right">All time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((company) => (
              <TableRow
                key={company.id}
                className="border-[var(--admin-line)] hover:bg-[var(--admin-soft)]/60"
              >
                <TableCell className="py-2.5 pl-4">
                  <Link
                    href={`/admin/companies/${company.id}`}
                    className="group flex items-center gap-2.5"
                  >
                    <CompanyLogoMark
                      initials={company.logoInitials}
                      color={company.logoColor}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <div className="truncate text-[13px] font-medium group-hover:underline">
                        {company.name}
                      </div>
                      <div className="truncate text-[11px] text-[var(--admin-faint)]">
                        {company.ownerEmail || company.email}
                      </div>
                    </div>
                  </Link>
                </TableCell>
                <TableCell className="py-2.5">
                  <CompanyStatusBadge status={company.status} />
                </TableCell>
                <TableCell className="py-2.5">
                  <SoftLockBadge state={company.softLock} />
                </TableCell>
                <TableCell className="py-2.5 text-[13px] text-[var(--admin-muted)]">
                  {company.tier}
                </TableCell>
                <TableCell className="py-2.5 text-right text-[13px] tabular-nums">
                  {company.seatsUsed}
                </TableCell>
                <TableCell className="py-2.5 text-right text-[13px] tabular-nums">
                  {company.reportsThisMonth.toLocaleString("en-IN")}
                </TableCell>
                <TableCell className="py-2.5 pr-4 text-right text-[13px] tabular-nums">
                  {company.reportsGenerated.toLocaleString("en-IN")}
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-12 text-center text-[13px] text-[var(--admin-muted)]"
                >
                  No companies match this search.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
      <AdminPagination
        page={safePage}
        pageSize={pageSize}
        total={filtered.length}
        onPageChange={setPage}
        onPageSizeChange={(n) => {
          setPageSize(n);
          setPage(1);
        }}
      />
    </Panel>
  );
}
