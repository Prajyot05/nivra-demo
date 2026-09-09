import type { Metadata } from "next";
import { AdminPageHeader, Panel } from "@/components/admin/admin-ui";
import { AdminLayoutPicker } from "@/components/admin/layout-picker";

export const metadata: Metadata = {
  title: "Layouts",
};

export default function CompanyLayoutsPage() {
  return (
    <>
      <AdminPageHeader
        title="Admin layouts"
        description="Same six professional skins as Nivra admin. Selection is shared — change it here or in the sidebar picker."
      />
      <Panel title="Choose a layout">
        <AdminLayoutPicker />
      </Panel>
    </>
  );
}
