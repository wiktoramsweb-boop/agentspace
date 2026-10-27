"use client";

import { useState, useTransition } from "react";
import { zglosMigracje } from "./actions";

const pole = "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none";
const SYSTEMY = ["ASARI", "Esti CRM", "Galactica Virgo", "IMO", "WebEstate", "Excel / Google Sheets", "Inny"];

/** Formularz „przenieście nam bazę”: dla biur, które wolą oddać migrację nam. */
export function ZgloszenieMigracji() {
  const [pending, start] = useTransition();
  const [wynik, setWynik] = useState<{ ok: boolean; error?: string } | null>(null);
  const [otwarte, setOtwarte] = useState(false);

  if (wynik?.ok) {
    return (
      <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-5">
        <p className="font-semibold text-emerald-900">Zgłoszenie przyjęte.</p>
        <p className="mt-1 text-sm text-emerald-800">Odezwiemy się, żeby ustalić, jak przekazać pliki z eksportu i kiedy przenosimy bazę.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-slate-900">Wolisz, żebyśmy przenieśli bazę za Ciebie?</p>
          <p className="mt-0.5 text-sm text-slate-500">Dostajemy eksport z Twojego programu, przenosimy klientów, oferty ze zdjęciami i przypisania agentów, a Ty sprawdzasz efekt.</p>
        </div>
        {!otwarte && (
          <button type="button" onClick={() => setOtwarte(true)} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">
            Zgłoś przeniesienie
          </button>
        )}
      </div>
      {otwarte && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            start(async () => setWynik(await zglosMigracje(fd)));
          }}
          className="mt-4 grid gap-3 sm:grid-cols-2"
        >
          <label className="text-sm text-slate-700">
            Z jakiego programu
            <select name="system" required className={`${pole} mt-1`} defaultValue="">
              <option value="" disabled>
                Wybierz
              </option>
              {SYSTEMY.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label className="text-sm text-slate-700">
            Telefon do kontaktu
            <input name="telefon" className={`${pole} mt-1`} placeholder="np. 500 100 200" />
          </label>
          <label className="text-sm text-slate-700">
            Ile mniej więcej ofert
            <input name="oferty" inputMode="numeric" className={`${pole} mt-1`} placeholder="np. 300" />
          </label>
          <label className="text-sm text-slate-700">
            Ile klientów
            <input name="klienci" inputMode="numeric" className={`${pole} mt-1`} placeholder="np. 2000" />
          </label>
          <label className="text-sm text-slate-700 sm:col-span-2">
            Link do plików (opcjonalnie)
            <input name="link" className={`${pole} mt-1`} placeholder="np. folder na Dysku Google albo WeTransfer" />
          </label>
          <label className="text-sm text-slate-700 sm:col-span-2">
            Co jeszcze powinniśmy wiedzieć
            <textarea name="notatka" rows={3} className={`${pole} mt-1`} placeholder="np. mamy dwa oddziały, część ofert jest w archiwum, termin przejścia do końca miesiąca" />
          </label>
          {wynik && !wynik.ok && <p className="text-sm text-red-600 sm:col-span-2">{wynik.error}</p>}
          <div className="flex gap-2 sm:col-span-2">
            <button type="submit" disabled={pending} className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50">
              {pending ? "Wysyłam…" : "Wyślij zgłoszenie"}
            </button>
            <button type="button" onClick={() => setOtwarte(false)} className="rounded-xl px-3 py-2 text-sm text-slate-500 hover:bg-slate-100">
              Anuluj
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
