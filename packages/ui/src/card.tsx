import type { ReactNode } from "react";
import {
  CARD,
  CARD_EMPTY,
  CARD_MUTED,
  CARD_PAD,
  CARD_PAD_TIGHT,
  CARD_WARN,
  META_TEXT,
  SECTION_TITLE,
  SECTION_TITLE_STRONG,
} from "./tokens";

export type CardVariant = "surface" | "muted" | "warn" | "empty";
export type CardPadding = "default" | "tight" | "none";

const VARIANT: Record<CardVariant, string> = {
  surface: CARD,
  muted: CARD_MUTED,
  warn: CARD_WARN,
  empty: CARD_EMPTY,
};

const PADDING: Record<CardPadding, string> = {
  default: CARD_PAD,
  tight: CARD_PAD_TIGHT,
  none: "",
};

/**
 * The one card shell for calculator surfaces. Charts, tables, result panels and
 * note blocks all use it so radius, border, background and padding stay equal.
 */
export function Card({
  variant = "surface",
  padding = "default",
  className,
  children,
}: {
  variant?: CardVariant;
  padding?: CardPadding;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`flex min-w-0 flex-col ${VARIANT[variant]} ${PADDING[padding]} ${className ?? ""}`}
    >
      {children}
    </div>
  );
}

/**
 * Eyebrow heading for a card or a page section. `strong` raises contrast for
 * the primary result panel; everything else stays muted so the numbers lead.
 */
export function SectionTitle({
  children,
  strong = false,
  as: Tag = "div",
  className,
}: {
  children: ReactNode;
  strong?: boolean;
  as?: "div" | "h2" | "h3";
  className?: string;
}) {
  return (
    <Tag className={`${strong ? SECTION_TITLE_STRONG : SECTION_TITLE} ${className ?? ""}`}>
      {children}
    </Tag>
  );
}

/**
 * Section title with optional right-aligned meta (totals, counts, controls).
 * Used above tables and chart groups.
 */
export function SectionHeader({
  title,
  meta,
  actions,
  strong = false,
  className,
}: {
  title: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  strong?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3 ${className ?? ""}`}
    >
      <SectionTitle strong={strong} as="h3">
        {title}
      </SectionTitle>
      {meta ? <p className={`${META_TEXT} tabular-nums sm:text-right`}>{meta}</p> : null}
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
