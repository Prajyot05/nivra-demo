"use client";

import { useMemo, useState } from "react";
import { Users, UserPlus, Gem } from "lucide-react";
import { AdminPageHeader, Panel, StatTile } from "@/components/admin/admin-ui";
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
        description={`${company.name} — company admin and employees. Member seat caps deferred.`}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="Users" value={activeCount} icon={Users} />
        <StatTile label="Plan" value={company.tier} icon={Gem} />
        <StatTile
          label="Reports this month"
          value={company.reportsThisMonth.toLocaleString("en-IN")}
          icon={UserPlus}
        />
      </div>

      <Panel title="Invite user" description="Local staging until invite API is wired">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="invite-name">Name</Label>
            <Input
              id="invite-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="invite-email">Email</Label>
            <Input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <Select
              value={role}
              onValueChange={(v) => setRole(v as CompanyUserRole)}
            >
              <SelectTrigger>
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
            <Button className="w-full" onClick={addUser}>
              Invite
            </Button>
          </div>
        </div>
        {message ? (
          <p className="mt-3 text-sm text-muted-foreground">{message}</p>
        ) : null}
      </Panel>

      <Panel title="Directory">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last active</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="font-medium">{user.name}</div>
                  <div className="text-xs text-muted-foreground">{user.email}</div>
                </TableCell>
                <TableCell>
                  <CompanyRoleBadge role={user.role} />
                </TableCell>
                <TableCell className="capitalize text-muted-foreground">
                  {user.status}
                </TableCell>
                <TableCell className="tabular-nums text-muted-foreground">
                  {user.lastActiveAt}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
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
