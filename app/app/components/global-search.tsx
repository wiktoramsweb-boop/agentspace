"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { SearchHit } from "@/app/api/szukaj/route";
import { ApartmentIcon, PersonIcon, PhoneIcon, SearchIcon2 } from "./icons";

const KIND_META: Record<
  SearchHit["kind"],
  { label: string; tile: string; Icon: (p: { className?: string }) => React.ReactElement }
> = {
  klient: { label: "Klienci", tile: "bg-rose-500", Icon: PersonIcon },
  nieruchomosc: { label: "Nieruchomości", tile: "bg-blue-500", Icon: ApartmentIcon },
  dzialanie: { label: "Działania", tile: "bg-amber-500", Icon: PhoneIcon },
  poszukiwanie: { label: "Poszukiwania", tile: "bg-sky-500", Icon: SearchIcon2 },
};

const ORDER: SearchHit["kind"][] = ["klient", "nieruchomosc", "dzialanie", "poszukiwanie"];

/**
 * Globalna wyszukiwarka (⌘K / Ctrl+K). Jedno pole zamiast skakania po
 * zakładkach: agent wpisuje numer telefonu albo nazwisko i od razu widzi
 * klienta, jego oferty i historię rozmów.
 */
export function GlobalSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Skrót klawiszowy działa z każdego miejsca aplikacji.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 30);
    else {
      setQ("");
      setHits([]);
      setActive(0);
    }
  }, [open]);

  // Odpytujemy z opóźnieniem, żeby nie strzelać przy każdej literze.
  useEffect(() => {
    if (q.trim().length < 2) {
      setHits([]);
      return;
    }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/szukaj?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setHits(data.hits ?? []);
        setActive(0);
      } catch {
        setHits([]);
      } finally {
        setLoading(false);
      }
    }, 220);
    return () => clearTimeout(t);
  }, [q]);

  const go = useCallback(
    (hit: SearchHit) => {
      setOpen(false);
      router.push(hit.href);
    },
    [router],
  );

  function onInputKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, hits.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && hits[active]) {
      e.preventDefault();
      go(hits[active]);
    }
  }

  const grouped = ORDER.map((k) => ({ kind: k, items: hits.filter((h) => h.kind === k) })).filter(
    (g) => g.items.length > 0,
  );
  let idx = -1;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="mb-3 flex w-full items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/50 transition hover:border-white/20 hover:text-white/80"
      >
        <SearchIcon2 className="h-4 w-4" />
        <span className="flex-1 text-left">Szukaj…</span>
        <kbd className="rounded border border-white/20 px-1.5 py-0.5 text-[10px] font-medium">⌘K</kbd>
      </button>

      {/* Portal do <body>: sidebar ma position:sticky, co tworzy własny kontekst
          nakładania. Modal renderowany w środku byłby przykrywany przez treść
          strony mimo wysokiego z-index. */}
      {open && mounted &&
        createPortal(
          <div
            className="portal-dark fixed inset-0 z-[60] flex items-start justify-center bg-slate-900/60 p-4 pt-[12vh] backdrop-blur-sm"
            onClick={() => setOpen(false)}
          >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
          >
            <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3">
              <SearchIcon2 className="h-5 w-5 text-slate-400" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={onInputKey}
                placeholder="Numer telefonu, nazwisko, adres, numer oferty…"
                className="flex-1 bg-transparent text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
              <kbd className="rounded border border-slate-300 px-1.5 py-0.5 text-[10px] text-slate-400">
                Esc
              </kbd>
            </div>

            <div className="max-h-[55vh] overflow-y-auto p-2">
              {q.trim().length < 2 ? (
                <p className="p-6 text-center text-sm text-slate-400">
                  Wpisz co najmniej 2 znaki. Szukamy w klientach, ofertach, działaniach i poszukiwaniach.
                </p>
              ) : loading && hits.length === 0 ? (
                <p className="p-6 text-center text-sm text-slate-400">Szukam…</p>
              ) : hits.length === 0 ? (
                <p className="p-6 text-center text-sm text-slate-400">
                  Nic nie znaleziono dla „{q}".
                </p>
              ) : (
                grouped.map((g) => {
                  const meta = KIND_META[g.kind];
                  return (
                    <div key={g.kind} className="mb-2">
                      <p className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                        {meta.label}
                      </p>
                      {g.items.map((h) => {
                        idx++;
                        const isActive = idx === active;
                        const myIdx = idx;
                        return (
                          <button
                            key={`${h.kind}-${h.id}`}
                            onClick={() => go(h)}
                            onMouseEnter={() => setActive(myIdx)}
                            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                              isActive ? "bg-emerald-50" : "hover:bg-slate-50"
                            }`}
                          >
                            <span
                              className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-white ${meta.tile}`}
                            >
                              <meta.Icon className="h-4 w-4" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-medium text-slate-900">
                                {h.title}
                              </span>
                              {h.subtitle && (
                                <span className="block truncate text-xs text-slate-500">{h.subtitle}</span>
                              )}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex items-center gap-3 border-t border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-400">
              <span>↑↓ nawigacja</span>
              <span>Enter otwiera</span>
              <span>Esc zamyka</span>
            </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
