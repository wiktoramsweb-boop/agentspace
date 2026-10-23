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
import { Kafel, LdNav, LdStopka } from "./rama";
import { CennikPlany } from "./cennik-plany";
import { SoloBaner } from "./solo-baner";

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


/** Nagłówek rozdziału: duży numer, linia i nazwa. Numeracja to oś całej strony. */
function Rozdzial({ nr, nazwa }: { nr: number; nazwa: string }) {
  return (
    <div className="lx-rozdzial" data-odslon-klasa aria-hidden="true">
      <span className="lx-rozdzial__nr">{String(nr).padStart(2, "0")}</span>
      <i />
      <span className="lx-rozdzial__nazwa">{nazwa}</span>
    </div>
  );
}

const TEMP_KOLOR = { goracy: "#f43f5e", cieply: "#f59e0b", zimny: "#0ea5e9" } as const;

function Pierscien({ wynik, temp }: { wynik: number; temp: keyof typeof TEMP_KOLOR }) {
  const r = 22;
  const obwod = 2 * Math.PI * r;
  return (
    <span className="lx-pierscien">
      <svg viewBox="0 0 52 52" aria-hidden="true">
        <circle cx="26" cy="26" r={r} fill="none" strokeWidth="5" stroke="rgba(148,163,184,0.25)" />
        <circle cx="26" cy="26" r={r} fill="none" strokeWidth="5" strokeLinecap="round" stroke={TEMP_KOLOR[temp]} strokeDasharray={obwod} style={{ ["--do" as string]: obwod * (1 - wynik / 100), ["--od" as string]: obwod }} />
      </svg>
      <b>{wynik}</b>
    </span>
  );
}

/** Liczba z przedrostkiem i przyrostkiem, np. „0 zł”: silnik odlicza tylko cyfry. */
function Licznik({ wartosc }: { wartosc: string }) {
  const m = wartosc.match(/^(\D*)(\d+)(.*)$/);
  if (!m) return <>{wartosc}</>;
  return (
    <>
      {m[1]}
      <span data-licznik={m[2]}>{m[2]}</span>
      {m[3]}
    </>
  );
}

/* ── Strona ────────────────────────────────────────────────── */

export function StronaGlowna({ lang }: { lang: string }) {
  const locale = toLocale(lang);
  const en = locale === "en";
  const t = nowaStrona(locale, DNI_PROBNE);
  const dict = getDict(locale);
  const faq = trescStronyGlownej(locale, DNI_PROBNE).faq.pozycje;
  const plany = dict.pricingWidget.plans;
  const href = (p: string) => localeHref(locale, p);
  const signup = "/signup";
  const kotwice = ["pulpit", "coach", "teren", "biuro", "start"];

  const wizualeCoach: ReactNode[] = [
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

  return (
    <div className="ld" data-ld id="top">
      <Silnik />

      {/* Wejście: rysuje się dom z logo, a ekran otwiera się jak dwuskrzydłowe drzwi. */}
      <div className="ld-loader" data-loader aria-hidden="true">
        <div className="ld-loader__skrzydlo ld-loader__skrzydlo--l" />
        <div className="ld-loader__skrzydlo ld-loader__skrzydlo--p" />
        <div className="ld-loader__znak">
          <svg viewBox="0 0 100 100" className="ld-loader__dom">
            <path d="M 50 29.3 L 80.5 54 L 72.3 54 L 72.3 76.6 L 60.6 76.6 L 60.6 59.9 L 39.6 59.9 L 39.6 76.6 L 27.9 76.6 L 27.9 54 L 19.5 54 Z" pathLength={1} />
            <circle cx="50" cy="22" r="3.2" />
          </svg>
          <span className="ld-loader__napis">
            {"AgentSpace".split("").map((z, i) => (
              <span key={i} style={{ animationDelay: `${0.45 + i * 0.035}s` }}>
                {z}
              </span>
            ))}
          </span>
        </div>
      </div>

      <LdNav lang={locale} />

      <main>
        {/* ── Okładka ── */}
        <section className="lx-hero">
          <div className="lx-hero__tlo" aria-hidden="true" data-paralaksa="0.18">
            <Ilustracja nazwa="noc-panorama" rodzaj="panorama" ziarno={21} w={2100} h={900} pora="noc" alt="" sizes="100vw" />
          </div>
          <div className="lx-hero__siatka">
            <div className="lx-hero__tekst">
              <p className="lx-hero__pod ld-wjedz">
                <span className="ld-kropka" />
                {t.hero.pod}
              </p>
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
              <p className="ld-lead ld-wjedz" style={{ transitionDelay: "0.4s" }}>
                {t.hero.lead}
              </p>
              <div className="lx-hero__cta ld-wjedz" style={{ transitionDelay: "0.52s" }}>
                <Link className="ld-btn ld-btn--duzy" data-magnes href={signup}>
                  {t.hero.cta}
                  <Ikona nazwa="strzalka" />
                </Link>
                {/* Od razu do aplikacji demo, bez przystanku na stronie /demo. */}
                <form action="/wejdz-demo" method="post" className="contents">
                  <button className="ld-btn ld-btn--duch ld-btn--duzy">{t.hero.cta2}</button>
                </form>
              </div>
              <p className="lx-hero__drobne ld-wjedz" style={{ transitionDelay: "0.6s" }}>
                {t.hero.podCta}
              </p>
            </div>

            <div className="lx-dzis ld-wjedz" style={{ transitionDelay: "0.7s" }} data-plywa="1" aria-label={`${t.hero.priorytety.tytul}: ${t.pulpit.tytul}`} role="img">
              <div className="lx-dzis__gora" aria-hidden="true">
                <b>{t.hero.priorytety.tytul}</b>
                <span>agentspace.pl/app</span>
              </div>
              {t.hero.priorytety.karty.map((k, i) => (
                <div className="lx-dzis__karta" key={k.kto} style={{ transitionDelay: `${0.9 + i * 0.14}s` }} aria-hidden="true">
                  <Pierscien wynik={k.wynik} temp={k.temp} />
                  <div>
                    <b>{k.kto}</b>
                    <small>{k.powod}</small>
                  </div>
                  <em className={`lx-temp lx-temp--${k.temp}`}>{k.tempNazwa}</em>
                </div>
              ))}
              <div className="lx-dzis__coach" aria-hidden="true">
                <span className="ld-karta__ikona">
                  <Ikona nazwa="mikrofon" />
                </span>
                <div>
                  <b>{t.hero.rozmowa.etykieta}</b>
                  <small>
                    {t.hero.ocena.tytul}: {t.hero.ocena.wynik}/10
                  </small>
                </div>
                <div className="ld-fala">
                  {Array.from({ length: 10 }, (_, i) => (
                    <i key={i} style={{ animationDelay: `${((i * 7) % 10) / 10}s` }} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <nav className="lx-spis ld-wjedz" style={{ transitionDelay: "0.85s" }} aria-label={en ? "Chapters" : "Rozdziały"}>
            {t.rozdzialy.map((r, i) => (
              <a key={r} href={`#${kotwice[i]}`}>
                <span>{String(i + 1).padStart(2, "0")}</span>
                {r}
              </a>
            ))}
          </nav>
        </section>

        {/* ── 01 Pulpit: okno aplikacji wypłaszcza się przy przewijaniu ── */}
        <section className="lx-pulpit" id="pulpit">
          <div className="lx-pulpit__tor" data-plaszcz>
            <div className="lx-pulpit__pin">
              <div className="lx-pulpit__tekst">
                <Rozdzial nr={1} nazwa={t.rozdzialy[0]} />
                <Slowa tekst={t.pulpit.tytul} />
                <p className="ld-lead">{t.pulpit.lead}</p>
                <ol className="lx-pulpit__punkty">
                  {t.pulpit.punkty.map((p, i) => (
                    <li key={p.tytul} data-plaszcz-punkt={i}>
                      <b>{p.tytul}</b>
                      <span>{p.tekst}</span>
                    </li>
                  ))}
                </ol>
              </div>
              <div className="lx-pulpit__scena">
                <div className="lx-pulpit__okno" data-plaszcz-okno>
                  <Okno zrzut="pulpit" alt={en ? "AgentSpace dashboard: today's priorities with client scores" : "Pulpit AgentSpace: priorytety na dziś z oceną klientów"} priorytet />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Jeden program: wszystkie moduły w dwóch pasach ── */}
        <section className="lx-wszystko" aria-labelledby="lx-wszystko-tytul">
          <div className="lx-naglowek lx-naglowek--srodek">
            <span className="ld-etykieta">{t.wszystko.etykieta}</span>
            <Slowa tekst={t.wszystko.tytul} id="lx-wszystko-tytul" />
            <p className="ld-lead">{t.wszystko.lead}</p>
          </div>
          <div className="lx-pasy" aria-hidden="true">
            {t.wszystko.rzedy.map((rzad, r) => (
              <div className={`lx-pas${r === 1 ? " lx-pas--wstecz" : ""}`} key={r}>
                <div className="lx-pas__tasma">
                  {[...rzad, ...rzad].map((m, i) => (
                    <span key={i}>{m}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <ul className="lx-wszystko__punkty">
            {t.wszystko.punkty.map((p, i) => (
              <li key={p.tytul} data-odslon style={{ transitionDelay: `${i * 0.1}s` }}>
                <b>{p.tytul}</b>
                <span>{p.tekst}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* ── Manifest ── */}
        <section className="ld-manifest" aria-label={en ? "Why AgentSpace" : "Dlaczego AgentSpace"}>
          <p data-manifest>
            <span className="sr">{t.manifest}</span>
            {t.manifest.split(/\s+/).map((w, i) => (
              <span key={i} aria-hidden="true">
                <span className={`w${/AgentSpace|AI/.test(w) ? " akcent" : ""}`}>{w}</span>{" "}
              </span>
            ))}
          </p>
        </section>

        {/* ── 02 AI Coach: przypięta scena z zakładkami etapów ── */}
        <section className="lx-coach" id="coach">
          <div className="lx-naglowek">
            <Rozdzial nr={2} nazwa={t.rozdzialy[1]} />
            <Slowa tekst={t.coach.tytul} />
            <p className="ld-lead">{t.coach.lead}</p>
          </div>
          <div className="lx-coach__tor" data-etapy>
            <div className="lx-coach__pin">
              <div className="lx-etapy" role="tablist" aria-label={t.coach.etykieta}>
                {t.coach.kroki.map((k, i) => (
                  <button key={k.tytul} role="tab" className={i === 0 ? "on" : ""} aria-selected={i === 0} data-etap-tab={i}>
                    <span>{String(i + 1).padStart(2, "0")}</span>
                    {k.tytul}
                    <i>
                      <em />
                    </i>
                  </button>
                ))}
              </div>
              <div className="lx-coach__uklad">
                <div className="lx-coach__scena">
                  <Ilustracja nazwa="coach-telefon-tlo" rodzaj="panorama" ziarno={7} w={1600} h={1250} pora="noc" alt="" className="ld-ilu ld-widok-tlo" sizes="(max-width: 960px) 100vw, 60vw" />
                  {wizualeCoach.map((w, i) => (
                    <div className={`lx-coach__wizual${i === 0 ? " on" : ""}`} key={i} data-etap-wizual>
                      {w}
                    </div>
                  ))}
                </div>
                <div className="lx-coach__teksty">
                  {t.coach.kroki.map((k, i) => (
                    <article key={k.tytul} className={`lx-coach__tekst${i === 0 ? " on" : ""}`} data-etap-tekst>
                      <div className="lx-coach__inline">
                        <Ilustracja nazwa="coach-telefon-tlo" rodzaj="panorama" ziarno={7} w={1600} h={1250} pora="noc" alt="" className="ld-ilu ld-widok-tlo" sizes="100vw" />
                        <div className="lx-coach__wizual on">{wizualeCoach[i]}</div>
                      </div>
                      <h3>{k.tytul}</h3>
                      <p>{k.tekst}</p>
                      {k.cytat && (
                        <p className="ld-cytat">
                          <b>{k.cytat.kto}</b>
                          {k.cytat.tresc}
                        </p>
                      )}
                      {k.dopisek && <p className="lx-coach__dopisek">{k.dopisek}</p>}
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="ld-liczby-pas">
            {t.coach.liczby.map((l) => (
              <div key={l.opis} data-odslon>
                <b className="ld-gradient">
                  <Licznik wartosc={l.wartosc} />
                </b>
                <span>{l.opis}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── 03 Teren: dzień agenta na poziomym torze ── */}
        <section className="lx-teren ld-jasna" id="teren">
          <div className="lx-naglowek lx-naglowek--rzad">
            <div>
              <Rozdzial nr={3} nazwa={t.rozdzialy[2]} />
              <Slowa tekst={t.dzien.tytul} />
            </div>
            <p className="ld-lead">{t.dzien.lead}</p>
          </div>
          <div className="lx-teren__tor" data-poziomo>
            <div className="lx-teren__pin">
              <div className="lx-teren__szyna" data-poziomo-szyna>
                {t.dzien.momenty.map((m, i) => (
                  <article className="lx-moment" key={m.pora}>
                    <div className="lx-moment__obraz">
                      <Ilustracja nazwa={m.obraz} rodzaj={scenyDnia[i].rodzaj} pora={scenyDnia[i].pora} ziarno={11 + i * 7} w={1600} h={2000} alt={m.tytul} sizes="(max-width: 960px) 100vw, 34vw" />
                      <span className="lx-moment__pora">{m.pora}</span>
                    </div>
                    <div className="lx-moment__tekst">
                      <h3>{m.tytul}</h3>
                      <p>{m.tekst}</p>
                      <ul className="ld-punkty">
                        {m.punkty.map((p) => (
                          <li key={p}>{p}</li>
                        ))}
                      </ul>
                    </div>
                  </article>
                ))}
              </div>
              <div className="lx-zegar" aria-hidden="true">
                <i>
                  <em data-poziomo-pasek />
                </i>
                {t.dzien.momenty.map((m, i) => (
                  <span key={m.pora} data-poziomo-znacznik={i} style={{ left: `${(i / (t.dzien.momenty.length - 1)) * 100}%` }}>
                    {m.pora}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── 04 Biuro: panorama z paralaksą i kafelki właściciela ── */}
        <section className="lx-biuro" id="biuro">
          <div className="lx-biuro__baner">
            <div className="lx-biuro__foto" data-paralaksa="0.22">
              <Ilustracja nazwa="miasto-zmierzch" rodzaj="ulica" ziarno={7} w={1600} h={900} pora="zmierzch" alt={en ? "Kraków tenements at dusk, an office light on" : "Kamienice w Krakowie o zmierzchu, w jednej świeci biuro"} />
            </div>
            <div className="lx-biuro__baner-tekst">
              <Rozdzial nr={4} nazwa={t.rozdzialy[3]} />
              <h2 className="ld-h2">{t.rozszerzenie.tytul}</h2>
              <p className="ld-lead">{t.rozszerzenie.lead}</p>
            </div>
          </div>
          <div className="lx-biuro__wnetrze ld-jasna">
            <div className="lx-naglowek lx-naglowek--rzad">
              <div>
                <span className="ld-etykieta">{t.wlasciciel.etykieta}</span>
                <Slowa tekst={t.wlasciciel.tytul} />
              </div>
              <p className="ld-lead">{t.wlasciciel.lead}</p>
            </div>
            <div className="lx-bento">
              {t.wlasciciel.karty.map((k, i) => (
                <Link href={href(k.href)} className={`lx-bento__karta lx-bento__karta--${i + 1}`} key={k.tytul} data-odslon-klasa>
                  <div className="lx-bento__obraz">
                    <Image src={`/strona/zrzuty/${k.zrzut}.webp`} alt={k.tytul} width={2000} height={1250} sizes="(max-width: 960px) 100vw, 60vw" />
                  </div>
                  <div className="lx-bento__tekst">
                    <h3>{k.tytul}</h3>
                    <p>{k.tekst}</p>
                    <span className="ld-wkarta__link">
                      {en ? "Learn more" : "Zobacz więcej"}
                      <Ikona nazwa="strzalka" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
            <ul className="lx-biuro__lista">
              {t.wlasciciel.lista.map((l, i) => (
                <li key={l.tytul} data-odslon>
                  <span>{String(i + 1).padStart(2, "0")}</span>
                  <b>{l.tytul}</b>
                  <p>{l.tekst}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── Indeks modułów: okno po lewej, spis po prawej ── */}
        <section className="lx-indeks" id="moduly">
          <div className="lx-naglowek">
            <span className="ld-etykieta">{t.moduly.etykieta}</span>
            <Slowa tekst={t.moduly.tytul} />
          </div>
          <div className="lx-indeks__uklad" data-historia>
            <div className="lx-indeks__bok">
              <div className="lx-indeks__okno">
                <figure className="ld-okno">
                  <div className="ld-okno__pasek" aria-hidden="true">
                    <i />
                    <i />
                    <i />
                    <span>agentspace.pl/app</span>
                  </div>
                  <div className="lx-indeks__zrzuty">
                    {t.moduly.lista.map((m) => (
                      <div key={m.nazwa} className="lx-indeks__zrzut" data-ekran>
                        <Image src={`/strona/zrzuty/${m.zrzut}.webp`} alt={`${m.nazwa}: ${m.tytul}`} width={2000} height={1250} sizes="(max-width: 960px) 100vw, 55vw" />
                      </div>
                    ))}
                  </div>
                </figure>
              </div>
            </div>
            <ol className="lx-indeks__lista">
              {t.moduly.lista.map((m, i) => (
                <li className="ld-krok lx-indeks__poz" key={m.nazwa}>
                  <div className="ld-inline lx-indeks__inline">
                    <Okno zrzut={m.zrzut} alt={`${m.nazwa}: ${m.tytul}`} male />
                  </div>
                  <span className="lx-indeks__nr">{String(i + 1).padStart(2, "0")}</span>
                  <h3>{m.nazwa}</h3>
                  <p>
                    <b>{m.tytul}</b> {m.tekst}
                  </p>
                </li>
              ))}
            </ol>
          </div>
          <Link className="lx-indeks__wiecej" href={href("/produkt")}>
            {en ? "All modules" : "Wszystkie moduły"}
            <Ikona nazwa="strzalka" />
          </Link>
        </section>

        {/* ── Liczby: pas z odliczaniem ── */}
        <section className="lx-liczby" aria-label={t.liczby.etykieta}>
          <span className="lx-liczby__etykieta">{t.liczby.etykieta}</span>
          <div className="lx-liczby__rzad">
            {t.liczby.slajdy.map((s) => (
              <div key={s.wartosc} data-odslon>
                <b>
                  <Licznik wartosc={s.wartosc} />
                </b>
                <span>{s.opis}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Dla kogo: rozwijane panele ── */}
        <section className="lx-kogo ld-jasna">
          <div className="lx-naglowek lx-naglowek--rzad">
            <div>
              <Slowa tekst={t.dlaKogo.tytul} />
            </div>
            <p className="ld-lead">{t.dlaKogo.lead}</p>
          </div>
          <div className="lx-kogo__rzad">
            {t.dlaKogo.karty.map((k, i) => (
              <article className="lx-panel" key={k.tytul} tabIndex={0} data-odslon-klasa>
                <Ilustracja nazwa={k.obraz} rodzaj={(["narozna", "biurowiec", "agent"] as RodzajSceny[])[i]} ziarno={3 + i * 5} w={600} h={760} pora={i === 1 ? "noc" : "zmierzch"} alt={k.tytul} sizes="(max-width: 960px) 100vw, 50vw" />
                <div className="lx-panel__tekst">
                  <span>{String(i + 1).padStart(2, "0")}</span>
                  <h3>{k.tytul}</h3>
                  <p>{k.tekst}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* ── Porównanie ── */}
        <section className="ld-por" data-odslon-klasa>
          <div className="lx-naglowek lx-naglowek--srodek">
            <span className="ld-etykieta">{t.porownanie.etykieta}</span>
            <Slowa tekst={t.porownanie.tytul} />
            <p className="ld-lead">{t.porownanie.lead}</p>
          </div>
          <div className="ld-por__tabela">
            <table>
              <thead>
                <tr>
                  <th scope="col">
                    <span className="sr">{en ? "Feature" : "Funkcja"}</span>
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
        <section className="ld-cennik ld-jasna" id="cennik">
          <div className="lx-naglowek lx-naglowek--srodek">
            <span className="ld-etykieta">{t.cennik.etykieta}</span>
            <Slowa tekst={t.cennik.tytul} />
            <p className="ld-lead">{t.cennik.lead}</p>
          </div>
          <CennikPlany
            plany={PLANS.map((plan) => {
              const opis = plany.find((p) => p.id === plan.id) ?? plany[0];
              return { id: plan.id, price: plan.price, priceFrom: plan.priceFrom, name: opis.name, tagline: opis.tagline, features: opis.features };
            })}
            en={en}
            polecany={t.cennik.polecany}
            wybierz={t.cennik.wybierz}
            miesiac={t.cennik.miesiac}
            od={t.cennik.od}
          />
          <SoloBaner en={en} />
          <div className="lx-srodek">
            <Link className="ld-cennik__pelny" href={href("/cennik")}>
              {t.cennik.pelny}
              <Ikona nazwa="strzalka" />
            </Link>
          </div>
        </section>

        {/* ── 05 Start: oś z trzema krokami ── */}
        <section className="lx-start" id="start">
          <div className="lx-naglowek lx-naglowek--rzad">
            <div>
              <Rozdzial nr={5} nazwa={t.rozdzialy[4]} />
              <Slowa tekst={t.start.tytul} />
            </div>
            <p className="ld-lead">{t.start.lead}</p>
          </div>
          <div className="lx-os" data-linia>
            <div className="lx-os__linia" aria-hidden="true">
              <em data-linia-pasek />
            </div>
            {t.start.kroki.map((k, i) => (
              <article key={k.tytul} className="lx-os__krok" data-linia-wezel={i}>
                <span className="lx-os__wezel">{i + 1}</span>
                <h3>{k.tytul}</h3>
                <p>{k.tekst}</p>
                <div className="ld-skarta__ui lx-os__ui" aria-hidden="true">
                  {i === 0 && (
                    <>
                      <div className="ld-pole">
                        <small>{en ? "Agency name" : "Nazwa biura"}</small>
                        <span>{en ? "e.g. Spectra Real Estate" : "np. Spectra Nieruchomości"}</span>
                      </div>
                      <div className="ld-pole ok">
                        <small>{en ? "Work email" : "E-mail służbowy"}</small>
                        <span>biuro@twojebiuro.pl</span>
                        <Ikona nazwa="ptaszek" />
                      </div>
                      <div className="ld-pole ok">
                        <small>{en ? "Trial" : "Okres próbny"}</small>
                        <span>{en ? `${DNI_PROBNE} days` : `${DNI_PROBNE} dni`}</span>
                        <Ikona nazwa="ptaszek" />
                      </div>
                    </>
                  )}
                  {i === 1 &&
                    [
                      [en ? "clients.xlsx" : "klienci.xlsx", en ? "412 clients" : "412 klientów", 100],
                      [en ? "listings.csv" : "oferty.csv", en ? "86 listings" : "86 ofert", 100],
                      [en ? "contacts.xlsx" : "kontakty.xlsx", en ? "matching columns" : "dopasowanie kolumn", 62],
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
                        {v === 100 ? <span className="ok">{en ? "done" : "gotowe"}</span> : <small>{v}%</small>}
                      </div>
                    ))}
                  {i === 2 &&
                    [
                      ["ZM", "Zofia M.", en ? "Manager" : "Menedżer", "#6ee7c8"],
                      ["AW", "Adam W.", "Agent", "#67e8f9"],
                      ["EB", "Ewa B.", en ? "Accountant" : "Księgowa", "#bae6fd"],
                    ].map(([ini, kto, rola, kolor]) => (
                      <div className="ld-osoba" key={kto}>
                        <span className="ld-osoba__awatar" style={{ background: kolor }}>
                          {ini}
                        </span>
                        <div>
                          <b>{kto}</b>
                          <small>{en ? "invitation sent" : "zaproszenie wysłane"}</small>
                        </div>
                        <em>{rola}</em>
                      </div>
                    ))}
                </div>
              </article>
            ))}
          </div>
          <div className="lx-srodek">
            <Link className="ld-btn ld-btn--duzy" data-magnes href={signup}>
              {t.start.cta}
              <Ikona nazwa="strzalka" />
            </Link>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="ld-faq ld-jasna" id="pytania">
          <div className="ld-faq__siatka">
            <div className="ld-faq__bok">
              <Slowa tekst={t.faq.tytul} />
              <p className="ld-lead">
                {en ? "Something else? " : "Coś jeszcze? "}
                <Link href={href("/kontakt")}>{en ? "Write to us" : "Napisz do nas"}</Link>
              </p>
            </div>
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

        {/* ── Koniec: pełny kadr z formularzem w jednej linii ── */}
        <section className="lx-koniec" aria-label={t.koniec.tytul}>
          <div className="lx-koniec__tlo" data-paralaksa="0.16" aria-hidden="true">
            <span className="ld-ilu"><Image src="/strona/podstrony/naglowek-produkt.webp" alt="" fill sizes="100vw" /></span>
          </div>
          <div className="lx-koniec__tresc">
            <Slowa tekst={t.koniec.tytul} />
            <p className="ld-lead">{t.koniec.lead}</p>
            <form className="lx-koniec__form" action="/signup" method="get">
              <label htmlFor="ld-email" className="sr">
                {t.koniec.pole}
              </label>
              <input id="ld-email" name="email" type="email" autoComplete="email" required placeholder={t.koniec.pole} />
              <button className="ld-btn ld-btn--duzy" type="submit" data-magnes>
                {t.koniec.przycisk}
                <Ikona nazwa="strzalka" />
              </button>
            </form>
            <p className="ld-koniec__alt">
              {t.koniec.alt} <Link href={href("/demo")}>{t.koniec.altLink}</Link>
            </p>
          </div>
        </section>
      </main>

      <LdStopka lang={locale} />
    </div>
  );
}
