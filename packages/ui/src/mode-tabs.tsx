export type ModeTab = { id: string; label: string };

export function ModeTabs({
  tabs,
  value,
  onChange,
  fullWidth = false,
}: {
  tabs: ModeTab[];
  value: string;
  onChange: (id: string) => void;
  /** Stretch tabs evenly across the available width. */
  fullWidth?: boolean;
}) {
  return (
    <div
      className={`flex flex-wrap gap-1.5 ${fullWidth ? "w-full" : ""}`}
      role="tablist"
    >
      {tabs.map((tab) => {
        const active = tab.id === value;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            className={`inline-flex h-9 min-w-0 items-center justify-center rounded-md px-2.5 text-xs font-semibold tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--app-primary)] sm:h-10 sm:px-3 ${
              fullWidth ? "flex-1" : ""
            } ${
              active
                ? "bg-[var(--app-primary)] text-[var(--app-primary-fg)]"
                : "border border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text-muted)] hover:bg-[var(--app-surface-muted)] hover:text-[var(--app-text)]"
            }`}
            onClick={() => onChange(tab.id)}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
