/**
 * Znak i logo AgentSpace do użycia w interfejsie.
 *
 * Geometria jest ta sama co w plikach z `scripts/marka/generuj.mjs`: dom
 * z zaokrąglonymi narożnikami i kropka na kalenicy. Zmiana kształtu wymaga
 * zmiany w obu miejscach, inaczej ikona aplikacji rozjedzie się z menu.
 *
 * Kafelek rysujemy tłem CSS, a nie gradientem w SVG. Gradient w SVG potrzebuje
 * identyfikatora, a ten sam znak stoi na stronie kilka razy (menu na telefonie
 * i na komputerze). Gdy pierwsza kopia jest ukryta, część przeglądarek przestaje
 * malować gradient we wszystkich pozostałych.
 */

const BRYLA =
  "M 50 29.3 L 80.5 54 L 72.3 54 L 72.3 76.6 L 60.6 76.6 L 60.6 59.9 " +
  "L 39.6 59.9 L 39.6 76.6 L 27.9 76.6 L 27.9 54 L 19.5 54 Z";

const GRADIENT = "linear-gradient(135deg, #10b981 0%, #06b6d4 100%)";

function Dom({ dom, kropka }: { dom: string; kropka: string }) {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
      <g transform="translate(50 50) scale(0.91) translate(-50 -50)">
        <g transform="translate(0 -2.15)">
          <path d={BRYLA} fill={dom} stroke={dom} strokeWidth={6} strokeLinejoin="round" />
          <circle cx={50} cy={27.6} r={2.9} fill={kropka} />
        </g>
      </g>
    </svg>
  );
}

type Wariant = "gradient" | "ciemny" | "jasny";

const KAFELKI: Record<Wariant, { tlo: string; dom: string; kropka: string; ramka?: string }> = {
  gradient: { tlo: GRADIENT, dom: "#0b1220", kropka: "#ffffff" },
  ciemny: { tlo: "#07090c", dom: "#ffffff", kropka: "#10b981", ramka: "rgba(255,255,255,0.08)" },
  jasny: { tlo: "#ffffff", dom: "#10b981", kropka: "#ffffff", ramka: "rgba(15,23,42,0.08)" },
};

/** Sam znak na kafelku. `rozmiar` w pikselach. */
export function Znak({
  rozmiar = 28,
  wariant = "gradient",
  className,
}: {
  rozmiar?: number;
  wariant?: Wariant;
  className?: string;
}) {
  const k = KAFELKI[wariant];
  return (
    <span
      className={`inline-flex flex-shrink-0 items-center justify-center overflow-hidden ${className ?? ""}`}
      style={{
        width: rozmiar,
        height: rozmiar,
        borderRadius: rozmiar * 0.226,
        background: k.tlo,
        boxShadow: k.ramka ? `inset 0 0 0 1px ${k.ramka}` : undefined,
      }}
      aria-hidden="true"
    >
      <Dom dom={k.dom} kropka={k.kropka} />
    </span>
  );
}

/** Znak z napisem. `ton` to kolor napisu: jasny na ciemnym tle, ciemny na jasnym. */
export function Logo({
  rozmiar = 28,
  ton = "jasny",
  wariant = "gradient",
  className,
}: {
  rozmiar?: number;
  /** `dziedzicz` bierze kolor z otoczenia, np. ze zmiennej motywu strony. */
  ton?: "jasny" | "ciemny" | "dziedzicz";
  wariant?: Wariant;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center ${className ?? ""}`} style={{ gap: rozmiar * 0.36 }}>
      <Znak rozmiar={rozmiar} wariant={wariant} />
      <span
        className="font-semibold"
        style={{
          fontFamily: "var(--font-sora), var(--font-app), system-ui, sans-serif",
          fontSize: rozmiar * 0.64,
          letterSpacing: "-0.02em",
          lineHeight: 1,
          color: ton === "jasny" ? "#ffffff" : ton === "ciemny" ? "#0b1220" : "currentColor",
        }}
      >
        AgentSpace
      </span>
    </span>
  );
}
