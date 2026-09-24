"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LOCALES, switchLocaleHref, type Locale } from "@/lib/i18n/config";

const LABELS: Record<Locale, string> = { pl: "PL", en: "EN" };
const TITLES: Record<Locale, string> = { pl: "Wersja polska", en: "English version" };

/**
 * Przełącznik języka - dwie pigułki obok przełącznika motywu.
 *
 * To zwykłe linki, nie przyciski: dzięki temu działa środkowy przycisk myszy,
 * a Google widzi obie wersje strony jako osobne adresy.
 */
export function LangSwitch({ lang }: { lang: Locale }) {
  const pathname = usePathname() ?? "/";

  return (
    <div
      className="flex items-center gap-[2px] rounded-full border border-[var(--mk-hairline)] bg-[var(--mk-surface-2)] p-[2px]"
      role="group"
      aria-label={lang === "pl" ? "Język strony" : "Site language"}
    >
      {LOCALES.map((code) => {
        const active = code === lang;
        return (
          <Link
            key={code}
            href={switchLocaleHref(pathname, code)}
            hrefLang={code}
            title={TITLES[code]}
            aria-current={active ? "true" : undefined}
            className={`flex h-7 min-w-8 items-center justify-center rounded-full px-2 text-[11px] font-semibold tracking-wide transition-colors ${
              active
                ? "bg-[var(--mk-surface-3)] text-[var(--color-mk-text)]"
                : "text-[var(--color-mk-muted)] hover:text-[var(--color-mk-text)]"
            }`}
          >
            {LABELS[code]}
          </Link>
        );
      })}
    </div>
  );
}
