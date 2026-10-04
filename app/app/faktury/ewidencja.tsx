"use client";

import { useState } from "react";

/**
 * Pobranie ewidencji sprzedaży za wybrany miesiąc.
 *
 * Domyślnie poprzedni miesiąc, bo po to się to pobiera: zamknięty okres
 * oddawany księgowej. Bieżący miesiąc też da się wybrać, ale rzadziej jest
 * tym, czego ktoś szuka.
 */
function miesiace(ile: number): { wartosc: string; etykieta: string }[] {
  const nazwy = [
    "styczeń", "luty", "marzec", "kwiecień", "maj", "czerwiec",
    "lipiec", "sierpień", "wrzesień", "październik", "listopad", "grudzień",
  ];
  const dzis = new Date();
  return Array.from({ length: ile }, (_, i) => {
    const d = new Date(dzis.getFullYear(), dzis.getMonth() - i, 1);
    const m = String(d.getMonth() + 1).padStart(2, "0");
    return {
      wartosc: `${d.getFullYear()}-${m}`,
      etykieta: `${nazwy[d.getMonth()]} ${d.getFullYear()}`,
    };
  });
}

export function EwidencjaSprzedazy() {
  const lista = miesiace(13);
  const [miesiac, setMiesiac] = useState(lista[1]?.wartosc ?? lista[0].wartosc);

  const [rok, mc] = miesiac.split("-").map(Number);
  const od = `${miesiac}-01`;
  // Dzień zero kolejnego miesiąca to ostatni dzień wybranego.
  const ostatni = new Date(rok, mc, 0).getDate();
  const doDnia = `${miesiac}-${String(ostatni).padStart(2, "0")}`;

  return (
    <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
      <p className="font-semibold text-slate-900">Ewidencja sprzedaży dla księgowej</p>
      <p className="mt-1 text-sm text-slate-500">
        Jeden wiersz na dokument, z rozbiciem na stawki VAT i wierszem sumującym.
        Proformy nie wchodzą, bo nie są fakturami.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <select
          value={miesiac}
          onChange={(e) => setMiesiac(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
          aria-label="Miesiąc"
        >
          {lista.map((m) => (
            <option key={m.wartosc} value={m.wartosc}>
              {m.etykieta}
            </option>
          ))}
        </select>
        <a
          href={`/api/eksport/ewidencja?od=${od}&do=${doDnia}`}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
        >
          Pobierz CSV
        </a>
      </div>
    </div>
  );
}
