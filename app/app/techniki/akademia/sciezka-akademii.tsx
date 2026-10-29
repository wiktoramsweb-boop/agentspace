"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { KolorModulu, StanAkademii, StanLekcjiAkademii, StanModulu, StanSprawdzianu } from "@/lib/techniki/akademia";
import { adresLekcji } from "@/lib/techniki/akademia-adresy";
import { oznaczLekcje } from "./actions";

type Wezel =
  | { rodzaj: "modul"; modul: StanModulu; x: number; y: number }
  | { rodzaj: "lekcja"; lekcja: StanLekcjiAkademii; modul: StanModulu; x: number; y: number }
  | { rodzaj: "sprawdzian"; spr: StanSprawdzianu; kolor: KolorModulu; x: number; y: number; egzamin?: boolean };

const KOLORY: Record<KolorModulu, { pelny: string; tekst: string; obrys: string; cien: string }> = {
  zielony: { pelny: "#10b981", tekst: "#047857", obrys: "#059669", cien: "rgba(16,185,129,0.45)" },
  turkus: { pelny: "#06b6d4", tekst: "#0e7490", obrys: "#0891b2", cien: "rgba(6,182,212,0.45)" },
  fiolet: { pelny: "#8b5cf6", tekst: "#6d28d9", obrys: "#7c3aed", cien: "rgba(139,92,246,0.45)" },
  zloto: { pelny: "#f59e0b", tekst: "#b45309", obrys: "#d97706", cien: "rgba(245,158,11,0.45)" },
};

const SERPENTYNA = [50, 66, 73, 64, 42, 30, 26, 35];
const KROK = 128;

const IKONY: Record<StanLekcjiAkademii["rodzaj"], string> = {
  technika: "M12 6.04A8.97 8.97 0 0 0 6 3.75c-1.05 0-2.06.18-3 .51v14.25A8.99 8.99 0 0 1 6 18c2.3 0 4.4.87 6 2.29m0-14.25a8.97 8.97 0 0 1 6-2.29c1.05 0 2.06.18 3 .51v14.25A8.99 8.99 0 0 0 18 18a8.97 8.97 0 0 0-6 2.29m0-14.25v14.25",
  skrypt: "M8.63 9.75h6.74M8.63 13.5h4M3.75 6a2.25 2.25 0 0 1 2.25-2.25h12A2.25 2.25 0 0 1 20.25 6v8.25A2.25 2.25 0 0 1 18 16.5H8.25L4.5 20.25V6Z",
  struktura: "M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5",
  obiekcje: "M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z",
};

/**
 * Ścieżka Akademii: moduły, lekcje i sprawdziany na krętej drodze. Ta sama
 * mechanika co ścieżka AI Coacha (wjazd węzłów, rysowanie przejechanej drogi,
 * „Tu jesteś”), żeby nowa osoba od razu wiedziała, jak tego używać.
 */
export function SciezkaAkademii({ stan, nazwa = "Akademia" }: { stan: StanAkademii; nazwa?: string }) {
  const [otwarta, setOtwarta] = useState<string | null>(null);
  const kontener = useRef<HTMLDivElement>(null);

  const wezly = useMemo<Wezel[]>(() => {
    const lista: Wezel[] = [];
    let i = 0;
    const nast = () => {
      const x = SERPENTYNA[i % SERPENTYNA.length];
      const y = 70 + i * KROK;
      i++;
      return { x, y };
    };
    for (const m of stan.moduly) {
      lista.push({ rodzaj: "modul", modul: m, ...nast() });
      for (const l of m.lekcje) lista.push({ rodzaj: "lekcja", lekcja: l, modul: m, ...nast() });
      lista.push({ rodzaj: "sprawdzian", spr: m.sprawdzian, kolor: m.kolor, ...nast() });
    }
    lista.push({ rodzaj: "sprawdzian", spr: stan.egzamin, kolor: "zloto", egzamin: true, ...nast() });
    return lista;
  }, [stan]);

  const wysokosc = (wezly.at(-1)?.y ?? 0) + 100;
  const sciezka = useMemo(() => krzywa(wezly.map((w) => [w.x, w.y])), [wezly]);
  const idAktualnego = stan.aktualne;
  const doAktualnego = wezly.findIndex((w) => (w.rodzaj === "lekcja" && w.lekcja.id === idAktualnego) || (w.rodzaj === "sprawdzian" && w.spr.id === idAktualnego));
  const przejechane = useMemo(() => krzywa(wezly.slice(0, doAktualnego === -1 ? wezly.length : doAktualnego + 1).map((w) => [w.x, w.y])), [wezly, doAktualnego]);

  useEffect(() => {
    const el = kontener.current;
    if (!el) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.querySelectorAll(".sn-wezel").forEach((w) => w.classList.add("sn-widac"));
      return;
    }
    const obs = new IntersectionObserver((wpisy) => wpisy.forEach((w) => w.isIntersecting && (w.target.classList.add("sn-widac"), obs.unobserve(w.target))), { rootMargin: "0px 0px -8% 0px" });
    el.querySelectorAll(".sn-wezel").forEach((w) => obs.observe(w));
    return () => obs.disconnect();
  }, [wezly]);

  useEffect(() => {
    const cel = kontener.current?.querySelector<HTMLElement>("[data-aktualna]");
    if (!cel || stan.lekcjiZrobionych === 0) return;
    const t = setTimeout(() => cel.scrollIntoView({ behavior: "smooth", block: "center" }), 600);
    return () => clearTimeout(t);
  }, [stan.lekcjiZrobionych]);

  const wybrana = wezly.find((w) => w.rodzaj === "lekcja" && w.lekcja.id === otwarta) as Extract<Wezel, { rodzaj: "lekcja" }> | undefined;
  const wybranySpr = wezly.find((w) => w.rodzaj === "sprawdzian" && w.spr.id === otwarta) as Extract<Wezel, { rodzaj: "sprawdzian" }> | undefined;

  return (
    <div className="relative">
      <div ref={kontener} className="relative mx-auto w-full max-w-3xl" style={{ height: wysokosc }}>
        <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 100 ${wysokosc}`} preserveAspectRatio="none" aria-hidden="true">
          <path d={sciezka} fill="none" stroke="#e2e8f0" strokeWidth={34} strokeLinecap="round" vectorEffect="non-scaling-stroke" className="akademia-droga" />
          <path d={sciezka} fill="none" stroke="#ffffff" strokeWidth={3} strokeDasharray="14 14" strokeLinecap="round" vectorEffect="non-scaling-stroke" className="akademia-kreski" />
          {doAktualnego !== 0 && (
            <>
              <path d={przejechane} fill="none" stroke="#bbf7d0" strokeWidth={34} strokeLinecap="round" vectorEffect="non-scaling-stroke" pathLength={1} className="sn-przejechane" />
              <path d={przejechane} fill="none" stroke="#22c55e" strokeWidth={3} strokeDasharray="14 14" strokeLinecap="round" vectorEffect="non-scaling-stroke" className="sn-przejechane-kreski" />
            </>
          )}
        </svg>

        {wezly.map((w, i) => {
          const pozycja = { left: `${w.x}%`, top: w.y, transitionDelay: `${(i % 6) * 60}ms` } as const;
          const poLewej = w.x > 55;
          const opis = `absolute top-1/2 w-36 -translate-y-1/2 sm:w-56 ${poLewej ? "right-24 text-right" : "left-24"}`;

          if (w.rodzaj === "modul") {
            const k = KOLORY[w.modul.kolor];
            const zrobione = w.modul.lekcje.filter((l) => l.zrobiona).length;
            return (
              <div key={`m${w.modul.nr}`} className="sn-wezel absolute -translate-x-1/2 -translate-y-1/2" style={pozycja}>
                <div
                  className="grid h-20 w-20 place-items-center rounded-[22px] text-3xl font-bold text-white shadow-lg"
                  style={{ background: w.modul.otwarty ? `linear-gradient(145deg, ${k.pelny}, ${k.obrys})` : "#cbd5e1", boxShadow: w.modul.otwarty ? `0 10px 0 ${k.obrys}, 0 18px 30px -10px ${k.cien}` : undefined }}
                >
                  {w.modul.nr}
                </div>
                <div className={opis}>
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Moduł {w.modul.nr}</p>
                  <p className="text-lg font-bold leading-tight text-slate-900">{w.modul.nazwa}</p>
                  <p className="text-xs font-semibold" style={{ color: w.modul.otwarty ? k.tekst : "#94a3b8" }}>
                    {w.modul.ukonczony ? "ukończony" : w.modul.otwarty ? `${zrobione}/${w.modul.lekcje.length} lekcji` : "zablokowany"}
                  </p>
                </div>
              </div>
            );
          }

          if (w.rodzaj === "sprawdzian") {
            const k = KOLORY[w.kolor];
            const s = w.spr;
            const aktualny = s.id === idAktualnego;
            return (
              <div key={s.id} className="sn-wezel absolute -translate-x-1/2 -translate-y-1/2" style={pozycja} {...(aktualny ? { "data-aktualna": "" } : {})}>
                {aktualny && <TuJestes />}
                <button
                  type="button"
                  disabled={!s.dostepny && !s.zaliczony}
                  onClick={() => setOtwarta(s.id)}
                  aria-label={`${s.tytul}${s.dostepny ? "" : " (zablokowany)"}`}
                  className={`relative grid place-items-center transition active:translate-y-1 ${w.egzamin ? "h-24 w-24" : "h-[78px] w-[78px]"} ${s.dostepny ? "cursor-pointer hover:scale-105" : "cursor-not-allowed"} ${aktualny ? "sn-puls" : ""} ${s.zaliczony ? "akademia-zaliczony" : ""}`}
                  style={{
                    borderRadius: w.egzamin ? "30px" : "24px",
                    transform: "rotate(45deg)",
                    background: s.zaliczony ? `linear-gradient(145deg, ${k.pelny}, ${k.obrys})` : s.dostepny ? "#ffffff" : "#f1f5f9",
                    boxShadow: s.zaliczony ? `0 7px 0 ${k.obrys}` : s.dostepny ? `0 7px 0 ${k.pelny}, inset 0 0 0 4px ${k.pelny}` : "0 6px 0 #cbd5e1, inset 0 0 0 3px #e2e8f0",
                    ["--puls" as string]: k.cien,
                  }}
                >
                  <span style={{ transform: "rotate(-45deg)" }} className="grid place-items-center">
                    {w.egzamin ? (
                      <svg className={`h-10 w-10 ${s.zaliczony ? "text-white" : s.dostepny ? "" : "text-slate-400"}`} style={!s.zaliczony && s.dostepny ? { color: k.pelny } : undefined} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 0 0 2.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 0 1 2.916.52 6.003 6.003 0 0 1-5.395 4.972m0 0a6.726 6.726 0 0 1-2.749 1.35m0 0a6.772 6.772 0 0 1-3.044 0" />
                      </svg>
                    ) : s.zaliczony ? (
                      <svg className="h-8 w-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="m5 12.5 4.5 4.5L19 7.5" /></svg>
                    ) : (
                      <span className={`text-3xl font-black ${s.dostepny ? "" : "text-slate-400"}`} style={s.dostepny ? { color: k.pelny } : undefined}>?</span>
                    )}
                  </span>
                </button>
                <div className={`${opis} ${poLewej ? "!right-28" : "!left-28"}`}>
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">{w.egzamin ? "Egzamin końcowy" : "Sprawdzian"}</p>
                  <p className={`font-bold leading-snug ${s.dostepny || s.zaliczony ? "text-slate-900" : "text-slate-400"}`}>{w.egzamin ? `Certyfikat: ${nazwa}` : `${s.ile} pytań`}</p>
                  <p className="text-xs font-semibold" style={{ color: s.zaliczony ? k.tekst : s.najlepszy !== null ? "#b45309" : "#94a3b8" }}>
                    {s.najlepszy !== null ? `Najlepszy wynik ${s.najlepszy}/${s.ile} · próg ${s.prog}` : s.dostepny ? `Próg ${s.prog}/${s.ile}` : "po lekcjach z modułu"}
                  </p>
                </div>
              </div>
            );
          }

          const l = w.lekcja;
          const k = KOLORY[w.modul.kolor];
          const aktualna = l.id === idAktualnego;
          return (
            <div key={l.id} className="sn-wezel absolute -translate-x-1/2 -translate-y-1/2" style={pozycja} {...(aktualna ? { "data-aktualna": "" } : {})}>
              {aktualna && <TuJestes />}
              <button
                type="button"
                disabled={!l.dostepna}
                onClick={() => setOtwarta(l.id)}
                aria-label={`${l.tytul}${l.dostepna ? "" : " (zablokowana)"}`}
                className={`relative grid h-[72px] w-[72px] place-items-center rounded-full transition active:translate-y-1 ${l.dostepna ? "cursor-pointer hover:scale-105" : "cursor-not-allowed"} ${aktualna ? "sn-puls" : ""}`}
                style={{
                  background: l.zrobiona ? `linear-gradient(145deg, ${k.pelny}, ${k.obrys})` : l.dostepna ? "#ffffff" : "#f1f5f9",
                  boxShadow: l.zrobiona ? `0 7px 0 ${k.obrys}` : l.dostepna ? `0 7px 0 ${k.pelny}, inset 0 0 0 4px ${k.pelny}` : "0 6px 0 #cbd5e1, inset 0 0 0 3px #e2e8f0",
                  ["--puls" as string]: k.cien,
                }}
              >
                {l.zrobiona ? (
                  <svg className="h-8 w-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="m5 12.5 4.5 4.5L19 7.5" /></svg>
                ) : (
                  <svg className={`h-7 w-7 ${l.dostepna ? "" : "text-slate-400"}`} style={l.dostepna ? { color: k.pelny } : undefined} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={IKONY[l.rodzaj]} />
                  </svg>
                )}
              </button>
              <div className={opis}>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
                  {{ technika: "Technika", skrypt: "Skrypt", struktura: "Podstawy", obiekcje: "Obiekcje" }[l.rodzaj]} · {l.minut} min
                </p>
                <p className={`font-bold leading-snug ${l.dostepna ? "text-slate-900" : "text-slate-400"}`}>{l.tytul}</p>
              </div>
            </div>
          );
        })}
      </div>

      {wybrana && <KartaLekcji lekcja={wybrana.lekcja} modul={wybrana.modul} naZamknij={() => setOtwarta(null)} />}
      {wybranySpr && <KartaSprawdzianu spr={wybranySpr.spr} kolor={wybranySpr.kolor} egzamin={wybranySpr.egzamin} naZamknij={() => setOtwarta(null)} />}
    </div>
  );
}

function TuJestes() {
  return (
    <span className="sn-tujestes absolute -top-12 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-xl bg-slate-900 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white shadow-lg">
      Tu jesteś
      <span className="absolute -bottom-1 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rotate-45 bg-slate-900" />
    </span>
  );
}

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

function Okno({ kolor, naZamknij, naglowek, tytul, children }: { kolor: KolorModulu; naZamknij: () => void; naglowek: string; tytul: string; children: React.ReactNode }) {
  const k = KOLORY[kolor];
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && naZamknij();
    addEventListener("keydown", esc);
    return () => removeEventListener("keydown", esc);
  }, [naZamknij]);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-4 backdrop-blur-sm sm:items-center" onClick={naZamknij}>
      <div role="dialog" aria-modal="true" aria-label={tytul} className="sn-karta w-full max-w-md overflow-hidden rounded-[28px] bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 text-white" style={{ background: `linear-gradient(140deg, ${k.pelny}, ${k.obrys})` }}>
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/80">{naglowek}</p>
            <button type="button" onClick={naZamknij} className="grid h-8 w-8 place-items-center rounded-full bg-white/20 text-sm font-bold hover:bg-white/30" aria-label="Zamknij">
              ✕
            </button>
          </div>
          <h3 className="mt-2 text-2xl font-bold leading-tight">{tytul}</h3>
        </div>
        <div className="space-y-4 p-6">{children}</div>
      </div>
    </div>
  );
}

function KartaLekcji({ lekcja, modul, naZamknij }: { lekcja: StanLekcjiAkademii; modul: StanModulu; naZamknij: () => void }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [blad, setBlad] = useState<string | null>(null);
  const k = KOLORY[modul.kolor];
  const ustaw = (zrobiona: boolean) =>
    start(async () => {
      setBlad(null);
      const w = await oznaczLekcje(lekcja.id, zrobiona);
      if (!w.ok) return setBlad(w.error);
      router.refresh();
      if (zrobiona) naZamknij();
    });
  return (
    <Okno kolor={modul.kolor} naZamknij={naZamknij} naglowek={`Moduł ${modul.nr} · ${lekcja.minut} min`} tytul={lekcja.tytul}>
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Twoje zadanie</p>
        <p className="mt-1 leading-relaxed text-slate-800">{lekcja.zadanie}</p>
      </div>
      <Link href={adresLekcji(lekcja)} className="flex items-center justify-between rounded-2xl border border-slate-200 p-4 transition hover:border-slate-300 hover:bg-slate-50">
        <span>
          <span className="block text-xs font-bold uppercase tracking-wider text-slate-400">Materiał do lekcji</span>
          <span className="font-semibold text-slate-900">Otwórz: {lekcja.tytul}</span>
        </span>
        <span className="text-slate-400">→</span>
      </Link>
      {blad && <p className="text-sm text-red-600">{blad}</p>}
      {lekcja.zrobiona ? (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold" style={{ color: k.tekst }}>
            ✓ Przerobione
          </p>
          <button type="button" disabled={pending} onClick={() => ustaw(false)} className="text-sm text-slate-500 hover:underline">
            Cofnij oznaczenie
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={pending}
          onClick={() => ustaw(true)}
          className="block w-full rounded-2xl py-4 text-center text-lg font-bold text-white transition active:translate-y-1 disabled:opacity-60"
          style={{ background: k.pelny, boxShadow: `0 6px 0 ${k.obrys}` }}
        >
          {pending ? "Zapisuję…" : "Mam to, przerobione"}
        </button>
      )}
    </Okno>
  );
}

function KartaSprawdzianu({ spr, kolor, egzamin, naZamknij }: { spr: StanSprawdzianu; kolor: KolorModulu; egzamin?: boolean; naZamknij: () => void }) {
  const k = KOLORY[kolor];
  return (
    <Okno kolor={kolor} naZamknij={naZamknij} naglowek={egzamin ? "Egzamin końcowy" : "Sprawdzian"} tytul={spr.tytul}>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-2xl bg-slate-50 p-3">
          <p className="text-2xl font-bold tabular-nums text-slate-900">{spr.ile}</p>
          <p className="text-xs text-slate-500">pytań</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-3">
          <p className="text-2xl font-bold tabular-nums text-slate-900">{spr.prog}</p>
          <p className="text-xs text-slate-500">do zaliczenia</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-3">
          <p className="text-2xl font-bold tabular-nums text-slate-900">{spr.najlepszy ?? "–"}</p>
          <p className="text-xs text-slate-500">najlepszy</p>
        </div>
      </div>
      <p className="text-sm leading-relaxed text-slate-600">
        {spr.dostepny
          ? "Po każdej odpowiedzi zobaczysz, czy była dobra i dlaczego. Możesz podchodzić ile razy chcesz, liczy się najlepszy wynik."
          : "Sprawdzian otworzy się, gdy przerobisz wszystkie lekcje z tego modułu."}
        {spr.podejscia > 0 && ` Podejścia: ${spr.podejscia}.`}
      </p>
      {spr.dostepny && (
        <Link
          href={`/app/techniki/akademia/${spr.id}`}
          className="block rounded-2xl py-4 text-center text-lg font-bold text-white transition active:translate-y-1"
          style={{ background: k.pelny, boxShadow: `0 6px 0 ${k.obrys}` }}
        >
          {spr.zaliczony ? "Popraw wynik" : "Rozwiąż sprawdzian"}
        </Link>
      )}
    </Okno>
  );
}
