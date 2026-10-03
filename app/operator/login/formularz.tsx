"use client";

import { useActionState } from "react";
import { zalogujOperatora } from "../actions";

export function FormularzLogowania() {
  const [state, formAction, pending] = useActionState(zalogujOperatora, undefined);

  return (
    <form action={formAction} className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <div>
        <label htmlFor="login" className="mb-1.5 block text-sm font-medium text-zinc-300">
          Login
        </label>
        <input
          id="login"
          name="login"
          autoComplete="username"
          autoFocus
          className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2.5 text-sm text-white outline-none transition focus:border-emerald-500"
        />
      </div>

      <div>
        <label htmlFor="haslo" className="mb-1.5 block text-sm font-medium text-zinc-300">
          Hasło
        </label>
        <input
          id="haslo"
          name="haslo"
          type="password"
          autoComplete="current-password"
          className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2.5 text-sm text-white outline-none transition focus:border-emerald-500"
        />
      </div>

      {state?.error && (
        <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-300">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
      >
        {pending ? "Sprawdzam..." : "Zaloguj"}
      </button>
    </form>
  );
}
