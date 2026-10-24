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
export function Wstecz({ href, className, children }: { href: string; className?: string; children: React.ReactNode }) {
  const router = useRouter();
  const sciezka = usePathname();
  return (
    <Link
      href={href}
      className={className}
      onClick={(e) => {
        const t = trasa();
        const poprzednia = t.length >= 2 ? t[t.length - 2] : null;
        if (!poprzednia || poprzednia === sciezka || e.metaKey || e.ctrlKey) return;
        e.preventDefault();
        router.back();
      }}
    >
      {children}
    </Link>
  );
}
