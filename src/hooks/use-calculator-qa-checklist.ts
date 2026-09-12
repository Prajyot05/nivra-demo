"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "nivra-dev-calc-qa-checklist";

function readChecked(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as Record<string, boolean>;
  } catch {
    return {};
  }
}

/** Excel QA ticks — persisted in this browser's localStorage (not in git). */
export function useCalculatorQaChecklist() {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setChecked(readChecked());
    setReady(true);
  }, []);

  const toggle = useCallback((id: string) => {
    setChecked((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    setChecked({});
    window.localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { checked, toggle, clearAll, ready };
}
