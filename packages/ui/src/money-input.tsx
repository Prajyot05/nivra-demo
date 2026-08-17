import { Field, TextInput } from "./field";
import { formatINR, parseDigits } from "./format";

export function MoneyInput({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  hint?: string;
}) {
  return (
    <Field label={label} hint={hint}>
      <TextInput
        inputMode="numeric"
        value={formatINR(value)}
        onChange={(e) => onChange(parseDigits(e.target.value.replace(/,/g, "")))}
      />
    </Field>
  );
}
