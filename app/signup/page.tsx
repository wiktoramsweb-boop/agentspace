"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signUpOwner } from "../auth/actions";
import { AuthShell } from "../components/auth/auth-shell";
import { FormField, SubmitButton, FormError } from "../components/auth/form-field";

export default function SignupPage() {
  const [state, formAction, pending] = useActionState(signUpOwner, undefined);

  return (
    <AuthShell
      title="Załóż biuro w AgentSpace"
      subtitle="Konto właściciela. Agentów dodasz po zalogowaniu."
      footer={
        <>
          Masz już konto?{" "}
          <Link href="/login" className="text-emerald-400 hover:text-emerald-300">
            Zaloguj się
          </Link>
        </>
      }
    >
      <form action={formAction} className="space-y-4">
        <FormField label="Imię i nazwisko" name="fullName" autoComplete="name" placeholder="Jan Kowalski" />
        <FormField label="Nazwa biura" name="agencyName" placeholder="Np. Spectra Nieruchomości" />
        <FormField label="Email" name="email" type="email" autoComplete="email" placeholder="ty@biuro.pl" />
        <FormField
          label="Hasło"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="min. 8 znaków"
          hint="Minimum 8 znaków."
        />
        <FormError message={state?.error} />
        <SubmitButton pending={pending}>Załóż biuro →</SubmitButton>
        <p className="text-center text-xs text-zinc-500">
          Zakładając konto akceptujesz{" "}
          <Link href="/regulamin" className="underline hover:text-zinc-400">regulamin</Link> i{" "}
          <Link href="/polityka-prywatnosci" className="underline hover:text-zinc-400">politykę prywatności</Link>.
        </p>
      </form>
    </AuthShell>
  );
}
