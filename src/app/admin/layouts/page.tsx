import type { Metadata } from "next";
import { AdminPageHeader, Panel } from "@/components/admin/admin-ui";
import { AdminLayoutPicker } from "@/components/admin/layout-picker";

export const metadata: Metadata = {
  title: "Layouts",
};

export default function AdminLayoutsPage() {
  return (
    <>
      <AdminPageHeader
        title="Admin layouts"
        description="Six professional skins shared by Nivra admin and Company admin. Pick one — it saves in this browser and applies to both dashboards."
      />
      <Panel
        title="Choose a layout"
        description="Studio · Harbor · Ledger · Workbench · Summit · Command"
      >
        <AdminLayoutPicker />
      </Panel>
      <Panel title="What changes">
        <ul className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
          <li className="rounded-[var(--admin-radius-sm)] border border-border bg-white px-3 py-2">
            All skins stay white — no dark or tinted canvases
          </li>
          <li className="rounded-[var(--admin-radius-sm)] border border-border bg-white px-3 py-2">
            Density, radius, shadows, and border weight
          </li>
          <li className="rounded-[var(--admin-radius-sm)] border border-border bg-white px-3 py-2">
            Active nav treatment and label typography
          </li>
          <li className="rounded-[var(--admin-radius-sm)] border border-border bg-white px-3 py-2">
            Accent color only on interactive / active states
          </li>
        </ul>
      </Panel>
    </>
  );
}
