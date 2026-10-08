"use client";

import { useState, useTransition } from "react";
import { inviteMember, removeMember, revokeInvite } from "@/app/company/users/actions";
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
import type { Company, CompanyUser } from "@/lib/admin/dummy-data";

export type PendingInviteRow = {
  id: string;
  email: string;
  name: string | null;
  role: "admin" | "advisor";
  expiresAt: string;
};

type InviteRole = "admin" | "advisor";

export function CompanyUsersPanel({
  company,
  initialUsers,
  pendingInvites,
  seats,
  currentUserId,
  canManage,
}: {
  company: Company;
  initialUsers: CompanyUser[];
  pendingInvites: PendingInviteRow[];
  /** `limit` null = unlimited. `used` counts members plus pending invites. */
  seats: { limit: number | null; used: number };
  currentUserId: string | null;
  canManage: boolean;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<InviteRole>("advisor");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const seatsFull = seats.limit != null && seats.used >= seats.limit;
  const seatLabel = seats.limit == null ? `${seats.used} / Unlimited` : `${seats.used} / ${seats.limit}`;

  function run(action: () => Promise<{ ok: boolean; message: string }>, onOk?: () => void) {
    setMessage(null);
    startTransition(async () => {
      const result = await action();
      setMessage({ ok: result.ok, text: result.message });
      if (result.ok) onOk?.();
    });
  }

  function addUser() {
    if (!name.trim() || !email.trim()) {
      setMessage({ ok: false, text: "Name and email are required." });
      return;
    }
    run(
      () => inviteMember({ name, email, role }),
      () => {
        setName("");
        setEmail("");
        setRole("advisor");
      },
    );
  }

  return (
    <>
      <AdminPageHeader
        title="Users"
        description={`${company.name}. One login per person; each account allows a single active session.`}
      />

      <StatStrip
        items={[
          { label: "Seats used", value: seatLabel, tone: seatsFull ? "warn" : "positive" },
          { label: "Plan", value: company.tier },
          { label: "Pending invites", value: pendingInvites.length },
        ]}
        className="lg:grid-cols-3 sm:grid-cols-3"
      />

      <Panel
        title="Invite user"
        description={
          seatsFull
            ? "All seats on this plan are taken. Remove a member or revoke an invite to free one."
            : "The invite email lets this person set their own password. Their seat is held until they join or the invite is revoked."
        }
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label htmlFor="invite-name" className="text-[12px]">
              Name
            </Label>
            <Input
              id="invite-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!canManage || seatsFull}
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
              disabled={!canManage || seatsFull}
              className="h-9 border-[var(--admin-line)] shadow-none"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[12px]">Role</Label>
            <Select
              value={role}
              onValueChange={(v) => setRole(v as InviteRole)}
              disabled={!canManage || seatsFull}
            >
              <SelectTrigger className="h-9 border-[var(--admin-line)] shadow-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Company admin</SelectItem>
                <SelectItem value="advisor">Employee</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button
              className="h-9 w-full text-[13px]"
              onClick={addUser}
              disabled={!canManage || seatsFull || pending}
            >
              {pending ? "Working..." : "Invite"}
            </Button>
          </div>
        </div>
        {message ? (
          <p
            className={`mt-3 text-[12px] ${message.ok ? "text-[var(--admin-muted)]" : "text-rose-700"}`}
          >
            {message.text}
          </p>
        ) : null}
        {!canManage ? (
          <p className="mt-3 text-[12px] text-[var(--admin-muted)]">
            Connect the database to manage members.
          </p>
        ) : null}
      </Panel>

      {pendingInvites.length > 0 ? (
        <Panel title="Pending invitations" description="Each one holds a seat" flush>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-4">Invitee</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead className="pr-4 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingInvites.map((invite) => (
                <TableRow
                  key={invite.id}
                  className="border-[var(--admin-line)] hover:bg-[var(--admin-soft)]/60"
                >
                  <TableCell className="pl-4">
                    <div className="text-[13px] font-medium">{invite.name ?? invite.email}</div>
                    <div className="text-[11px] text-[var(--admin-faint)]">{invite.email}</div>
                  </TableCell>
                  <TableCell>
                    <CompanyRoleBadge role={invite.role} />
                  </TableCell>
                  <TableCell className="text-[13px] tabular-nums text-[var(--admin-muted)]">
                    {invite.expiresAt}
                  </TableCell>
                  <TableCell className="pr-4 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-[12px] text-[var(--admin-muted)] hover:text-rose-700"
                      disabled={!canManage || pending}
                      onClick={() => run(() => revokeInvite(invite.id))}
                    >
                      Revoke
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Panel>
      ) : null}

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
            {initialUsers.map((user) => (
              <TableRow
                key={user.id}
                className="border-[var(--admin-line)] hover:bg-[var(--admin-soft)]/60"
              >
                <TableCell className="pl-4">
                  <div className="text-[13px] font-medium">{user.name}</div>
                  <div className="text-[11px] text-[var(--admin-faint)]">{user.email}</div>
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
                    disabled={!canManage || pending || user.id === currentUserId}
                    onClick={() => {
                      if (window.confirm(`Remove ${user.name}? Their login will be deleted.`)) {
                        run(() => removeMember(user.id));
                      }
                    }}
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
