"use client";

import { useActionState } from "react";
import { requestPasswordReset } from "./actions";
import { FormField, SubmitButton, FormError } from "../components/auth/form-field";

export function RequestResetForm({ linkError }: { linkError?: boolean }) {
  const [state, formAction, pending] = useActionState(requestPasswordReset, undefined);
  const ok = !!state && "ok" in state && state.ok;
  const errorMsg = state && "error" in state ? state.error : undefined;

  if (ok) {
    return (
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
        <p className="font-medium text-emerald-300">Sprawdź skrzynkę 📧</p>
        <p className="mt-1 text-emerald-200/90">
          Jeśli konto z tym adresem istnieje, wysłaliśmy link do ustawienia nowego hasła. Otwórz go na tym
          samym urządzeniu i w tej samej przeglądarce. Link może chwilę iść — sprawdź też spam.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      {linkError && (
        <FormError message="Link wygasł lub jest nieprawidłowy. Wyślij nowy poniżej." />
      )}
      <FormField label="Email" name="email" type="email" autoComplete="email" placeholder="ty@biuro.pl" />
      <FormError message={errorMsg} />
      <SubmitButton pending={pending}>Wyślij link do resetu</SubmitButton>
    </form>
  );
}
