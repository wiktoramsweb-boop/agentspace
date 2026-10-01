"use client";

import type { ReactNode } from "react";

/** Wspólne klocki formularzy dokumentów: protokołu, aneksu i kolejnych. */

export const pole =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/15";

export function Pole({
  label, value, onChange, placeholder, type = "text", hint, maxLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  hint?: string;
  maxLength?: number;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm text-slate-500">{label}</label>
      <input
        type={type}
        value={value}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={pole}
      />
      {hint && <p className="mt-1.5 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

export function Sekcja({
  tytul, opis, children, akcja,
}: {
  tytul: string;
  opis?: string;
  children: ReactNode;
  akcja?: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-slate-900">{tytul}</h2>
          {opis && <p className="mt-0.5 text-sm text-slate-500">{opis}</p>}
        </div>
        {akcja}
      </div>
      {children}
    </section>
  );
}

export function PrzyciskDodaj({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-slate-300 px-3.5 py-2 text-sm font-medium text-slate-600 transition hover:border-emerald-500 hover:text-emerald-700"
    >
      <span aria-hidden="true" className="text-base leading-none">+</span>
      {children}
    </button>
  );
}

export function PrzyciskUsun({ onClick, tytul = "Usuń" }: { onClick: () => void; tytul?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={tytul}
      aria-label={tytul}
      className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
      </svg>
    </button>
  );
}

/**
 * Pasek akcji na dole: najpierw zapis pliku, potem druk.
 *
 * Kolejność jest celowa i wynika z tego, że druk prosto ze strony kiedyś nie
 * działał: na papier szedł interfejs aplikacji zamiast dokumentu. Teraz zawsze
 * najpierw powstaje prawdziwy PDF, a druk otwiera ten właśnie plik.
 */
export function PasekAkcji({
  onZapisz, onDrukuj, pracuje, blad, gotowe,
}: {
  onZapisz: () => void;
  onDrukuj: () => void;
  pracuje: false | "zapis" | "druk";
  blad: string | null;
  gotowe: string | null;
}) {
  return (
    <div className="sticky bottom-0 -mx-5 mt-2 border-t border-slate-200 bg-white/95 px-5 py-4 backdrop-blur md:mx-0 md:rounded-2xl md:border">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onZapisz}
          disabled={!!pracuje}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-400 disabled:opacity-60"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          {pracuje === "zapis" ? "Tworzę PDF…" : "Zapisz PDF na dysk"}
        </button>
        <button
          type="button"
          onClick={onDrukuj}
          disabled={!!pracuje}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-800 transition hover:border-slate-400 disabled:opacity-60"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5Z" />
          </svg>
          {pracuje === "druk" ? "Przygotowuję…" : "Drukuj"}
        </button>

        {gotowe && <span className="text-sm text-emerald-700">{gotowe}</span>}
        {blad && <span className="text-sm text-red-600">{blad}</span>}
      </div>
      <p className="mt-2 text-xs text-slate-400">
        Druk otwiera gotowy plik PDF w nowej karcie, dlatego na papier idzie sam dokument,
        bez nagłówków przeglądarki.
      </p>
    </div>
  );
}
