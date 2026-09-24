import Image from "next/image";
import { type ReactNode } from "react";
import { AuroraBackground } from "./aurora-background";
import { Spotlight } from "./effects/spotlight";

type PageHeroProps = {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  /** Wersja kompaktowa - mniejsze paddingi, dla stron statycznych/prawnych. */
  compact?: boolean;
  /** Zdjęcie obok nagłówka. Strona bez zdjęć czyta się jak dokumentacja. */
  photo?: { src: string; alt: string; caption?: string };
};

/**
 * Nagłówek podstrony marketingowej: aurora + spotlight w tle.
 *
 * Wejścia robi CSS (`.mk-reveal`), nie motion - treść nagłówka nie może
 * zależeć od tego, czy JS zdążył się zhydratować. To komponent serwerowy.
 */
export function PageHero({
  eyebrow,
  title,
  description,
  children,
  compact = false,
  photo,
}: PageHeroProps) {
  return (
    <section
      className={`relative overflow-hidden px-6 ${
        compact
          ? "pt-[120px] pb-14 md:pt-[148px] md:pb-16"
          : "pt-[132px] pb-18 md:pt-[156px] md:pb-22"
      }`}
    >
      <AuroraBackground />
      <Spotlight />

      <div
        className={`relative z-10 mx-auto max-w-[1120px] ${
          photo ? "grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)] lg:gap-14" : ""
        }`}
      >
        <div>
        {eyebrow && (
          <p className="mk-reveal mk-eyebrow mb-6">{eyebrow}</p>
        )}

        <h1
          className="mk-reveal max-w-[20ch]"
          style={{ "--mk-delay": "0.08s" } as React.CSSProperties}
        >
          {title}
        </h1>

        {description && (
          <div
            className="mk-reveal mt-6 max-w-[56ch] text-lg leading-relaxed text-[var(--color-mk-muted)]"
            style={{ "--mk-delay": "0.16s" } as React.CSSProperties}
          >
            {description}
          </div>
        )}

        {children && (
          <div
            className="mk-reveal mt-10"
            style={{ "--mk-delay": "0.24s" } as React.CSSProperties}
          >
            {children}
          </div>
        )}
        </div>

        {photo && (
          <figure
            className="mk-reveal relative m-0 aspect-[4/5] overflow-hidden rounded-[24px] border border-[var(--mk-hairline)]"
            style={{ "--mk-delay": "0.22s" } as React.CSSProperties}
          >
            <Image src={photo.src} alt={photo.alt} fill sizes="(max-width: 1024px) 100vw, 42vw" priority className="object-cover" />
            {photo.caption && (
              <>
                <span className="absolute inset-0 bg-gradient-to-t from-[rgba(4,7,10,0.9)] via-[rgba(4,7,10,0.15)] to-transparent" />
                <figcaption className="absolute bottom-5 left-5 right-5 text-sm text-white/90 [text-shadow:0_2px_12px_rgba(0,0,0,0.5)]">{photo.caption}</figcaption>
              </>
            )}
          </figure>
        )}
      </div>
    </section>
  );
}
