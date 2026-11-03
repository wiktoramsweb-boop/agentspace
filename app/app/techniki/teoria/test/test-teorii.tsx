"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import type { ZakresTestu } from "@/lib/techniki/teoria";
import { oddajTest, sprawdzPytanie, type Omowienie } from "../actions";

type PytanieWidok = { id: string; pytanie: string; opcje: { i: number; tekst: string }[] };
type Ocena = { dobrze: boolean; poprawna: number; wyjasnienie: string };
type Wynik = { wynik: number; max: number; zaliczony: boolean; omowienie: Omowienie[]; doPowtorki: number };

/**
 * Test z teorii w dwóch trybach. „Nauka” (testy modułów, powtórka błędów):
 * po każdej odpowiedzi od razu wyjaśnienie. „Egzamin” (egzamin próbny):
 * jak prawdziwy egzamin, z czasem i bez podpowiedzi, omówienie dopiero na końcu.
 */
export function TestTeorii({
  zakres, tryb, tytul, podtytul, prog, minut, pytania, najlepszy, kolor,
}: {
  zakres: ZakresTestu;
  tryb: "nauka" | "egzamin";
  tytul: string;
  podtytul: string;
  prog: number;
  minut: number | null;
  pytania: PytanieWidok[];
  najlepszy: string | null;
  kolor: { pelny: string; obrys: string };
}) {
  // Zestaw zamrażamy na czas podejścia: po oddaniu serwer odświeża stronę
  // i przysyła nowe losowanie, które czeka na „Rozwiąż jeszcze raz”.
  const [zestaw, setZestaw] = useState(pytania);
  const [start, setStart] = useState(false);
  const [nr, setNr] = useState(0);
  const [odp, setOdp] = useState<Record<string, number>>({});
  const [ocena, setOcena] = useState<Ocena | null>(null);
  const [wynik, setWynik] = useState<Wynik | null>(null);
  const [blad, setBlad] = useState<string | null>(null);
  const [koniecCzasu, setKoniecCzasu] = useState<number | null>(null);
  const [teraz, setTeraz] = useState(() => Date.now());
  const [pending, run] = useTransition();
  const oddane = useRef(false);
  const p = zestaw[nr];
  const egzamin = tryb === "egzamin";

  const oddaj = useCallback(
    (odpowiedzi: Record<string, number>) => {
      if (oddane.current) return;
      oddane.current = true;
      run(async () => {
        setBlad(null);
        const r = await oddajTest(zakres, zestaw.map((q) => ({ id: q.id, wybrana: odpowiedzi[q.id] ?? -1 })));
        if (!r.ok) {
          oddane.current = false;
          return setBlad(r.error);
        }
        setWynik(r);
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    },
    [zakres, zestaw],
  );

  useEffect(() => {
    if (!koniecCzasu || wynik) return;
    const t = setInterval(() => setTeraz(Date.now()), 1000);
    return () => clearInterval(t);
  }, [koniecCzasu, wynik]);

  const zostalo = koniecCzasu ? Math.max(0, Math.ceil((koniecCzasu - teraz) / 1000)) : null;
  useEffect(() => {
    if (zostalo === 0 && !wynik) oddaj(odp);
  }, [zostalo, wynik, odp, oddaj]);

  const zacznij = () => {
    setStart(true);
    if (minut) {
      setTeraz(Date.now());
      setKoniecCzasu(Date.now() + minut * 60_000);
    }
  };

  const wybierz = (i: number) => {
    if (pending || ocena) return;
    if (egzamin) return setOdp((o) => ({ ...o, [p.id]: i }));
    run(async () => {
      setBlad(null);
      const r = await sprawdzPytanie(p.id, i);
      if (!r.ok) return setBlad(r.error);
      setOdp((o) => ({ ...o, [p.id]: i }));
      setOcena(r);
    });
  };

  const dalej = () => {
    if (nr < zestaw.length - 1) {
      setNr(nr + 1);
      setOcena(null);
      return;
    }
    oddaj(odp);
  };

  const odNowa = () => {
    oddane.current = false;
    setZestaw(pytania);
    setNr(0);
    setOdp({});
    setOcena(null);
    setWynik(null);
    setKoniecCzasu(null);
    setStart(false);
  };

  if (!start) {
    return (
      <div className="sn-karta mx-auto max-w-xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
        <div className="p-7 text-white" style={{ background: `linear-gradient(140deg, ${kolor.pelny}, ${kolor.obrys})` }}>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/80">{podtytul}</p>
          <h1 className="mt-2 text-3xl font-bold leading-tight">{tytul}</h1>
        </div>
        <div className="space-y-5 p-7">
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { l: zestaw.length, o: "pytań" },
              { l: minut ? `${minut} min` : "bez limitu", o: "czas" },
              { l: najlepszy ?? "–", o: "Twój najlepszy" },
            ].map((x) => (
              <div key={x.o} className="rounded-2xl bg-slate-50 p-3">
                <p className="text-xl font-bold tabular-nums text-slate-900">{x.l}</p>
                <p className="text-xs text-slate-500">{x.o}</p>
              </div>
            ))}
          </div>
          <p className="text-sm leading-relaxed text-slate-600">
            {egzamin
              ? `Jak na prawdziwym egzaminie: bez podpowiedzi w trakcie. Zaliczenie od ${prog} dobrych odpowiedzi. Po oddaniu zobaczysz wynik i omówienie każdego pytania. Gdy skończy się czas, test odda się sam.`
              : "Po każdej odpowiedzi od razu zobaczysz, czy była dobra i dlaczego. Pytania za każdym razem losują się od nowa."}
          </p>
          <button type="button" onClick={zacznij} className="block w-full rounded-2xl py-4 text-lg font-bold text-white transition active:translate-y-1" style={{ background: kolor.pelny, boxShadow: `0 6px 0 ${kolor.obrys}` }}>
            Zaczynam
          </button>
        </div>
      </div>
    );
  }

  if (wynik) return <EkranWyniku wynik={wynik} prog={prog} kolor={kolor} zestaw={zestaw} odp={odp} odNowa={odNowa} />;

  const wybrana = odp[p.id];
  const odpowiedziane = Object.keys(odp).length;
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-5 flex items-center gap-3">
        <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${((nr + (ocena ? 1 : 0)) / zestaw.length) * 100}%`, background: kolor.pelny }} />
        </div>
        <span className="text-sm font-semibold tabular-nums text-slate-500">
          {nr + 1}/{zestaw.length}
        </span>
        {zostalo !== null && (
          <span className={`rounded-lg px-2.5 py-1 text-sm font-bold tabular-nums ${zostalo < 120 ? "bg-rose-50 text-rose-700" : "bg-slate-100 text-slate-700"}`}>
            {Math.floor(zostalo / 60)}:{String(zostalo % 60).padStart(2, "0")}
          </span>
        )}
      </div>

      <div key={nr} className="rozmowa-krok rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-xl font-bold leading-snug text-slate-900 sm:text-2xl">{p.pytanie}</h2>
        <div className="mt-6 space-y-2.5">
          {p.opcje.map((o, j) => {
            const zaznaczona = wybrana === o.i;
            const poprawna = ocena && o.i === ocena.poprawna;
            const zla = ocena && zaznaczona && !ocena.dobrze;
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
                        : zaznaczona
                          ? "bg-slate-50 font-semibold text-slate-900"
                          : "border-slate-200 bg-white text-slate-800 hover:-translate-y-0.5 hover:border-slate-400"
                }`}
                style={zaznaczona && !ocena ? { borderColor: kolor.pelny } : undefined}
              >
                <span
                  className={`grid h-7 w-7 flex-shrink-0 place-items-center rounded-lg text-sm font-bold ${poprawna ? "bg-emerald-500 text-white" : zla ? "bg-rose-500 text-white" : zaznaczona ? "text-white" : "bg-slate-100 text-slate-500"}`}
                  style={zaznaczona && !ocena ? { background: kolor.pelny } : undefined}
                >
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
          </div>
        )}
        {blad && <p className="mt-4 text-sm text-red-600">{blad}</p>}

        {(ocena || (egzamin && wybrana !== undefined)) && (
          <button type="button" onClick={dalej} disabled={pending} className="mt-5 block w-full rounded-2xl py-3.5 text-base font-bold text-white transition active:translate-y-1 disabled:opacity-60" style={{ background: kolor.pelny, boxShadow: `0 5px 0 ${kolor.obrys}` }}>
            {pending ? "Liczę wynik…" : nr < zestaw.length - 1 ? "Dalej" : "Oddaj i zobacz wynik"}
          </button>
        )}
        {egzamin && (
          <div className="mt-4 flex items-center justify-between text-sm">
            <button type="button" onClick={() => setNr(Math.max(0, nr - 1))} disabled={nr === 0} className="font-medium text-slate-500 hover:text-slate-900 disabled:opacity-40">
              ← Poprzednie
            </button>
            <button type="button" onClick={() => oddaj(odp)} disabled={pending} className="font-medium text-slate-500 hover:text-slate-900">
              Oddaj teraz ({odpowiedziane}/{zestaw.length})
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function EkranWyniku({
  wynik, prog, kolor, zestaw, odp, odNowa,
}: {
  wynik: Wynik;
  prog: number;
  kolor: { pelny: string; obrys: string };
  zestaw: PytanieWidok[];
  odp: Record<string, number>;
  odNowa: () => void;
}) {
  const procent = wynik.max ? Math.round((wynik.wynik / wynik.max) * 100) : 0;
  const obwod = 2 * Math.PI * 54;
  const zle = wynik.omowienie.filter((o) => !o.dobrze);
  const pytanie = (id: string) => zestaw.find((q) => q.id === id);
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
            <circle cx="60" cy="60" r="54" fill="none" stroke={wynik.zaliczony ? kolor.pelny : "#f59e0b"} strokeWidth="10" strokeLinecap="round" strokeDasharray={obwod} strokeDashoffset={obwod * (1 - procent / 100)} />
          </svg>
          <div className="absolute inset-0 grid place-items-center">
            <p className="text-4xl font-black tabular-nums text-slate-900">
              {wynik.wynik}
              <span className="text-xl font-bold text-slate-400">/{wynik.max}</span>
            </p>
          </div>
        </div>
        <h1 className="mt-5 text-2xl font-bold text-slate-900">{wynik.zaliczony ? "Zaliczone!" : "Jeszcze nie. Powtórz i spróbuj znowu."}</h1>
        <p className="mt-1 text-slate-600">
          {procent}% poprawnych · próg {prog}/{wynik.max}
          {wynik.doPowtorki > 0 && ` · ${wynik.doPowtorki} pytań czeka na powtórkę`}
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link href="/app/techniki?widok=teoria" className="rounded-2xl px-6 py-3.5 font-bold text-white transition active:translate-y-1" style={{ background: kolor.pelny, boxShadow: `0 5px 0 ${kolor.obrys}` }}>
            Wracam do teorii
          </Link>
          <button type="button" onClick={odNowa} className="rounded-2xl border border-slate-300 px-6 py-3.5 font-semibold text-slate-700 hover:border-slate-400">
            Rozwiąż jeszcze raz
          </button>
        </div>
      </div>

      {zle.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-3 font-semibold text-slate-900">Do powtórki ({zle.length})</h2>
          <div className="space-y-3">
            {zle.map((o) => {
              const q = pytanie(o.id);
              if (!q) return null;
              const twoja = q.opcje.find((x) => x.i === odp[o.id])?.tekst;
              return (
                <div key={o.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="font-semibold text-slate-900">{q.pytanie}</p>
                  <p className="mt-2 text-sm text-rose-700">
                    <b>Twoja odpowiedź:</b> {twoja ?? "brak odpowiedzi"}
                  </p>
                  <p className="mt-1 text-sm text-emerald-800">
                    <b>Dobra odpowiedź:</b> {q.opcje.find((x) => x.i === o.poprawna)?.tekst}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">{o.wyjasnienie}</p>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
