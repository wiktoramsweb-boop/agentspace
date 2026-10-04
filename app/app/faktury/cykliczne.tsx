"use client";

import { useState, useTransition } from "react";
import { utworzHarmonogram, zatrzymajHarmonogram } from "./cykliczne-actions";
import type { Harmonogram } from "@/lib/faktury-cykliczne";

const OKRESY = [
  { wartosc: 1, etykieta: "co miesiąc" },
  { wartosc: 3, etykieta: "co kwartał" },
  { wartosc: 6, etykieta: "co pół roku" },
  { wartosc: 12, etykieta: "co rok" },
];

/** Przycisk na karcie faktury: zrób z niej dokument cykliczny. */
export function UstawCykliczna({ invoiceId }: { invoiceId: string }) {
  const [otwarte, setOtwarte] = useState(false);
  const [coMiesiecy, setCoMiesiecy] = useState(1);
  const [dniPlatnosci, setDniPlatnosci] = useState(7);
  const [blad, setBlad] = useState<string | null>(null);
  const [gotowe, setGotowe] = useState(false);
  const [pending, start] = useTransition();

  if (gotowe) {
    return <span className="text-sm text-emerald-700">Harmonogram ustawiony</span>;
  }

  return (
    <div className="print-hide">
      <button
        onClick={() => setOtwarte((v) => !v)}
        className="text-sm text-slate-500 transition hover:text-slate-900"
      >
        Powtarzaj cyklicznie
      </button>

      {otwarte && (
        <div className="mt-3 max-w-sm rounded-2xl border border-slate-200 bg-white p-4">
          <p className="mb-3 text-sm text-slate-500">
            Kolejne faktury wystawią się same, z nową numeracją i datami. Pierwsza
            pójdzie dopiero w następnym okresie, nie dziś.
          </p>
          <label className="mb-1 block text-xs font-medium text-slate-500">Jak często</label>
          <select
            value={coMiesiecy}
            onChange={(e) => setCoMiesiecy(Number(e.target.value))}
            className="mb-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
          >
            {OKRESY.map((o) => (
              <option key={o.wartosc} value={o.wartosc}>
                {o.etykieta}
              </option>
            ))}
          </select>
          <label className="mb-1 block text-xs font-medium text-slate-500">Dni na płatność</label>
          <input
            type="number"
            min={0}
            max={90}
            value={dniPlatnosci}
            onChange={(e) => setDniPlatnosci(Number(e.target.value))}
            className="mb-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
          />
          {blad && <p className="mb-2 text-sm text-red-600">{blad}</p>}
          <button
            disabled={pending}
            onClick={() => {
              setBlad(null);
              start(async () => {
                const w = await utworzHarmonogram(invoiceId, { coMiesiecy, dniPlatnosci });
                if (w.ok) setGotowe(true);
                else setBlad(w.error);
              });
            }}
            className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
          >
            {pending ? "Zapisuję..." : "Ustaw harmonogram"}
          </button>
        </div>
      )}
    </div>
  );
}

/** Lista aktywnych harmonogramów na stronie faktur. */
export function ListaHarmonogramow({ lista }: { lista: Harmonogram[] }) {
  const [pending, start] = useTransition();
  const aktywne = lista.filter((h) => h.aktywny);
  if (aktywne.length === 0) return null;

  return (
    <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
      <p className="font-semibold text-slate-900">Faktury cykliczne</p>
      <p className="mt-1 text-sm text-slate-500">
        Wystawiają się same raz dziennie, gdy nadejdzie termin.
      </p>
      <div className="mt-4 divide-y divide-slate-100">
        {aktywne.map((h) => (
          <div key={h.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div className="min-w-0">
              <p className="truncate font-medium text-slate-900">{h.nazwa || "Harmonogram"}</p>
              <p className="text-sm text-slate-500">
                Najbliższa: {h.nastepne}
                {h.ostatnie_wystawienie && ` · ostatnia: ${h.ostatnie_wystawienie}`}
              </p>
            </div>
            <button
              disabled={pending}
              onClick={() => {
                if (!confirm("Zatrzymać ten harmonogram? Wystawione faktury zostają.")) return;
                start(() => void zatrzymajHarmonogram(h.id));
              }}
              className="text-sm text-slate-500 transition hover:text-red-600 disabled:opacity-50"
            >
              Zatrzymaj
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
