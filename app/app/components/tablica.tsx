"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

/**
 * Tablica kanban z przeciąganiem kart między kolumnami.
 *
 * Napisana na zdarzeniach wskaźnika, a nie na HTML5 drag and drop: tamten
 * nie działa na telefonach, a agent przesuwa klientów właśnie z telefonu,
 * między prezentacjami. Na dotyk przeciąga się za uchwyt (kropki w rogu
 * karty), żeby zwykłe przewijanie palcem dalej przewijało stronę.
 *
 * Kolejność kart w kolumnie trzymamy w liczbie (`pos`). Przy upuszczeniu
 * między dwie karty dostajemy średnią sąsiadów, więc zapis dotyczy jednej
 * karty. Gdy któryś sąsiad nie ma jeszcze pozycji, numerujemy kolumnę od nowa.
 */

export type KolumnaTablicy = {
  id: string;
  nazwa: string;
  /** Kolor kropki i paska nagłówka, pełna klasa Tailwind. */
  kolor: string;
  /** Linia pod nazwą, np. suma budżetów. Liczona przez rodzica z aktualnych kart. */
  podsumowanie?: (karty: KartaTablicy[]) => ReactNode;
  /** Kolumna z kartami wyciętymi z widoku (np. zamknięte sprzed 30 dni). */
  dopisek?: string;
};

export type KartaTablicy = { id: string; kolumna: string; pos: number | null };

export type Przeniesienie = { id: string; kolumna: string; kolejnosc: { id: string; pos: number }[] };

type Drag = {
  id: string;
  z: string;
  x: number;
  y: number;
  dx: number;
  dy: number;
  w: number;
  h: number;
  nad: string | null;
  indeks: number;
};

const PROG = 6;

export function sortujKarty<K extends KartaTablicy>(karty: K[]): K[] {
  return [...karty].sort((a, b) => {
    if (a.pos == null && b.pos == null) return 0;
    if (a.pos == null) return 1;
    if (b.pos == null) return -1;
    return a.pos - b.pos;
  });
}

export function Tablica<K extends KartaTablicy>({
  kolumny,
  karty: poczatkowe,
  renderKarta,
  onPrzenies,
  etykietaKarty,
  pusta,
}: {
  kolumny: KolumnaTablicy[];
  karty: K[];
  renderKarta: (k: K, przenoszona: boolean) => ReactNode;
  /** Zwraca komunikat błędu albo null. Przy błędzie karta wraca na miejsce. */
  onPrzenies: (p: Przeniesienie) => Promise<string | null>;
  /** Nazwa karty do czytnika ekranu i menu „Przenieś do". */
  etykietaKarty: (k: K) => string;
  pusta?: string;
}) {
  const [karty, setKarty] = useState<K[]>(poczatkowe);
  const [drag, setDrag] = useState<Drag | null>(null);
  const dragRef = useRef<Drag | null>(null);
  const [komunikat, setKomunikat] = useState<string | null>(null);
  // Menu „Przenieś do" rysujemy w portalu przy przycisku: w kolumnie
  // przycinałby je przewijany kontener tablicy.
  const [menu, setMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const kolumnyRef = useRef(new Map<string, HTMLDivElement>());
  const kartyRef = useRef(new Map<string, HTMLDivElement>());
  const poDragu = useRef(false);
  const start = useRef<{ id: string; x: number; y: number; el: HTMLDivElement } | null>(null);
  const raf = useRef<number | null>(null);

  // Nowe dane z serwera (np. po odświeżeniu) zastępują lokalne, o ile nikt
  // właśnie nie przeciąga.
  useEffect(() => {
    if (!drag) setKarty(poczatkowe);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poczatkowe]);

  const wKolumnie = useMemo(() => {
    const m = new Map<string, K[]>();
    for (const k of kolumny) m.set(k.id, []);
    for (const c of sortujKarty(karty)) m.get(c.kolumna)?.push(c);
    return m;
  }, [karty, kolumny]);

  const gdzieUpuscic = useCallback(
    (x: number, y: number, przenoszonaId: string): { nad: string | null; indeks: number } => {
      for (const [id, el] of kolumnyRef.current) {
        const r = el.getBoundingClientRect();
        if (x >= r.left && x <= r.right && y >= r.top - 40 && y <= r.bottom + 400) {
          const lista = (wKolumnie.get(id) ?? []).filter((c) => c.id !== przenoszonaId);
          let indeks = lista.length;
          for (let i = 0; i < lista.length; i++) {
            const kr = kartyRef.current.get(lista[i].id)?.getBoundingClientRect();
            if (kr && y < kr.top + kr.height / 2) {
              indeks = i;
              break;
            }
          }
          return { nad: id, indeks };
        }
      }
      return { nad: null, indeks: 0 };
    },
    [wKolumnie],
  );

  // Przewijanie, gdy przeciągana karta zbliża się do krawędzi.
  const przewijaj = useCallback((x: number, y: number) => {
    if (raf.current) cancelAnimationFrame(raf.current);
    const sc = scroller.current;
    const krok = () => {
      let ruch = false;
      if (sc) {
        const r = sc.getBoundingClientRect();
        if (x < r.left + 60) { sc.scrollLeft -= 14; ruch = true; }
        else if (x > r.right - 60) { sc.scrollLeft += 14; ruch = true; }
      }
      if (y < 70) { window.scrollBy(0, -12); ruch = true; }
      else if (y > window.innerHeight - 70) { window.scrollBy(0, 12); ruch = true; }
      if (ruch) raf.current = requestAnimationFrame(krok);
    };
    raf.current = requestAnimationFrame(krok);
  }, []);

  // Słuchacze ruchu żyją tylko w trakcie jednego przeciągania. Trzymamy je
  // w ref, żeby zdjąć dokładnie te same funkcje, które zostały podpięte.
  const sluchacze = useRef<{ ruch: (e: PointerEvent) => void; gora: () => void } | null>(null);

  function zdejmijSluchaczy() {
    const sl = sluchacze.current;
    if (sl) {
      window.removeEventListener("pointermove", sl.ruch);
      window.removeEventListener("pointerup", sl.gora);
      window.removeEventListener("pointercancel", sl.gora);
    }
    sluchacze.current = null;
    if (raf.current) cancelAnimationFrame(raf.current);
  }

  function naDol(e: React.PointerEvent, id: string) {
    if (e.button !== 0) return;
    const el = kartyRef.current.get(id);
    const karta = karty.find((k) => k.id === id);
    if (!el || !karta) return;
    zdejmijSluchaczy();
    start.current = { id, x: e.clientX, y: e.clientY, el };

    const ruch = (ev: PointerEvent) => {
      const st = start.current;
      if (!st) return;
      const d = dragRef.current;
      let nowy: Drag | null;
      if (!d) {
        if (Math.hypot(ev.clientX - st.x, ev.clientY - st.y) < PROG) return;
        const r = st.el.getBoundingClientRect();
        nowy = {
          id: st.id,
          z: karta.kolumna,
          x: ev.clientX,
          y: ev.clientY,
          dx: st.x - r.left,
          dy: st.y - r.top,
          w: r.width,
          h: r.height,
          ...gdzieUpuscic(ev.clientX, ev.clientY, st.id),
        };
      } else {
        nowy = { ...d, x: ev.clientX, y: ev.clientY, ...gdzieUpuscic(ev.clientX, ev.clientY, d.id) };
      }
      dragRef.current = nowy;
      setDrag(nowy);
      przewijaj(ev.clientX, ev.clientY);
    };

    // Zapis idzie poza aktualizacją stanu: funkcja przekazana do setState
    // musi być czysta, a zapis wywołuje odświeżenie routera.
    const gora = () => {
      zdejmijSluchaczy();
      start.current = null;
      const d = dragRef.current;
      dragRef.current = null;
      setDrag(null);
      if (d) {
        poDragu.current = true;
        setTimeout(() => (poDragu.current = false), 50);
        if (d.nad) void upusc(d.id, d.nad, d.indeks);
      }
    };

    sluchacze.current = { ruch, gora };
    window.addEventListener("pointermove", ruch);
    window.addEventListener("pointerup", gora);
    window.addEventListener("pointercancel", gora);
  }

  async function upusc(id: string, kolumna: string, indeks: number) {
    const karta = karty.find((k) => k.id === id);
    if (!karta) return;
    const docelowe = sortujKarty(karty.filter((k) => k.kolumna === kolumna && k.id !== id));
    const przed = docelowe[indeks - 1];
    const za = docelowe[indeks];
    let kolejnosc: { id: string; pos: number }[];
    if ((przed && przed.pos == null) || (za && za.pos == null)) {
      const nowa = [...docelowe];
      nowa.splice(indeks, 0, karta);
      kolejnosc = nowa.map((k, i) => ({ id: k.id, pos: (i + 1) * 1000 }));
    } else {
      const pos =
        przed && za ? (przed.pos! + za.pos!) / 2 : przed ? przed.pos! + 1000 : za ? za.pos! - 1000 : 1000;
      kolejnosc = [{ id, pos }];
    }

    const poprzednie = karty;
    const mapa = new Map(kolejnosc.map((k) => [k.id, k.pos]));
    setKarty((all) => all.map((k) => (k.id === id ? { ...k, kolumna, pos: mapa.get(k.id) ?? k.pos } : mapa.has(k.id) ? { ...k, pos: mapa.get(k.id)! } : k)));
    const blad = await onPrzenies({ id, kolumna, kolejnosc });
    if (blad) {
      setKarty(poprzednie);
      setKomunikat(blad);
      setTimeout(() => setKomunikat(null), 4000);
    }
  }

  async function przeniesMenu(id: string, kolumna: string) {
    setMenu(null);
    const ile = (wKolumnie.get(kolumna) ?? []).length;
    await upusc(id, kolumna, ile);
  }

  useEffect(() => () => zdejmijSluchaczy(), []);

  const przenoszona = drag ? karty.find((k) => k.id === drag.id) : null;

  return (
    <div className="relative">
      {komunikat && (
        <p role="alert" className="mb-3 rounded-xl border border-red-500/30 bg-red-100 px-4 py-2.5 text-sm text-red-700">
          {komunikat}
        </p>
      )}
      <div ref={scroller} className="-mx-5 overflow-x-auto px-5 pb-4 md:mx-0 md:px-0" style={{ scrollbarGutter: "stable" }}>
        <div className="flex min-w-max gap-4">
          {kolumny.map((kol) => {
            const lista = wKolumnie.get(kol.id) ?? [];
            const widoczne = lista.filter((k) => k.id !== drag?.id);
            const tu = drag?.nad === kol.id;
            return (
              <div
                key={kol.id}
                ref={(el) => {
                  if (el) kolumnyRef.current.set(kol.id, el);
                  else kolumnyRef.current.delete(kol.id);
                }}
                className={`flex w-[272px] flex-shrink-0 flex-col rounded-2xl border p-2.5 transition-colors sm:w-[288px] ${
                  tu ? "border-emerald-500/60 bg-emerald-100" : "border-slate-200 bg-slate-50"
                }`}
              >
                <div className="mb-2.5 px-1.5 pt-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                      <span className={`h-2 w-2 rounded-full ${kol.kolor}`} aria-hidden="true" />
                      {kol.nazwa}
                    </p>
                    <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold tabular-nums text-slate-500 shadow-sm">
                      {lista.length}
                    </span>
                  </div>
                  {kol.podsumowanie && <div className="mt-1 text-xs text-slate-500">{kol.podsumowanie(lista)}</div>}
                  {kol.dopisek && <p className="mt-0.5 text-[11px] text-slate-400">{kol.dopisek}</p>}
                </div>

                <div className="flex min-h-[80px] flex-col gap-2">
                  {widoczne.map((k, i) => (
                    <div key={k.id}>
                      {tu && drag?.indeks === i && <Miejsce h={drag.h} />}
                      <div
                        ref={(el) => {
                          if (el) kartyRef.current.set(k.id, el);
                          else kartyRef.current.delete(k.id);
                        }}
                        onClickCapture={(e) => {
                          if (poDragu.current) {
                            e.preventDefault();
                            e.stopPropagation();
                          }
                        }}
                        onPointerDown={(e) => {
                          // Myszą przeciąga się całą kartę, palcem tylko za uchwyt.
                          if (e.pointerType === "mouse") naDol(e, k.id);
                        }}
                        className="group relative select-none"
                      >
                        {renderKarta(k, false)}
                        <button
                          type="button"
                          aria-label={`Przeciągnij: ${etykietaKarty(k)}`}
                          onPointerDown={(e) => {
                            e.stopPropagation();
                            naDol(e, k.id);
                          }}
                          className="absolute right-1.5 top-1.5 flex h-7 w-7 cursor-grab touch-none items-center justify-center rounded-lg text-slate-400 opacity-60 transition hover:bg-slate-100 hover:text-slate-700 group-hover:opacity-100 active:cursor-grabbing"
                        >
                          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <circle cx="7" cy="5" r="1.4" /><circle cx="13" cy="5" r="1.4" />
                            <circle cx="7" cy="10" r="1.4" /><circle cx="13" cy="10" r="1.4" />
                            <circle cx="7" cy="15" r="1.4" /><circle cx="13" cy="15" r="1.4" />
                          </svg>
                        </button>
                        <div className="absolute bottom-1.5 right-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
                              setMenu(menu?.id === k.id ? null : { id: k.id, x: r.right, y: r.bottom });
                            }}
                            aria-haspopup="menu"
                            aria-expanded={menu?.id === k.id}
                            className="rounded-md px-1.5 py-0.5 text-[11px] font-medium text-slate-400 opacity-0 transition hover:bg-slate-100 hover:text-slate-700 focus:opacity-100 group-hover:opacity-100"
                          >
                            Przenieś
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {tu && drag && drag.indeks >= widoczne.length && <Miejsce h={drag.h} />}
                  {lista.length === 0 && !tu && (
                    <p className="rounded-xl border border-dashed border-slate-200 px-3 py-6 text-center text-xs text-slate-400">
                      {pusta ?? "Przeciągnij tu kartę"}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {menu &&
        createPortal(
          <>
            <div className="fixed inset-0 z-[95]" onClick={() => setMenu(null)} aria-hidden="true" />
            <div
              role="menu"
              className="fixed z-[96] w-52 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl"
              style={{
                left: Math.max(8, Math.min(menu.x - 208, window.innerWidth - 216)),
                top: Math.min(menu.y + 4, window.innerHeight - 8 - kolumny.length * 38),
              }}
            >
              <p className="px-3 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Przenieś do</p>
              {kolumny
                .filter((c) => c.id !== karty.find((x) => x.id === menu.id)?.kolumna)
                .map((c) => (
                  <button
                    key={c.id}
                    role="menuitem"
                    type="button"
                    onClick={() => void przeniesMenu(menu.id, c.id)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
                  >
                    <span className={`h-2 w-2 rounded-full ${c.kolor}`} aria-hidden="true" />
                    {c.nazwa}
                  </button>
                ))}
            </div>
          </>,
          document.body,
        )}

      {drag && przenoszona &&
        createPortal(
          <div
            className="pointer-events-none fixed z-[90]"
            style={{
              left: drag.x - drag.dx,
              top: drag.y - drag.dy,
              width: drag.w,
              transform: "rotate(2deg) scale(1.02)",
              filter: "drop-shadow(0 18px 30px rgba(15,23,42,0.25))",
            }}
          >
            {renderKarta(przenoszona, true)}
          </div>,
          document.body,
        )}
    </div>
  );
}

function Miejsce({ h }: { h: number }) {
  return (
    <div
      className="mb-2 rounded-xl border-2 border-dashed border-emerald-500/60 bg-white"
      style={{ height: Math.max(44, Math.min(h, 160)) }}
      aria-hidden="true"
    />
  );
}
