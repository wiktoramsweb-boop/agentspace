"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const IKONY = {
  dom: "m3 10 9-7 9 7v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-9Z",
  kasa: "M4 7h16a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1Zm8 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
  klucz: "M14.7 6.3a4 4 0 0 0-5.2 5.2L3 18v3h3l6.5-6.5a4 4 0 0 0 5.2-5.2l-2.5 2.5-2.5-2.5 2.5-2.5Z",
  dok: "M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Zm0 0v5h5",
  czat: "M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9l-5 4v-4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z",
};

export function NawigacjaWlasciciela({ token, nowa }: { token: string; nowa: boolean }) {
  const sciezka = usePathname();
  const b = `/wlasciciel/${token}`;
  const pozycje = [
    { href: b, label: "Pulpit", d: IKONY.dom, kropka: false },
    { href: `${b}/rozliczenia`, label: "Rozliczenia", d: IKONY.kasa, kropka: false },
    { href: `${b}/usterki`, label: "Usterki", d: IKONY.klucz, kropka: false },
    { href: `${b}/dokumenty`, label: "Dokumenty", d: IKONY.dok, kropka: false },
    { href: `${b}/wiadomosci`, label: "Wiadomości", d: IKONY.czat, kropka: nowa },
  ];
  return (
    <nav className="portal-nav">
      <div>
        {pozycje.map((p) => (
          <Link key={p.href} href={p.href} aria-current={sciezka === p.href ? "page" : undefined}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d={p.d} />
            </svg>
            {p.kropka && sciezka !== p.href && <span className="kropka" aria-hidden="true" />}
            {p.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
