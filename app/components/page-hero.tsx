import { type ReactNode } from "react";
import { AuroraBackground } from "./aurora-background";
import { Spotlight } from "./effects/spotlight";

type PageHeroProps = {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  /** Wersja kompaktowa — mniejsze paddingi, dla stron statycznych/prawnych. */
  compact?: boolean;
};

/**
 * Nagłówek podstrony marketingowej: aurora + spotlight w tle.
 *
 * Wejścia robi CSS (`.mk-reveal`), nie motion — treść nagłówka nie może
 * zależeć od tego, czy JS zdążył się zhydratować. To komponent serwerowy.
 */
export function PageHero({
  eyebrow,
  title,
  description,
  children,
  compact = false,
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

      <div className="relative z-10 mx-auto max-w-[1120px]">
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
    </section>
  );
}
