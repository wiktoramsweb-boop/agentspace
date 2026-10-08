"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { RodzajDostepu } from "@/lib/portal-klienta";

/** Dolny pasek zakładek. Inny dla sprzedającego i dla kupującego. */
export function PortalNav({ token, rodzaj }: { token: string; rodzaj: RodzajDostepu }) {
  const sciezka = usePathname();
  const base = `/klient/${token}`;

  const pozycje =
    rodzaj === "kupujacy"
      ? [
          { href: base, label: "Oferty", ikona: <IkonaSzukaj /> },
          { href: `${base}/terminy`, label: "Terminy", ikona: <IkonaKalendarz /> },
        ]
      : [
          { href: base, label: "Moje nieruchomości", ikona: <IkonaDom /> },
          { href: `${base}/kalendarz`, label: "Kalendarz", ikona: <IkonaKalendarz /> },
        ];

  return (
    <nav className="portal-nav">
      <div>
        {pozycje.map((p) => (
          <Link
            key={p.href}
            href={p.href}
            aria-current={sciezka === p.href ? "page" : undefined}
          >
            {p.ikona}
            {p.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

function IkonaDom() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m3 10 9-7 9 7v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-9Z" />
    </svg>
  );
}
function IkonaKalendarz() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 3v3m10-3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" />
    </svg>
  );
}
function IkonaSzukaj() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m20 20-3.5-3.5M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14Z" />
    </svg>
  );
}
