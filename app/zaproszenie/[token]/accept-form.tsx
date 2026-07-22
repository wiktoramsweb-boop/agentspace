"use client";

import { useActionState } from "react";
import { acceptInvitation } from "../../auth/actions";
import { FormField, SubmitButton, FormError } from "../../components/auth/form-field";

export function AcceptInviteForm({ token, email }: { token: string; email: string }) {
  const [state, formAction, pending] = useActionState(acceptInvitation, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <FormField label="Email" name="email-display" defaultValue={email} readOnly required={false} />
      <FormField label="Imię i nazwisko" name="fullName" autoComplete="name" placeholder="Jan Kowalski" />
      <FormField
        label="Hasło"
        name="password"
        type="password"
        autoComplete="new-password"
        placeholder="min. 8 znaków"
        hint="Minimum 8 znaków."
      />
      <FormError message={state?.error} />
      <SubmitButton pending={pending}>Dołącz do zespołu →</SubmitButton>
    </form>
  );
}
