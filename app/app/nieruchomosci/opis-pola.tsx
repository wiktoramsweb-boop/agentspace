"use client";

import { useState } from "react";

/**
 * Opis oferty po polsku i po angielsku.
 *
 * Limit 8500 znaków jest po stronie portali, więc licznik pokazujemy na bieżąco,
 * a nie dopiero przy zapisie. Wersję angielską tłumaczy model na żądanie, bo
 * agent i tak pisze najpierw po polsku, a tłumaczenie ręczne po prostu nie
 * powstaje.
 */
export function OpisPola({
  opis,
  opisEn,
}: {
  opis?: string | null;
  opisEn?: string | null;
}) {
  const [pl, setPl] = useState(opis ?? "");
  const [en, setEn] = useState(opisEn ?? "");
  const [pracuje, setPracuje] = useState(false);
  const [blad, setBlad] = useState<string | null>(null);

  async function przetlumacz() {
    setBlad(null);
    setPracuje(true);
    try {
      const r = await fetch("/api/opis/tlumacz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tekst: pl }),
      });
      const dane = (await r.json()) as { tekst?: string; error?: string };
      if (!r.ok || !dane.tekst) throw new Error(dane.error ?? "Nie udało się przetłumaczyć.");
      setEn(dane.tekst);
    } catch (e) {
      setBlad(e instanceof Error ? e.message : "Nie udało się przetłumaczyć.");
    } finally {
      setPracuje(false);
    }
  }

  return (
    <>
      <div>
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <label className="text-sm text-slate-500">Opis oferty</label>
          <Licznik ile={pl.length} limit={8500} />
        </div>
        <textarea
          name="description"
          rows={10}
          maxLength={8500}
          value={pl}
          onChange={(e) => setPl(e.target.value)}
          placeholder="Rozkładowe, po remoncie, balkon, blisko tramwaju..."
          className={inp}
        />
        <p className="mt-1.5 text-xs text-slate-400">
          Pełny opis możesz też wygenerować w module Opisy i wkleić tutaj.
        </p>
      </div>

      <div>
        <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
          <label className="text-sm text-slate-500">
            Opis po angielsku <span className="text-xs text-slate-400">(dla kupujących z zagranicy)</span>
          </label>
          <div className="flex items-center gap-3">
            <Licznik ile={en.length} limit={8500} />
            <button
              type="button"
              onClick={przetlumacz}
              disabled={pracuje || !pl.trim()}
              className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-violet-500 disabled:opacity-50"
            >
              {pracuje ? "Tłumaczę..." : en ? "Przetłumacz ponownie" : "Przetłumacz z polskiego"}
            </button>
          </div>
        </div>
        <textarea
          name="description_en"
          rows={8}
          maxLength={8500}
          value={en}
          onChange={(e) => setEn(e.target.value)}
          placeholder="Kliknij „Przetłumacz z polskiego” albo wpisz własny tekst."
          className={inp}
        />
        {blad && <p className="mt-1.5 text-xs text-red-600">{blad}</p>}
      </div>
    </>
  );
}

function Licznik({ ile, limit }: { ile: number; limit: number }) {
  const blisko = ile > limit * 0.9;
  return (
    <span className={`text-xs tabular-nums ${blisko ? "font-semibold text-amber-600" : "text-slate-400"}`}>
      {ile} / {limit}
    </span>
  );
}

const inp =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/15";
