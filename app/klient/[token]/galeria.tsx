"use client";

import { useRef, useState } from "react";

/**
 * Przewijana galeria zdjęć.
 *
 * Przewijanie palcem zamiast strzałek, bo portal jest używany na telefonie.
 * Kropki pod spodem mówią, ile zdjęć zostało - bez nich klient nie wie, że
 * w bok jest cokolwiek więcej.
 */
export function Galeria({ zdjecia, alt }: { zdjecia: string[]; alt: string }) {
  const [aktywne, setAktywne] = useState(0);
  const pas = useRef<HTMLDivElement>(null);

  if (zdjecia.length === 0) {
    return (
      <div className="portal-foto">
        <div className="portal-foto-pusta">Brak zdjęć</div>
      </div>
    );
  }

  return (
    <div>
      <div
        ref={pas}
        className="portal-galeria"
        onScroll={(e) => {
          const el = e.currentTarget;
          setAktywne(Math.round(el.scrollLeft / el.clientWidth));
        }}
      >
        {zdjecia.map((u, i) => (
          <div key={u}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={u} alt={`${alt} - zdjęcie ${i + 1}`} loading={i === 0 ? "eager" : "lazy"} />
          </div>
        ))}
      </div>
      {zdjecia.length > 1 && (
        <div className="portal-kropki-galerii" aria-hidden="true">
          {zdjecia.map((u, i) => (
            <i key={u} className={i === aktywne ? "na" : undefined} />
          ))}
        </div>
      )}
    </div>
  );
}
