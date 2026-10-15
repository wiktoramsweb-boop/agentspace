"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signUpOwner } from "../auth/actions";
import { AuthShell } from "../components/auth/auth-shell";
import { FormField, SubmitButton, FormError } from "../components/auth/form-field";

export function FormularzRejestracji({ wymagaKodu, email, dniProbne }: { wymagaKodu: boolean; email: string; dniProbne: number }) {
  const [state, formAction, pending] = useActionState(signUpOwner, undefined);

  return (
    <AuthShell
      title="Załóż biuro w AgentSpace"
      subtitle={`${dniProbne} dni za darmo, z pełnym dostępem. Bez karty płatniczej: po okresie próbnym sam decydujesz, czy zostajesz. Agentów dodasz po zalogowaniu.`}
      footer={
        <>
          Masz już konto?{" "}
          <Link href="/login" className="font-medium text-emerald-400 underline-offset-2 hover:text-emerald-300 hover:underline">
            Zaloguj się
          </Link>
        </>
      }
    >
      <form action={formAction} className="space-y-4">
        {/* Pułapka na boty: człowiek tego pola nie widzi i go nie wypełni. */}
        <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
        {wymagaKodu && (
          <FormField
            label="Kod zaproszenia"
            name="inviteCode"
            placeholder="Kod od AgentSpace"
            hint="Dostajesz go przy rozmowie wdrożeniowej."
          />
        )}
        <FormField label="Imię i nazwisko" name="fullName" autoComplete="name" placeholder="Jan Kowalski" />
        <FormField label="Nazwa biura" name="agencyName" placeholder="Np. Nowak Nieruchomości" />
        <FormField label="Email" name="email" type="email" autoComplete="email" placeholder="ty@biuro.pl" defaultValue={email} />
        <FormField label="Telefon" name="phone" type="tel" autoComplete="tel" placeholder="+48 600 000 000" />
        <FormField
          label="Hasło"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="min. 8 znaków"
          hint="Minimum 8 znaków."
        />
        <FormError message={state?.error} />
        <SubmitButton pending={pending}>Załóż biuro i zacznij za darmo →</SubmitButton>
        <p className="text-center text-xs text-zinc-400">
          Zakładając konto akceptujesz{" "}
          <Link href="/regulamin" className="underline underline-offset-2 hover:text-emerald-300">regulamin</Link> i{" "}
          <Link href="/polityka-prywatnosci" className="underline underline-offset-2 hover:text-emerald-300">politykę prywatności</Link>.
        </p>
      </form>
    </AuthShell>
  );
}
