"use client";

import { useActionState, useEffect, useRef } from "react";
import { inviteAgent } from "./actions";

export function InviteForm() {
  const [state, formAction, pending] = useActionState(inviteAgent, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-3 sm:flex-row">
      <input
        name="email"
        type="email"
        required
        placeholder="email.agenta@biuro.pl"
        className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-white placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-zinc-950 transition hover:bg-emerald-400 disabled:opacity-60"
      >
        {pending ? "Wysyłam..." : "Zaproś agenta"}
      </button>
      {state?.error && (
        <p className="w-full text-sm text-red-400 sm:order-last">{state.error}</p>
      )}
      {state?.success && (
        <p className="w-full text-sm text-emerald-400 sm:order-last">{state.success}</p>
      )}
    </form>
  );
}
