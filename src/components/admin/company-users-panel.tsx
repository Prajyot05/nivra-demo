"use client";

import { useMemo, useState } from "react";
import { AdminPageHeader, Panel, StatStrip } from "@/components/admin/admin-ui";
import { CompanyRoleBadge } from "@/components/admin/status-badges";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import type { Company, CompanyUser, CompanyUserRole } from "@/lib/admin/dummy-data";

export function CompanyUsersPanel({
  company,
  initialUsers,
}: {
  company: Company;
  initialUsers: CompanyUser[];
}) {
  const [users, setUsers] = useState(initialUsers);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<CompanyUserRole>("advisor");
  const [message, setMessage] = useState<string | null>(null);

  const activeCount = useMemo(
    () => users.filter((u) => u.status === "active" || u.status === "invited").length,
    [users],
  );

  function addUser() {
    setMessage(null);
    if (!name.trim() || !email.trim()) {
      setMessage("Name and email are required.");
      return;
    }
    const next: CompanyUser = {
      id: `local_${Date.now()}`,
      companyId: company.id,
      name: name.trim(),
      email: email.trim(),
      role,
      status: "invited",
      lastActiveAt: "—",
    };
    setUsers((prev) => [next, ...prev]);
    setName("");
    setEmail("");
    setRole("advisor");
    setMessage(
      "Invite staged locally. Persist via Clerk invitation + Neon User row in a follow-up.",
    );
  }

  function removeUser(id: string) {
    const target = users.find((u) => u.id === id);
    if (target?.role === "admin") {
      setMessage("Cannot remove the Company Admin (Owner).");
      return;
    }
    setUsers((prev) => prev.filter((u) => u.id !== id));
    setMessage("User removed from this view (not persisted yet).");
  }

  return (
    <>
      <AdminPageHeader
        title="Users"
        description={`${company.name}. Company admin and employees. Member seat caps deferred for v1.`}
      />

      <StatStrip
        items={[
          { label: "Users", value: activeCount, tone: "positive" },
          { label: "Plan", value: company.tier },
          {
            label: "Reports this month",
            value: company.reportsThisMonth.toLocaleString("en-IN"),
          },
        ]}
        className="lg:grid-cols-3 sm:grid-cols-3"
      />

      <Panel title="Invite user" description="Local staging until invite API is wired">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label htmlFor="invite-name" className="text-[12px]">
              Name
            </Label>
            <Input
              id="invite-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-9 border-[var(--admin-line)] shadow-none"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="invite-email" className="text-[12px]">
              Email
            </Label>
            <Input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-9 border-[var(--admin-line)] shadow-none"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[12px]">Role</Label>
            <Select
              value={role}
              onValueChange={(v) => setRole(v as CompanyUserRole)}
            >
              <SelectTrigger className="h-9 border-[var(--admin-line)] shadow-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Company admin</SelectItem>
                <SelectItem value="advisor">Employee</SelectItem>
                <SelectItem value="viewer">Employee (viewer label)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button className="h-9 w-full text-[13px]" onClick={addUser}>
              Invite
            </Button>
          </div>
        </div>
        {message ? (
          <p className="mt-3 text-[12px] text-[var(--admin-muted)]">{message}</p>
        ) : null}
      </Panel>

      <Panel title="Directory" description="Everyone on this firm" flush>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-4">Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last active</TableHead>
              <TableHead className="pr-4 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow
                key={user.id}
                className="border-[var(--admin-line)] hover:bg-[var(--admin-soft)]/60"
              >
                <TableCell className="pl-4">
                  <div className="text-[13px] font-medium">{user.name}</div>
                  <div className="text-[11px] text-[var(--admin-faint)]">
                    {user.email}
                  </div>
                </TableCell>
                <TableCell>
                  <CompanyRoleBadge role={user.role} />
                </TableCell>
                <TableCell className="text-[13px] capitalize text-[var(--admin-muted)]">
                  {user.status}
                </TableCell>
                <TableCell className="text-[13px] tabular-nums text-[var(--admin-muted)]">
                  {user.lastActiveAt}
                </TableCell>
                <TableCell className="pr-4 text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-[12px] text-[var(--admin-muted)] hover:text-rose-700"
                    disabled={user.role === "admin"}
                    onClick={() => removeUser(user.id)}
                  >
                    Remove
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Panel>
    </>
  );
}
