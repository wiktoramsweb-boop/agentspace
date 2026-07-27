"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { inviteAgent } from "./actions";
import { CopyLink } from "./copy-link";

export type ManagerOption = { id: string; label: string };

export function InviteForm({ managers }: { managers: ManagerOption[] }) {
  const [state, formAction, pending] = useActionState(inviteAgent, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const [role, setRole] = useState("agent");

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
      setRole("agent");
    }
  }, [state]);

  return (
    <div className="space-y-3">
      <form ref={formRef} action={formAction} className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            name="email"
            type="email"
            required
            placeholder="email@biuro.pl"
            className={inp + " flex-1"}
          />
          <input name="fullName" placeholder="Imię i nazwisko (opcjonalnie)" className={inp + " flex-1"} />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex-1">
            <label className={lbl}>Rola</label>
            <select name="role" value={role} onChange={(e) => setRole(e.target.value)} className={inp}>
              <option value="agent">Agent</option>
              <option value="manager">Menedżer</option>
              <option value="owner">CEO (pełny dostęp)</option>
            </select>
          </div>
          {role === "agent" && (
            <div className="flex-1">
              <label className={lbl}>Menedżer (opcjonalnie)</label>
              <select name="managerId" className={inp} defaultValue="">
                <option value="">— bez menedżera —</option>
                {managers.map((m) => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-zinc-950 transition hover:bg-emerald-400 disabled:opacity-60 sm:w-auto"
        >
          {pending ? "Tworzę..." : "Utwórz zaproszenie"}
        </button>
      </form>

      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
      {state?.success && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] p-3">
          <p className="mb-2 text-sm text-emerald-300">{state.success}</p>
          {state.link && <CopyLink link={state.link} label="Kopiuj link" />}
          <p className="mt-2 text-xs text-zinc-500">
            Wyślij ten link zaproszonej osobie (WhatsApp, SMS, mail). Po kliknięciu założy konto z nadaną rolą.
          </p>
        </div>
      )}
    </div>
  );
}

const lbl = "mb-1.5 block text-xs text-zinc-500";
const inp =
  "w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-white placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30";
