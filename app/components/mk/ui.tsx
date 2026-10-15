import Link from "next/link";
import type { ReactNode } from "react";

/** Krótka etykieta nad nagłówkiem sekcji. */
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

/** Nagłówek sekcji - z etykietą i opcjonalnym podtytułem. */
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
 * `accent` podświetla ją na stałe - dla polecanego pakietu albo głównego CTA.
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
 * Przycisk. Jednolity kolor marki, bez poświaty i połysku: główne wezwanie
 * ma się wyróżniać kontrastem i miejscem na stronie, nie efektem.
 */
export function Button({
  href,
  children,
  variant = "primary",
  className = "",
}: ButtonProps) {
  const base =
    "inline-flex h-12 items-center justify-center rounded-xl px-6 text-[1rem] font-semibold transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-mk-accent)]";
  const styles =
    variant === "primary"
      ? "bg-[var(--color-mk-accent)] text-[var(--mk-on-accent)] hover:bg-[var(--mk-accent-text)]"
      : "border border-[var(--mk-hairline-strong)] bg-[var(--mk-card-bg)] text-[var(--color-mk-text)] hover:border-[var(--color-mk-text)]";
  const cls = `${base} ${styles} ${className}`;

  if (href.startsWith("/")) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} className={cls}>
      {children}
    </a>
  );
}

/** Znacznik listy w kolorze marki. */
export function Tick({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center ${className}`}
    >
      <svg className="h-4 w-4 text-[var(--color-mk-accent)]" viewBox="0 0 20 20" fill="none">
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
