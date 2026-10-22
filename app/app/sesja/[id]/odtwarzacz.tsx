"use client";

import { useEffect, useRef, useState } from "react";
import { formatCzasu } from "@/lib/coach/metryki";

export type ZnacznikNagrania = { t: number; tytul: string; dobrze: boolean };

/**
 * Odsłuch rozmowy głosowej z momentami z oceny na osi.
 * Klik w znacznik przewija nagranie do tego miejsca.
 */
export function Odtwarzacz({ sesjaId, znaczniki, dlugosc }: { sesjaId: string; znaczniki: ZnacznikNagrania[]; dlugosc: number | null }) {
  const audio = useRef<HTMLAudioElement>(null);
  const [gra, setGra] = useState(false);
  const [czas, setCzas] = useState(0);
  const [dl, setDl] = useState(dlugosc ?? 0);
  const [blad, setBlad] = useState(false);

  useEffect(() => {
    const a = audio.current;
    if (!a) return;
    const naCzas = () => setCzas(a.currentTime);
    const naMeta = () => Number.isFinite(a.duration) && a.duration > 0 && setDl(a.duration);
    const naKoniec = () => setGra(false);
    a.addEventListener("timeupdate", naCzas);
    a.addEventListener("loadedmetadata", naMeta);
    a.addEventListener("ended", naKoniec);
    return () => {
      a.removeEventListener("timeupdate", naCzas);
      a.removeEventListener("loadedmetadata", naMeta);
      a.removeEventListener("ended", naKoniec);
    };
  }, []);

  function przelacz() {
    const a = audio.current;
    if (!a) return;
    if (a.paused) {
      a.play().then(() => setGra(true)).catch(() => setBlad(true));
    } else {
      a.pause();
      setGra(false);
    }
  }

  function skocz(t: number) {
    const a = audio.current;
    if (!a) return;
    a.currentTime = Math.max(0, t - 1);
    a.play().then(() => setGra(true)).catch(() => setBlad(true));
  }

  const procent = (t: number) => (dl > 0 ? Math.min(100, (t / dl) * 100) : 0);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5">
      <audio ref={audio} src={`/api/coach/nagranie?sesja=${sesjaId}`} preload="metadata" onError={() => setBlad(true)} />
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Nagranie i przebieg rozmowy</p>
        <span className="font-mono text-sm tabular-nums text-slate-600">
          {formatCzasu(czas)} / {formatCzasu(dl)}
        </span>
      </div>
      {blad ? (
        <p className="mt-3 text-sm text-slate-500">Nagranie jeszcze się przygotowuje albo jest niedostępne. Spróbuj odświeżyć za minutę.</p>
      ) : (
        <div className="mt-4 flex items-center gap-4">
          <div className="relative min-w-0 flex-1 pb-9 pt-2">
            <button
              type="button"
              className="relative block h-2 w-full rounded-full bg-slate-100"
              aria-label="Przewiń nagranie"
              onClick={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                skocz(((e.clientX - r.left) / r.width) * dl + 1);
              }}
            >
              <span className="absolute inset-y-0 left-0 rounded-full bg-emerald-500" style={{ width: `${procent(czas)}%` }} />
            </button>
            {znaczniki.map((z, i) => (
              <button
                key={i}
                type="button"
                onClick={() => skocz(z.t)}
                className="group absolute top-0 -translate-x-1/2"
                style={{ left: `${procent(z.t)}%` }}
                title={`${formatCzasu(z.t)} ${z.tytul}`}
              >
                <span className={`block h-4 w-4 rounded-full ring-4 ring-white transition group-hover:scale-125 ${z.dobrze ? "bg-emerald-500" : "bg-rose-500"}`} />
                <span className={`absolute left-1/2 top-6 hidden max-w-[150px] -translate-x-1/2 truncate rounded-md px-2 py-0.5 text-[11px] font-semibold sm:block ${z.dobrze ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                  {z.tytul}
                </span>
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={przelacz}
            className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-500 text-white shadow-sm transition hover:bg-emerald-400"
            aria-label={gra ? "Pauza" : "Odtwórz"}
          >
            {gra ? (
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
            ) : (
              <svg className="h-5 w-5 translate-x-0.5" viewBox="0 0 24 24" fill="currentColor"><path d="M7 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L8.5 4.64A1 1 0 0 0 7 5.5Z" /></svg>
            )}
          </button>
        </div>
      )}
      {znaczniki.length > 0 && !blad && <p className="text-xs text-slate-400">{znaczniki.length} momenty z oceny na osi, kliknij, żeby przewinąć.</p>}
    </div>
  );
}
