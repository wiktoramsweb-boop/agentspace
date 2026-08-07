import Link from "next/link";
import type { ReactNode } from "react";

/** Etykieta nad nagłówkiem sekcji. */
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
    <section id={id} className={`px-6 py-20 md:py-28 ${className}`}>
      <div className="mx-auto max-w-[1080px]">{children}</div>
    </section>
  );
}

/** Nagłówek sekcji — wyśrodkowany, z etykietą i opcjonalnym podtytułem. */
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
      className={`flex flex-col gap-4 ${
        centered ? "items-center text-center" : "items-start text-left"
      } ${centered ? "mx-auto max-w-2xl" : "max-w-2xl"}`}
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

type ButtonProps = {
  href: string;
  children: ReactNode;
  variant?: "primary" | "ghost";
  className?: string;
};

/**
 * Przycisk. Dwa warianty, zero gradientów i shimmerów — tylko kolor i stan.
 */
export function Button({
  href,
  children,
  variant = "primary",
  className = "",
}: ButtonProps) {
  const base =
    "inline-flex h-14 items-center justify-center rounded-full px-8 text-[1.0625rem] font-medium transition-colors duration-200";

  const styles =
    variant === "primary"
      ? "bg-[var(--color-mk-accent)] text-white hover:bg-[#2560e0]"
      : "border border-[var(--color-mk-line)] text-[var(--color-mk-text)] hover:border-[#3a322d] hover:bg-white/[0.03]";

  const isInternal = href.startsWith("/") || href.startsWith("#");
  const cls = `${base} ${styles} ${className}`;

  if (isInternal && !href.startsWith("#")) {
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

/** Znacznik listy — cienki, nie emoji-check. */
export function Tick({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={`mt-[3px] h-4 w-4 flex-shrink-0 text-[var(--color-mk-accent)] ${className}`}
      viewBox="0 0 20 20"
      fill="none"
    >
      <path
        d="M3.3 10.8 7.5 15 16.7 5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
