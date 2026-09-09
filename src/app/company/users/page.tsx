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
import {
  DEMO_COMPANY_ID,
  getCompany,
  getCompanyUsers,
  type CompanyUser,
  type CompanyUserRole,
} from "@/lib/admin/dummy-data";

export default function CompanyUsersPage() {
  const company = getCompany(DEMO_COMPANY_ID)!;
  const [users, setUsers] = useState(() => getCompanyUsers(company.id));
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<CompanyUserRole>("advisor");
  const [message, setMessage] = useState<string | null>(null);

  const seatsLeft = company.seats - users.filter((u) => u.status !== "disabled").length;

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
    if (seatsLeft <= 0) {
      setMessage(`Seat limit reached (${company.seats}). Upgrade plan or remove a user.`);
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
    setMessage("Invite added (dummy — not persisted).");
  }

  function removeUser(id: string) {
    const target = users.find((u) => u.id === id);
    if (target?.role === "admin") {
      setMessage("Cannot remove the Admin (Owner) in this demo.");
      return;
    }
    setUsers((prev) => prev.filter((u) => u.id !== id));
    setMessage("User removed (dummy).");
  }

  function setUserRole(id: string, nextRole: CompanyUserRole) {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== id) return u;
        if (u.role === "admin") return u;
        return { ...u, role: nextRole };
      }),
    );
  }

  return (
    <>
      <AdminPageHeader
        title="Users & seats"
        description="Admin (Owner) can add/remove users up to the subscription seat limit. Roles: Admin (Owner), Advisor (edit/view), Viewer (view)."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="Seats used" value={`${activeCount} / ${company.seats}`} icon={Users} />
        <StatTile label="Seats left" value={Math.max(company.seats - activeCount, 0)} icon={UserPlus} />
        <StatTile label="Plan" value={company.tier} icon={Gem} />
      </div>

      <Panel title="Invite user" description="Respects seat limits from the plan">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label htmlFor="invite-name">Name</Label>
            <Input
              id="invite-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="invite-email">Email</Label>
            <Input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.in"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as CompanyUserRole)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="advisor">Advisor</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button className="w-full" onClick={addUser} disabled={seatsLeft <= 0}>
              Add user
            </Button>
          </div>
        </div>
        {message ? <p className="mt-3 text-sm text-muted-foreground">{message}</p> : null}
      </Panel>

      <Panel title="Team">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
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
                  {user.role === "admin" ? (
                    <CompanyRoleBadge role={user.role} />
                  ) : (
                    <Select
                      value={user.role}
                      onValueChange={(v) => setUserRole(user.id, v as CompanyUserRole)}
                    >
                      <SelectTrigger className="h-8 w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="advisor">Advisor</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </TableCell>
                <TableCell className="capitalize text-muted-foreground">
                  {user.status}
                </TableCell>
                <TableCell className="tabular-nums text-muted-foreground">
                  {user.lastActiveAt}
                </TableCell>
                <TableCell className="text-right">
                  {user.role === "admin" ? (
                    <span className="text-xs text-muted-foreground">Owner</span>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => removeUser(user.id)}
                    >
                      Remove
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Panel>
    </>
  );
}
