import { Field, TextInput } from "./field";
import { AgeInput } from "./year-input";

export function ClientHeader({
  name,
  age,
  onNameChange,
  onAgeChange,
}: {
  name: string;
  age: number;
  onNameChange: (name: string) => void;
  onAgeChange: (age: number) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Field label="Client Name">
        <TextInput value={name} onChange={(e) => onNameChange(e.target.value)} />
      </Field>
      <AgeInput value={age} onChange={onAgeChange} />
    </div>
  );
}
