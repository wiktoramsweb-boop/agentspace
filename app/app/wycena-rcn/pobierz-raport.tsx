"use client";

import { useState } from "react";
import type { DaneRaportu } from "@/lib/wycena-pdf";

/** Raport PDF powstaje w przeglądarce (pdf-lib), tak jak umowy: bez serwera i bez druku. */
export function PobierzRaport({ dane, nazwaPliku }: { dane: DaneRaportu; nazwaPliku: string }) {
  const [czeka, setCzeka] = useState(false);
  const [blad, setBlad] = useState<string | null>(null);
  async function pobierz() {
    setCzeka(true);
    setBlad(null);
    try {
      const { raportWycenyPdf } = await import("@/lib/wycena-pdf");
      const bajty = await raportWycenyPdf(dane);
      const url = URL.createObjectURL(new Blob([bajty as BlobPart], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = nazwaPliku;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    } catch (e) {
      setBlad(e instanceof Error ? e.message : "Nie udało się przygotować PDF.");
    } finally {
      setCzeka(false);
    }
  }
  return (
    <div>
      <button
        type="button"
        onClick={pobierz}
        disabled={czeka}
        className="inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-5 py-3 text-sm font-bold text-slate-900 transition hover:bg-emerald-300 disabled:opacity-60"
      >
        {czeka ? "Przygotowuję raport…" : "Pobierz raport PDF"}
      </button>
      {blad && <p className="mt-2 text-sm text-rose-300">{blad}</p>}
    </div>
  );
}
