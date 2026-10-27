"use client";

import { useState } from "react";
import type { Prog } from "@/lib/zasady-prowizji";

const pole = "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none";

/** Wiersze progów: „od X zł netto od początku roku agent ma Y%”. */
export function Progi({ poczatkowe }: { poczatkowe: Prog[] }) {
  const [wiersze, setWiersze] = useState<{ od: string; pct: string }[]>(
    poczatkowe.length ? poczatkowe.map((p) => ({ od: String(p.od), pct: String(p.pct) })) : [],
  );
  return (
    <div className="space-y-2">
      {wiersze.length === 0 && <p className="text-sm text-slate-500">Bez progów: każdy agent ma udział ustawiony w swoim profilu.</p>}
      {wiersze.map((w, i) => (
        <div key={i} className="grid grid-cols-[minmax(0,1fr)_minmax(0,7rem)_auto] items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <span className="shrink-0">od</span>
            <input name="prog_od" inputMode="numeric" value={w.od} onChange={(e) => setWiersze((x) => x.map((y, j) => (j === i ? { ...y, od: e.target.value } : y)))} className={pole} aria-label="Próg w zł netto" />
            <span className="shrink-0">zł</span>
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input name="prog_pct" inputMode="numeric" value={w.pct} onChange={(e) => setWiersze((x) => x.map((y, j) => (j === i ? { ...y, pct: e.target.value } : y)))} className={pole} aria-label="Udział agenta w procentach" />
            <span>%</span>
          </label>
          <button type="button" onClick={() => setWiersze((x) => x.filter((_, j) => j !== i))} className="rounded-lg px-2 py-1.5 text-sm text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label="Usuń próg">
            ✕
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => setWiersze((x) => [...x, x.length ? { od: String(Number(x[x.length - 1].od || 0) + 50000), pct: String(Math.min(100, Number(x[x.length - 1].pct || 50) + 10)) } : { od: "0", pct: "50" }])}
        className="rounded-xl border border-dashed border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:border-emerald-500 hover:text-emerald-700"
      >
        + Dodaj próg
      </button>
    </div>
  );
}
