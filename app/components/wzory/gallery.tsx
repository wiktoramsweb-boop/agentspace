"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

/** Galeria zdjęć oferty z powiększeniem. Strzałki działają też z klawiatury. */
export function OfferGallery({ photos, title }: { photos: string[]; title: string }) {
  const [main, setMain] = useState(0);
  const [zoom, setZoom] = useState<number | null>(null);

  const move = useCallback(
    (dir: number) => setZoom((z) => (z == null ? z : (z + dir + photos.length) % photos.length)),
    [photos.length],
  );

  useEffect(() => {
    if (zoom == null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setZoom(null);
      if (e.key === "ArrowRight") move(1);
      if (e.key === "ArrowLeft") move(-1);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [zoom, move]);

  const rest = photos.slice(0, 4).filter((_, i) => i !== main).slice(0, 4);

  return (
    <>
      <div className="wzg">
        <button type="button" className="wzg__main wz-img" onClick={() => setZoom(main)} aria-label="Powiększ zdjęcie">
          <Image src={photos[main]} alt={title} fill priority sizes="(max-width: 1100px) 100vw, 70vw" />
        </button>

        {photos.map((p, i) =>
          i === main ? null : (
            <button
              key={p + i}
              type="button"
              className="wzg__thumb wz-img"
              aria-current={i === main}
              onClick={() => setMain(i)}
              aria-label={`Zdjęcie ${i + 1}`}
            >
              <Image src={p} alt="" fill sizes="25vw" />
              {i === 3 && photos.length > 4 && <span className="wzg__more">+{photos.length - 4}</span>}
            </button>
          ),
        )}
        {rest.length === 0 && null}
      </div>

      {zoom != null && (
        <div className="wzlb" role="dialog" aria-modal="true" aria-label={`Zdjęcia: ${title}`}>
          <div className="wzlb__bar">
            <span>
              {zoom + 1} z {photos.length} · {title}
            </span>
            <button type="button" onClick={() => setZoom(null)}>
              Zamknij ✕
            </button>
          </div>
          <div className="wzlb__img">
            <Image src={photos[zoom]} alt="" fill sizes="100vw" />
          </div>
          <div className="wzlb__nav">
            <button type="button" onClick={() => move(-1)} aria-label="Poprzednie zdjęcie">
              ←
            </button>
            <button type="button" onClick={() => move(1)} aria-label="Następne zdjęcie">
              →
            </button>
          </div>
        </div>
      )}
    </>
  );
}
