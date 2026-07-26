"use client";

import { useActionState, useEffect, useRef } from "react";
import { inviteAgent } from "./actions";
import { CopyLink } from "./copy-link";

export function InviteForm() {
  const [state, formAction, pending] = useActionState(inviteAgent, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state]);

  return (
    <div className="space-y-3">
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
          {pending ? "Tworzę..." : "Zaproś agenta"}
        </button>
      </form>

      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
      {state?.success && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] p-3">
          <p className="mb-2 text-sm text-emerald-300">{state.success}</p>
          {state.link && <CopyLink link={state.link} label="Kopiuj link" />}
          <p className="mt-2 text-xs text-zinc-500">
            Wyślij ten link agentowi (WhatsApp, SMS, mail). Po kliknięciu założy konto i dołączy do zespołu.
          </p>
        </div>
      )}
    </div>
  );
}
