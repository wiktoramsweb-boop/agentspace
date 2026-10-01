"use client";

import { useState } from "react";

/**
 * Opis oferty po polsku i po angielsku.
 *
 * Limit 8500 znaków jest po stronie portali, więc licznik pokazujemy na bieżąco,
 * a nie dopiero przy zapisie. Oba opisy pisze agent: generowanie i tłumaczenie
 * przez model wycofaliśmy, bo pojedyncze wywołanie kosztowało więcej niż
 * wszystkie pozostałe funkcje AI razem wzięte.
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
      </div>

      <div>
        <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
          <label className="text-sm text-slate-500">
            Opis po angielsku <span className="text-xs text-slate-400">(dla kupujących z zagranicy)</span>
          </label>
          <Licznik ile={en.length} limit={8500} />
        </div>
        <textarea
          name="description_en"
          rows={8}
          maxLength={8500}
          value={en}
          onChange={(e) => setEn(e.target.value)}
          placeholder="Wersja angielska opisu. Możesz zostawić puste."
          className={inp}
        />
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
