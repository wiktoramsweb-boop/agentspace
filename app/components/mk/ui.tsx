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
    <section id={id} className={`mk-sekcja relative px-6 py-16 md:px-10 md:py-24 ${className}`}>
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

/** Przycisk marketingu: pigułka w kolorze marki z falą pod kursorem. */
export function Button({
  href,
  children,
  variant = "primary",
  className = "",
}: ButtonProps) {
  // Ten sam przycisk co na stronie głównej (style w ld/podstrony.css).
  const cls = `mk-btn${variant === "primary" ? "" : " mk-btn--duch"} ${className}`;

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
