"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { WYNIKI, type RozmowaDrzewo, type Wynik } from "@/lib/techniki/rozmowy";

type Krok = { wezel: string; wybrano?: number };

const STYL_WYNIKU: Record<Wynik, { tlo: string; tekst: string; ikona: string }> = {
  sukces: { tlo: "bg-emerald-50 border-emerald-200", tekst: "text-emerald-800", ikona: "✓" },
  pozniej: { tlo: "bg-sky-50 border-sky-200", tekst: "text-sky-800", ikona: "↻" },
  stop: { tlo: "bg-slate-100 border-slate-200", tekst: "text-slate-700", ikona: "■" },
};

/**
 * Rozmowa krok po kroku: agent mówi, Ty wybierasz, co odpowiada klient, a
 * skrypt pokazuje, jak poprowadzić dalej. Każda ścieżka kończy się jednym
 * z trzech wyników, więc widać, że „nie” też można zamknąć dobrze.
 */
export function RozmowaInteraktywna({ drzewo, nazwyTechnik }: { drzewo: RozmowaDrzewo; nazwyTechnik: Record<string, string> }) {
  const [kroki, setKroki] = useState<Krok[]>([{ wezel: drzewo.start }]);
  const koniecRef = useRef<HTMLDivElement>(null);
  const pierwszy = useRef(true);

  useEffect(() => {
    if (pierwszy.current) {
      pierwszy.current = false;
      return;
    }
    koniecRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [kroki.length]);

  const wybierz = (i: number) => {
    setKroki((k) => {
      const ostatni = k[k.length - 1];
      const w = drzewo.wezly[ostatni.wezel];
      const opcja = w.opcje?.[i];
      if (!opcja) return k;
      return [...k.slice(0, -1), { ...ostatni, wybrano: i }, { wezel: opcja.dalej }];
    });
  };

  const biezacy = drzewo.wezly[kroki[kroki.length - 1].wezel];
  const sciezek = Object.values(drzewo.wezly).filter((w) => w.koniec).length;

  return (
    <section className="mb-10 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
        <div>
          <h2 className="font-semibold text-slate-900">Przećwicz rozmowę z rozgałęzieniami</h2>
          <p className="text-sm text-slate-500">Wybieraj, co mówi klient. Zobaczysz, jak poprowadzić każdą wersję. Ta rozmowa ma {sciezek} różnych zakończeń.</p>
        </div>
        <div className="flex gap-2">
          {kroki.length > 1 && (
            <button
              type="button"
              onClick={() => setKroki((k) => (k.length > 1 ? [...k.slice(0, -2), { wezel: k[k.length - 2].wezel }] : k))}
              className="rounded-xl border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:border-slate-400"
            >
              ← Krok wstecz
            </button>
          )}
          <button type="button" onClick={() => setKroki([{ wezel: drzewo.start }])} className="rounded-xl px-3 py-1.5 text-sm font-medium text-slate-500 hover:bg-slate-100">
            Od początku
          </button>
        </div>
      </div>

      <div className="space-y-3 bg-slate-50 p-4 sm:p-6">
        {kroki.map((k, i) => {
          const w = drzewo.wezly[k.wezel];
          if (!w) return null;
          const ostatni = i === kroki.length - 1;
          return (
            <div key={`${k.wezel}-${i}`} className="rozmowa-krok space-y-3">
              <div className="flex justify-end">
                <div className="max-w-[88%]">
                  <p className="rounded-2xl rounded-br-md bg-slate-900 px-4 py-3 text-sm leading-relaxed text-white">
                    <span className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wider text-emerald-300">Ty</span>
                    {w.agent}
                  </p>
                  {(w.uwaga || w.technika) && (
                    <p className="mt-1.5 text-right text-xs leading-relaxed text-slate-500">
                      {w.technika && (
                        <Link href={`/app/techniki/${w.technika}`} className="font-semibold text-emerald-700 hover:underline">
                          {nazwyTechnik[w.technika] ?? w.technika}
                        </Link>
                      )}
                      {w.technika && w.uwaga && " · "}
                      {w.uwaga}
                    </p>
                  )}
                </div>
              </div>
              {k.wybrano !== undefined && w.opcje && (
                <div className="flex justify-start">
                  <p className="max-w-[85%] rounded-2xl rounded-bl-md border border-slate-200 bg-white px-4 py-3 text-sm leading-relaxed text-slate-800">
                    <span className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wider text-slate-400">Klient</span>
                    {w.opcje[k.wybrano].klient}
                  </p>
                </div>
              )}
              {ostatni && w.koniec && (
                <div className={`rozmowa-wynik rounded-2xl border p-4 ${STYL_WYNIKU[w.koniec.wynik].tlo}`}>
                  <p className={`flex items-center gap-2 font-semibold ${STYL_WYNIKU[w.koniec.wynik].tekst}`}>
                    <span aria-hidden="true">{STYL_WYNIKU[w.koniec.wynik].ikona}</span>
                    {WYNIKI[w.koniec.wynik].nazwa}
                  </p>
                  <p className={`mt-1 text-sm leading-relaxed ${STYL_WYNIKU[w.koniec.wynik].tekst}`}>{w.koniec.tekst}</p>
                  <button
                    type="button"
                    onClick={() => setKroki([{ wezel: drzewo.start }])}
                    className="mt-3 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
                  >
                    Sprawdź inną drogę
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {biezacy?.opcje && (
          <div ref={koniecRef} className="rozmowa-krok pt-1">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Co odpowiada klient?</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {biezacy.opcje.map((o, i) => (
                <button
                  key={o.klient}
                  type="button"
                  onClick={() => wybierz(i)}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-400 hover:shadow-md"
                >
                  „{o.klient}”
                </button>
              ))}
            </div>
          </div>
        )}
        {biezacy?.koniec && <div ref={koniecRef} />}
      </div>
    </section>
  );
}
