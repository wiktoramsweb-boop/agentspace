"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signIn } from "../auth/actions";
import { AuthShell } from "../components/auth/auth-shell";
import { FormField, SubmitButton, FormError } from "../components/auth/form-field";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(signIn, undefined);

  return (
    <AuthShell
      title="Zaloguj się"
      subtitle="Wróć do swojego zespołu i treningu."
      footer={
        <>
          Nie masz jeszcze konta?{" "}
          <Link href="/signup" className="text-emerald-400 hover:text-emerald-300">
            Załóż biuro
          </Link>
        </>
      }
    >
      <form action={formAction} className="space-y-4">
        <FormField label="Email" name="email" type="email" autoComplete="email" placeholder="ty@biuro.pl" />
        <FormField label="Hasło" name="password" type="password" autoComplete="current-password" placeholder="••••••••" />
        <FormError message={state?.error} />
        <SubmitButton pending={pending}>Zaloguj się</SubmitButton>
      </form>
    </AuthShell>
  );
}
