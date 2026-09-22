"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useFavorites, HeartIcon } from "./favorites";

export type NavLink = { href: string; label: string };

/**
 * Nagłówek wzoru. Ten sam komponent w każdym wzorze, ale kolory, font i
 * kształty bierze z motywu, więc za każdym razem wygląda inaczej.
 */
export function WzNav({
  base,
  office,
  sub,
  links,
  more = [],
  phone,
  cta,
}: {
  base: string;
  office: React.ReactNode;
  sub?: string;
  links: NavLink[];
  /** Pozycje schowane pod „Więcej", żeby pasek nie puchł do dziesięciu linków. */
  more?: NavLink[];
  phone: string;
  cta?: string;
}) {
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const path = usePathname();
  const { ids } = useFavorites(base);

  useEffect(() => {
    const on = () => setSolid(window.scrollY > 24);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  useEffect(() => {
    setOpen(false);
    setMoreOpen(false);
  }, [path]);

  return (
    <header className={`wzn${solid ? " is-solid" : ""}${open ? " is-open" : ""}`}>
      <Link href={`${base}`} className="wzn__logo">
        <b>{office}</b>
        {sub && <span>{sub}</span>}
      </Link>

      <nav className="wzn__links">
        {links.map((l) => (
          <Link key={l.href} href={l.href} aria-current={path === l.href ? "page" : undefined}>
            {l.label}
          </Link>
        ))}

        {more.length > 0 && (
          <div
            className={`wzn__more${moreOpen ? " is-open" : ""}`}
            onMouseEnter={() => setMoreOpen(true)}
            onMouseLeave={() => setMoreOpen(false)}
          >
            <button type="button" aria-expanded={moreOpen} onClick={() => setMoreOpen((v) => !v)}>
              Więcej <i aria-hidden="true" />
            </button>
            <div className="wzn__drop">
              {more.map((l) => (
                <Link key={l.href} href={l.href} aria-current={path === l.href ? "page" : undefined}>
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>

      <div className="wzn__side">
        <Link href={`${base}/ulubione`} className="wzn__fav" aria-label="Ulubione oferty">
          <HeartIcon filled={ids.length > 0} />
          <b>{ids.length}</b>
          <span>ulubione</span>
        </Link>
        <a href={`tel:${phone.replace(/\s/g, "")}`} className="wzn__tel">
          {phone}
        </a>
        {cta && (
          <Link href={`${base}/kontakt`} className="wz-btn wz-btn--sm wzn__cta">
            {cta}
          </Link>
        )}
        <button
          type="button"
          className="wzn__burger"
          aria-label="Menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <i />
          <i />
          <i />
        </button>
      </div>
    </header>
  );
}

/** Stała plakietka: to jest wzór, a nie strona działającego biura. */
export function WzBadge({ name }: { name: string }) {
  return (
    <aside className="wzb" aria-label="Informacja o wzorze">
      <span className="wzb__txt">
        <b>Wzór strony</b> od AgentSpace<i>.</i> <em>Dane i oferty są przykładowe.</em>
      </span>
      <Link href="/wzory" className="wzb__link">
        Inne wzory
      </Link>
      <Link href={`/kontakt?base=${encodeURIComponent(name)}`} className="wzb__cta">
        Chcę taką stronę
      </Link>
    </aside>
  );
}

export function WzFooter({
  base,
  office,
  address,
  phone,
  email,
  nip,
}: {
  base: string;
  office: string;
  address: string[];
  phone: string;
  email: string;
  nip: string;
}) {
  return (
    <footer className="wzfo">
      <div className="wz-wrap wzfo__in">
        <div>
          <p className="wz-h3" style={{ fontFamily: "var(--d-display)", marginBottom: 12 }}>
            {office}
          </p>
          <p className="wz-muted" style={{ fontSize: 15 }}>
            {address.map((a) => (
              <span key={a} style={{ display: "block" }}>
                {a}
              </span>
            ))}
          </p>
          <p style={{ marginTop: 14, fontSize: 15 }}>
            <a href={`tel:${phone.replace(/\s/g, "")}`}>{phone}</a>
            <br />
            <a href={`mailto:${email}`}>{email}</a>
          </p>
        </div>

        <div>
          <h4>Oferty</h4>
          <ul>
            <li>
              <Link href={`${base}/oferty?transakcja=sprzedaz`}>Na sprzedaż</Link>
            </li>
            <li>
              <Link href={`${base}/oferty?transakcja=wynajem`}>Na wynajem</Link>
            </li>
            <li>
              <Link href={`${base}/oferty?typ=dom`}>Domy</Link>
            </li>
            <li>
              <Link href={`${base}/oferty?typ=lokal`}>Lokale i biura</Link>
            </li>
            <li>
              <Link href={`${base}/sprzedaj`}>Sprzedaj nieruchomość</Link>
            </li>
            <li>
              <Link href={`${base}/wynajmij`}>Oddaj w zarządzanie</Link>
            </li>
            <li>
              <Link href={`${base}/ulubione`}>Ulubione</Link>
            </li>
          </ul>
        </div>

        <div>
          <h4>Biuro</h4>
          <ul>
            <li>
              <Link href={`${base}/zespol`}>Zespół</Link>
            </li>
            <li>
              <Link href={`${base}/o-nas`}>O nas</Link>
            </li>
            <li>
              <Link href={`${base}/poradnik`}>Poradnik</Link>
            </li>
            <li>
              <Link href={`${base}/kalkulator`}>Kalkulator raty</Link>
            </li>
            <li>
              <Link href={`${base}/kontakt`}>Kontakt</Link>
            </li>
            <li>
              <Link href={`${base}/zglos-nieruchomosc`}>Zgłoś nieruchomość</Link>
            </li>
            <li>
              <Link href={`${base}/zlec-poszukiwanie`}>Zleć poszukiwanie</Link>
            </li>
          </ul>
        </div>

        <div>
          <h4>Formalności</h4>
          <ul>
            <li>
              <span className="wz-muted">Polityka prywatności</span>
            </li>
            <li>
              <span className="wz-muted">Regulamin</span>
            </li>
            <li>
              <span className="wz-muted">Licencja pośrednika</span>
            </li>
            <li>
              <span className="wz-muted">{nip}</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="wz-wrap">
        <div className="wzfo__bottom">
          <span>
            © {new Date().getFullYear()} {office}. Wzór strony, treści przykładowe.
          </span>
          <span>
            Strona i CRM:{" "}
            <Link href="/" style={{ textDecoration: "underline" }}>
              AgentSpace
            </Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
