import { useEffect, useRef, useState } from "react";
import { calculate } from "@/lib/calculate-client";

export function useCalculate<T>(
  id: string,
  input: unknown,
  enabled = true,
  options?: { debounceMs?: number },
) {
  const debounceMs = options?.debounceMs ?? 250;
  const [result, setResult] = useState<T | null>(null);
  const [resultId, setResultId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const serialized = JSON.stringify(input);
  const hasResultRef = useRef(false);

  useEffect(() => {
    hasResultRef.current = resultId === id && result != null;
  }, [resultId, id, result]);

  useEffect(() => {
    let cancelled = false;

    if (!enabled) {
      // Keep the last valid result on screen; do not blank the page.
      setLoading(false);
      return () => {
        cancelled = true;
      };
    }

    // Recalculations keep prior numbers visible. Only first load shows loading.
    if (!hasResultRef.current) setLoading(true);
    setError(null);

    const handle = window.setTimeout(() => {
      calculate<T>(id, JSON.parse(serialized) as unknown)
        .then((payload) => {
          if (cancelled) return;
          setResult(payload.result);
          setResultId(id);
          setError(null);
        })
        .catch((err: unknown) => {
          if (cancelled) return;
          setResult(null);
          setResultId(null);
          setError(err instanceof Error ? err.message : "Calculation failed");
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, debounceMs);

    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [id, serialized, enabled, debounceMs]);

  // Drop stale results immediately on id change (effects run after paint).
  const matched = resultId === id ? result : null;

  return { result: matched, error, loading: enabled && (loading || resultId !== id) };
}
