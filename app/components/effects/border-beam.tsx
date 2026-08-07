"use client";

type BorderBeamProps = {
  size?: number;
  duration?: number;
  colorFrom?: string;
  colorTo?: string;
  delay?: number;
};

/**
 * BorderBeam — animowana świetlna linia okrążająca obwód karty.
 * Magic UI / Aceternity inspired.
 *
 * Wymaga rodzica z `position: relative` i `overflow: hidden`.
 */
export function BorderBeam({
  size = 250,
  duration = 8,
  colorFrom = "#10b981",
  colorTo = "#22d3ee",
  delay = 0,
}: BorderBeamProps) {
  return (
    <div
      className="pointer-events-none absolute inset-0 rounded-[inherit] [border:1px_solid_transparent] ![mask-clip:padding-box,border-box] ![mask-composite:intersect] [mask:linear-gradient(transparent,transparent),linear-gradient(white,white)]"
      style={
        {
          "--size": size,
          "--duration": `${duration}s`,
          "--anchor": "90",
          "--border-width": "1.5px",
          "--color-from": colorFrom,
          "--color-to": colorTo,
          "--delay": `-${delay}s`,
        } as React.CSSProperties
      }
    >
      <div
        className="absolute aspect-square animate-border-beam"
        style={{
          width: `${size}px`,
          offsetPath: `rect(0 auto auto 0 round ${size}px)`,
          background: `linear-gradient(to left, ${colorFrom}, ${colorTo}, transparent)`,
          animationDuration: `${duration}s`,
          animationDelay: `-${delay}s`,
        }}
      />
    </div>
  );
}
