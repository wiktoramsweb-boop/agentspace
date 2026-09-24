import Link from "next/link";
import { getDict, localeHref, toLocale } from "@/lib/i18n";

export function SiteFooter({ lang = "pl" }: { lang?: string }) {
  const locale = toLocale(lang);
  const t = getDict(locale).footer;
  const href = (path: string) => localeHref(locale, path);

  return (
    <footer className="border-t border-[var(--mk-hairline)] bg-[var(--color-mk-bg)] px-6 py-16">
      <div className="mx-auto max-w-6xl">
        {/* Top: brand + columns */}
        <div className="grid gap-12 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          {/* Brand */}
          <div>
            <Link href={href("/")} className="mb-4 flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inset-0 animate-ping rounded-full bg-emerald-500 opacity-75" />
                <span className="relative h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span className="text-lg font-semibold text-[var(--color-mk-text)]">AgentSpace</span>
            </Link>
            <p className="mb-6 max-w-xs text-sm leading-relaxed text-zinc-500">{t.tagline}</p>
            <p className="text-xs text-zinc-600">
              {t.madeIn.before}
              <span className="text-[var(--color-mk-muted)]">{t.madeIn.company}</span>
              {t.madeIn.after}
            </p>
          </div>

          {/* Columns */}
          {t.sections.map((section) => (
            <div key={section.title}>
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-300">
                {section.title}
              </h4>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={href(link.href)}
                      className="text-sm text-zinc-500 transition hover:text-emerald-400"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom: legal */}
        <div className="mt-12 space-y-2 border-t border-[var(--mk-hairline)] pt-8 text-xs text-zinc-600">
          <p>
            © 2026 AgentSpace ·{" "}
            <a href="https://agentspace.pl" className="hover:text-zinc-400">
              agentspace.pl
            </a>
          </p>
          <p>
            {t.operator} <span className="text-zinc-400">Spectra Nieruchomości</span>,
            ul. Zbożowa 2/1, 30-002 Kraków · NIP: 6772516327 · REGON: 529666353
          </p>
          <p>
            {t.contact}{" "}
            <a
              href="mailto:nieruchomoscispectra@gmail.com"
              className="hover:text-zinc-400"
            >
              nieruchomoscispectra@gmail.com
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
