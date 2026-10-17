import "./strona.css";
import "./podstrony.css";
import Link from "next/link";
import { getDict, localeHref, toLocale } from "@/lib/i18n";
import { kategorieZModulami } from "@/lib/marketing/modules";
import { NavRuch } from "./nav-ruch";

/**
 * Wspólna rama strony: nawigacja i stopka w nowym stylu.
 * Używa jej strona główna i każda podstrona (przez SiteNav i SiteFooter),
 * żeby po kliknięciu w menu nie lądować w starym wyglądzie.
 */

type Link_ = { label: string; href: string };

function teksty(lang: "pl" | "en") {
  const en = lang === "en";
  return {
    produkt: en ? "Product" : "Produkt",
    linki: [
      { label: "AI Coach", href: "/produkt/ai-coach" },
      { label: en ? "Agency websites" : "Strony www", href: "/wzory" },
      { label: en ? "Pricing" : "Cennik", href: "/cennik" },
      { label: "Blog", href: "/blog" },
      { label: en ? "About" : "O nas", href: "/o-nas" },
    ] as Link_[],
    wszystkie: en ? "All modules" : "Wszystkie moduły",
    login: en ? "Log in" : "Zaloguj się",
    cta: en ? "Try it free" : "Wypróbuj za darmo",
    menu: en ? "Open menu" : "Otwórz menu",
    zamknij: en ? "Close menu" : "Zamknij menu",
    kolumny: [
      {
        tytul: en ? "Product" : "Produkt",
        linki: [
          { label: en ? "All modules" : "Wszystkie moduły", href: "/produkt" },
          { label: "AI Coach", href: "/produkt/ai-coach" },
          { label: en ? "Agency websites" : "Strony www dla biur", href: "/wzory" },
          { label: en ? "Integrations" : "Integracje", href: "/integracje" },
          { label: en ? "Pricing" : "Cennik", href: "/cennik" },
          { label: "Demo", href: "/demo" },
        ],
      },
      {
        tytul: en ? "Who it's for" : "Dla kogo",
        linki: [
          { label: en ? "Agents" : "Dla agentów", href: "/dla-agentow" },
          { label: en ? "Agency owners" : "Dla właścicieli biur", href: "/dla-wlascicieli" },
          { label: "Blog", href: "/blog" },
          { label: en ? "About" : "O AgentSpace", href: "/o-nas" },
          { label: en ? "Contact" : "Kontakt", href: "/kontakt" },
        ],
      },
      {
        tytul: en ? "Legal" : "Prawne",
        linki: [
          { label: en ? "Privacy policy" : "Polityka prywatności", href: "/polityka-prywatnosci" },
          { label: en ? "Terms" : "Regulamin", href: "/regulamin" },
          { label: en ? "Data processing agreement" : "Umowa powierzenia danych", href: "/umowa-powierzenia" },
        ],
      },
    ],
    pas: en
      ? ["Calls", "Viewings", "Contracts", "Commissions", "Training", "Agency results"]
      : ["Telefony", "Prezentacje", "Umowy", "Prowizje", "Trening", "Wynik biura"],
    gora: en ? "Back to top" : "Wróć na górę strony",
    jezyk: en ? { label: "Polski", href: "/" } : { label: "English", href: "/en" },
  };
}

/** Znak marki: kafelek z gradientem i dom z kropką (ta sama geometria co w lib marki). */
export function Kafel({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <linearGradient id="ld-kafel" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#10b981" />
          <stop offset="1" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" rx="22.6" fill="url(#ld-kafel)" />
      <g transform="translate(50 50) scale(0.91) translate(-50 -50)">
        <g transform="translate(0 -2.15)">
          <path d="M 50 29.3 L 80.5 54 L 72.3 54 L 72.3 76.6 L 60.6 76.6 L 60.6 59.9 L 39.6 59.9 L 39.6 76.6 L 27.9 76.6 L 27.9 54 L 19.5 54 Z" fill="#0b1220" stroke="#0b1220" strokeWidth={6} strokeLinejoin="round" />
          <circle cx="50" cy="27.6" r="2.9" fill="#ffffff" />
        </g>
      </g>
    </svg>
  );
}

function Strzalka() {
  return (
    <svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export function LdNav({ lang = "pl" }: { lang?: string }) {
  const locale = toLocale(lang);
  const t = teksty(locale);
  const href = (p: string) => localeHref(locale, p);
  const kategorie = kategorieZModulami(locale);

  return (
    <>
      <NavRuch />
      <div className="ld-poswiata" data-poswiata aria-hidden="true" />
      <header className="ld-nav" data-nav>
        <Link href={href("/")} className="ld-logo" aria-label="AgentSpace">
          <Kafel className="ld-logo__kafel" />
          <span className="ld-logo__napis">AgentSpace</span>
        </Link>
        <nav className="ld-nav__linki" aria-label={locale === "en" ? "Main" : "Główna"}>
          <div className="ld-rozw">
            <Link href={href("/produkt")} className="ld-rozw__guzik">
              {t.produkt}
              <svg viewBox="0 0 12 12" aria-hidden="true">
                <path d="M3 4.5 6 7.5l3-3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </Link>
            {/* Panel otwiera się na hover i na fokus z klawiatury, bez JS. */}
            <div className="ld-rozw__panel">
              <div className="ld-rozw__siatka">
                {kategorie.map((k) => (
                  <div key={k.id}>
                    <b>{k.label}</b>
                    <ul>
                      {k.moduly.map((m) => (
                        <li key={m.slug}>
                          <Link href={href(`/produkt/${m.slug}`)}>{m.name}</Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              <Link href={href("/produkt")} className="ld-rozw__wszystkie">
                {t.wszystkie}
                <Strzalka />
              </Link>
            </div>
          </div>
          {t.linki.map((l) => (
            <Link key={l.href} href={href(l.href)}>
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="ld-nav__akcje">
          <Link className="ld-nav__login" href="/login">
            {t.login}
          </Link>
          <Link className="ld-btn" data-magnes href="/signup">
            {t.cta}
          </Link>
          <button className="ld-burger" data-burger aria-label={t.menu} data-label-otworz={t.menu} data-label-zamknij={t.zamknij} aria-expanded="false" aria-controls="ld-menu">
            <svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" aria-hidden="true">
              <path d="M4 9h16M4 15h16" />
            </svg>
          </button>
        </div>
      </header>
      <div className="ld-menu" id="ld-menu" data-menu>
        <nav aria-label="Menu">
          <Link href={href("/produkt")}>{t.produkt}</Link>
          {t.linki.map((l) => (
            <Link key={l.href} href={href(l.href)}>
              {l.label}
            </Link>
          ))}
          <Link href={href("/kontakt")}>{locale === "en" ? "Contact" : "Kontakt"}</Link>
        </nav>
        <div className="ld-menu__akcje">
          <Link className="ld-btn ld-btn--duzy" href="/signup">
            {t.cta}
          </Link>
          <Link className="ld-btn ld-btn--duch ld-btn--duzy" href="/login">
            {t.login}
          </Link>
        </div>
      </div>
    </>
  );
}

export function LdStopka({ lang = "pl" }: { lang?: string }) {
  const locale = toLocale(lang);
  const t = teksty(locale);
  const dict = getDict(locale);
  const href = (p: string) => localeHref(locale, p);
  // Dwa komplety słów, żeby pas przesuwał się bez szwu (animacja o -50%).
  const pas = [...t.pas, ...t.pas];

  return (
    <footer className="ld-stopka">
      <div className="ld-stopka__pas" aria-hidden="true">
        <div className="ld-stopka__tasma">
          {pas.map((s, i) => (
            <span key={i}>
              {s}
              <i />
            </span>
          ))}
        </div>
      </div>
      <div className="ld-stopka__gora">
        <div>
          <Link href={href("/")} className="ld-logo" aria-label="AgentSpace">
            <Kafel className="ld-logo__kafel" />
            <span className="ld-logo__napis">AgentSpace</span>
          </Link>
          <p>{dict.footer.tagline}</p>
          <address className="ld-stopka__firma">
            <b>Spectra Nieruchomości</b>
            ul. Zbożowa 2/1, 30-002 Kraków
            <br />
            NIP 6772516327 · REGON 529666353
            <br />
            <a href="mailto:nieruchomoscispectra@gmail.com">nieruchomoscispectra@gmail.com</a>
          </address>
        </div>
        {t.kolumny.map((s) => (
          <div key={s.tytul}>
            <h4>{s.tytul}</h4>
            <ul>
              {s.linki.map((l) => (
                <li key={l.href}>
                  <Link href={href(l.href)}>{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="ld-stopka__dol">
        <span>© 2026 AgentSpace · agentspace.pl</span>
        <span>
          {dict.footer.madeIn.before}
          {dict.footer.madeIn.company}
          {dict.footer.madeIn.after}
        </span>
        <Link href={t.jezyk.href} className="ld-stopka__jezyk" hrefLang={locale === "en" ? "pl" : "en"}>
          {t.jezyk.label}
        </Link>
        <a className="ld-gora" href="#top" aria-label={t.gora} data-magnes>
          <svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 19V5M6 11l6-6 6 6" />
          </svg>
        </a>
      </div>
    </footer>
  );
}
