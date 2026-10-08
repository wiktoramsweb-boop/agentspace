"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { RodzajDostepu } from "@/lib/portal-klienta";

/** Dolny pasek zakładek. Inny dla sprzedającego i dla kupującego. */
export function PortalNav({
  token,
  rodzaj,
  nowaWiadomosc,
}: {
  token: string;
  rodzaj: RodzajDostepu;
  nowaWiadomosc: boolean;
}) {
  const sciezka = usePathname();
  const base = `/klient/${token}`;

  const pozycje =
    rodzaj === "kupujacy"
      ? [
          { href: base, label: "Oferty", ikona: <IkonaSzukaj />, kropka: false },
          { href: `${base}/ulubione`, label: "Ulubione", ikona: <IkonaSerce />, kropka: false },
          { href: `${base}/terminy`, label: "Terminy", ikona: <IkonaKalendarz />, kropka: false },
          { href: `${base}/wiadomosci`, label: "Wiadomości", ikona: <IkonaCzat />, kropka: nowaWiadomosc },
          { href: `${base}/biuro`, label: "Biuro", ikona: <IkonaBiuro />, kropka: false },
        ]
      : [
          { href: base, label: "Moja sprawa", ikona: <IkonaDom />, kropka: false },
          { href: `${base}/kalendarz`, label: "Kalendarz", ikona: <IkonaKalendarz />, kropka: false },
          { href: `${base}/wiadomosci`, label: "Wiadomości", ikona: <IkonaCzat />, kropka: nowaWiadomosc },
          { href: `${base}/biuro`, label: "Biuro", ikona: <IkonaBiuro />, kropka: false },
        ];

  return (
    <nav className="portal-nav">
      <div>
        {pozycje.map((p) => (
          <Link key={p.href} href={p.href} aria-current={sciezka === p.href ? "page" : undefined}>
            {p.ikona}
            {p.kropka && <span className="kropka" aria-hidden="true" />}
            {p.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

function Ikona({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

function IkonaDom() {
  return <Ikona d="m3 10 9-7 9 7v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-9Z" />;
}
function IkonaKalendarz() {
  return <Ikona d="M7 3v3m10-3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" />;
}
function IkonaSzukaj() {
  return <Ikona d="m20 20-3.5-3.5M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14Z" />;
}
function IkonaSerce() {
  return <Ikona d="M12 20s-7-4.3-7-9.4A3.9 3.9 0 0 1 12 8a3.9 3.9 0 0 1 7 2.6C19 15.7 12 20 12 20Z" />;
}
function IkonaCzat() {
  return <Ikona d="M4 5h16a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H9l-5 4V6a1 1 0 0 1 1-1Z" />;
}
function IkonaBiuro() {
  return <Ikona d="M5 21V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v16M15 10h3a1 1 0 0 1 1 1v10M3 21h18M9 8h2M9 12h2M9 16h2" />;
}
