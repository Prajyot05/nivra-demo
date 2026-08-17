import { useEffect, useState } from "react";
import { calculate } from "@/lib/calculate-client";

export function useCalculate<T>(id: string, input: unknown) {
  const [result, setResult] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const serialized = JSON.stringify(input);

  useEffect(() => {
    setResult(null);
    setError(null);
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    const handle = window.setTimeout(() => {
      setLoading(true);
      calculate<T>(id, JSON.parse(serialized) as unknown)
        .then((payload) => {
          if (cancelled) return;
          setResult(payload.result);
          setError(null);
        })
        .catch((err: unknown) => {
          if (cancelled) return;
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

  return { result, error, loading };
}
