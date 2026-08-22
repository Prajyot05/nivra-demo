import { useEffect, useState } from "react";
import { calculate } from "@/lib/calculate-client";

export function useCalculate<T>(id: string, input: unknown) {
  const [result, setResult] = useState<T | null>(null);
  const [resultId, setResultId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const serialized = JSON.stringify(input);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
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
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [id, serialized]);

  // Drop stale results immediately on id change (effects run after paint).
  const matched = resultId === id ? result : null;

  return { result: matched, error, loading: loading || resultId !== id };
}
