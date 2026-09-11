import { Children, type ReactNode } from "react";
import {
  FORM_GRID,
  RESULTS_LEFT,
  RESULTS_RIGHT,
  RESULTS_SPLIT,
  STACK,
  statGridClass,
} from "./tokens";

/** Input grid shared by every calculator form. */
export function FormGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`${FORM_GRID} ${className ?? ""}`}>{children}</div>;
}

/**
 * Headline metric band above the results. Column count follows the number of
 * stats so a 3-stat page and a 5-stat page both stay balanced.
 */
export function StatGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const count = Children.toArray(children).length;
  return (
    <div className={`@container shrink-0 ${className ?? ""}`}>
      <div className={statGridClass(count)}>{children}</div>
    </div>
  );
}

/** Vertical stack with the standard section rhythm. */
export function Stack({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`${STACK} ${className ?? ""}`}>{children}</div>;
}

/**
 * Charts-left / numbers-right results layout. `stretch` makes both columns the
 * same height so their bottom edges line up on desktop.
 *
 * `mobileFirst` decides which column leads once the grid stacks. Calculators
 * lead with `right` (the numbers) so a phone shows the answer before the
 * supporting chart.
 */
export function ResultsSplit({
  left,
  right,
  stretch = true,
  mobileFirst = "right",
  className,
}: {
  left: ReactNode;
  right: ReactNode;
  stretch?: boolean;
  mobileFirst?: "left" | "right";
  className?: string;
}) {
  const rightFirst = mobileFirst === "right";
  return (
    <div className={`${RESULTS_SPLIT} ${stretch ? "lg:items-stretch" : ""} ${className ?? ""}`}>
      <div className={`${RESULTS_LEFT} min-h-0 ${rightFirst ? "order-2 lg:order-1" : ""}`}>
        {left}
      </div>
      <div className={`${RESULTS_RIGHT} min-h-0 ${rightFirst ? "order-1 lg:order-2" : ""}`}>
        {right}
      </div>
    </div>
  );
}
