"use client";

import { todayPL } from "@/lib/datetime";
import { useState } from "react";
import { generujRaportPdf } from "@/lib/raport-pdf";
import { pobierzPdf, drukujPdf } from "@/lib/pdf-kit";
import type { RaportWlasciciela } from "@/lib/data-raporty";

/**
 * Zapis i druk raportu. Jak w dokumentach: najpierw powstaje plik, dopiero
 * potem druk otwiera ten właśnie plik, więc na papier idzie raport, a nie
 * interfejs aplikacji z nagłówkami przeglądarki.
 */
export function EksportRaportu({
  raport,
  nazwaBiura,
  stopka,
}: {
  raport: RaportWlasciciela;
  nazwaBiura: string;
  stopka?: string;
}) {
  const [pracuje, setPracuje] = useState<false | "zapis" | "druk">(false);
  const [blad, setBlad] = useState<string | null>(null);

  async function zrob(tryb: "zapis" | "druk") {
    setBlad(null);
    setPracuje(tryb);
    try {
      const bytes = await generujRaportPdf(raport, nazwaBiura, stopka);
      if (tryb === "zapis") {
        const dzis = todayPL();
        pobierzPdf(bytes, `Raport ${nazwaBiura} ${dzis}`.replace(/[\\/:*?"<>|]/g, "-"));
      } else {
        drukujPdf(bytes);
      }
    } catch (e) {
      setBlad(e instanceof Error ? e.message : "Nie udało się przygotować raportu.");
    } finally {
      setPracuje(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => zrob("zapis")}
        disabled={!!pracuje}
        className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400 disabled:opacity-60"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
        </svg>
        {pracuje === "zapis" ? "Tworzę PDF…" : "Pobierz PDF"}
      </button>
      <button
        type="button"
        onClick={() => zrob("druk")}
        disabled={!!pracuje}
        className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:border-slate-400 disabled:opacity-60"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5Z" />
        </svg>
        {pracuje === "druk" ? "Przygotowuję…" : "Drukuj"}
      </button>
      {blad && <span className="text-sm text-red-600">{blad}</span>}
    </div>
  );
}
