import { AdminPageHeader, Panel, StatStrip } from "@/components/admin/admin-ui";
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
import { requireSignedIn } from "@/lib/require-signed-in";

export default async function AdminStaffPage() {
  await requireSignedIn();
  const staff = await listNivraStaff();
  const source = isDatabaseConfigured() ? "Neon" : "dummy fallback";

  return (
    <>
      <AdminPageHeader
        title="Staff & roles"
        description={`Nivra platform admins (UserRole.NIVRA_ADMIN). Source: ${source}.`}
      />

      <StatStrip
        items={[
          {
            label: "Nivra admins",
            value: staff.length,
            hint: "Platform-level access",
            tone: "positive",
          },
        ]}
        className="lg:grid-cols-1 sm:grid-cols-1"
      />

      <Panel title="Nivra team" description="Who can manage the platform" flush>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-4">Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="pr-4 text-right">Reports this month</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {staff.map((person) => (
              <TableRow
                key={person.id}
                className="border-[var(--admin-line)] hover:bg-[var(--admin-soft)]/60"
              >
                <TableCell className="pl-4">
                  <div className="text-[13px] font-medium">{person.name}</div>
                  <div className="text-[11px] text-[var(--admin-faint)]">
                    {person.email}
                  </div>
                </TableCell>
                <TableCell>
                  <NivraRoleBadge role={person.role} />
                </TableCell>
                <TableCell className="text-[13px] capitalize text-[var(--admin-muted)]">
                  {person.status}
                </TableCell>
                <TableCell className="pr-4 text-right text-[13px] tabular-nums">
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
