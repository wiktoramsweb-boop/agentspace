"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { HEADER_ACCENT, HEADER_TILE, navItemFor } from "./nav-meta";

/**
 * Nagłówek ekranu.
 *
 * Sam tytuł na pustym tle wyglądał jak surowy tekst wklejony nad treść. Teraz
 * po lewej stoi kafelek z ikoną modułu, a etykieta i kreska pod tytułem biorą
 * kolor tego samego modułu. Ikonę i kolor czytamy z `nav-meta.tsx`, czyli z tej
 * samej listy co menu boczne - dzięki temu Kalendarz ma wszędzie tę samą ikonę
 * i ten sam błękit, bez ustawiania czegokolwiek na każdym ekranie osobno.
 */
export function PageHeader({
  title,
  subtitle,
  action,
  eyebrow,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  eyebrow?: string;
}) {
  const pathname = usePathname() ?? "";
  const item = navItemFor(pathname);
  const color = item?.color ?? "slate";
  const accent = HEADER_ACCENT[color];
  // Etykieta nad tytułem: podana wprost, a jak nie, to nazwa modułu z menu.
  // Pomijamy ją, gdy powtarzałaby tytuł.
  const label =
    eyebrow ?? (item && item.label !== String(title) ? item.label : undefined);

  return (
    <header className="mb-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3.5 sm:gap-4">
          <span
            aria-hidden="true"
            className={`mt-0.5 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl ${HEADER_TILE[color]}`}
          >
            {item?.icon ?? <FallbackIcon />}
          </span>

          <div className="min-w-0">
            {label && (
              <p className={`mb-1.5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] ${accent.text}`}>
                <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${accent.bar}`} />
                {label}
              </p>
            )}

            <h1 className="text-[1.75rem] font-semibold leading-[1.15] tracking-[-0.022em] text-slate-900 md:text-[2rem]">
              {title}
            </h1>

            {subtitle && (
              <p className="mt-2 max-w-2xl text-[0.9375rem] leading-relaxed text-slate-500">{subtitle}</p>
            )}
          </div>
        </div>

        {action && <div className="flex-shrink-0 sm:pt-1">{action}</div>}
      </div>

      {/* Kreska z krótkim akcentem w kolorze modułu: daje nagłówkowi oparcie
          i oddziela go od treści, bez rysowania pełnej ramki. */}
      <div aria-hidden="true" className="mt-5 flex items-center gap-0">
        <span className={`h-0.5 w-10 rounded-full ${accent.bar}`} />
        <span className="h-px flex-1 bg-slate-200" />
      </div>
    </header>
  );
}

/** Ekrany spoza menu (np. karta pojedynczego dokumentu). */
function FallbackIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z"
      />
    </svg>
  );
}
