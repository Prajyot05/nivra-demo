export type AdminLayoutId =
  | "studio"
  | "harbor"
  | "ledger"
  | "workbench"
  | "summit"
  | "command";

export type AdminLayoutPreset = {
  id: AdminLayoutId;
  name: string;
  tagline: string;
  inspiredBy: string;
  /** Structural cues consumed by the shell */
  density: "comfortable" | "compact" | "airy";
  sidebar: "light";
  corners: "soft" | "sharp" | "none";
};

export const ADMIN_LAYOUTS: AdminLayoutPreset[] = [
  {
    id: "studio",
    name: "Studio",
    tagline: "Soft rounded product console",
    inspiredBy: "Linear · Vercel",
    density: "comfortable",
    sidebar: "light",
    corners: "soft",
  },
  {
    id: "harbor",
    name: "Harbor",
    tagline: "Refined banking white",
    inspiredBy: "Mercury · Brex",
    density: "comfortable",
    sidebar: "light",
    corners: "soft",
  },
  {
    id: "ledger",
    name: "Ledger",
    tagline: "Advisory navy & gold accents",
    inspiredBy: "Wealth desks · family offices",
    density: "comfortable",
    sidebar: "light",
    corners: "soft",
  },
  {
    id: "workbench",
    name: "Workbench",
    tagline: "Crisp SaaS operations",
    inspiredBy: "Stripe Dashboard · Notion",
    density: "comfortable",
    sidebar: "light",
    corners: "soft",
  },
  {
    id: "summit",
    name: "Summit",
    tagline: "Enterprise CRM structure",
    inspiredBy: "HubSpot · Salesforce Lightning",
    density: "comfortable",
    sidebar: "light",
    corners: "soft",
  },
  {
    id: "command",
    name: "Command",
    tagline: "Executive white with teal accents",
    inspiredBy: "Modern fintech ops",
    density: "comfortable",
    sidebar: "light",
    corners: "soft",
  },
];

export const DEFAULT_ADMIN_LAYOUT: AdminLayoutId = "studio";
export const ADMIN_LAYOUT_STORAGE_KEY = "nivra-admin-layout";

/** Map removed layout ids to replacements. */
const LEGACY_LAYOUT_MAP: Record<string, AdminLayoutId> = {
  terminal: "harbor",
  atelier: "summit",
};

export function isAdminLayoutId(value: string): value is AdminLayoutId {
  return ADMIN_LAYOUTS.some((layout) => layout.id === value);
}

export function resolveAdminLayoutId(value: string | null | undefined): AdminLayoutId {
  if (!value) return DEFAULT_ADMIN_LAYOUT;
  if (isAdminLayoutId(value)) return value;
  if (value in LEGACY_LAYOUT_MAP) return LEGACY_LAYOUT_MAP[value];
  return DEFAULT_ADMIN_LAYOUT;
}

export function getAdminLayout(id: AdminLayoutId): AdminLayoutPreset {
  return ADMIN_LAYOUTS.find((layout) => layout.id === id) ?? ADMIN_LAYOUTS[0];
}
