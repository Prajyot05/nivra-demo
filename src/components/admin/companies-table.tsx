"use client";

import Link from "next/link";
import { ArrowDown, ArrowUp, ArrowUpDown, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  AdminPagination,
  FilterTabs,
  Panel,
} from "@/components/admin/admin-ui";
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
import type {
  Company,
  CompanyStatus,
  SubscriptionTier,
} from "@/lib/admin/dummy-data";
import { cn } from "@/lib/utils";

type StatusFilter = "all" | CompanyStatus;
type TierFilter = "all" | SubscriptionTier;
type SortKey = "name" | "users" | "reports" | "renewal";

const PAGE_SIZES = [25, 50, 100];

/**
 * Scale-ready companies directory (Cycle search + tabs, Lovable pagination).
 * Designed for 500–1000 tenants: filter → sort → page. Never render the full set.
 */
export function CompaniesTable({ companies }: { companies: Company[] }) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [tier, setTier] = useState<TierFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQuery(query), 200);
    return () => window.clearTimeout(t);
  }, [query]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQuery, status, tier, sortKey, sortDir, pageSize]);

  const counts = useMemo(() => {
    const base: Record<StatusFilter, number> = {
      all: companies.length,
      active: 0,
      trial: 0,
      suspended: 0,
      inactive: 0,
    };
    for (const c of companies) base[c.status] += 1;
    return base;
  }, [companies]);

  const filtered = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    return companies.filter((c) => {
      if (status !== "all" && c.status !== status) return false;
      if (tier !== "all" && c.tier !== tier) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.ownerEmail.toLowerCase().includes(q) ||
        c.tier.toLowerCase().includes(q)
      );
    });
  }, [companies, debouncedQuery, status, tier]);

  const sorted = useMemo(() => {
    const rows = [...filtered];
    const dir = sortDir === "asc" ? 1 : -1;
    rows.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name") cmp = a.name.localeCompare(b.name);
      else if (sortKey === "users") cmp = a.seatsUsed - b.seatsUsed;
      else if (sortKey === "reports") {
        cmp = a.reportsThisMonth - b.reportsThisMonth;
      } else cmp = a.renewsAt.localeCompare(b.renewsAt);
      return cmp * dir;
    });
    return rows;
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRows = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "name" || key === "renewal" ? "asc" : "desc");
    }
  }

  function SortHead({
    label,
    column,
    align = "left",
  }: {
    label: string;
    column: SortKey;
    align?: "left" | "right";
  }) {
    const active = sortKey === column;
    const Icon = !active ? ArrowUpDown : sortDir === "asc" ? ArrowUp : ArrowDown;
    return (
      <TableHead className={align === "right" ? "text-right" : undefined}>
        <button
          type="button"
          onClick={() => toggleSort(column)}
          className={cn(
            "inline-flex items-center gap-1 text-[12px] font-medium transition-colors",
            align === "right" && "flex-row-reverse",
            active ? "text-[var(--admin-ink)]" : "text-[var(--admin-faint)] hover:text-[var(--admin-muted)]",
          )}
        >
          {label}
          <Icon className="h-3 w-3" />
        </button>
      </TableHead>
    );
  }

  return (
    <Panel
      title="Directory"
      description={`${companies.length.toLocaleString("en-IN")} tenants · filter, sort, and page. Charts never plot every company.`}
      actions={
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <select
            value={tier}
            onChange={(e) => setTier(e.target.value as TierFilter)}
            className="h-8 rounded-md border border-[var(--admin-line)] bg-white px-2 text-[12px] text-[var(--admin-ink)] shadow-none outline-none"
            aria-label="Filter by plan"
          >
            <option value="all">All plans</option>
            <option value="Starter">Starter</option>
            <option value="Growth">Growth</option>
            <option value="Pro">Pro</option>
            <option value="Enterprise">Enterprise</option>
          </select>
          <div className="relative w-full sm:w-56">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--admin-faint)]" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name or email…"
              className="h-8 border-[var(--admin-line)] bg-white pl-8 text-[13px] shadow-none"
            />
          </div>
        </div>
      }
      flush
    >
      <div className="px-4 pt-3">
        <FilterTabs
          value={status}
          onChange={setStatus}
          tabs={[
            { id: "all", label: "All", count: counts.all },
            { id: "active", label: "Active", count: counts.active },
            { id: "trial", label: "Trial", count: counts.trial },
            { id: "suspended", label: "Suspended", count: counts.suspended },
            { id: "inactive", label: "Inactive", count: counts.inactive },
          ]}
        />
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-4">
                <button
                  type="button"
                  onClick={() => toggleSort("name")}
                  className={cn(
                    "inline-flex items-center gap-1 text-[12px] font-medium",
                    sortKey === "name"
                      ? "text-[var(--admin-ink)]"
                      : "text-[var(--admin-faint)]",
                  )}
                >
                  Company
                  {sortKey === "name" ? (
                    sortDir === "asc" ? (
                      <ArrowUp className="h-3 w-3" />
                    ) : (
                      <ArrowDown className="h-3 w-3" />
                    )
                  ) : (
                    <ArrowUpDown className="h-3 w-3" />
                  )}
                </button>
              </TableHead>
              <TableHead className="text-[12px] font-medium text-[var(--admin-faint)]">
                Status
              </TableHead>
              <TableHead className="text-[12px] font-medium text-[var(--admin-faint)]">
                Soft lock
              </TableHead>
              <TableHead className="text-[12px] font-medium text-[var(--admin-faint)]">
                Tier
              </TableHead>
              <SortHead label="Users" column="users" align="right" />
              <SortHead label="Reports" column="reports" align="right" />
              <TableHead className="pr-4">
                <button
                  type="button"
                  onClick={() => toggleSort("renewal")}
                  className={cn(
                    "inline-flex items-center gap-1 text-[12px] font-medium",
                    sortKey === "renewal"
                      ? "text-[var(--admin-ink)]"
                      : "text-[var(--admin-faint)]",
                  )}
                >
                  Renewal
                  {sortKey === "renewal" ? (
                    sortDir === "asc" ? (
                      <ArrowUp className="h-3 w-3" />
                    ) : (
                      <ArrowDown className="h-3 w-3" />
                    )
                  ) : (
                    <ArrowUpDown className="h-3 w-3" />
                  )}
                </button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.map((company) => (
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
                      <div className="truncate text-[13px] font-medium text-[var(--admin-ink)] group-hover:underline">
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
                <TableCell className="py-2.5 pr-4 text-[13px] tabular-nums text-[var(--admin-muted)]">
                  {company.renewsAt}
                </TableCell>
              </TableRow>
            ))}
            {pageRows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-14 text-center text-[13px] text-[var(--admin-muted)]"
                >
                  No companies match this filter. Clear search or switch status.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>

      <AdminPagination
        page={safePage}
        pageSize={pageSize}
        total={sorted.length}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        pageSizeOptions={PAGE_SIZES}
      />
    </Panel>
  );
}
