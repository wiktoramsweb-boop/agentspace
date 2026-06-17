import Link from "next/link";

const FOOTER_SECTIONS = [
  {
    title: "Produkt",
    links: [
      { href: "/", label: "Strona główna" },
      { href: "/cennik", label: "Cennik" },
      { href: "/demo", label: "Demo" },
      { href: "/dla-agentow", label: "Dla agentów" },
      { href: "/dla-wlascicieli", label: "Dla właścicieli biur" },
    ],
  },
  {
    title: "Wiedza",
    links: [
      { href: "/blog", label: "Blog" },
      { href: "/o-nas", label: "O AgentSpace" },
      { href: "/kontakt", label: "Kontakt" },
    ],
  },
  {
    title: "Prawne",
    links: [
      { href: "/polityka-prywatnosci", label: "Polityka prywatności" },
      { href: "/regulamin", label: "Regulamin" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-zinc-900 bg-zinc-950 px-6 py-16">
      <div className="mx-auto max-w-6xl">
        {/* Top: brand + columns */}
        <div className="grid gap-12 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          {/* Brand */}
          <div>
            <Link href="/" className="mb-4 flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inset-0 animate-ping rounded-full bg-emerald-500 opacity-75" />
                <span className="relative h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span className="text-lg font-semibold text-white">AgentSpace</span>
            </Link>
            <p className="mb-6 max-w-xs text-sm leading-relaxed text-zinc-500">
              Polska platforma do szkolenia agentów nieruchomości z AI Coachem. Start Q1 2026.
            </p>
            <p className="text-xs text-zinc-600">
              Klient zero: <span className="text-zinc-400">Spectra Nieruchomości</span>,
              Kraków
            </p>
          </div>

          {/* Columns */}
          {FOOTER_SECTIONS.map((section) => (
            <div key={section.title}>
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-300">
                {section.title}
              </h4>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
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
        <div className="mt-12 space-y-2 border-t border-zinc-900 pt-8 text-xs text-zinc-600">
          <p>
            © 2026 AgentSpace ·{" "}
            <a href="https://agentspace.pl" className="hover:text-zinc-400">
              agentspace.pl
            </a>
          </p>
          <p>
            Operator: <span className="text-zinc-400">Spectra Nieruchomości</span>,
            ul. Zbożowa 2/1, 30-002 Kraków · NIP: 6772516327 · REGON: 529666353
          </p>
          <p>
            Kontakt:{" "}
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
