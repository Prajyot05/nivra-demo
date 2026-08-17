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
    <>
      <Field label="Client Name">
        <TextInput value={name} onChange={(e) => onNameChange(e.target.value)} />
      </Field>
      <AgeInput value={age} onChange={onAgeChange} />
    </>
  );
}
