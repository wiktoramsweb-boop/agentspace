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
  wzor,
  office,
  sub,
  links,
  phone,
  cta,
}: {
  wzor: string;
  office: React.ReactNode;
  sub?: string;
  links: NavLink[];
  phone: string;
  cta?: string;
}) {
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);
  const path = usePathname();
  const { ids } = useFavorites(wzor);

  useEffect(() => {
    const on = () => setSolid(window.scrollY > 24);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  useEffect(() => setOpen(false), [path]);

  return (
    <header className={`wzn${solid ? " is-solid" : ""}${open ? " is-open" : ""}`}>
      <Link href={`/wzory/${wzor}`} className="wzn__logo">
        <b>{office}</b>
        {sub && <span>{sub}</span>}
      </Link>

      <nav className="wzn__links">
        {links.map((l) => (
          <Link key={l.href} href={l.href} aria-current={path === l.href ? "page" : undefined}>
            {l.label}
          </Link>
        ))}
      </nav>

      <div className="wzn__side">
        <Link href={`/wzory/${wzor}/oferty?ulubione=1`} className="wzn__fav" aria-label="Ulubione oferty">
          <HeartIcon filled={ids.length > 0} />
          <b>{ids.length}</b>
          <span>ulubione</span>
        </Link>
        <a href={`tel:${phone.replace(/\s/g, "")}`} className="wzn__tel">
          {phone}
        </a>
        {cta && (
          <Link href={`/wzory/${wzor}/kontakt`} className="wz-btn wz-btn--sm wzn__cta">
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
      <Link href={`/kontakt?wzor=${encodeURIComponent(name)}`} className="wzb__cta">
        Chcę taką stronę
      </Link>
    </aside>
  );
}

export function WzFooter({
  wzor,
  office,
  address,
  phone,
  email,
  nip,
}: {
  wzor: string;
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
              <Link href={`/wzory/${wzor}/oferty?transakcja=sprzedaz`}>Na sprzedaż</Link>
            </li>
            <li>
              <Link href={`/wzory/${wzor}/oferty?transakcja=wynajem`}>Na wynajem</Link>
            </li>
            <li>
              <Link href={`/wzory/${wzor}/oferty?typ=dom`}>Domy</Link>
            </li>
            <li>
              <Link href={`/wzory/${wzor}/oferty?typ=lokal`}>Lokale i biura</Link>
            </li>
            <li>
              <Link href={`/wzory/${wzor}/oferty?ulubione=1`}>Ulubione</Link>
            </li>
          </ul>
        </div>

        <div>
          <h4>Biuro</h4>
          <ul>
            <li>
              <Link href={`/wzory/${wzor}/zespol`}>Zespół</Link>
            </li>
            <li>
              <Link href={`/wzory/${wzor}#wiedza`}>Poradnik</Link>
            </li>
            <li>
              <Link href={`/wzory/${wzor}/kontakt`}>Kontakt</Link>
            </li>
            <li>
              <Link href={`/wzory/${wzor}/kontakt#zglos`}>Zgłoś nieruchomość</Link>
            </li>
            <li>
              <Link href={`/wzory/${wzor}/kontakt#poszukiwanie`}>Zleć poszukiwanie</Link>
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
