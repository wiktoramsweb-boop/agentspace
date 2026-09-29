"use client";

import { useState } from "react";
import { odswiezDane, wyczysc, zalozZespol, type Wynik } from "./actions";

/** Trzy przyciski i jeden komunikat: panel ma być nudny i przewidywalny. */
export function DemoPanel() {
  const [wynik, setWynik] = useState<Wynik | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const uruchom = (nazwa: string, fn: () => Promise<Wynik>) => async () => {
    setBusy(nazwa);
    setWynik(null);
    try {
      setWynik(await fn());
    } catch (e) {
      setWynik({ ok: false, message: e instanceof Error ? e.message : "Coś poszło nie tak." });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={busy !== null}
          onClick={uruchom("zespol", zalozZespol)}
          className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
        >
          {busy === "zespol" ? "Zakładam…" : "1. Załóż zespół"}
        </button>

        <button
          type="button"
          disabled={busy !== null}
          onClick={uruchom("dane", odswiezDane)}
          className="rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-white transition hover:bg-emerald-400 disabled:opacity-60"
        >
          {busy === "dane" ? "Wypełniam…" : "2. Wypełnij dane"}
        </button>

        <button
          type="button"
          disabled={busy !== null}
          onClick={uruchom("czysc", wyczysc)}
          className="rounded-xl border border-slate-300 px-5 py-3 font-medium text-slate-500 transition hover:bg-slate-100 disabled:opacity-60"
        >
          {busy === "czysc" ? "Czyszczę…" : "Wyczyść dane"}
        </button>
      </div>

      {wynik && (
        <div
          className={`mt-5 rounded-xl border p-4 text-sm ${
            wynik.ok ? "border-emerald-300 bg-emerald-50 text-emerald-900" : "border-amber-300 bg-amber-50 text-amber-900"
          }`}
        >
          <p className="font-medium">{wynik.message}</p>
          {wynik.szczegoly && wynik.szczegoly.length > 0 && (
            <ul className="mt-2 space-y-0.5 text-xs opacity-90">
              {wynik.szczegoly.map((d, i) => (
                <li key={i}>{d}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
