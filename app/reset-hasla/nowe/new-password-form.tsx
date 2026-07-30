"use client";

import { useActionState } from "react";
import { updatePassword } from "../actions";
import { FormField, SubmitButton, FormError } from "../../components/auth/form-field";

export function NewPasswordForm() {
  const [state, formAction, pending] = useActionState(updatePassword, undefined);
  const errorMsg = state && "error" in state ? state.error : undefined;

  return (
    <form action={formAction} className="space-y-4">
      <FormField
        label="Nowe hasło"
        name="password"
        type="password"
        autoComplete="new-password"
        placeholder="••••••••"
        hint="Minimum 8 znaków"
      />
      <FormField
        label="Powtórz hasło"
        name="confirm"
        type="password"
        autoComplete="new-password"
        placeholder="••••••••"
      />
      <FormError message={errorMsg} />
      <SubmitButton pending={pending}>Ustaw nowe hasło i zaloguj</SubmitButton>
    </form>
  );
}
