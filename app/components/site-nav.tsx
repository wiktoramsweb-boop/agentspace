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
 * UWAGA: żaden rodzic tego elementu nie może mieć `transform` —
 * transform tworzy nowy kontekst kompozycji i zabija backdrop-filter
 * (pasek przestaje być matowy, robi się płaski).
 */
export function SiteNav() {
  return (
    <header className="fixed inset-x-0 top-0 z-40 h-[68px]">
      <div
        aria-hidden="true"
        className="absolute inset-0 border-b border-white/[0.08] bg-[rgba(10,10,10,0.55)] backdrop-blur-lg"
      />

      <nav className="relative mx-auto flex h-full max-w-[1080px] items-center justify-between gap-4 px-6">
        <Link
          href="/"
          className="text-[0.9375rem] font-medium tracking-tight text-[var(--color-mk-text)] transition-opacity hover:opacity-80"
        >
          AgentSpace
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-3 py-2 text-sm font-medium text-[rgba(255,242,234,0.72)] transition-colors hover:text-[var(--color-mk-text)]"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="hidden rounded-full px-3 py-2 text-sm font-medium text-[rgba(255,242,234,0.72)] transition-colors hover:text-[var(--color-mk-text)] sm:block"
          >
            Zaloguj
          </Link>
          <Link
            href="/kontakt"
            className="inline-flex h-9 items-center rounded-full bg-[var(--color-mk-accent)] px-4 text-sm font-medium text-white transition-colors hover:bg-[#2560e0]"
          >
            Umów rozmowę
          </Link>
        </div>
      </nav>
    </header>
  );
}
