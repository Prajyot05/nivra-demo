"use client";

import { WealthAgeField, WealthTextField } from "./wealth-inputs";

/** Shared client identity fields for multi-mode calculator pages. */
export function ClientProfileFields({
  name,
  onName,
  nameError,
  age,
  onAge,
  ageError,
  email,
  onEmail,
  emailError,
  phone,
  onPhone,
  phoneError,
}: {
  name: string;
  onName: (value: string) => void;
  nameError?: string;
  age: number;
  onAge: (value: number) => void;
  ageError?: string;
  email: string;
  onEmail: (value: string) => void;
  emailError?: string;
  phone: string;
  onPhone: (value: string) => void;
  phoneError?: string;
}) {
  return (
    <>
      <WealthTextField
        label="Client name"
        value={name}
        onChange={onName}
        error={nameError}
        autoComplete="name"
      />
      <WealthAgeField value={age} onChange={onAge} error={ageError} />
      <WealthTextField
        label="Email"
        type="email"
        value={email}
        onChange={onEmail}
        error={emailError}
        placeholder="client@email.com"
        autoComplete="email"
      />
      <WealthTextField
        label="Phone"
        type="tel"
        value={phone}
        onChange={onPhone}
        error={phoneError}
        placeholder="+91 98765 43210"
        autoComplete="tel"
      />
    </>
  );
}
