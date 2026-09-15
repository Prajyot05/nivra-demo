import { ShieldCheck } from "lucide-react";
import { AdminPageHeader, Panel, StatTile } from "@/components/admin/admin-ui";
import { NivraRoleBadge } from "@/components/admin/status-badges";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listNivraStaff } from "@/lib/admin/queries";
import { isDatabaseConfigured } from "@/lib/db";

export default async function AdminStaffPage() {
  const staff = await listNivraStaff();
  const source = isDatabaseConfigured() ? "Neon" : "dummy fallback";

  return (
    <>
      <AdminPageHeader
        title="Staff & roles"
        description={`Nivra platform admins (UserRole.NIVRA_ADMIN). Source: ${source}.`}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <StatTile label="Nivra admins" value={staff.length} icon={ShieldCheck} />
      </div>

      <Panel title="Nivra team">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Reports this month</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {staff.map((person) => (
              <TableRow key={person.id}>
                <TableCell>
                  <div className="font-medium">{person.name}</div>
                  <div className="text-xs text-muted-foreground">{person.email}</div>
                </TableCell>
                <TableCell>
                  <NivraRoleBadge role={person.role} />
                </TableCell>
                <TableCell className="capitalize text-muted-foreground">
                  {person.status}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {person.reportsThisMonth}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Panel>
    </>
  );
}
