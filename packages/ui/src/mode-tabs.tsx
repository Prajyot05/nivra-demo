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
    <div className="flex flex-wrap gap-2" role="tablist">
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
                ? "rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
                : "rounded-md border border-border bg-background px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent"
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
