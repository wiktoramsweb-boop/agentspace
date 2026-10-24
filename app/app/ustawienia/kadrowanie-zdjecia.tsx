"use client";

import { useEffect, useRef, useState } from "react";

const POLE = 280;
const WYJSCIE = 640;

type Stan = { x: number; y: number; zoom: number };

/**
 * Kadrowanie zdjęcia profilowego do kwadratu. Zaczynamy od kadru, który
 * zwykle trafia: przy zdjęciu pionowym (typowe zdjęcie biznesowe) bierzemy
 * górę z małym marginesem nad głową, bo środek obrazu to klatka piersiowa
 * i włosy z czołem wypadały poza kółko. Agent może przesunąć i przybliżyć.
 */
export function KadrowanieZdjecia({ plik, onGotowe, onAnuluj }: { plik: File; onGotowe: (b: Blob) => void; onAnuluj: () => void }) {
  const [src] = useState(() => URL.createObjectURL(plik));
  const [wym, setWym] = useState<{ w: number; h: number } | null>(null);
  const [s, setS] = useState<Stan>({ x: 0, y: 0, zoom: 1 });
  const obraz = useRef<HTMLImageElement>(null);
  const ciagniecie = useRef<{ px: number; py: number; x: number; y: number } | null>(null);

  useEffect(() => () => URL.revokeObjectURL(src), [src]);

  const bazowa = wym ? Math.max(POLE / wym.w, POLE / wym.h) : 1;
  const skala = bazowa * s.zoom;

  const ogranicz = (st: Stan): Stan => {
    if (!wym) return st;
    const sk = bazowa * st.zoom;
    const minX = POLE - wym.w * sk;
    const minY = POLE - wym.h * sk;
    return { ...st, x: Math.min(0, Math.max(minX, st.x)), y: Math.min(0, Math.max(minY, st.y)) };
  };

  function zaladowane() {
    const img = obraz.current;
    if (!img) return;
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    setWym({ w, h });
    const sk = Math.max(POLE / w, POLE / h);
    const x = (POLE - w * sk) / 2;
    // Pionowe: 4% wysokości nad kadrem zostawiamy na włosy; poziome: środek.
    const y = h > w ? -0.04 * h * sk : (POLE - h * sk) / 2;
    setS({ x, y: Math.min(0, Math.max(POLE - h * sk, y)), zoom: 1 });
  }

  function zmienZoom(z: number) {
    // Przybliżamy względem środka kółka, a nie lewego górnego rogu.
    setS((st) => {
      const stara = bazowa * st.zoom;
      const nowa = bazowa * z;
      const cx = (POLE / 2 - st.x) / stara;
      const cy = (POLE / 2 - st.y) / stara;
      return ogranicz({ zoom: z, x: POLE / 2 - cx * nowa, y: POLE / 2 - cy * nowa });
    });
  }

  function zapisz() {
    const img = obraz.current;
    if (!img || !wym) return;
    const c = document.createElement("canvas");
    c.width = WYJSCIE;
    c.height = WYJSCIE;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, -s.x / skala, -s.y / skala, POLE / skala, POLE / skala, 0, 0, WYJSCIE, WYJSCIE);
    c.toBlob((b) => b && onGotowe(b), "image/jpeg", 0.88);
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-900/50 p-0 sm:items-center sm:p-4" onClick={onAnuluj}>
      <div className="w-full max-w-sm rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-slate-900">Ustaw kadr</h2>
        <p className="mt-0.5 text-sm text-slate-500">Przeciągnij zdjęcie, żeby cała głowa zmieściła się w kółku.</p>

        <div
          className="relative mx-auto mt-4 cursor-grab touch-none overflow-hidden rounded-2xl bg-slate-900 active:cursor-grabbing"
          style={{ width: POLE, height: POLE }}
          onPointerDown={(e) => {
            (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
            ciagniecie.current = { px: e.clientX, py: e.clientY, x: s.x, y: s.y };
          }}
          onPointerMove={(e) => {
            const d = ciagniecie.current;
            if (!d) return;
            setS((st) => ogranicz({ ...st, x: d.x + e.clientX - d.px, y: d.y + e.clientY - d.py }));
          }}
          onPointerUp={() => (ciagniecie.current = null)}
          onPointerCancel={() => (ciagniecie.current = null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={obraz}
            src={src}
            alt=""
            draggable={false}
            onLoad={zaladowane}
            className="pointer-events-none absolute left-0 top-0 max-w-none select-none"
            style={wym ? { width: wym.w * skala, height: wym.h * skala, transform: `translate(${s.x}px, ${s.y}px)` } : { opacity: 0 }}
          />
          {/* Kółko pokazuje, co zobaczy zespół; rogi przyciemnione. */}
          <div className="pointer-events-none absolute inset-0 rounded-full shadow-[0_0_0_9999px_rgba(15,23,42,0.55)] ring-2 ring-white/80" />
        </div>

        <label className="mt-4 flex items-center gap-3 text-sm text-slate-600">
          <span>Przybliż</span>
          <input type="range" min={1} max={3} step={0.01} value={s.zoom} onChange={(e) => zmienZoom(Number(e.target.value))} className="flex-1 accent-emerald-600" />
        </label>

        <div className="mt-5 flex gap-2">
          <button type="button" onClick={onAnuluj} className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Anuluj
          </button>
          <button type="button" onClick={zapisz} disabled={!wym} className="flex-1 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-500 disabled:opacity-50">
            Zapisz zdjęcie
          </button>
        </div>
      </div>
    </div>
  );
}
