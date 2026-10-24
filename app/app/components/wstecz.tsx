"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

const KLUCZ = "as_trasa";

function trasa(): string[] {
  try {
    return JSON.parse(sessionStorage.getItem(KLUCZ) ?? "[]") as string[];
  } catch {
    return [];
  }
}

/**
 * Zapamiętuje strony odwiedzone w tej karcie przeglądarki. Dzięki temu
 * „wróć” wie, czy agent przyszedł z innego miejsca w aplikacji (wtedy cofamy
 * go dokładnie tam), czy wszedł z linku z zewnątrz (wtedy idziemy do listy).
 */
export function SledzenieTrasy() {
  const sciezka = usePathname();
  useEffect(() => {
    const t = trasa();
    if (t[t.length - 1] === sciezka) return;
    try {
      sessionStorage.setItem(KLUCZ, JSON.stringify([...t, sciezka].slice(-30)));
    } catch {
      /* tryb prywatny: „wróć” zadziała jak zwykły link */
    }
  }, [sciezka]);
  return null;
}

/**
 * Link „← Lista”, który cofa do poprzedniego miejsca w aplikacji, jak strzałka
 * w telefonie. Wcześniej zawsze prowadził na listę: agent wchodził w ofertę
 * z pulpitu, a „wróć” wyrzucał go na listę ofert zamiast z powrotem na pulpit.
 */
export function Wstecz({ href, children }: { href: string; className?: string; children: React.ReactNode }) {
  const router = useRouter();
  const sciezka = usePathname();
  // Strzałkę rysujemy sami: stare etykiety miały „← ” w tekście.
  const etykieta = typeof children === "string" ? children.replace(/^\s*←\s*/, "") : children;
  return (
    <Link
      href={href}
      className="print-hide group mb-5 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1.5 pl-1.5 pr-4 text-sm font-medium text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
      onClick={(e) => {
        const t = trasa();
        const poprzednia = t.length >= 2 ? t[t.length - 2] : null;
        if (!poprzednia || poprzednia === sciezka || e.metaKey || e.ctrlKey) return;
        e.preventDefault();
        router.back();
      }}
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 transition group-hover:-translate-x-0.5 group-hover:bg-slate-200">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </span>
      {etykieta}
    </Link>
  );
}
