"use client";

import { useState } from "react";

const MIESIACE = ["styczeń", "luty", "marzec", "kwiecień", "maj", "czerwiec", "lipiec", "sierpień", "wrzesień", "październik", "listopad", "grudzień"];
const DNI = ["pn", "wt", "śr", "cz", "pt", "sb", "nd"];
const GODZINY = Array.from({ length: 15 }, (_, i) => i + 7); // 7:00–21:00
const MINUTY = ["00", "15", "30", "45"];

const klucz = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const dodajDni = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const zKlucza = (k: string) => {
  const [r, m, d] = k.split("-").map(Number);
  return new Date(r, m - 1, d);
};
const ladnie = (k: string) => new Intl.DateTimeFormat("pl-PL", { weekday: "short", day: "numeric", month: "long" }).format(zKlucza(k));

/**
 * Wybór dnia i godziny bez systemowych pól daty, które na Macu i telefonie
 * wyglądały różnie i potrafiły nie dać się kliknąć. Najczęstsze terminy są pod
 * jednym stuknięciem (dziś, jutro, pełne godziny), reszta w kalendarzu miesiąca.
 *
 * Wartość to „RRRR-MM-DD” i „GG:MM”. Z `name` komponent wystawia ukryte pola
 * `${name}_date` i `${name}_time`, więc działa też w zwykłym formularzu.
 */
export function WyborTerminu({
  data,
  godzina,
  onChange,
  name,
  bezGodziny = false,
}: {
  data: string;
  godzina: string;
  onChange?: (data: string, godzina: string) => void;
  name?: string;
  bezGodziny?: boolean;
}) {
  const [d, setD] = useState(data);
  const [g, setG] = useState(godzina);
  const [kalendarz, setKalendarz] = useState(false);
  const [miesiac, setMiesiac] = useState(() => {
    const x = zKlucza(data);
    return new Date(x.getFullYear(), x.getMonth(), 1);
  });
  const dzis = new Date();
  const dzisK = klucz(dzis);
  const szybkie = [
    { k: dzisK, t: "Dziś" },
    { k: klucz(dodajDni(dzis, 1)), t: "Jutro" },
    { k: klucz(dodajDni(dzis, 2)), t: "Pojutrze" },
  ];
  const ustaw = (nd: string, ng: string) => {
    setD(nd);
    setG(ng);
    onChange?.(nd, ng);
  };
  const [hh, mm] = g.split(":");

  // Siatka miesiąca od poniedziałku.
  const start = (miesiac.getDay() + 6) % 7;
  const ileDni = new Date(miesiac.getFullYear(), miesiac.getMonth() + 1, 0).getDate();
  const pola: (Date | null)[] = [...Array(start).fill(null), ...Array.from({ length: ileDni }, (_, i) => new Date(miesiac.getFullYear(), miesiac.getMonth(), i + 1))];

  const pill = (aktywny: boolean) =>
    `rounded-lg px-3 py-1.5 text-sm font-medium transition ${aktywny ? "bg-emerald-600 text-white shadow-sm" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`;

  return (
    <div className="space-y-3">
      {name && (
        <>
          <input type="hidden" name={`${name}_date`} value={d} />
          {!bezGodziny && <input type="hidden" name={`${name}_time`} value={g} />}
        </>
      )}

      <div className="flex flex-wrap items-center gap-1.5">
        {szybkie.map((s) => (
          <button key={s.k} type="button" onClick={() => ustaw(s.k, g)} className={pill(d === s.k)}>
            {s.t}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setKalendarz((v) => !v)}
          className={`inline-flex items-center gap-1.5 ${pill(!szybkie.some((s) => s.k === d))}`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
          </svg>
          {szybkie.some((s) => s.k === d) ? "Inny dzień" : ladnie(d)}
        </button>
      </div>

      {kalendarz && (
        <div className="w-full max-w-xs rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <button type="button" aria-label="Poprzedni miesiąc" onClick={() => setMiesiac(new Date(miesiac.getFullYear(), miesiac.getMonth() - 1, 1))} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100">
              ‹
            </button>
            <span className="text-sm font-semibold capitalize text-slate-900">
              {MIESIACE[miesiac.getMonth()]} {miesiac.getFullYear()}
            </span>
            <button type="button" aria-label="Następny miesiąc" onClick={() => setMiesiac(new Date(miesiac.getFullYear(), miesiac.getMonth() + 1, 1))} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100">
              ›
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center">
            {DNI.map((x) => (
              <span key={x} className="py-1 text-[11px] font-medium uppercase text-slate-400">
                {x}
              </span>
            ))}
            {pola.map((p, i) =>
              p ? (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    ustaw(klucz(p), g);
                    setKalendarz(false);
                  }}
                  className={`h-9 rounded-lg text-sm transition ${
                    klucz(p) === d ? "bg-emerald-600 font-semibold text-white" : klucz(p) === dzisK ? "font-semibold text-emerald-700 ring-1 ring-emerald-300" : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {p.getDate()}
                </button>
              ) : (
                <span key={i} />
              ),
            )}
          </div>
        </div>
      )}

      {!bezGodziny && (
        <div>
          <div className="flex flex-wrap gap-1">
            {GODZINY.map((h) => {
              const t = String(h).padStart(2, "0");
              return (
                <button key={h} type="button" onClick={() => ustaw(d, `${t}:${mm ?? "00"}`)} className={`w-11 rounded-lg py-1.5 text-sm tabular-nums transition ${hh === t ? "bg-emerald-600 font-semibold text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>
                  {h}
                </button>
              );
            })}
          </div>
          <div className="mt-1.5 flex items-center gap-1">
            <span className="mr-1 text-xs text-slate-400">minuty</span>
            {MINUTY.map((m) => (
              <button key={m} type="button" onClick={() => ustaw(d, `${hh ?? "09"}:${m}`)} className={`w-11 rounded-lg py-1 text-sm tabular-nums transition ${mm === m ? "bg-emerald-600 font-semibold text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>
                :{m}
              </button>
            ))}
            <span className="ml-2 text-sm font-semibold tabular-nums text-slate-900">
              {ladnie(d)}, {g}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
