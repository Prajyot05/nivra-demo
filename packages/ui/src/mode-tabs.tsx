export type ModeTab = { id: string; label: string };

export function ModeTabs({
  tabs,
  value,
  onChange,
}: {
  tabs: ModeTab[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 mb-2" role="tablist">
      {tabs.map((tab) => {
        const active = tab.id === value;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            className={
              active
                ? "rounded-md bg-[var(--app-primary)] px-3 py-1.5 text-sm font-semibold tracking-wide text-[var(--app-primary-fg)] transition-colors"
                : "rounded-md border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-1.5 text-sm font-medium tracking-wide text-[var(--app-text-muted)] transition-colors hover:bg-[var(--app-surface-muted)]"
            }
            onClick={() => onChange(tab.id)}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
