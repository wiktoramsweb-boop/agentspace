import Link from "next/link";

const NAV_LINKS = [
  { href: "/blog", label: "Blog" },
  { href: "/cennik", label: "Cennik" },
  { href: "/o-nas", label: "O nas" },
  { href: "/kontakt", label: "Kontakt" },
];

/**
 * Top nav dla podstron (NIE landing — tam jest StickyNav z innym zachowaniem).
 */
export function SiteNav() {
  return (
    <nav className="fixed inset-x-0 top-0 z-40 border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="flex items-center gap-2 transition hover:opacity-80">
          <span className="relative flex h-2 w-2">
            <span className="absolute inset-0 animate-ping rounded-full bg-emerald-500 opacity-75" />
            <span className="relative h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="font-semibold text-white">AgentSpace</span>
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-zinc-400 transition hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="hidden text-sm text-zinc-400 transition hover:text-white sm:block"
          >
            Zaloguj
          </Link>
          <Link
            href="/#waitlist"
            className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-400"
          >
            Lista oczekujących
          </Link>
        </div>
      </div>
    </nav>
  );
}
