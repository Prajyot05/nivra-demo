import { ShieldCheck, Headset } from "lucide-react";
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
import { DUMMY_NIVRA_STAFF } from "@/lib/admin/dummy-data";

export default function AdminStaffPage() {
  const admins = DUMMY_NIVRA_STAFF.filter((s) => s.role === "main_admin");
  const support = DUMMY_NIVRA_STAFF.filter((s) => s.role === "support");

  return (
    <>
      <AdminPageHeader
        title="Staff & roles"
        description="Two Nivra roles: Main admin (platform) and Support staff who generate reports for tenants."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <StatTile label="Main admins" value={admins.length} icon={ShieldCheck} />
        <StatTile
          label="Support staff"
          value={support.filter((s) => s.status === "active").length}
          hint={`${support.length} total including inactive`}
          icon={Headset}
        />
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
            {DUMMY_NIVRA_STAFF.map((person) => (
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
