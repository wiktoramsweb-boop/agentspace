"use client";

import { useMemo, useState, useTransition } from "react";
import { czytajCsvZNaglowkami } from "@/lib/csv";
import {
  POLA_KLIENTA,
  POLA_NIERUCHOMOSCI,
  zaproponujMapowanie,
  type Pole,
} from "@/lib/import-mapowanie";
import { Select } from "../../components/select";
import { importujKlientow, importujOferty, type WynikImportu } from "./actions";
import { PobieranieZdjec } from "./pobieranie-zdjec";

type Rodzaj = "klienci" | "oferty";

/**
 * Kreator importu z pliku.
 *
 * Plik czytamy w przeglądarce, a nie wysyłamy na serwer, z jednego powodu:
 * agent musi zobaczyć, co do czego trafi, ZANIM cokolwiek wyląduje w bazie.
 * Import bez podglądu to import, którego nikt nie odważy się puścić na
 * prawdziwej bazie klientów.
 */
export function KreatorImportu() {
  const [rodzaj, setRodzaj] = useState<Rodzaj>("klienci");
  const [nazwaPliku, setNazwaPliku] = useState<string | null>(null);
  const [naglowki, setNaglowki] = useState<string[]>([]);
  const [wiersze, setWiersze] = useState<Record<string, string>[]>([]);
  const [mapa, setMapa] = useState<Record<string, string>>({});
  const [blad, setBlad] = useState<string | null>(null);
  const [wynik, setWynik] = useState<WynikImportu | null>(null);
  const [pending, start] = useTransition();
  const [aktywne, setAktywne] = useState(false);

  const pola: Pole[] = rodzaj === "klienci" ? POLA_KLIENTA : POLA_NIERUCHOMOSCI;

  async function wczytaj(plik: File) {
    setBlad(null);
    setWynik(null);
    try {
      const tresc = await plik.text();
      const { naglowki: n, wiersze: w } = czytajCsvZNaglowkami(tresc);
      if (n.length === 0 || w.length === 0) {
        setBlad("Nie znalazłem w tym pliku żadnych danych. Sprawdź, czy pierwszy wiersz to nazwy kolumn.");
        return;
      }
      setNazwaPliku(plik.name);
      setNaglowki(n);
      setWiersze(w);
      setMapa(zaproponujMapowanie(n, pola));
    } catch {
      setBlad("Nie udało się odczytać pliku. Zapisz go w Excelu jako CSV i spróbuj ponownie.");
    }
  }

  // Zmiana rodzaju importu po wczytaniu pliku: dopasowujemy kolumny od nowa.
  function zmienRodzaj(nowy: Rodzaj) {
    setRodzaj(nowy);
    setWynik(null);
    if (naglowki.length > 0) {
      setMapa(zaproponujMapowanie(naglowki, nowy === "klienci" ? POLA_KLIENTA : POLA_NIERUCHOMOSCI));
    }
  }

  /** Wiersze przepisane na nasze pola, gotowe do wysłania i do podglądu. */
  const gotowe = useMemo(
    () =>
      wiersze.map((w) => {
        const o: Record<string, string> = {};
        for (const pole of pola) {
          const kolumna = mapa[pole.klucz];
          if (kolumna) o[pole.klucz] = w[kolumna] ?? "";
        }
        return o;
      }),
    [wiersze, mapa, pola],
  );

  const brakWymaganych = pola.filter((p) => p.wymagane && !mapa[p.klucz]);
  const puste = gotowe.filter((w) => !w[pola[0].klucz]?.trim()).length;

  function importuj() {
    setBlad(null);
    start(async () => {
      const w = rodzaj === "klienci" ? await importujKlientow(gotowe) : await importujOferty(gotowe, { aktywne });
      setWynik(w);
    });
  }

  return (
    <div className="space-y-6">
      {/* Krok 1: co importujemy */}
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">
          Krok 1 · Co wgrywasz
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {([
            { id: "klienci", tytul: "Klienci", opis: "Kontakty, telefony, notatki" },
            { id: "oferty", tytul: "Nieruchomości", opis: "Oferty z ceną i metrażem" },
          ] as const).map((x) => (
            <button
              key={x.id}
              type="button"
              onClick={() => zmienRodzaj(x.id)}
              aria-pressed={rodzaj === x.id}
              className={`rounded-2xl border p-4 text-left transition ${
                rodzaj === x.id
                  ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/20"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <span className="block font-semibold text-slate-900">{x.tytul}</span>
              <span className="mt-0.5 block text-sm text-slate-500">{x.opis}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Krok 2: plik */}
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">
          Krok 2 · Wybierz plik CSV
        </p>
        <label className="flex cursor-pointer items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center transition hover:border-emerald-400">
          <input
            type="file"
            accept=".csv,.txt,text/csv"
            className="sr-only"
            onChange={(e) => {
              const plik = e.target.files?.[0];
              if (plik) void wczytaj(plik);
            }}
          />
          <span className="text-sm text-slate-600">
            {nazwaPliku ? (
              <>
                <strong className="text-slate-900">{nazwaPliku}</strong> · {wiersze.length} wierszy.
                Kliknij, żeby wybrać inny.
              </>
            ) : (
              <>
                Kliknij i wskaż plik. Jeśli masz XLSX, otwórz go w Excelu i zapisz jako
                <strong className="text-slate-900"> CSV</strong>.
              </>
            )}
          </span>
        </label>
        {blad && <p className="mt-2 text-sm text-red-600">{blad}</p>}
      </div>

      {/* Krok 3: mapowanie */}
      {naglowki.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">
            Krok 3 · Sprawdź, co gdzie trafi
          </p>
          <p className="mb-3 text-sm text-slate-500">
            Dopasowałem kolumny po nazwach. Popraw, jeśli coś się nie zgadza. Kolumny pominięte
            nie zostaną zaimportowane.
          </p>
          <div className="space-y-2">
            {pola.map((pole) => (
              <div key={pole.klucz} className="grid items-center gap-2 sm:grid-cols-[180px_1fr]">
                <span className="text-sm text-slate-700">
                  {pole.nazwa}
                  {pole.wymagane && <span className="ml-1 text-red-500">*</span>}
                </span>
                <Select
                  value={mapa[pole.klucz] ?? ""}
                  onChange={(e) => setMapa((m) => ({ ...m, [pole.klucz]: e.target.value }))}
                  placeholder="nie importuj"
                  options={naglowki.map((n) => ({ value: n, label: n }))}
                />
              </div>
            ))}
          </div>

          {brakWymaganych.length > 0 && (
            <p className="mt-3 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Wskaż kolumnę dla: {brakWymaganych.map((p) => p.nazwa).join(", ")}. Bez tego nie ma
              czego zapisać.
            </p>
          )}
        </div>
      )}

      {/* Krok 4: podgląd */}
      {gotowe.length > 0 && brakWymaganych.length === 0 && (
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">
            Krok 4 · Podgląd pierwszych pięciu
          </p>
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  {pola.filter((p) => mapa[p.klucz]).map((p) => (
                    <th key={p.klucz} className="whitespace-nowrap px-3 py-2 font-medium">
                      {p.nazwa}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {gotowe.slice(0, 5).map((w, i) => (
                  <tr key={i}>
                    {pola.filter((p) => mapa[p.klucz]).map((p) => (
                      <td key={p.klucz} className="max-w-[220px] truncate px-3 py-2 text-slate-700">
                        {w[p.klucz] || <span className="text-slate-300">puste</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-3 text-sm text-slate-500">
            Do zapisania: <strong className="text-slate-900">{gotowe.length - puste}</strong>{" "}
            {rodzaj === "klienci" ? "klientów" : "ofert"}.
            {puste > 0 && ` ${puste} wierszy bez wymaganego pola zostanie pominiętych.`}
            {gotowe.length > 2000 && " Za jednym razem zapiszę pierwsze 2000."}
          </p>

          {rodzaj === "oferty" && (
            <label className="mt-4 flex items-start gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={aktywne} onChange={(e) => setAktywne(e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600" />
              <span>
                Oferty bez kolumny statusu zapisz od razu jako <strong>aktywne</strong>.
                <span className="block text-xs text-slate-500">Bez zaznaczenia trafią do archiwum, żeby agent je przejrzał przed publikacją.</span>
              </span>
            </label>
          )}

          <button
            type="button"
            onClick={importuj}
            disabled={pending}
            className="mt-4 rounded-xl bg-emerald-500 px-6 py-3 font-semibold text-white transition hover:bg-emerald-400 disabled:opacity-50"
          >
            {pending ? "Zapisuję..." : `Zaimportuj do bazy biura`}
          </button>
        </div>
      )}

      {wynik && (
        <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-5">
          <p className="font-semibold text-emerald-900">
            Dodano {wynik.dodane} {rodzaj === "klienci" ? "klientów" : "ofert"}.
          </p>
          {wynik.pominiete > 0 && (
            <p className="mt-1 text-sm text-emerald-800">
              Pominięto {wynik.pominiete}: duplikaty albo wiersze bez wymaganego pola.
            </p>
          )}
          {wynik.bledy.length > 0 && (
            <ul className="mt-2 list-disc space-y-0.5 pl-5 text-sm text-amber-800">
              {wynik.bledy.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          )}
          {rodzaj === "oferty" && wynik.dodane > 0 && !aktywne && (
            <p className="mt-2 text-sm text-emerald-800">
              Oferty bez statusu w pliku trafiły do archiwum. Przejrzyj je i zmień status tym, które mają wrócić
              do sprzedaży.
            </p>
          )}
          {rodzaj === "oferty" && (wynik.zdjecDoPobrania ?? 0) > 0 && (
            <div className="mt-4">
              <PobieranieZdjec naStart={wynik.zdjecDoPobrania ?? 0} auto />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
