import Link from "next/link";

const NAV_LINKS = [
  { href: "/#moduly", label: "Produkt" },
  { href: "/integracje", label: "Integracje" },
  { href: "/cennik", label: "Cennik" },
  { href: "/blog", label: "Blog" },
  { href: "/o-nas", label: "O nas" },
];

/**
 * Górna nawigacja marketingu.
 *
 * UWAGA: żaden rodzic tego elementu nie może mieć `transform` -
 * transform tworzy nowy kontekst kompozycji i zabija backdrop-filter
 * (pasek przestaje być matowy, robi się płaski).
 */
export function SiteNav() {
  return (
    <header className="fixed inset-x-0 top-0 z-40 h-[68px]">
      <div
        aria-hidden="true"
        className="absolute inset-0 border-b border-white/[0.07] bg-[rgba(8,9,11,0.6)] backdrop-blur-xl"
      />

      <nav className="relative mx-auto flex h-full max-w-[1080px] items-center justify-between gap-4 px-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-[0.9375rem] font-semibold tracking-tight text-[var(--color-mk-text)] transition-opacity hover:opacity-80"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400 opacity-70" />
            <span className="relative h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_1px_rgba(16,185,129,0.9)]" />
          </span>
          AgentSpace
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-3 py-2 text-sm font-medium text-[rgba(244,247,246,0.7)] transition-colors hover:bg-white/[0.05] hover:text-[var(--color-mk-text)]"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="hidden rounded-full px-3 py-2 text-sm font-medium text-[rgba(244,247,246,0.7)] transition-colors hover:text-[var(--color-mk-text)] sm:block"
          >
            Zaloguj
          </Link>
          <Link
            href="/kontakt"
            className="inline-flex h-9 items-center rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 px-4 text-sm font-semibold text-zinc-950 shadow-[0_6px_20px_-8px_rgba(16,185,129,0.9)] transition-all hover:shadow-[0_10px_28px_-8px_rgba(16,185,129,1)] hover:brightness-110"
          >
            Umów rozmowę
          </Link>
        </div>
      </nav>
    </header>
  );
}
