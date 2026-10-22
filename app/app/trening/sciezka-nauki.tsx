"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { StanSciezki, StanLekcji, StanPoziomu } from "@/lib/coach/sciezka";

type Wezel =
  | { rodzaj: "poziom"; poziom: StanPoziomu; x: number; y: number }
  | { rodzaj: "lekcja"; lekcja: StanLekcji; poziom: StanPoziomu; x: number; y: number }
  | { rodzaj: "skrzynia"; poziom: StanPoziomu; x: number; y: number };

const KOLORY: Record<StanPoziomu["kolor"], { pelny: string; jasny: string; tekst: string; obrys: string; cien: string }> = {
  zielony: { pelny: "#10b981", jasny: "#d1fae5", tekst: "#047857", obrys: "#059669", cien: "rgba(16,185,129,0.45)" },
  turkus: { pelny: "#06b6d4", jasny: "#cffafe", tekst: "#0e7490", obrys: "#0891b2", cien: "rgba(6,182,212,0.45)" },
  fiolet: { pelny: "#8b5cf6", jasny: "#ede9fe", tekst: "#6d28d9", obrys: "#7c3aed", cien: "rgba(139,92,246,0.45)" },
  zloto: { pelny: "#f59e0b", jasny: "#fef3c7", tekst: "#b45309", obrys: "#d97706", cien: "rgba(245,158,11,0.45)" },
};

// Kształt drogi: punkty w procentach szerokości, powtarzane w kółko jak serpentyna.
const SERPENTYNA = [50, 66, 73, 64, 42, 30, 26, 35];
const KROK = 132;

/**
 * Ścieżka nauki jako kręta droga: poziomy, lekcje i skrzynie z nagrodą.
 * Przejechany odcinek wypełnia się kolorem przy wejściu, węzły wjeżdżają
 * przy przewijaniu, a aktualna lekcja pulsuje z napisem „Tu jesteś”.
 */
export function SciezkaNauki({ stan, nazwyTechnik }: { stan: StanSciezki; nazwyTechnik: Record<string, string> }) {
  const [otwarta, setOtwarta] = useState<string | null>(null);
  const kontener = useRef<HTMLDivElement>(null);

  const wezly = useMemo<Wezel[]>(() => {
    const lista: Wezel[] = [];
    let i = 0;
    const nastepny = () => {
      const x = SERPENTYNA[i % SERPENTYNA.length];
      const y = 70 + i * KROK;
      i++;
      return { x, y };
    };
    for (const p of stan.poziomy) {
      lista.push({ rodzaj: "poziom", poziom: p, ...nastepny() });
      for (const l of p.lekcje) lista.push({ rodzaj: "lekcja", lekcja: l, poziom: p, ...nastepny() });
      lista.push({ rodzaj: "skrzynia", poziom: p, ...nastepny() });
    }
    return lista;
  }, [stan]);

  const wysokosc = (wezly.at(-1)?.y ?? 0) + 90;
  const sciezka = useMemo(() => krzywa(wezly.map((w) => [w.x, w.y])), [wezly]);
  // Przejechane: do aktualnej lekcji włącznie albo do końca, gdy wszystko zaliczone.
  const ileDoAktualnej = wezly.findIndex((w) => w.rodzaj === "lekcja" && w.lekcja.aktualna);
  const przejechane = useMemo(
    () => krzywa(wezly.slice(0, ileDoAktualnej === -1 ? wezly.length : ileDoAktualnej + 1).map((w) => [w.x, w.y])),
    [wezly, ileDoAktualnej],
  );

  // Węzły wjeżdżają, gdy pojawią się na ekranie.
  useEffect(() => {
    const el = kontener.current;
    if (!el) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.querySelectorAll(".sn-wezel").forEach((w) => w.classList.add("sn-widac"));
      return;
    }
    const obs = new IntersectionObserver(
      (wpisy) => wpisy.forEach((w) => w.isIntersecting && (w.target.classList.add("sn-widac"), obs.unobserve(w.target))),
      { rootMargin: "0px 0px -8% 0px" },
    );
    el.querySelectorAll(".sn-wezel").forEach((w) => obs.observe(w));
    return () => obs.disconnect();
  }, [wezly]);

  // Na start przewijamy do aktualnej lekcji, żeby agent nie szukał, gdzie jest.
  useEffect(() => {
    const cel = kontener.current?.querySelector<HTMLElement>("[data-aktualna]");
    if (!cel || stan.zaliczone === 0) return;
    const t = setTimeout(() => cel.scrollIntoView({ behavior: "smooth", block: "center" }), 600);
    return () => clearTimeout(t);
  }, [stan.zaliczone]);

  const wybrana = wezly.find((w) => w.rodzaj === "lekcja" && w.lekcja.id === otwarta) as Extract<Wezel, { rodzaj: "lekcja" }> | undefined;

  return (
    <div className="relative">
      <div ref={kontener} className="relative mx-auto w-full max-w-3xl" style={{ height: wysokosc }}>
        <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 100 ${wysokosc}`} preserveAspectRatio="none" aria-hidden="true">
          <path d={sciezka} fill="none" stroke="#e2e8f0" strokeWidth={34} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          <path d={sciezka} fill="none" stroke="#ffffff" strokeWidth={3} strokeDasharray="14 14" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          {ileDoAktualnej !== 0 && (
            <>
              <path d={przejechane} fill="none" stroke="#bbf7d0" strokeWidth={34} strokeLinecap="round" vectorEffect="non-scaling-stroke" pathLength={1} className="sn-przejechane" />
              <path d={przejechane} fill="none" stroke="#22c55e" strokeWidth={3} strokeDasharray="14 14" strokeLinecap="round" vectorEffect="non-scaling-stroke" className="sn-przejechane-kreski" />
            </>
          )}
        </svg>

        {wezly.map((w, i) => {
          const pozycja = { left: `${w.x}%`, top: w.y, transitionDelay: `${(i % 6) * 60}ms` } as const;
          const k = KOLORY[w.poziom.kolor];
          const poLewej = w.x > 55;
          if (w.rodzaj === "poziom") {
            const zablokowany = !w.poziom.lekcje[0].odblokowana;
            return (
              <div key={`p${w.poziom.nr}`} className="sn-wezel absolute -translate-x-1/2 -translate-y-1/2" style={pozycja}>
                <div
                  className="grid h-20 w-20 place-items-center rounded-[22px] text-3xl font-bold text-white shadow-lg"
                  style={{ background: zablokowany ? "#cbd5e1" : `linear-gradient(145deg, ${k.pelny}, ${k.obrys})`, boxShadow: zablokowany ? undefined : `0 10px 0 ${k.obrys}, 0 18px 30px -10px ${k.cien}` }}
                >
                  {w.poziom.nr}
                </div>
                <div className={`absolute top-1/2 w-36 -translate-y-1/2 sm:w-56 ${poLewej ? "right-24 text-right" : "left-24"}`}>
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Poziom {w.poziom.nr}</p>
                  <p className="text-xl font-bold text-slate-900">{w.poziom.nazwa}</p>
                  <p className="text-xs font-semibold" style={{ color: zablokowany ? "#94a3b8" : k.tekst }}>
                    {w.poziom.zaliczone}/{w.poziom.lekcje.length} lekcji
                  </p>
                </div>
              </div>
            );
          }
          if (w.rodzaj === "skrzynia") {
            const otwarty = w.poziom.ukonczony;
            return (
              <div key={`s${w.poziom.nr}`} className="sn-wezel absolute -translate-x-1/2 -translate-y-1/2" style={pozycja}>
                <Skrzynia otwarta={otwarty} kolor={k.pelny} />
                <div className={`absolute top-1/2 w-40 -translate-y-1/2 ${poLewej ? "right-20 text-right" : "left-20"}`}>
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">{otwarty ? "Zdobyte" : "Nagroda"}</p>
                  <p className="text-base font-bold" style={{ color: otwarty ? k.tekst : "#475569" }}>
                    +{w.poziom.nagroda} XP
                  </p>
                </div>
              </div>
            );
          }
          const l = w.lekcja;
          const aktywna = l.odblokowana;
          return (
            <div key={l.id} className="sn-wezel absolute -translate-x-1/2 -translate-y-1/2" style={pozycja} {...(l.aktualna ? { "data-aktualna": "" } : {})}>
              {l.aktualna && (
                <span className="sn-tujestes absolute -top-11 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-xl bg-slate-900 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white shadow-lg">
                  Tu jesteś
                  <span className="absolute -bottom-1 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rotate-45 bg-slate-900" />
                </span>
              )}
              <button
                type="button"
                disabled={!aktywna}
                onClick={() => setOtwarta(l.id)}
                aria-label={`Lekcja ${l.id}: ${l.tytul}${aktywna ? "" : " (zablokowana)"}`}
                className={`relative grid h-[72px] w-[72px] place-items-center rounded-full transition active:translate-y-1 ${aktywna ? "cursor-pointer hover:scale-105" : "cursor-not-allowed"} ${l.aktualna ? "sn-puls" : ""}`}
                style={{
                  background: l.zaliczona ? `linear-gradient(145deg, ${k.pelny}, ${k.obrys})` : aktywna ? "#ffffff" : "#f1f5f9",
                  boxShadow: l.zaliczona
                    ? `0 7px 0 ${k.obrys}`
                    : aktywna
                      ? `0 7px 0 ${k.pelny}, inset 0 0 0 4px ${k.pelny}`
                      : "0 6px 0 #cbd5e1, inset 0 0 0 3px #e2e8f0",
                  ["--puls" as string]: k.cien,
                }}
              >
                {l.zaliczona ? (
                  <svg className="h-8 w-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="m5 12.5 4.5 4.5L19 7.5" /></svg>
                ) : aktywna ? (
                  <svg className="h-8 w-8 translate-x-0.5" viewBox="0 0 24 24" fill={k.pelny}><path d="M7 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L8.5 4.64A1 1 0 0 0 7 5.5Z" /></svg>
                ) : (
                  <svg className="h-7 w-7 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
                )}
              </button>
              <div className={`absolute top-1/2 w-36 -translate-y-1/2 sm:w-52 ${poLewej ? "right-24 text-right" : "left-24"}`}>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Lekcja {l.id}</p>
                <p className={`font-bold leading-snug ${aktywna ? "text-slate-900" : "text-slate-400"}`}>{l.tytul}</p>
                {l.najlepszy !== null && (
                  <p className="text-xs font-semibold" style={{ color: l.zaliczona ? k.tekst : "#b45309" }}>
                    Rekord {l.najlepszy} · próg {l.prog}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {wybrana && (
        <KartaLekcji
          lekcja={wybrana.lekcja}
          poziom={wybrana.poziom}
          technika={nazwyTechnik[wybrana.lekcja.technika] ?? wybrana.lekcja.technika}
          naZamknij={() => setOtwarta(null)}
        />
      )}
    </div>
  );
}

/** Wygładzona linia przez punkty (krzywe Béziera między kolejnymi węzłami). */
function krzywa(punkty: number[][]): string {
  if (!punkty.length) return "";
  let d = `M ${punkty[0][0]} ${punkty[0][1]}`;
  for (let i = 1; i < punkty.length; i++) {
    const [x0, y0] = punkty[i - 1];
    const [x1, y1] = punkty[i];
    const sy = (y1 - y0) * 0.55;
    d += ` C ${x0} ${y0 + sy}, ${x1} ${y1 - sy}, ${x1} ${y1}`;
  }
  return d;
}

function Skrzynia({ otwarta, kolor }: { otwarta: boolean; kolor: string }) {
  return (
    <svg className={`h-16 w-16 ${otwarta ? "sn-skrzynia-otwarta" : ""}`} viewBox="0 0 64 64" aria-hidden="true">
      <rect x="8" y="28" width="48" height="28" rx="6" fill={otwarta ? kolor : "#cbd5e1"} />
      <rect x="8" y="28" width="48" height="6" fill="rgba(0,0,0,0.12)" />
      <g className="sn-wieko">
        <path d="M8 28v-6a12 12 0 0 1 12-12h24a12 12 0 0 1 12 12v6Z" fill={otwarta ? kolor : "#94a3b8"} />
        <rect x="27" y="22" width="10" height="12" rx="3" fill="#fff" opacity="0.9" />
      </g>
      {otwarta && (
        <g className="sn-iskry" fill="#fde047">
          <circle cx="16" cy="12" r="2.5" />
          <circle cx="50" cy="9" r="2" />
          <circle cx="32" cy="4" r="2.5" />
        </g>
      )}
    </svg>
  );
}

function KartaLekcji({ lekcja, poziom, technika, naZamknij }: { lekcja: StanLekcji; poziom: StanPoziomu; technika: string; naZamknij: () => void }) {
  const k = KOLORY[poziom.kolor];
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && naZamknij();
    addEventListener("keydown", esc);
    return () => removeEventListener("keydown", esc);
  }, [naZamknij]);
  const trudnosc = { latwy: "łatwy", sredni: "średni", trudny: "trudny" }[lekcja.poziomTrudnosci];
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-4 backdrop-blur-sm sm:items-center" onClick={naZamknij}>
      <div role="dialog" aria-modal="true" aria-label={lekcja.tytul} className="sn-karta w-full max-w-md overflow-hidden rounded-[28px] bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 text-white" style={{ background: `linear-gradient(140deg, ${k.pelny}, ${k.obrys})` }}>
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/80">
              Poziom {poziom.nr} · Lekcja {lekcja.id}
            </p>
            <button type="button" onClick={naZamknij} className="grid h-8 w-8 place-items-center rounded-full bg-white/20 text-sm font-bold hover:bg-white/30" aria-label="Zamknij">
              ✕
            </button>
          </div>
          <h3 className="mt-2 text-2xl font-bold leading-tight">{lekcja.tytul}</h3>
          <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
            <span className="rounded-full bg-white/20 px-2.5 py-1">Klient: {lekcja.charakter}</span>
            <span className="rounded-full bg-white/20 px-2.5 py-1">Trudność: {trudnosc}</span>
            <span className="rounded-full bg-white/20 px-2.5 py-1">Próg: {lekcja.prog}/100</span>
          </div>
        </div>
        <div className="space-y-4 p-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Twój cel</p>
            <p className="mt-1 leading-relaxed text-slate-800">{lekcja.cel}</p>
          </div>
          <Link href={`/app/techniki/${lekcja.technika}`} className="flex items-center justify-between rounded-2xl border border-slate-200 p-4 transition hover:border-slate-300 hover:bg-slate-50">
            <span>
              <span className="block text-xs font-bold uppercase tracking-wider text-slate-400">Przeczytaj przed rozmową (2 min)</span>
              <span className="font-semibold text-slate-900">{technika}</span>
            </span>
            <span className="text-slate-400">→</span>
          </Link>
          {lekcja.najlepszy !== null && (
            <p className="text-sm text-slate-600">
              Twój rekord: <b className="text-slate-900">{lekcja.najlepszy}/100</b> · podejścia: {lekcja.podejscia}
            </p>
          )}
          <Link
            href={`/app/trening/${lekcja.scenariusz}?lekcja=${lekcja.id}`}
            className="block rounded-2xl py-4 text-center text-lg font-bold text-white transition active:translate-y-1"
            style={{ background: k.pelny, boxShadow: `0 6px 0 ${k.obrys}` }}
          >
            {lekcja.zaliczona ? "Powtórz i pobij rekord" : "Zacznij lekcję"}
          </Link>
        </div>
      </div>
    </div>
  );
}
