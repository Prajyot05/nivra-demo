import { Field, TextInput, inputErrorClass } from "./field";
import { formatINR, parseDigits } from "./format";

export function MoneyInput({
  label,
  value,
  onChange,
  hint,
  error,
  align = "left",
  wrapLabel = false,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  hint?: string;
  error?: string;
  align?: "left" | "right";
  wrapLabel?: boolean;
}) {
  return (
    <Field label={label} hint={hint} error={error} wrapLabel={wrapLabel}>
      <TextInput
        inputMode="numeric"
        className={`${error ? inputErrorClass : ""} ${align === "right" ? "text-right" : ""}`.trim()}
        value={formatINR(value)}
        onChange={(e) => onChange(parseDigits(e.target.value.replace(/,/g, "")))}
      />
    </Field>
  );
}
