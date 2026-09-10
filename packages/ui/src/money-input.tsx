import { Field, TextInput, inputErrorClass } from "./field";
import { formatINR, parseDigits } from "./format";

export function MoneyInput({
  label,
  value,
  onChange,
  hint,
  error,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  hint?: string;
  error?: string;
}) {
  return (
    <Field label={label} hint={hint} error={error}>
      <TextInput
        inputMode="numeric"
        className={error ? inputErrorClass : undefined}
        value={formatINR(value)}
        onChange={(e) => onChange(parseDigits(e.target.value.replace(/,/g, "")))}
      />
    </Field>
  );
}
