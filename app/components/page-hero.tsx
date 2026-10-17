import Image from "next/image";
import { type ReactNode } from "react";

type PageHeroProps = {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  /** Wersja kompaktowa - mniejsze odstępy, dla stron statycznych/prawnych. */
  compact?: boolean;
  /** Zdjęcie obok nagłówka. Strona bez zdjęć czyta się jak dokumentacja. */
  photo?: { src: string; alt: string; caption?: string };
};

/**
 * Nagłówek podstrony w stylu strony głównej: etykieta z kropką, duży
 * nagłówek w Sorze i cienka linia pod spodem. Wejścia robi CSS (`.mk-reveal`),
 * więc treść nie zależy od tego, czy JS zdążył się wczytać.
 */
export function PageHero({ eyebrow, title, description, children, compact = false, photo }: PageHeroProps) {
  return (
    <section className={`mk-hero${compact ? " mk-hero--kompakt" : ""}`}>
      <div className={`mk-hero__siatka${photo ? " mk-hero__siatka--foto" : ""}`}>
        <div className="mk-hero__tekst">
          {eyebrow && <p className="mk-reveal mk-eyebrow">{eyebrow}</p>}
          <h1 className="mk-reveal" style={{ "--mk-delay": "0.08s" } as React.CSSProperties}>
            {title}
          </h1>
          {description && (
            <div className="mk-reveal mk-hero__opis" style={{ "--mk-delay": "0.16s" } as React.CSSProperties}>
              {description}
            </div>
          )}
          {children && (
            <div className="mk-reveal" style={{ "--mk-delay": "0.24s", marginTop: 8 } as React.CSSProperties}>
              {children}
            </div>
          )}
        </div>

        {photo && (
          <figure className="mk-reveal mk-hero__foto" style={{ "--mk-delay": "0.22s" } as React.CSSProperties}>
            <Image src={photo.src} alt={photo.alt} fill sizes="(max-width: 960px) 100vw, 42vw" priority className="object-cover" />
            {photo.caption && <figcaption>{photo.caption}</figcaption>}
          </figure>
        )}
      </div>
      {!photo && <div className="mk-hero__siatka mk-hero__kreska" aria-hidden="true" />}
    </section>
  );
}
