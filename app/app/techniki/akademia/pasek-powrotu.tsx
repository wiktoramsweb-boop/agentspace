"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { oznaczLekcje } from "./actions";

export function PasekPowrotu({ lekcjaId, tytul, nazwa, zrobiona, moznaOznaczyc }: { lekcjaId: string; tytul: string; nazwa: string; zrobiona: boolean; moznaOznaczyc: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [blad, setBlad] = useState<string | null>(null);
  const powrot = "/app/techniki?widok=akademia";
  // Pasek idzie wprost do <body>: wewnątrz animowanej treści strony `fixed`
  // przykleja się do kontenera, a baner instalacji aplikacji go przykrywał.
  const [cel, setCel] = useState<HTMLElement | null>(null);
  useEffect(() => setCel(document.querySelector<HTMLElement>(".app-shell") ?? document.body), []);

  const pasek = (
      <div className="pasek-akademii print-hide fixed left-3 right-[76px] bottom-[calc(84px+env(safe-area-inset-bottom))] z-[95] md:right-auto md:inset-x-auto md:bottom-5 md:left-1/2 md:w-[min(640px,calc(100%-320px))] md:-translate-x-[calc(50%-130px)]">
        <div className="sn-karta flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/95 p-2 pl-4 shadow-xl shadow-slate-900/15 backdrop-blur">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600">{nazwa}</p>
            <p className="truncate text-sm font-semibold text-slate-900">{tytul}</p>
            {blad && <p className="text-xs text-red-600">{blad}</p>}
          </div>
          {zrobiona || !moznaOznaczyc ? (
            <Link href={powrot} className="flex-shrink-0 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700">
              ← Wróć do ścieżki
            </Link>
          ) : (
            <>
              <Link href={powrot} className="hidden flex-shrink-0 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 sm:block">
                Wróć
              </Link>
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  start(async () => {
                    setBlad(null);
                    const w = await oznaczLekcje(lekcjaId, true);
                    if (!w.ok) return setBlad(w.error);
                    router.push(powrot);
                  })
                }
                className="flex-shrink-0 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-60"
              >
                {pending ? "Zapisuję…" : (<><span className="sm:hidden">Przerobione ✓</span><span className="hidden sm:inline">Przerobione, wracam ✓</span></>)}
              </button>
            </>
          )}
        </div>
      </div>
  );

  return (
    <>
      {/* Miejsce pod paskiem, żeby koniec lekcji nie chował się za nim. */}
      <div className="h-28" aria-hidden="true" />
      {cel && createPortal(pasek, cel)}
    </>
  );
}
