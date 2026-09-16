export type ModeTab = { id: string; label: string };

/**
 * Mode switcher — slate track with white active pill (client profile / mode bar).
 */
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
      className={`inline-flex flex-wrap gap-1 rounded-xl border border-slate-200/60 bg-slate-100 p-1 ${
        fullWidth ? "w-full" : ""
      }`}
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
            className={`inline-flex h-8 min-w-0 items-center justify-center rounded-lg px-3.5 text-xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 sm:h-9 ${
              fullWidth ? "flex-1" : ""
            } ${
              active
                ? "bg-white font-bold text-slate-900 shadow-sm"
                : "font-semibold text-slate-500 hover:text-slate-800"
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
