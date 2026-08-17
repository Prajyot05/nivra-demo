export type CalculateResponse<T> = {
  id: string;
  result: T;
};

export async function calculate<T>(
  id: string,
  input: unknown,
): Promise<CalculateResponse<T>> {
  const res = await fetch(`/api/calculate/${id}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = (await res.json().catch(() => ({}))) as {
    error?: string;
    id?: string;
    result?: T;
  };
  if (!res.ok) {
    throw new Error(body.error ?? `Calculate failed (${res.status})`);
  }
  return body as CalculateResponse<T>;
}
