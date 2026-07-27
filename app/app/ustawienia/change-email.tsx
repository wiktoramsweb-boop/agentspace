"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { changeMyEmail } from "./actions";

export function ChangeEmail({ currentEmail }: { currentEmail: string }) {
  const [state, formAction, pending] = useActionState(changeMyEmail, undefined);
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
      setOpen(false);
    }
  }, [state]);

  if (!open) {
    return (
      <div className="space-y-2">
        <button
          onClick={() => setOpen(true)}
          className="text-xs font-medium text-emerald-400 transition hover:text-emerald-300"
        >
          Zmień email
        </button>
        {state?.success && <p className="text-xs text-emerald-400">{state.success}</p>}
      </div>
    );
  }

  return (
    <form ref={formRef} action={formAction} className="mt-2 space-y-2">
      <input
        name="email"
        type="email"
        required
        placeholder="nowy@email.pl"
        defaultValue=""
        className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none"
      />
      <p className="text-xs text-zinc-500">
        Obecny: {currentEmail}. Po zmianie logujesz się nowym adresem, hasło bez zmian.
      </p>
      {state?.error && <p className="text-xs text-red-400">{state.error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-zinc-950 transition hover:bg-emerald-400 disabled:opacity-60"
        >
          {pending ? "Zapisuję…" : "Zapisz email"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 transition hover:bg-zinc-800"
        >
          Anuluj
        </button>
      </div>
    </form>
  );
}
