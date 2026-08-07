import Link from "next/link";
import type { ReactNode } from "react";

/** Etykieta nad nagłówkiem sekcji (pigułka z pulsującą kropką). */
export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="mk-eyebrow">{children}</p>;
}

/** Sekcja o jednolitym rytmie pionowym + kontener. */
export function Section({
  children,
  id,
  className = "",
}: {
  children: ReactNode;
  id?: string;
  className?: string;
}) {
  return (
    <section id={id} className={`relative px-6 py-16 md:py-20 ${className}`}>
      <div className="mx-auto max-w-[1120px]">{children}</div>
    </section>
  );
}

/** Nagłówek sekcji — z etykietą i opcjonalnym podtytułem. */
export function SectionHead({
  eyebrow,
  title,
  lead,
  align = "center",
}: {
  eyebrow?: string;
  title: ReactNode;
  lead?: ReactNode;
  align?: "center" | "left";
}) {
  const centered = align === "center";
  return (
    <div
      className={`flex flex-col gap-5 ${
        centered ? "mx-auto max-w-2xl items-center text-center" : "max-w-2xl items-start text-left"
      }`}
    >
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <h2>{title}</h2>
      {lead ? (
        <p className="text-[1.0625rem] leading-relaxed text-[var(--color-mk-muted)]">
          {lead}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Karta treści. Gradient + obramowanie ożywające pod kursorem (`.mk-card`).
 * `accent` podświetla ją na stałe — dla polecanego pakietu albo głównego CTA.
 */
export function Card({
  children,
  className = "",
  accent = false,
}: {
  children: ReactNode;
  className?: string;
  accent?: boolean;
}) {
  return (
    <div className={`mk-card${accent ? " mk-card-accent" : ""} ${className}`}>
      {children}
    </div>
  );
}

type ButtonProps = {
  href: string;
  children: ReactNode;
  variant?: "primary" | "ghost";
  className?: string;
};

/**
 * Przycisk.
 * `primary` ma gradient marki + poświatę, która rośnie przy najechaniu,
 * oraz przesuwający się połysk (`.mk-sheen`) — to jedyne miejsce, gdzie
 * pozwalamy sobie na tak wyraźny efekt, bo to najważniejszy element strony.
 */
export function Button({
  href,
  children,
  variant = "primary",
  className = "",
}: ButtonProps) {
  const base =
    "group relative inline-flex h-14 items-center justify-center overflow-hidden rounded-full px-8 text-[1.0625rem] font-semibold transition-all duration-300";

  const styles =
    variant === "primary"
      ? "text-zinc-950 shadow-[0_10px_36px_-12px_rgba(16,185,129,0.75)] hover:shadow-[0_16px_50px_-12px_rgba(16,185,129,0.95)] hover:-translate-y-0.5"
      : "border border-white/12 bg-white/[0.03] font-medium text-[var(--color-mk-text)] backdrop-blur-sm hover:border-emerald-400/40 hover:bg-white/[0.06] hover:-translate-y-0.5";

  const isInternalRoute = href.startsWith("/");
  const cls = `${base} ${styles} ${className}`;

  const inner = (
    <>
      {variant === "primary" ? (
        <span
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-r from-emerald-400 via-emerald-400 to-cyan-400"
        />
      ) : null}
      {/* Połysk przejeżdżający przy hoverze */}
      <span
        aria-hidden="true"
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full"
      />
      <span className="relative z-10">{children}</span>
    </>
  );

  if (isInternalRoute) {
    return (
      <Link href={href} className={cls}>
        {inner}
      </Link>
    );
  }

  return (
    <a href={href} className={cls}>
      {inner}
    </a>
  );
}

/** Znacznik listy w kolorze marki. */
export function Tick({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/12 ring-1 ring-emerald-500/25 ${className}`}
    >
      <svg className="h-3 w-3 text-emerald-400" viewBox="0 0 20 20" fill="none">
        <path
          d="M4 10.5 8 14.5 16 5.5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
