import { Field, TextInput } from "./field";

export function YearInput({
  label = "Tenure (Yrs)",
  value,
  onChange,
  min = 1,
  max = 100,
}: {
  label?: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <Field label={label}>
      <TextInput
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </Field>
  );
}

export function AgeInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <YearInput label="Age" value={value} onChange={onChange} min={0} max={120} />
  );
}
