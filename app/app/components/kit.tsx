"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

// Wspólne „klocki" UI z obsługą AKCENTU koloru - moduły mają różnić się kolorystycznie,
// więc każdy komponent przyjmuje `accent`. Pełne klasy Tailwind (żeby się zbudowały).

export type Accent = "emerald" | "sky" | "violet" | "amber" | "rose" | "cyan";

const SOLID: Record<Accent, string> = {
  emerald: "bg-emerald-500 text-zinc-950 hover:bg-emerald-400",
  sky: "bg-sky-400 text-zinc-950 hover:bg-sky-300",
  violet: "bg-violet-500 text-white hover:bg-violet-400",
  amber: "bg-amber-400 text-zinc-950 hover:bg-amber-300",
  rose: "bg-rose-500 text-white hover:bg-rose-400",
  cyan: "bg-cyan-400 text-zinc-950 hover:bg-cyan-300",
};

const GRADIENT: Record<Accent, string> = {
  emerald: "bg-gradient-to-r from-emerald-400 to-cyan-400 text-zinc-950 hover:brightness-110",
  sky: "bg-gradient-to-r from-sky-400 to-cyan-400 text-zinc-950 hover:brightness-110",
  violet: "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white hover:brightness-110",
  amber: "bg-gradient-to-r from-amber-400 to-orange-400 text-zinc-950 hover:brightness-110",
  rose: "bg-gradient-to-r from-rose-500 to-pink-500 text-white hover:brightness-110",
  cyan: "bg-gradient-to-r from-cyan-400 to-emerald-400 text-zinc-950 hover:brightness-110",
};

const ON: Record<Accent, string> = {
  emerald: "bg-emerald-500 text-zinc-950 shadow-sm shadow-emerald-500/30",
  sky: "bg-sky-400 text-zinc-950 shadow-sm shadow-sky-400/30",
  violet: "bg-violet-500 text-white shadow-sm shadow-violet-500/30",
  amber: "bg-amber-400 text-zinc-950 shadow-sm shadow-amber-400/30",
  rose: "bg-rose-500 text-white shadow-sm shadow-rose-500/30",
  cyan: "bg-cyan-400 text-zinc-950 shadow-sm shadow-cyan-400/30",
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
    variant === "gradient" ? GRADIENT[accent] : variant === "ghost" ? "bg-zinc-800/60 text-zinc-200 hover:bg-zinc-800" : SOLID[accent];
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
    <div className={`inline-flex rounded-xl border border-zinc-800 bg-zinc-900/70 p-1 ${className ?? ""}`}>
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            aria-pressed={active}
            className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3.5 py-1.5 text-sm font-medium transition ${
              active ? ON[accent] : "text-zinc-400 hover:text-white"
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
