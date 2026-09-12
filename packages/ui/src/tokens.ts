/**
 * Calculator design tokens.
 *
 * Every calculator surface (inputs, results, charts, tables, notes) composes
 * these strings instead of re-declaring padding / radius / label styles. When a
 * value needs to change, change it here and the whole suite follows.
 *
 * Colors stay on the `--app-*` custom properties so the theme switcher in
 * `CalculatorPage` keeps working.
 */

/* ── Vertical rhythm ─────────────────────────────────────────────────────── */

/** Gap between major blocks of a page (stat band, split, table, notes). */
export const STACK = "flex flex-col gap-4";
/** Gap between a heading and the block it introduces. */
export const STACK_TIGHT = "flex flex-col gap-2.5";
/** Gap inside a card between stacked rows. */
export const STACK_INNER = "flex flex-col gap-3";

/* ── Cards ───────────────────────────────────────────────────────────────── */

const CARD_SHAPE = "rounded-xl border";

/** Default card: charts, tables, result panels, supporting info. */
export const CARD = `${CARD_SHAPE} border-[var(--app-border)] bg-[var(--app-surface)]`;
/** Recessed card: the input / assumptions area. */
export const CARD_MUTED = `${CARD_SHAPE} border-[var(--app-border)] bg-[var(--app-surface-muted)]`;
/** Advisory card: notes, caveats, cost-of-delay callouts. */
export const CARD_WARN = `${CARD_SHAPE} border-[var(--app-warn-border)] bg-[var(--app-warn-bg)]`;
/** Empty state. */
export const CARD_EMPTY =
  "rounded-xl border border-dashed border-[var(--app-border)] bg-[var(--app-surface)]";

/** Standard card padding. */
export const CARD_PAD = "p-3.5 sm:p-4";
/** Compact card padding for dense secondary cards. */
export const CARD_PAD_TIGHT = "p-3";
/** Horizontal padding for row-based cards (ResultCard) so rows align edge to edge. */
export const ROW_PAD_X = "px-3.5 sm:px-4";

/* ── Typography ──────────────────────────────────────────────────────────── */

/**
 * The single eyebrow style for every card / section heading in a calculator.
 * Replaces the four competing sizes the pages used to ship.
 */
export const SECTION_TITLE =
  "text-[11px] font-semibold uppercase tracking-widest text-[var(--app-text-muted)] sm:text-xs";
/** Same scale, higher contrast: primary result panels. */
export const SECTION_TITLE_STRONG =
  "text-[11px] font-semibold uppercase tracking-widest text-[var(--app-text)] sm:text-xs";
/** Micro label inside a card (legend keys, metric captions). */
export const MICRO_LABEL =
  "text-[10px] font-semibold uppercase tracking-wider text-[var(--app-text-muted)]";
/** Supporting sentence under a heading or next to a total. */
export const META_TEXT = "text-[11px] leading-snug text-[var(--app-text-subtle)]";
/** Body copy inside notes and explanations. */
export const BODY_TEXT = "text-xs leading-relaxed text-[var(--app-text-muted)] sm:text-[13px]";
/** Numeric readout shared by result rows and inline totals. */
export const NUMERIC = "tabular-nums font-semibold text-[var(--app-text)]";

/* ── Layout ──────────────────────────────────────────────────────────────── */

/**
 * Input grid. One column width for the whole suite so fields line up when the
 * user moves between calculators.
 */
export const FORM_GRID =
  "grid grid-cols-[repeat(auto-fill,minmax(8rem,1fr))] items-start gap-x-3 gap-y-3";

/**
 * Two-column results: charts on the left, numbers on the right.
 * Left grows; right column matches height and scrolls when needed.
 */
export const RESULTS_SPLIT = "grid grid-cols-1 gap-4 lg:grid-cols-12";
export const RESULTS_LEFT = "flex min-w-0 flex-col gap-4 lg:col-span-7";
export const RESULTS_RIGHT = "flex min-w-0 flex-col gap-4 lg:col-span-5";

/** Column counts for the headline stat band, keyed by number of stats. */
/**
 * Column counts key off the band's own width, not the viewport, so a stat band
 * breaks the same way whether it sits full width or inside a results column.
 * Requires an `@container` ancestor — see `StatGrid`.
 */
export function statGridClass(count: number): string {
  const columns =
    count <= 1
      ? "grid-cols-1"
      : count === 2
        ? "grid-cols-1 @sm:grid-cols-2"
        : count === 3
          ? "grid-cols-1 @sm:grid-cols-2 @xl:grid-cols-3"
          : count === 4
            ? "grid-cols-1 @sm:grid-cols-2 @3xl:grid-cols-4"
            : count === 5
              ? "grid-cols-1 @sm:grid-cols-2 @xl:grid-cols-3 @5xl:grid-cols-5"
              : "grid-cols-1 @sm:grid-cols-2 @xl:grid-cols-3";
  return `grid gap-2.5 ${columns}`;
}

/* ── Controls ────────────────────────────────────────────────────────────── */

/** Icon-only action in the page header (download, etc.). */
export const ICON_BUTTON =
  "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[var(--app-primary)] text-[var(--app-primary-fg)] transition-colors hover:bg-[var(--app-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--app-primary)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--app-bg)] disabled:pointer-events-none disabled:opacity-50";

const CONTROL_BASE =
  "inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-md px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--app-primary)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--app-surface)] disabled:pointer-events-none disabled:opacity-50";

/** Filled action inside a card (Add goal, Reviewed, confirm). */
export const BUTTON_PRIMARY = `${CONTROL_BASE} bg-[var(--app-primary)] text-[var(--app-primary-fg)] hover:bg-[var(--app-primary-hover)]`;
/** Outlined action inside a card (Reset, Duplicate, Cancel). */
export const BUTTON_SECONDARY = `${CONTROL_BASE} border border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text-muted)] hover:bg-[var(--app-surface-muted)] hover:text-[var(--app-text)]`;
/** Destructive outlined action (Remove). */
export const BUTTON_DANGER = `${CONTROL_BASE} border border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-danger)] hover:border-[var(--app-danger)]/40 hover:bg-[var(--app-danger)]/8`;

/** Small selectable chip (quick period presets). */
export const CHIP =
  "rounded-md border px-2 py-1 text-[11px] font-medium tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--app-primary)]";
export const CHIP_ON =
  "border-[var(--app-primary)] bg-[var(--app-primary)] text-[var(--app-primary-fg)]";
export const CHIP_OFF =
  "border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text-muted)] hover:border-[var(--app-primary-soft)] hover:text-[var(--app-text)]";

/** Status pill used for buckets / categories in tables and timelines. */
export const PILL =
  "inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider";
