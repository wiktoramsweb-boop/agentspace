"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import {
  oznaczPrzeczytane,
  pobierzPowiadomienia,
  type PozycjaPowiadomienia,
} from "../powiadomienia-actions";
import { kiedy, useNaZywo } from "./na-zywo";

/**
 * Dzwonek z historią powiadomień. Stoi w ciemnym menu, więc kolory są
 * stałe (biel z przezroczystością), niezależne od motywu treści.
 */
export function Dzwonek({ userId, rozwijaW = "prawo" }: { userId: string; rozwijaW?: "prawo" | "dol" }) {
  const [otwarty, setOtwarty] = useState(false);
  const [pozycje, setPozycje] = useState<PozycjaPowiadomienia[]>([]);
  const [nieprzeczytane, setNieprzeczytane] = useState(0);
  // Dopóki nie wiemy, czy tabela powiadomień istnieje, nie otwieramy kanału
  // na żywo i nie pokazujemy dzwonka, który za chwilę mógłby zniknąć.
  const [aktywny, setAktywny] = useState(false);
  const [, startTransition] = useTransition();
  const box = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  // Panel rysujemy w <body>, na wierzchu: w menu bocznym chował się pod
  // treścią strony, bo menu i treść to osobne warstwy.
  const [miejsce, setMiejsce] = useState<{ top: number; left: number } | null>(null);

  const odswiez = useCallback(() => {
    pobierzPowiadomienia()
      .then((s) => {
        if (s.brakMigracji) {
          setAktywny(false);
          return;
        }
        setAktywny(true);
        setPozycje(s.pozycje);
        setNieprzeczytane(s.nieprzeczytane);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    odswiez();
  }, [odswiez]);

  useNaZywo({
    kanal: `powiadomienia-${userId}`,
    tabela: "notifications",
    filtr: `user_id=eq.${userId}`,
    onZmiana: odswiez,
    wlaczony: aktywny,
  });

  useEffect(() => {
    if (!otwarty) return;
    function klik(e: MouseEvent) {
      const t = e.target as Node;
      if (box.current?.contains(t) || panel.current?.contains(t)) return;
      setOtwarty(false);
    }
    function esc(e: KeyboardEvent) {
      if (e.key === "Escape") setOtwarty(false);
    }
    document.addEventListener("mousedown", klik);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", klik);
      document.removeEventListener("keydown", esc);
    };
  }, [otwarty]);

  useEffect(() => {
    if (!otwarty) return;
    function ustaw() {
      const r = box.current?.getBoundingClientRect();
      if (!r) return;
      const szer = Math.min(380, window.innerWidth - 24);
      const left = rozwijaW === "prawo" ? r.right + 12 : r.right - szer;
      const top = rozwijaW === "prawo" ? r.top : r.bottom + 8;
      setMiejsce({ top: Math.max(12, top), left: Math.min(Math.max(12, left), window.innerWidth - szer - 12) });
    }
    ustaw();
    window.addEventListener("resize", ustaw);
    window.addEventListener("scroll", ustaw, true);
    return () => {
      window.removeEventListener("resize", ustaw);
      window.removeEventListener("scroll", ustaw, true);
    };
  }, [otwarty, rozwijaW]);

  if (!aktywny) return null;

  function wszystkiePrzeczytane() {
    setPozycje((p) => p.map((x) => ({ ...x, read_at: x.read_at ?? new Date().toISOString() })));
    setNieprzeczytane(0);
    startTransition(() => oznaczPrzeczytane());
  }

  function kliknieta(p: PozycjaPowiadomienia) {
    if (!p.read_at) {
      setPozycje((all) => all.map((x) => (x.id === p.id ? { ...x, read_at: new Date().toISOString() } : x)));
      setNieprzeczytane((n) => Math.max(0, n - 1));
      startTransition(() => oznaczPrzeczytane(p.id));
    }
    setOtwarty(false);
  }

  return (
    <div className="relative" ref={box}>
      <button
        type="button"
        onClick={() => setOtwarty((v) => !v)}
        aria-label={nieprzeczytane > 0 ? `Powiadomienia, nieprzeczytane: ${nieprzeczytane}` : "Powiadomienia"}
        aria-expanded={otwarty}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl text-zinc-400 transition hover:bg-white/10 hover:text-white"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
        </svg>
        {nieprzeczytane > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex min-w-[18px] items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-bold leading-[18px] text-[#06281d] ring-2 ring-[#0b0d12]">
            {nieprzeczytane > 99 ? "99+" : nieprzeczytane}
          </span>
        )}
      </button>

      {otwarty && miejsce && createPortal(
        <div
          ref={panel}
          style={{ top: miejsce.top, left: miejsce.left }}
          className="dzwonek-panel fixed z-[200] w-[min(380px,calc(100vw-24px))] overflow-hidden rounded-2xl border border-white/10 bg-[#111318] shadow-[0_24px_70px_-20px_rgba(0,0,0,0.85)]"
        >
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <p className="text-sm font-semibold text-white">Powiadomienia</p>
            {nieprzeczytane > 0 && (
              <button
                type="button"
                onClick={wszystkiePrzeczytane}
                className="text-xs font-medium text-emerald-400 transition hover:text-emerald-300"
              >
                Oznacz wszystkie
              </button>
            )}
          </div>
          <ul className="max-h-[min(460px,70dvh)] overflow-y-auto">
            {pozycje.length === 0 && (
              <li className="px-4 py-10 text-center text-sm text-zinc-500">
                Nic nowego. Tu pojawią się wiadomości z czatu, zadania z automatyzacji i nowe leady.
              </li>
            )}
            {pozycje.map((p) => {
              const tresc = (
                <div className="flex gap-3 px-4 py-3">
                  <span className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${KOLOR[p.kind] ?? KOLOR.info}`}>
                    <Ikona kind={p.kind} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`block text-sm leading-snug ${p.read_at ? "text-zinc-300" : "font-semibold text-white"}`}>
                      {p.title}
                    </span>
                    {p.body && <span className="mt-0.5 block line-clamp-2 text-xs leading-relaxed text-zinc-500">{p.body}</span>}
                    <span className="mt-1 block text-[11px] text-zinc-600">{kiedy(p.created_at)}</span>
                  </span>
                  {!p.read_at && <span className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-emerald-400" aria-label="nieprzeczytane" />}
                </div>
              );
              return (
                <li key={p.id} className="border-b border-white/5 last:border-0">
                  {p.href ? (
                    <Link href={p.href} onClick={() => kliknieta(p)} className="block transition hover:bg-white/5">
                      {tresc}
                    </Link>
                  ) : (
                    <button type="button" onClick={() => kliknieta(p)} className="block w-full text-left transition hover:bg-white/5">
                      {tresc}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>,
        document.body,
      )}
    </div>
  );
}

const KOLOR: Record<string, string> = {
  info: "bg-white/10 text-zinc-300",
  zadanie: "bg-violet-500/20 text-violet-300",
  lead: "bg-fuchsia-500/20 text-fuchsia-300",
  czat: "bg-sky-500/20 text-sky-300",
  automatyzacja: "bg-amber-500/20 text-amber-300",
  zastepstwo: "bg-teal-500/20 text-teal-300",
  trening: "bg-cyan-500/20 text-cyan-300",
  cena: "bg-emerald-500/20 text-emerald-300",
  portal: "bg-rose-500/20 text-rose-300",
  kredyt: "bg-blue-500/20 text-blue-300",
};

const SCIEZKA: Record<string, string> = {
  info: "M11.25 11.25l.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z",
  zadanie: "M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  lead: "M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0",
  czat: "M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z",
  automatyzacja: "m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z",
  zastepstwo: "M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5",
  trening: "M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z",
  cena: "M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941",
  portal: "M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3",
  kredyt: "M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75Z",
};

function Ikona({ kind }: { kind: string }) {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d={SCIEZKA[kind] ?? SCIEZKA.info} />
    </svg>
  );
}
