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
          className="text-xs font-medium text-emerald-600 transition hover:text-emerald-700"
        >
          Zmień email
        </button>
        {state?.success && <p className="text-xs text-emerald-600">{state.success}</p>}
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
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none"
      />
      <p className="text-xs text-slate-500">
        Obecny: {currentEmail}. Po zmianie logujesz się nowym adresem, hasło bez zmian.
      </p>
      {state?.error && <p className="text-xs text-red-600">{state.error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-400 disabled:opacity-60"
        >
          {pending ? "Zapisuję…" : "Zapisz email"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-700 transition hover:bg-slate-100"
        >
          Anuluj
        </button>
      </div>
    </form>
  );
}
