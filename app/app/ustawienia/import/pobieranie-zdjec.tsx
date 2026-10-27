"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { pobierzZdjeciaImportu } from "./actions";

/**
 * Pobieranie zdjęć z poprzedniego systemu partia po partii, z postępem.
 * Można zamknąć stronę: kolejka zostaje w bazie i wróci tu przy następnym wejściu.
 */
export function PobieranieZdjec({ naStart, auto = false }: { naStart: number; auto?: boolean }) {
  const router = useRouter();
  const [zostalo, setZostalo] = useState(naStart);
  const [pobrane, setPobrane] = useState(0);
  const [nieudane, setNieudane] = useState(0);
  const [trwa, setTrwa] = useState(false);
  const stop = useRef(false);
  const ruszone = useRef(false);

  async function start() {
    stop.current = false;
    setTrwa(true);
    let puste = 0;
    while (!stop.current) {
      const w = await pobierzZdjeciaImportu().catch(() => null);
      if (!w) break;
      setPobrane((x) => x + w.pobrane);
      setNieudane((x) => x + w.nieudane);
      setZostalo(w.zostalo);
      if (w.zostalo === 0) break;
      // Partia bez postępu dwa razy z rzędu: przerywamy, żeby nie kręcić się w kółko.
      puste = w.pobrane + w.nieudane === 0 ? puste + 1 : 0;
      if (puste >= 2) break;
    }
    setTrwa(false);
    router.refresh();
  }

  useEffect(() => {
    if (auto && !ruszone.current && naStart > 0) {
      ruszone.current = true;
      void start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto, naStart]);

  const razem = pobrane + nieudane + zostalo;
  const procent = razem ? Math.round(((pobrane + nieudane) / razem) * 100) : 100;
  if (naStart === 0 && pobrane === 0) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold text-slate-900">Zdjęcia z poprzedniego systemu</p>
        <p className="text-sm tabular-nums text-slate-500">
          {pobrane} pobranych{nieudane ? ` · ${nieudane} niedostępnych` : ""} · {zostalo} w kolejce
        </p>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${procent}%` }} />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {zostalo > 0 &&
          (trwa ? (
            <button type="button" onClick={() => (stop.current = true)} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Wstrzymaj
            </button>
          ) : (
            <button type="button" onClick={() => void start()} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500">
              {pobrane ? "Pobieraj dalej" : "Pobierz zdjęcia"}
            </button>
          ))}
        <p className="text-xs text-slate-500">
          {zostalo === 0 ? "Gotowe. Zdjęcia są już przy ofertach." : "Możesz zamknąć stronę i wrócić później, kolejka nie przepadnie."}
        </p>
      </div>
    </div>
  );
}
