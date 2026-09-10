import { Field, TextInput, inputErrorClass } from "./field";
import { AgeInput } from "./year-input";

export function ClientHeader({
  name,
  age,
  onNameChange,
  onAgeChange,
  nameError,
  ageError,
}: {
  name: string;
  age: number;
  onNameChange: (name: string) => void;
  onAgeChange: (age: number) => void;
  nameError?: string;
  ageError?: string;
}) {
  return (
    <>
      <Field label="Client Name" error={nameError}>
        <TextInput
          value={name}
          className={nameError ? inputErrorClass : undefined}
          onChange={(e) => onNameChange(e.target.value)}
        />
      </Field>
      <AgeInput value={age} onChange={onAgeChange} error={ageError} />
    </>
  );
}
