"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * Keeps multi-mode calculator tabs in sync with `?mode=` so category nav can deep-link.
 */
export function useCalculatorMode<T extends string>(
  modes: readonly T[],
  fallback: T,
): [T, (next: T) => void] {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const raw = searchParams.get("mode");
  const mode = (modes as readonly string[]).includes(raw ?? "") ? (raw as T) : fallback;

  const setMode = useCallback(
    (next: T) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("mode", next);
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  return [mode, setMode];
}
