"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { importujOgloszenie } from "../ofertowka/actions";
import type { ZOgloszenia } from "@/lib/import-ogloszenia";

const pole = "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/15";

/**
 * Wklej link do ogłoszenia, a resztę zrobi program. Ten sam element w wycenie,
 * kreatorze oferty i wszędzie, gdzie zaczyna się od cudzego ogłoszenia.
 * Gdy portal nie oddaje strony (OLX), od razu przechodzi na wklejenie treści.
 */
export function WklejLink({ tytul, opis, onDane, start = "", auto = false }: { tytul: string; opis: string; onDane: (d: ZOgloszenia) => void; start?: string; auto?: boolean }) {
  const [link, setLink] = useState(start);
  const [tekst, setTekst] = useState("");
  const [trybTekstu, setTrybTekstu] = useState(false);
  const [blad, setBlad] = useState<string | null>(null);
  const [czeka, uruchom] = useTransition();

  function pobierz() {
    setBlad(null);
    uruchom(async () => {
      const r = await importujOgloszenie(trybTekstu ? { tekst } : { link });
      if (r.ok) return onDane(r.dane);
      setBlad(r.blad);
      if (/OLX|pobieranie/.test(r.blad)) setTrybTekstu(true);
    });
  }

  // Wejście z gotowym linkiem (asystent, wycena): czytamy od razu, raz.
  const juz = useRef(false);
  useEffect(() => {
    if (!auto || !start || juz.current) return;
    juz.current = true;
    pobierz();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto, start]);

  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4">
      <p className="text-sm font-semibold text-slate-900">{tytul}</p>
      <p className="mt-0.5 text-xs text-slate-500">{opis}</p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-start">
        {trybTekstu ? (
          <textarea value={tekst} onChange={(e) => setTekst(e.target.value)} rows={4} maxLength={15000} placeholder="Wklej tu całą treść ogłoszenia" className={pole} />
        ) : (
          <input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (link.trim()) pobierz();
              }
            }}
            inputMode="url"
            placeholder="https://www.otodom.pl/pl/oferta/…"
            className={pole}
          />
        )}
        <button
          type="button"
          onClick={pobierz}
          disabled={czeka || (trybTekstu ? tekst.trim().length < 40 : !link.trim())}
          className="shrink-0 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-400 disabled:opacity-40"
        >
          {czeka ? "Czytam ogłoszenie…" : "Pobierz dane"}
        </button>
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className={blad ? "text-rose-600" : "text-slate-500"}>{blad ?? "Otodom, Morizon, Gratka, Nieruchomosci-online, Domiporta, Adresowo. Z OLX wklej treść ogłoszenia."}</span>
        <button type="button" onClick={() => setTrybTekstu((v) => !v)} className="font-medium text-emerald-700 hover:underline">
          {trybTekstu ? "Mam link" : "Wkleję treść ogłoszenia"}
        </button>
      </div>
    </div>
  );
}
