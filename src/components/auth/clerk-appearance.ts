export const authAppearance = {
  variables: {
    colorPrimary: "#0a0a0a",
    colorPrimaryForeground: "#ffffff",
    colorForeground: "#0a0a0a",
    colorMutedForeground: "#737373",
    colorBackground: "#ffffff",
    colorInput: "#ffffff",
    colorInputForeground: "#0a0a0a",
    colorBorder: "#e5e5e5",
    colorNeutral: "#0a0a0a",
    colorDanger: "#b42318",
    colorSuccess: "#0b7443",
    colorRing: "#e5e5e5",
    borderRadius: "0.5rem",
    fontFamily: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif",
    fontSize: "0.875rem",
  },
  elements: {
    rootBox: "w-full! max-w-full!",
    cardBox:
      "w-full! max-w-full! overflow-visible! shadow-none! border-0! rounded-none! bg-transparent!",
    card: "w-full! max-w-full! overflow-visible! shadow-none! border-0! bg-transparent! p-1! gap-6",
    header: "hidden!",
    footer: "bg-none! bg-transparent! p-0! mt-2 [&>*]:bg-transparent!",
    footerAction: "hidden!",
    formFieldLabel: "text-[13px] font-medium text-[#0a0a0a]",
    formButtonPrimary:
      "h-10 rounded-lg! bg-[#0a0a0a]! bg-none! text-[14px] font-medium normal-case shadow-none! hover:bg-[#262626]! after:hidden!",
    formFieldAction: "text-[13px] font-medium text-[#525252] hover:text-[#0a0a0a]",
    identityPreviewEditButton: "text-[#0a0a0a]",
  },
} as const;