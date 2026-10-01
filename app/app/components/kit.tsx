"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

// Wspólne „klocki" UI z obsługą AKCENTU koloru - moduły mają różnić się kolorystycznie,
// więc każdy komponent przyjmuje `accent`. Pełne klasy Tailwind (żeby się zbudowały).

/**
 * Jasne akcenty (bursztyn, turkus, błękit, fiolet, róż) mają ciemny napis -
 * biały dawał na nich 1,7-2,7:1. Kolor napisu zapisujemy wprost jako #101828,
 * a nie przez `text-slate-900`: tamtą klasę ciemny motyw zamienia na biel, bo
 * zwykle leży na jasnym tle. Tło przycisku jest stałe w obu motywach, więc
 * napis też musi być stały.
 */
const CIEMNY_NAPIS = "text-[#101828]";
// Fiolet jest wyjątkiem: na violet-500 nie przechodzi ani biały napis (3,9:1),
// ani ciemny (4,0:1). Dlatego tam schodzimy o stopień ciemniej z tłem.
export type Accent = "emerald" | "sky" | "violet" | "amber" | "rose" | "cyan";

const SOLID: Record<Accent, string> = {
  emerald: "bg-emerald-500 text-white hover:bg-emerald-400",
  sky: "bg-sky-400 text-[#101828] hover:bg-sky-300",
  violet: "bg-violet-600 text-white hover:bg-violet-500",
  amber: "bg-amber-400 text-[#101828] hover:bg-amber-300",
  rose: "bg-rose-500 text-[#101828] hover:bg-rose-400",
  cyan: "bg-cyan-400 text-[#101828] hover:bg-cyan-300",
};

const GRADIENT: Record<Accent, string> = {
  emerald: "bg-gradient-to-r from-emerald-400 to-cyan-400 text-white hover:brightness-110",
  sky: "bg-gradient-to-r from-sky-400 to-cyan-400 text-[#101828] hover:brightness-110",
  violet: "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:brightness-110",
  amber: "bg-gradient-to-r from-amber-400 to-orange-400 text-[#101828] hover:brightness-110",
  rose: "bg-gradient-to-r from-rose-500 to-pink-500 text-[#101828] hover:brightness-110",
  cyan: "bg-gradient-to-r from-cyan-400 to-emerald-400 text-[#101828] hover:brightness-110",
};

const ON: Record<Accent, string> = {
  emerald: "bg-emerald-500 text-white shadow-sm shadow-emerald-500/30",
  sky: "bg-sky-400 text-[#101828] shadow-sm shadow-sky-400/30",
  violet: "bg-violet-600 text-white shadow-sm shadow-violet-600/30",
  amber: "bg-amber-400 text-[#101828] shadow-sm shadow-amber-400/30",
  rose: "bg-rose-500 text-[#101828] shadow-sm shadow-rose-500/30",
  cyan: "bg-cyan-400 text-[#101828] shadow-sm shadow-cyan-400/30",
};

export function Button({
  accent = "emerald",
  variant = "solid",
  className,
  children,
  ...rest
}: {
  accent?: Accent;
  variant?: "solid" | "gradient" | "ghost";
  children: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60";
  const style =
    variant === "gradient" ? GRADIENT[accent] : variant === "ghost" ? "bg-slate-100 text-slate-800 hover:bg-slate-100" : SOLID[accent];
  return (
    <button className={`${base} ${style} ${className ?? ""}`} {...rest}>
      {children}
    </button>
  );
}

export type SegOption<T extends string> = { value: T; label: string; icon?: ReactNode };

export function SegmentedToggle<T extends string>({
  value,
  onChange,
  options,
  accent = "emerald",
  className,
}: {
  value: T;
  onChange: (v: T) => void;
  options: SegOption<T>[];
  accent?: Accent;
  className?: string;
}) {
  return (
    <div className={`inline-flex rounded-xl border border-slate-200 bg-white p-1 ${className ?? ""}`}>
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            aria-pressed={active}
            className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3.5 py-1.5 text-sm font-medium transition ${
              active ? ON[accent] : "text-slate-500 hover:text-slate-900"
            }`}
          >
            {o.icon}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
