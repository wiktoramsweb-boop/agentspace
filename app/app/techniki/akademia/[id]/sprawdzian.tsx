"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { KolorModulu } from "@/lib/techniki/akademia";
import { oddajSprawdzian, sprawdzOdpowiedz } from "../actions";

const KOLORY: Record<KolorModulu, { pelny: string; obrys: string }> = {
  zielony: { pelny: "#10b981", obrys: "#059669" },
  turkus: { pelny: "#06b6d4", obrys: "#0891b2" },
  fiolet: { pelny: "#8b5cf6", obrys: "#7c3aed" },
  zloto: { pelny: "#f59e0b", obrys: "#d97706" },
};

type PytanieWidok = { pytanie: string; opcje: { i: number; tekst: string }[] };
type Ocena = { dobrze: boolean; poprawna: number; wyjasnienie: string; technika: string | null };
type Wynik = { wynik: number; max: number; zaliczony: boolean; pierwszyRaz: boolean; bledne: number[] };

/**
 * Sprawdzian krok po kroku: pytanie, odpowiedź, od razu wyjaśnienie, następne.
 * Na końcu serwer liczy wynik i zapisuje najlepszy, a ekran pokazuje, co
 * powtórzyć. Ma uczyć, a nie straszyć, więc każdy błąd ma swoje „dlaczego”.
 */
export function Sprawdzian({
  id, tytul, podtytul, prog, pytania, najlepszy, kolor, nazwyTechnik,
}: {
  id: string;
  tytul: string;
  podtytul: string;
  prog: number;
  pytania: PytanieWidok[];
  najlepszy: number | null;
  kolor: KolorModulu;
  nazwyTechnik: Record<string, string>;
}) {
  const router = useRouter();
  const k = KOLORY[kolor];
  const [start, setStart] = useState(false);
  const [nr, setNr] = useState(0);
  const [odpowiedzi, setOdpowiedzi] = useState<number[]>([]);
  const [ocena, setOcena] = useState<Ocena | null>(null);
  const [oceny, setOceny] = useState<Ocena[]>([]);
  const [wynik, setWynik] = useState<Wynik | null>(null);
  const [blad, setBlad] = useState<string | null>(null);
  const [pending, run] = useTransition();
  const p = pytania[nr];

  const wybierz = (i: number) => {
    if (ocena || pending) return;
    run(async () => {
      setBlad(null);
      const r = await sprawdzOdpowiedz(id, nr, i);
      if (!r.ok) return setBlad(r.error);
      setOdpowiedzi((o) => [...o, i]);
      setOcena(r);
      setOceny((o) => [...o, r]);
    });
  };

  const dalej = () => {
    if (nr < pytania.length - 1) {
      setNr(nr + 1);
      setOcena(null);
      return;
    }
    run(async () => {
      const r = await oddajSprawdzian(id, odpowiedzi);
      if (!r.ok) return setBlad(r.error);
      setWynik(r);
      router.refresh();
    });
  };

  const odNowa = () => {
    setNr(0);
    setOdpowiedzi([]);
    setOceny([]);
    setOcena(null);
    setWynik(null);
    setStart(true);
    router.refresh();
  };

  if (!start) {
    return (
      <div className="sn-karta mx-auto max-w-xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
        <div className="p-7 text-white" style={{ background: `linear-gradient(140deg, ${k.pelny}, ${k.obrys})` }}>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/80">{podtytul}</p>
          <h1 className="mt-2 text-3xl font-bold leading-tight">{tytul}</h1>
        </div>
        <div className="space-y-5 p-7">
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { l: pytania.length, o: "pytań" },
              { l: prog, o: "do zaliczenia" },
              { l: najlepszy ?? "–", o: "Twój najlepszy" },
            ].map((x) => (
              <div key={x.o} className="rounded-2xl bg-slate-50 p-3">
                <p className="text-2xl font-bold tabular-nums text-slate-900">{x.l}</p>
                <p className="text-xs text-slate-500">{x.o}</p>
              </div>
            ))}
          </div>
          <p className="text-sm leading-relaxed text-slate-600">Bez limitu czasu. Po każdej odpowiedzi zobaczysz, czy była dobra i dlaczego. Liczy się najlepszy wynik ze wszystkich podejść, a CEO widzi Twój postęp.</p>
          <button type="button" onClick={() => setStart(true)} className="block w-full rounded-2xl py-4 text-lg font-bold text-white transition active:translate-y-1" style={{ background: k.pelny, boxShadow: `0 6px 0 ${k.obrys}` }}>
            Zaczynam
          </button>
        </div>
      </div>
    );
  }

  if (wynik) return <EkranWyniku wynik={wynik} prog={prog} kolor={kolor} pytania={pytania} oceny={oceny} nazwyTechnik={nazwyTechnik} odNowa={odNowa} />;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-5 flex items-center gap-3">
        <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${((nr + (ocena ? 1 : 0)) / pytania.length) * 100}%`, background: k.pelny }} />
        </div>
        <span className="text-sm font-semibold tabular-nums text-slate-500">
          {nr + 1}/{pytania.length}
        </span>
      </div>

      <div key={nr} className="rozmowa-krok rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-xl font-bold leading-snug text-slate-900 sm:text-2xl">{p.pytanie}</h2>
        <div className="mt-6 space-y-2.5">
          {p.opcje.map((o, j) => {
            const wybrana = odpowiedzi[nr] === o.i;
            const poprawna = ocena && o.i === ocena.poprawna;
            const zla = ocena && wybrana && !ocena.dobrze;
            return (
              <button
                key={o.i}
                type="button"
                disabled={Boolean(ocena) || pending}
                onClick={() => wybierz(o.i)}
                className={`flex w-full items-start gap-3 rounded-2xl border-2 px-4 py-3.5 text-left text-[15px] leading-relaxed transition ${
                  poprawna
                    ? "akademia-dobrze border-emerald-500 bg-emerald-50 text-emerald-900"
                    : zla
                      ? "akademia-zle border-rose-400 bg-rose-50 text-rose-900"
                      : ocena
                        ? "border-slate-200 bg-white text-slate-400"
                        : "border-slate-200 bg-white text-slate-800 hover:-translate-y-0.5 hover:border-slate-400"
                }`}
              >
                <span className={`grid h-7 w-7 flex-shrink-0 place-items-center rounded-lg text-sm font-bold ${poprawna ? "bg-emerald-500 text-white" : zla ? "bg-rose-500 text-white" : "bg-slate-100 text-slate-500"}`}>
                  {poprawna ? "✓" : zla ? "✕" : String.fromCharCode(65 + j)}
                </span>
                {o.tekst}
              </button>
            );
          })}
        </div>

        {ocena && (
          <div className={`rozmowa-wynik mt-5 rounded-2xl p-4 ${ocena.dobrze ? "bg-emerald-50" : "bg-amber-50"}`}>
            <p className={`font-bold ${ocena.dobrze ? "text-emerald-800" : "text-amber-900"}`}>{ocena.dobrze ? "Dobrze!" : "Nie tym razem"}</p>
            <p className={`mt-1 text-sm leading-relaxed ${ocena.dobrze ? "text-emerald-900" : "text-amber-900"}`}>{ocena.wyjasnienie}</p>
            {ocena.technika && (
              <Link href={`/app/techniki/${ocena.technika}`} target="_blank" className="mt-2 inline-block text-xs font-semibold text-emerald-700 hover:underline">
                Technika: {nazwyTechnik[ocena.technika] ?? ocena.technika} ↗
              </Link>
            )}
          </div>
        )}
        {blad && <p className="mt-4 text-sm text-red-600">{blad}</p>}

        {ocena && (
          <button type="button" onClick={dalej} disabled={pending} className="mt-5 block w-full rounded-2xl py-3.5 text-base font-bold text-white transition active:translate-y-1 disabled:opacity-60" style={{ background: k.pelny, boxShadow: `0 5px 0 ${k.obrys}` }}>
            {pending ? "Liczę wynik…" : nr < pytania.length - 1 ? "Dalej" : "Zobacz wynik"}
          </button>
        )}
      </div>
    </div>
  );
}

function EkranWyniku({
  wynik, prog, kolor, pytania, oceny, nazwyTechnik, odNowa,
}: {
  wynik: Wynik;
  prog: number;
  kolor: KolorModulu;
  pytania: PytanieWidok[];
  oceny: Ocena[];
  nazwyTechnik: Record<string, string>;
  odNowa: () => void;
}) {
  const k = KOLORY[kolor];
  const [licznik, setLicznik] = useState(0);
  const procent = Math.round((wynik.wynik / wynik.max) * 100);

  // Wynik nabija się od zera, a pierścień wypełnia razem z nim.
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return setLicznik(wynik.wynik);
    let i = 0;
    const t = setInterval(() => {
      i++;
      setLicznik(i);
      if (i >= wynik.wynik) clearInterval(t);
    }, 160);
    return () => clearInterval(t);
  }, [wynik.wynik]);

  const obwod = 2 * Math.PI * 54;
  return (
    <div className="mx-auto max-w-2xl">
      <div className="sn-karta relative overflow-hidden rounded-[28px] border border-slate-200 bg-white p-7 text-center shadow-sm sm:p-10">
        {wynik.zaliczony && (
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            {Array.from({ length: 18 }, (_, i) => (
              <span key={i} className="akademia-konfetti" style={{ left: `${(i * 37) % 100}%`, animationDelay: `${(i % 6) * 0.12}s`, background: ["#10b981", "#06b6d4", "#f59e0b", "#8b5cf6"][i % 4] }} />
            ))}
          </div>
        )}
        <div className="relative mx-auto h-36 w-36">
          <svg className="h-36 w-36 -rotate-90" viewBox="0 0 120 120" aria-hidden="true">
            <circle cx="60" cy="60" r="54" fill="none" stroke="#e2e8f0" strokeWidth="10" />
            <circle cx="60" cy="60" r="54" fill="none" stroke={wynik.zaliczony ? k.pelny : "#f59e0b"} strokeWidth="10" strokeLinecap="round" strokeDasharray={obwod} strokeDashoffset={obwod * (1 - licznik / wynik.max)} style={{ transition: "stroke-dashoffset 0.16s linear" }} />
          </svg>
          <div className="absolute inset-0 grid place-items-center">
            <p className="text-4xl font-black tabular-nums text-slate-900">
              {licznik}
              <span className="text-xl font-bold text-slate-400">/{wynik.max}</span>
            </p>
          </div>
        </div>
        <h1 className="mt-5 text-2xl font-bold text-slate-900">{wynik.zaliczony ? (wynik.pierwszyRaz ? "Zaliczone! Następny moduł otwarty." : "Zaliczone!") : "Prawie. Jeszcze jedno podejście."}</h1>
        <p className="mt-1 text-slate-600">
          {procent}% poprawnych odpowiedzi · próg {prog}/{wynik.max}
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link href="/app/techniki?widok=akademia" className="rounded-2xl px-6 py-3.5 font-bold text-white transition active:translate-y-1" style={{ background: k.pelny, boxShadow: `0 5px 0 ${k.obrys}` }}>
            {wynik.zaliczony ? "Wracam na ścieżkę" : "Powtórzę lekcje"}
          </Link>
          <button type="button" onClick={odNowa} className="rounded-2xl border border-slate-300 px-6 py-3.5 font-semibold text-slate-700 hover:border-slate-400">
            Rozwiąż jeszcze raz
          </button>
        </div>
      </div>

      {wynik.bledne.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-3 font-semibold text-slate-900">Do powtórki</h2>
          <div className="space-y-3">
            {wynik.bledne.map((i) => (
              <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="font-semibold text-slate-900">{pytania[i].pytanie}</p>
                <p className="mt-2 text-sm text-emerald-800">
                  <b>Dobra odpowiedź:</b> {pytania[i].opcje.find((o) => o.i === oceny[i]?.poprawna)?.tekst}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">{oceny[i]?.wyjasnienie}</p>
                {oceny[i]?.technika && (
                  <Link href={`/app/techniki/${oceny[i].technika}`} className="mt-2 inline-block text-xs font-semibold text-emerald-700 hover:underline">
                    Przeczytaj: {nazwyTechnik[oceny[i].technika!] ?? oceny[i].technika} →
                  </Link>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
