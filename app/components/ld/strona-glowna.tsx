import "./strona.css";
import { existsSync } from "node:fs";
import path from "node:path";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { nowaStrona } from "@/lib/marketing/nowa-strona";
import { scenaSvg, type RodzajSceny } from "@/lib/marketing/ilustracje";
import { trescStronyGlownej } from "@/lib/marketing/strona-glowna";
import { PLANS } from "@/lib/marketing/plans";
import { DNI_PROBNE } from "@/lib/abonament-cennik";
import { getDict, localeHref, toLocale } from "@/lib/i18n";
import { Silnik } from "./silnik";

/* ── Drobne klocki ─────────────────────────────────────────── */

function Ikona({ nazwa, className = "ic" }: { nazwa: "strzalka" | "ptaszek" | "tel" | "plus" | "gora" | "menu" | "iskra" | "mikrofon" | "arkusz" | "osoby"; className?: string }) {
  const p = { className, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  switch (nazwa) {
    case "strzalka":
      return <svg {...p}><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
    case "ptaszek":
      return <svg {...p} strokeWidth={2.4}><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>;
    case "tel":
      return <svg {...p} fill="currentColor" stroke="none"><path d="M6.6 10.8a15.2 15.2 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z" /></svg>;
    case "plus":
      return <svg {...p}><path d="M12 5v14M5 12h14" /></svg>;
    case "gora":
      return <svg {...p}><path d="M12 19V5M6 11l6-6 6 6" /></svg>;
    case "menu":
      return <svg {...p} strokeWidth={1.8}><path d="M4 9h16M4 15h16" /></svg>;
    case "iskra":
      return <svg {...p} strokeWidth={1.8}><path d="M9 5l1.5 4.2 4.2 1.5-4.2 1.5L9 16.4l-1.5-4.2-4.2-1.5 4.2-1.5z" /><path d="M17.5 3l.7 1.9 1.9.7-1.9.7-.7 1.9-.7-1.9-1.9-.7 1.9-.7zM17.5 14.2l.9 2.4 2.4.9-2.4.9-.9 2.4-.9-2.4-2.4-.9 2.4-.9z" /></svg>;
    case "mikrofon":
      return <svg {...p} strokeWidth={1.9}><rect x="9" y="2.5" width="6" height="11.5" rx="3" /><path d="M18.5 10.5v.5a6.5 6.5 0 0 1-13 0v-.5M12 17.5v4" /></svg>;
    case "arkusz":
      return <svg {...p} strokeWidth={1.8}><path d="M14 3H6.5A1.5 1.5 0 0 0 5 4.5v15A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5V8z" /><path d="M14 3v5h5M8.5 13h7M8.5 17h5" /></svg>;
    case "osoby":
      return <svg {...p} strokeWidth={1.8}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5" /><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.8c1.8.7 3 2.4 3.5 5.2" /></svg>;
  }
}

/** Znak marki: kafelek z gradientem i dom z kropką (ta sama geometria co w lib marki). */
function Kafel({ className }: { className: string }) {
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

/** Nagłówek odsłaniany słowo po słowie (słowa dzielimy po stronie serwera). */
function Slowa({ tekst, className = "ld-h2", as: Tag = "h2", id }: { tekst: string; className?: string; as?: "h2" | "h3"; id?: string }) {
  const slowa = tekst.split(/\s+/);
  return (
    <Tag className={`${className} ld-slowa`} id={id}>
      <span className="sr">{tekst}</span>
      {slowa.map((s, i) => (
        <span key={i} aria-hidden="true">
          <span className="s">
            <span style={{ transitionDelay: `${i * 0.055}s` }}>{s}</span>
          </span>
          {i < slowa.length - 1 ? " " : null}
        </span>
      ))}
    </Tag>
  );
}

function Okno({ zrzut, alt, male, priorytet }: { zrzut: string; alt: string; male?: boolean; priorytet?: boolean }) {
  return (
    <figure className={`ld-okno${male ? " ld-okno--male" : ""}`}>
      <div className="ld-okno__pasek" aria-hidden="true">
        <i />
        <i />
        <i />
        <span>agentspace.pl/app</span>
      </div>
      <Image src={`/strona/zrzuty/${zrzut}.webp`} alt={alt} width={2000} height={1250} sizes="(max-width: 960px) 100vw, 60vw" priority={priorytet} />
    </figure>
  );
}

/**
 * Obraz z Nano Banana, jeśli plik już jest w public/strona/ilustracje,
 * a do tego czasu rysunek z kodu w tych samych kolorach.
 */
function Ilustracja({ nazwa, rodzaj, ziarno, w, h, pora, alt, className = "ld-ilu", sizes = "100vw" }: { nazwa: string; rodzaj: RodzajSceny; ziarno: number; w: number; h: number; pora?: "zmierzch" | "noc" | "rano" | "dzien"; alt: string; className?: string; sizes?: string }) {
  const katalog = path.join(process.cwd(), "public", "strona", "ilustracje");
  const plik = ["webp", "jpg", "png"].map((r) => `${nazwa}.${r}`).find((p) => existsSync(path.join(katalog, p)));
  if (plik) {
    return (
      <span className={className}>
        <Image src={`/strona/ilustracje/${plik}`} alt={alt} fill sizes={sizes} />
      </span>
    );
  }
  return <span className={className} dangerouslySetInnerHTML={{ __html: scenaSvg({ rodzaj, ziarno, w, h, pora }, alt) }} />;
}

function Wartosc({ v }: { v: string }) {
  const tak = v === "tak" || v === "yes";
  const nie = v === "nie" || v === "no";
  if (tak) return <span className="ld-tak" aria-label={v}><Ikona nazwa="ptaszek" className="ic" /></span>;
  if (nie) return <span className="ld-nie" aria-label={v}>-</span>;
  return <span className="ld-czesc">{v}</span>;
}

/* ── Strona ────────────────────────────────────────────────── */

export function StronaGlowna({ lang }: { lang: string }) {
  const locale = toLocale(lang);
  const t = nowaStrona(locale, DNI_PROBNE);
  const dict = getDict(locale);
  const faq = trescStronyGlownej(locale, DNI_PROBNE).faq.pozycje;
  const plany = dict.pricingWidget.plans;
  const href = (p: string) => localeHref(locale, p);
  const signup = "/signup";

  const krokiCoach: ReactNode[] = [
    <div className="ld-combo" key="tel">
      <div className="ld-tel" role="img" aria-label={`${t.coach.telefon.typ}: ${t.coach.telefon.kto}`}>
        <div className="ld-tel__ekran" aria-hidden="true">
          <div className="ld-tel__gora">
            <span>{t.coach.telefon.pora}</span>
            <small>{t.coach.telefon.typ}</small>
          </div>
          <div className="ld-tel__kto">
            <span className="ld-tel__awatar">
              K
              <i />
              <i />
            </span>
            <b>{t.coach.telefon.kto}</b>
            <span>{t.coach.telefon.gdzie}</span>
          </div>
          <div className="ld-tel__guziki">
            <div className="ld-tel__guzik ld-tel__nie">
              <span style={{ transform: "rotate(135deg)" }}>
                <Ikona nazwa="tel" className="" />
              </span>
              {t.coach.telefon.odrzuc}
            </div>
            <div className="ld-tel__guzik ld-tel__tak">
              <span>
                <Ikona nazwa="tel" className="" />
              </span>
              {t.coach.telefon.odbierz}
            </div>
          </div>
        </div>
      </div>
      <div className="ld-combo__karta ld-transkrypt" aria-hidden="true">
        <div className="ld-transkrypt__tytul">
          <span className="ld-kropka" />
          {t.coach.transkrypt.tytul}
        </div>
        {t.coach.transkrypt.linie.map((l, i) => (
          <div key={i} className={`ld-dymek ld-dymek--${l.kto}`}>
            <small>{l.kto === "ai" ? t.coach.kroki[0].cytat?.kto : "Agent"}</small>
            {l.tekst}
          </div>
        ))}
      </div>
    </div>,
    <div className="ld-ocena-panel" key="ocena" role="img" aria-label={`${t.hero.ocena.tytul}: ${t.hero.ocena.wynik}/10`}>
      <div className="ld-ocena-panel__gora" aria-hidden="true">
        <div>
          <small>{t.hero.ocena.tytul}</small>
          <strong>{t.coach.telefon.typ}</strong>
        </div>
        <div className="ld-ocena-panel__wynik">
          {t.hero.ocena.wynik}
          <span>/10</span>
        </div>
      </div>
      {t.hero.ocena.obszary.map(([nazwa, v]) => (
        <div className="ld-pasek" key={nazwa} aria-hidden="true">
          <span>{nazwa}</span>
          <i>
            <em style={{ ["--v" as string]: `${v * 10}%` }} />
          </i>
          <b>{v}</b>
        </div>
      ))}
    </div>,
    <Okno key="popr" zrzut="coach-poprawki" alt="AI Coach: kluczowe momenty rozmowy z poprawionymi zdaniami" male />,
    <Okno key="trening" zrzut="trening" alt="AI Coach: lista scenariuszy i zadania od menedżera" male />,
  ];

  const scenyDnia: { rodzaj: RodzajSceny; pora: "rano" | "dzien" | "zmierzch" | "noc" }[] = [
    { rodzaj: "wnetrze", pora: "rano" },
    { rodzaj: "agent", pora: "dzien" },
    { rodzaj: "narozna", pora: "zmierzch" },
    { rodzaj: "ulica", pora: "noc" },
  ];
  const krokiDnia = t.dzien.momenty.map((m, i) => (
    <Ilustracja key={m.obraz} nazwa={m.obraz} rodzaj={scenyDnia[i].rodzaj} pora={scenyDnia[i].pora} ziarno={11 + i * 7} w={1600} h={2000} alt={m.tytul} sizes="(max-width: 960px) 100vw, 50vw" />
  ));

  return (
    <div className="ld" data-ld>
      <Silnik />

      <div className="ld-loader" data-loader aria-hidden="true">
        <div className="ld-loader__pasek" />
        <div className="ld-loader__znak">
          <Kafel className="ld-loader__kafel" />
          <span className="ld-loader__napis">AgentSpace</span>
        </div>
      </div>
      <div className="ld-kursor" data-kursor aria-hidden="true" />

      {/* ── Nawigacja ── */}
      <header className="ld-nav" data-nav>
        <Link href={href("/")} className="ld-logo" aria-label="AgentSpace">
          <Kafel className="ld-logo__kafel" />
          <span className="ld-logo__napis">AgentSpace</span>
        </Link>
        <nav className="ld-nav__linki" aria-label="Nawigacja">
          {t.nav.linki.map((l) => (
            <a key={l.href} href={l.href}>
              {l.label}
            </a>
          ))}
        </nav>
        <div className="ld-nav__akcje">
          <Link className="ld-nav__login" href="/login">
            {t.nav.login}
          </Link>
          <Link className="ld-btn" data-magnes href={signup}>
            {t.nav.cta}
          </Link>
          <button className="ld-burger" data-burger aria-label={t.nav.menu} data-label-otworz={t.nav.menu} data-label-zamknij={t.nav.zamknij} aria-expanded="false" aria-controls="ld-menu">
            <Ikona nazwa="menu" className="ic" />
          </button>
        </div>
      </header>
      <div className="ld-menu" id="ld-menu" data-menu>
        <nav aria-label="Menu">
          {t.nav.linki.map((l) => (
            <a key={l.href} href={l.href}>
              {l.label}
            </a>
          ))}
        </nav>
        <div className="ld-menu__akcje">
          <Link className="ld-btn ld-btn--duzy" href={signup}>
            {t.hero.cta}
          </Link>
          <Link className="ld-btn ld-btn--duch ld-btn--duzy" href="/login">
            {t.nav.login}
          </Link>
        </div>
      </div>

      <main>
        {/* ── Hero ── */}
        <section className="ld-hero" id="gora">
          <div className="ld-hero__siatka">
            <h1>
              <span className="ld-linia">
                <span style={{ transitionDelay: "0.05s" }}>{t.hero.linie[0]}</span>
              </span>
              <span className="ld-linia">
                <span style={{ transitionDelay: "0.17s" }} className="ld-gradient">
                  {t.hero.linie[1]}
                </span>
              </span>
            </h1>
            <p className="ld-hero__pod">
              <span className="ld-linia">
                <span style={{ transitionDelay: "0.32s" }}>{t.hero.pod}</span>
              </span>
            </p>
            <div className="ld-hero__bok">
              <p className="ld-lead ld-wjedz" style={{ transitionDelay: "0.5s" }}>
                {t.hero.lead}
              </p>
              <div className="ld-hero__cta ld-wjedz" style={{ transitionDelay: "0.62s" }}>
                <Link className="ld-btn ld-btn--duzy" data-magnes href={signup}>
                  {t.hero.cta}
                  <Ikona nazwa="strzalka" />
                </Link>
                <a className="ld-btn ld-btn--duch ld-btn--duzy" href="#coach">
                  {t.hero.cta2}
                </a>
              </div>
              <p className="ld-hero__drobne ld-wjedz" style={{ transitionDelay: "0.7s" }}>
                {t.hero.podCta}
              </p>
            </div>
          </div>

          <div className="ld-scena ld-wjedz" style={{ transitionDelay: "0.8s" }}>
            <div className="ld-scena__pochyl" data-pochyl>
              <div className="ld-skala" data-skala data-w="1400" data-h="780">
                <div className="ld-skala__wnetrze" style={{ width: 1400, height: 780 }}>
                  <div style={{ position: "absolute", left: 90, top: 20, width: 1220 }}>
                    <Okno zrzut="tablica" alt="AgentSpace: klienci na tablicy etapów sprzedaży" priorytet />
                  </div>
                  <div className="ld-plywa ld-karta" data-plywa="1.1" style={{ left: 0, top: 500, width: 330 }} aria-hidden="true">
                    <div className="ld-karta__gora">
                      <b>
                        <span className="ld-kropka" />
                        {t.hero.rozmowa.etykieta}
                      </b>
                      {t.hero.rozmowa.czas}
                    </div>
                    <div className="ld-karta__kto">
                      <span className="ld-karta__ikona">
                        <Ikona nazwa="mikrofon" />
                      </span>
                      <div>
                        <b>{t.hero.rozmowa.kto}</b>
                        <small>{t.hero.rozmowa.gdzie}</small>
                      </div>
                    </div>
                    <div className="ld-fala">
                      {Array.from({ length: 16 }, (_, i) => (
                        <i key={i} style={{ animationDelay: `${((i * 7) % 10) / 10}s` }} />
                      ))}
                    </div>
                  </div>
                  <div className="ld-plywa ld-karta" data-plywa="1.8" style={{ right: 0, top: 110, width: 300 }} aria-hidden="true">
                    <div className="ld-karta__gora">
                      <b>{t.hero.ocena.tytul}</b>
                      AI Coach
                    </div>
                    <div className="ld-ocena__wynik">
                      <b>{t.hero.ocena.wynik}</b>
                      <span>/10</span>
                    </div>
                    {t.hero.ocena.obszary.map(([nazwa, v]) => (
                      <div className="ld-pasek" key={nazwa}>
                        <span>{nazwa}</span>
                        <i>
                          <em style={{ ["--v" as string]: `${v * 10}%` }} />
                        </i>
                        <b>{v}</b>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Manifest ── */}
        <section className="ld-manifest" aria-label="Dlaczego AgentSpace">
          <p data-manifest>
            <span className="sr">{t.manifest}</span>
            {t.manifest.split(/\s+/).map((w, i) => (
              <span key={i} aria-hidden="true">
                <span className={`w${/AgentSpace|AI/.test(w) ? " akcent" : ""}`}>{w}</span>{" "}
              </span>
            ))}
          </p>
        </section>

        {/* ── AI Coach ── */}
        <section className="ld-historia" id="coach">
          <div className="ld-glowka">
            <div>
              <span className="ld-pigulka">
                <span className="ld-pigulka__ikona">
                  <Ikona nazwa="iskra" />
                </span>
                {t.coach.etykieta}
              </span>
              <Slowa tekst={t.coach.tytul} />
            </div>
            <p className="ld-lead">{t.coach.lead}</p>
          </div>
          <div className="ld-hist" data-historia>
            <div className="ld-hist__kroki">
              {t.coach.kroki.map((k, i) => (
                <article className="ld-krok" key={k.tytul}>
                  <div className="ld-inline">
                    <div className="ld-ekran">{krokiCoach[i]}</div>
                  </div>
                  <h3>{k.tytul}</h3>
                  <p>{k.tekst}</p>
                  {k.cytat && (
                    <p className="ld-cytat">
                      <b>{k.cytat.kto}</b>
                      {k.cytat.tresc}
                    </p>
                  )}
                  {k.dopisek && <p>{k.dopisek}</p>}
                </article>
              ))}
            </div>
            <div className="ld-hist__bok">
              <div className="ld-hist__widok">
                {krokiCoach.map((w, i) => (
                  <div className="ld-ekran" key={i} data-ekran>
                    {w}
                  </div>
                ))}
              </div>
              <div className="ld-kropki">
                {t.coach.kroki.map((k, i) => (
                  <button key={i} aria-label={k.tytul} data-kropka={i}>
                    <span />
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="ld-liczby-pas">
            {t.coach.liczby.map((l) => (
              <div key={l.opis} data-odslon>
                <b className="ld-gradient">{l.wartosc}</b>
                <span>{l.opis}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Dzień agenta ── */}
        <section className="ld-historia ld-jasna ld-kurtyna" id="dzien" style={{ zIndex: 2 }}>
          <div className="ld-glowka">
            <div>
              <span className="ld-etykieta">{t.dzien.etykieta}</span>
              <Slowa tekst={t.dzien.tytul} />
            </div>
            <p className="ld-lead">{t.dzien.lead}</p>
          </div>
          <div className="ld-hist" data-historia>
            <div className="ld-hist__kroki">
              {t.dzien.momenty.map((m, i) => (
                <article className="ld-krok" key={m.pora}>
                  <div className="ld-inline">
                    <div className="ld-ekran">{krokiDnia[i]}</div>
                  </div>
                  <span className="ld-krok__pora">{m.pora}</span>
                  <h3>{m.tytul}</h3>
                  <p>{m.tekst}</p>
                  <ul className="ld-punkty">
                    {m.punkty.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
            <div className="ld-hist__bok">
              <div className="ld-hist__widok">
                {krokiDnia.map((w, i) => (
                  <div className="ld-ekran" key={i} data-ekran>
                    {w}
                  </div>
                ))}
              </div>
              <div className="ld-kropki">
                {t.dzien.momenty.map((m, i) => (
                  <button key={i} aria-label={`${m.pora} ${m.tytul}`} data-kropka={i}>
                    <span />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Rozszerzające się ujęcie ── */}
        <section className="ld-rozsz" data-rozsz aria-label={t.rozszerzenie.tytul} style={{ zIndex: 3 }}>
          <div className="ld-rozsz__pin">
            <div className="ld-rozsz__obraz" data-rozsz-obraz>
              <Ilustracja nazwa="miasto-zmierzch" rodzaj="ulica" ziarno={7} w={1600} h={900} pora="zmierzch" alt="Kamienice w Krakowie o zmierzchu, w jednej świeci biuro" />
              <div className="ld-rozsz__cien" />
            </div>
            <div className="ld-rozsz__tekst" data-rozsz-tekst>
              <h2 className="ld-h2">{t.rozszerzenie.tytul}</h2>
              <p className="ld-lead">{t.rozszerzenie.lead}</p>
            </div>
          </div>
        </section>

        {/* ── Właściciel ── */}
        <section className="ld-wlasc ld-jasna" id="wlasciciel" style={{ position: "relative", zIndex: 4 }}>
          <div className="ld-glowka">
            <div>
              <span className="ld-etykieta">{t.wlasciciel.etykieta}</span>
              <Slowa tekst={t.wlasciciel.tytul} />
            </div>
            <p className="ld-lead">{t.wlasciciel.lead}</p>
          </div>
          <div className="ld-wlasc__siatka">
            {t.wlasciciel.karty.map((k) => (
              <Link href={href(k.href)} className="ld-wkarta" key={k.tytul} data-odslon-klasa>
                <div className="ld-wkarta__obraz">
                  <Image src={`/strona/zrzuty/${k.zrzut}.webp`} alt={k.tytul} width={2000} height={1250} sizes="(max-width: 960px) 100vw, 45vw" />
                </div>
                <h3>{k.tytul}</h3>
                <p>{k.tekst}</p>
                <span className="ld-wkarta__link">
                  {locale === "en" ? "Learn more" : "Zobacz więcej"}
                  <Ikona nazwa="strzalka" />
                </span>
              </Link>
            ))}
          </div>
          <ul className="ld-wlasc__lista">
            {t.wlasciciel.lista.map((l) => (
              <li key={l.tytul} data-odslon>
                <b>{l.tytul}</b>
                <p>{l.tekst}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* ── Moduły ── */}
        <section className="ld-mod ld-kurtyna" id="moduly">
          <div className="ld-glowka">
            <div>
              <span className="ld-etykieta">{t.moduly.etykieta}</span>
              <Slowa tekst={t.moduly.tytul} />
            </div>
          </div>
          <div className="ld-mod__tor" data-mod>
            <div className="ld-mod__pin">
              <div className="ld-mod__zakladki" role="tablist" aria-label={t.moduly.etykieta}>
                {t.moduly.lista.map((m, i) => (
                  <button key={m.nazwa} role="tab" className={i === 0 ? "on" : ""} aria-selected={i === 0} data-zakladka={i}>
                    {m.nazwa}
                    <i />
                  </button>
                ))}
              </div>
              <div className="ld-mod__podpis" aria-live="polite">
                {t.moduly.lista.map((m, i) => (
                  <div key={m.nazwa} className={i === 0 ? "on" : ""}>
                    <h3>{m.tytul}</h3>
                    <p>{m.tekst}</p>
                  </div>
                ))}
              </div>
              <div className="ld-mod__ramka">
                <figure className="ld-okno">
                  <div className="ld-okno__pasek" aria-hidden="true">
                    <i />
                    <i />
                    <i />
                    <span>agentspace.pl/app</span>
                  </div>
                  <div className="ld-mod__zrzuty">
                    {t.moduly.lista.map((m, i) => (
                      <Image key={m.nazwa} className={i === 0 ? "on" : ""} src={`/strona/zrzuty/${m.zrzut}.webp`} alt={`${m.nazwa}: ${m.tytul}`} width={2000} height={1250} sizes="(max-width: 960px) 100vw, 75vw" />
                    ))}
                  </div>
                </figure>
              </div>
            </div>
          </div>
        </section>

        {/* ── Liczby ── */}
        <section className="ld-dowod" aria-label={t.liczby.etykieta}>
          <div className="ld-dowod__tor" data-dowod>
            <div className="ld-dowod__pin">
              <span className="ld-etykieta ld-dowod__etykieta">{t.liczby.etykieta}</span>
              <div className="ld-dowod__slajdy">
                {t.liczby.slajdy.map((s, i) => (
                  <div key={s.wartosc} className={`ld-dowod__slajd${i === 0 ? " on" : ""}`}>
                    <span className="ld-dowod__duza ld-gradient">{s.wartosc}</span>
                    <span className="ld-dowod__opis">{s.opis}</span>
                  </div>
                ))}
              </div>
              <div className="ld-dowod__nav" aria-hidden="true">
                {t.liczby.slajdy.map((s) => (
                  <span key={s.wartosc}>
                    <i />
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Dla kogo ── */}
        <section className="ld-kogo ld-jasna ld-kurtyna">
          <div className="ld-glowka">
            <div>
              <Slowa tekst={t.dlaKogo.tytul} />
            </div>
            <p className="ld-lead">{t.dlaKogo.lead}</p>
          </div>
          <div className="ld-kogo__siatka">
            {t.dlaKogo.karty.map((k, i) => (
              <article className="ld-kkarta" key={k.tytul} data-odslon-klasa>
                <div className="ld-kkarta__obraz">
                  <Ilustracja nazwa={k.obraz} rodzaj={(["narozna", "biurowiec", "agent"] as RodzajSceny[])[i]} ziarno={3 + i * 5} w={600} h={760} pora={i === 1 ? "noc" : "zmierzch"} alt={k.tytul} sizes="(max-width: 960px) 100vw, 33vw" />
                </div>
                <h3>{k.tytul}</h3>
                <p>{k.tekst}</p>
              </article>
            ))}
          </div>
        </section>

        {/* ── Porównanie ── */}
        <section className="ld-por ld-kurtyna" data-odslon-klasa>
          <div className="ld-glowka">
            <div>
              <span className="ld-etykieta">{t.porownanie.etykieta}</span>
              <Slowa tekst={t.porownanie.tytul} />
            </div>
            <p className="ld-lead">{t.porownanie.lead}</p>
          </div>
          <div className="ld-por__tabela">
            <table>
              <thead>
                <tr>
                  <th scope="col">
                    <span className="sr">{locale === "en" ? "Feature" : "Funkcja"}</span>
                  </th>
                  <th scope="col">{t.porownanie.kolumny[0]}</th>
                  <th scope="col">{t.porownanie.kolumny[1]}</th>
                  <th scope="col" className="nasze">
                    {t.porownanie.kolumny[2]}
                  </th>
                </tr>
              </thead>
              <tbody>
                {t.porownanie.wiersze.map((w, i) => (
                  <tr key={w.cecha} style={{ transitionDelay: `${i * 0.07}s` }}>
                    <th scope="row">{w.cecha}</th>
                    <td>
                      <Wartosc v={w.wartosci[0]} />
                    </td>
                    <td>
                      <Wartosc v={w.wartosci[1]} />
                    </td>
                    <td className="nasze">
                      <Wartosc v={w.wartosci[2]} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="ld-por__nota">{t.porownanie.nota}</p>
        </section>

        {/* ── Cennik ── */}
        <section className="ld-cennik ld-jasna ld-kurtyna" id="cennik">
          <div className="ld-glowka">
            <div>
              <span className="ld-etykieta">{t.cennik.etykieta}</span>
              <Slowa tekst={t.cennik.tytul} />
            </div>
            <p className="ld-lead">{t.cennik.lead}</p>
          </div>
          <div className="ld-plany">
            {PLANS.map((plan) => {
              const opis = plany.find((p) => p.id === plan.id) ?? plany[0];
              const wyr = plan.id === "pro";
              return (
                <div className={`ld-plan${wyr ? " ld-plan--wyr" : ""}`} key={plan.id} data-odslon>
                  {wyr && <span className="ld-plan__znaczek">{t.cennik.polecany}</span>}
                  <h3>{opis.name}</h3>
                  <p className="ld-plan__kto">{opis.tagline}</p>
                  <div className="ld-plan__cena">
                    {plan.priceFrom && <span className="od">{t.cennik.od}</span>}
                    {plan.price}
                    <small>{t.cennik.miesiac}</small>
                  </div>
                  <ul>
                    {opis.features.map((f) => (
                      <li key={f}>
                        <Ikona nazwa="ptaszek" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link className={`ld-btn${wyr ? "" : " ld-btn--ciemny"}`} href={signup}>
                    {t.cennik.wybierz}
                  </Link>
                </div>
              );
            })}
          </div>
          <Link className="ld-cennik__pelny" href={href("/cennik")}>
            {t.cennik.pelny}
            <Ikona nazwa="strzalka" />
          </Link>
        </section>

        {/* ── Start ── */}
        <section className="ld-start ld-kurtyna" id="start">
          <div className="ld-glowka">
            <div>
              <span className="ld-etykieta">{t.start.etykieta}</span>
              <Slowa tekst={t.start.tytul} />
            </div>
            <p className="ld-lead">{t.start.lead}</p>
          </div>
          <div className="ld-stos" data-stos>
            {t.start.kroki.map((k, i) => (
              <article key={k.tytul} className={`ld-skarta ld-skarta--${i + 1}`} style={{ ["--i" as string]: i }}>
                <div className="ld-skarta__tekst">
                  <span className="ld-skarta__nr">{i + 1}</span>
                  <div>
                    <h3>{k.tytul}</h3>
                    <p>{k.tekst}</p>
                    {i === 0 && (
                      <Link className="ld-btn ld-btn--ciemny" href={signup}>
                        {t.start.cta}
                      </Link>
                    )}
                  </div>
                </div>
                <div className="ld-skarta__ui" aria-hidden="true">
                  {i === 0 && (
                    <>
                      <div className="ld-pole">
                        <small>{locale === "en" ? "Agency name" : "Nazwa biura"}</small>
                        <span>{locale === "en" ? "e.g. Spectra Real Estate" : "np. Spectra Nieruchomości"}</span>
                      </div>
                      <div className="ld-pole ok">
                        <small>{locale === "en" ? "Work email" : "E-mail służbowy"}</small>
                        <span>biuro@twojebiuro.pl</span>
                        <Ikona nazwa="ptaszek" />
                      </div>
                      <div className="ld-wiersz">
                        <div className="ld-pole">
                          <small>{locale === "en" ? "Password" : "Hasło"}</small>
                          <span>••••••••••</span>
                        </div>
                        <div className="ld-pole ok">
                          <small>{locale === "en" ? "Trial" : "Okres próbny"}</small>
                          <span>{locale === "en" ? `${DNI_PROBNE} days` : `${DNI_PROBNE} dni`}</span>
                          <Ikona nazwa="ptaszek" />
                        </div>
                      </div>
                      <span className="ld-guzik-ui">{t.start.cta}</span>
                    </>
                  )}
                  {i === 1 && (
                    <>
                      {[
                        [locale === "en" ? "clients.xlsx" : "klienci.xlsx", locale === "en" ? "412 clients" : "412 klientów", 100],
                        [locale === "en" ? "listings.csv" : "oferty.csv", locale === "en" ? "86 listings" : "86 ofert", 100],
                        [locale === "en" ? "contacts.xlsx" : "kontakty.xlsx", locale === "en" ? "matching columns" : "dopasowanie kolumn", 62],
                      ].map(([plik, opis, v]) => (
                        <div className="ld-import" key={String(plik)}>
                          <span className="ld-import__ikona">
                            <Ikona nazwa="arkusz" />
                          </span>
                          <div>
                            <b>{plik}</b>
                            <small>{opis}</small>
                            <i>
                              <em style={{ ["--v" as string]: `${v}%` }} />
                            </i>
                          </div>
                          {v === 100 ? <span className="ok">{locale === "en" ? "done" : "gotowe"}</span> : <small>{v}%</small>}
                        </div>
                      ))}
                    </>
                  )}
                  {i === 2 && (
                    <>
                      {[
                        ["ZM", "Zofia M.", locale === "en" ? "Manager" : "Menedżer", "#6ee7c8"],
                        ["AW", "Adam W.", "Agent", "#67e8f9"],
                        ["KS", "Klara S.", "Agent", "#a7f3d0"],
                        ["EB", "Ewa B.", locale === "en" ? "Accountant" : "Księgowa", "#bae6fd"],
                      ].map(([ini, kto, rola, kolor]) => (
                        <div className="ld-osoba" key={kto}>
                          <span className="ld-osoba__awatar" style={{ background: kolor }}>
                            {ini}
                          </span>
                          <div>
                            <b>{kto}</b>
                            <small>{locale === "en" ? "invitation sent" : "zaproszenie wysłane"}</small>
                          </div>
                          <em>{rola}</em>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="ld-faq ld-jasna ld-kurtyna" id="pytania">
          <div className="ld-faq__siatka">
            <Slowa tekst={t.faq.tytul} />
            <div className="ld-faq__lista">
              {faq.map((p, i) => (
                <div className="ld-pyt" key={p.q} data-pyt>
                  <h3>
                    <button aria-expanded="false" aria-controls={`ld-odp-${i}`}>
                      {p.q}
                      <span className="ld-pyt__ikona">
                        <Ikona nazwa="plus" />
                      </span>
                    </button>
                  </h3>
                  <div className="ld-pyt__odp" id={`ld-odp-${i}`}>
                    <div>
                      <p>{p.a}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Koniec ── */}
        <section className="ld-koniec" aria-label={t.koniec.tytul}>
          <div className="ld-koniec__pudlo" data-koniec>
            <Ilustracja nazwa="noc-panorama" rodzaj="panorama" ziarno={21} w={2100} h={900} pora="noc" alt="" />
            <div>
              <Slowa tekst={t.koniec.tytul} />
              <p className="ld-lead">{t.koniec.lead}</p>
            </div>
            <form className="ld-koniec__form" action="/signup" method="get">
              <label htmlFor="ld-email">{t.koniec.pole}</label>
              <input id="ld-email" name="email" type="email" autoComplete="email" required placeholder="biuro@twojebiuro.pl" />
              <button className="ld-btn ld-btn--duzy" type="submit" data-magnes style={{ alignSelf: "flex-start" }}>
                {t.koniec.przycisk}
                <Ikona nazwa="strzalka" />
              </button>
              <p className="ld-koniec__alt">
                {t.koniec.alt} <Link href={href("/demo")}>{t.koniec.altLink}</Link>
              </p>
            </form>
          </div>
        </section>
      </main>

      {/* ── Stopka ── */}
      <footer className="ld-stopka">
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
          {dict.footer.sections.map((s) => (
            <div key={s.title}>
              <h4>{s.title}</h4>
              <ul>
                {s.links.map((l) => (
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
          <span>{dict.footer.madeIn.before}{dict.footer.madeIn.company}{dict.footer.madeIn.after}</span>
        </div>
        <a className="ld-gora" href="#gora" aria-label={t.stopka.gora} data-magnes>
          <Ikona nazwa="gora" className="ic" />
        </a>
        <span className="ld-stopka__napis" data-napis aria-hidden="true">
          agentspace
        </span>
      </footer>
    </div>
  );
}
