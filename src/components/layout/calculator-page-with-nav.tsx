"use client";

import { CalculatorPage as BaseCalculatorPage } from "@nivra/ui";
import type { ComponentProps } from "react";
import { NavToggleButton } from "@/components/layout/sidebar-context";

type CalculatorPageProps = ComponentProps<typeof BaseCalculatorPage>;

export function CalculatorPage(props: CalculatorPageProps) {
  return <BaseCalculatorPage {...props} leading={<NavToggleButton />} />;
}
