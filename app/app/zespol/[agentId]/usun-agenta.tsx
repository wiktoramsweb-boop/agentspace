"use client";

import { useActionState, useState } from "react";
import { removeAgent, type DorobekAgenta, type UsuniecieResult } from "../actions";

/**
 * Usunięcie osoby z zespołu.
 *
 * Wcześniej był tu mały szary link bez potwierdzenia, a kliknięcie kasowało
 * profil razem z kluczami obcymi, czyli z całą bazą klientów i ofert tej
 * osoby. Teraz widać wprost, co zostanie przepisane i na kogo, a samo
 * usunięcie wymaga rozwinięcia sekcji i potwierdzenia.
 */
export function UsunAgenta({
  agentId,
  imie,
  dorobek,
  kandydaci,
}: {
  agentId: string;
  imie: string;
  dorobek: DorobekAgenta;
  kandydaci: { id: string; name: string }[];
}) {
  const [otwarte, setOtwarte] = useState(false);
  const [state, formAction, pending] = useActionState(
    async (_prev: UsuniecieResult, formData: FormData) => removeAgent(agentId, formData),
    undefined,
  );

  const pozycje = [
    ["klientów", dorobek.klienci],
    ["ofert", dorobek.oferty],
    ["transakcji", dorobek.transakcje],
    ["zadań", dorobek.zadania],
  ] as const;
  const maDane = pozycje.some(([, ile]) => ile > 0);

  if (!otwarte) {
    return (
      <div className="mt-10 border-t border-slate-200 pt-6">
        <button
          type="button"
          onClick={() => setOtwarte(true)}
          className="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
        >
          Usuń z zespołu
        </button>
      </div>
    );
  }

  return (
    <div className="mt-10 rounded-2xl border border-red-200 bg-red-50/60 p-6">
      <h2 className="text-base font-semibold text-red-900">Usuwasz {imie} z zespołu</h2>
      <p className="mt-1 text-sm leading-relaxed text-red-900/80">
        Ta osoba straci dostęp do systemu, a jej konto zostanie skasowane.
        Tego nie da się cofnąć.
      </p>

      <div className="mt-4 rounded-xl border border-red-200 bg-white p-4">
        <p className="text-sm font-medium text-slate-900">
          {maDane ? "Dorobek zostanie przepisany, nie skasowany" : "Ta osoba nie ma przypisanych danych"}
        </p>
        {maDane && (
          <ul className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-slate-600 sm:grid-cols-4">
            {pozycje.map(([label, ile]) => (
              <li key={label}>
                <span className="font-mono font-semibold text-slate-900">{ile}</span> {label}
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-xs leading-relaxed text-slate-500">
          Sesje AI Coacha, cele i dziennik wyników tej osoby znikają razem z nią.
        </p>
      </div>

      <form action={formAction} className="mt-5">
        <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="przejmujacy">
          Kto przejmuje klientów i oferty
        </label>
        <select
          id="przejmujacy"
          name="przejmujacy"
          className="w-full max-w-sm rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-200"
        >
          {kandydaci.map((k) => (
            <option key={k.id} value={k.id}>
              {k.name}
            </option>
          ))}
        </select>

        {state?.error && (
          <p className="mt-3 rounded-lg border border-red-300 bg-white p-3 text-sm text-red-700">{state.error}</p>
        )}

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={pending}
            className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
          >
            {pending ? "Usuwam…" : `Usuń ${imie} i przepisz dane`}
          </button>
          <button
            type="button"
            onClick={() => setOtwarte(false)}
            className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            Anuluj
          </button>
        </div>
      </form>
    </div>
  );
}
