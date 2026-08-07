import type { ReactNode } from "react";

/**
 * Ramka „rysunku technicznego” — hairline + jasne znaczniki w narożnikach.
 * To jest jedyny powtarzalny motyw wizualny marketingu. Używany wszędzie:
 * karty modułów, cennik, case study, sekcje.
 *
 * Znaczniki są SVG (nie border-radius), bo dają ten „inżynieryjny” charakter
 * którego nie da się uzyskać samym CSS-em.
 */

const CORNERS = [
  { pos: "top-[-1px] left-[-1px]", d: "M7 1H1v6" },
  { pos: "top-[-1px] right-[-1px]", d: "M1 1h6v6" },
  { pos: "bottom-[-1px] right-[-1px]", d: "M1 7h6V1" },
  { pos: "bottom-[-1px] left-[-1px]", d: "M7 7H1V1" },
];

type FrameProps = {
  children: ReactNode;
  className?: string;
  /** Delikatne podświetlenie krawędzi przy hover (dla kart klikalnych). */
  interactive?: boolean;
};

export function Frame({ children, className = "", interactive = false }: FrameProps) {
  return (
    <div
      className={[
        "relative border border-[var(--color-mk-line)]",
        interactive
          ? "transition-colors duration-300 hover:border-[#3a322d]"
          : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {CORNERS.map((corner) => (
        <svg
          key={corner.pos}
          aria-hidden="true"
          className={`pointer-events-none absolute z-10 ${corner.pos}`}
          width="8"
          height="8"
          viewBox="0 0 8 8"
          fill="none"
        >
          <path
            d={corner.d}
            stroke="var(--color-mk-line-lit)"
            strokeLinecap="round"
          />
        </svg>
      ))}
      {children}
    </div>
  );
}

/**
 * Pozioma linia rozdzielająca sekcje, z „wcięciem” — sygnaturowy detal.
 * Rysowana jako SVG rozciągnięty na całą szerokość.
 */
export function FrameRule({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={`block w-full ${className}`}
      viewBox="0 0 1200 8"
      preserveAspectRatio="none"
      height="8"
      fill="none"
    >
      <path
        d="M0 1h72l38 6V1h1090"
        stroke="var(--color-mk-line-lit)"
        strokeOpacity="0.35"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
