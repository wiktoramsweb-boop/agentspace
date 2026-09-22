import Image from "next/image";
import Link from "next/link";
import { WzSearch } from "../search";
import { OfferCard } from "../offer-card";
import { LeadForm } from "../lead-form";
import {
  DEMO_AGENTS,
  DEMO_ARTICLES,
  DEMO_OFFERS,
  KIND_LABELS,
  districts,
  getOffer,
  pln,
  pricePerM2,
} from "@/lib/wzory/data";

const STATS: [string, string][] = [
  ["128", "transakcji w 2025 roku"],
  ["21 dni", "mediana czasu sprzedaży"],
  ["98%", "ceny ofertowej średnio"],
  ["17 lat", "na krakowskim rynku"],
];

const STEPS: [string, string, string][] = [
  [
    "01",
    "Wycena i przygotowanie",
    "Zaczynamy od danych: ceny transakcyjne z okolicy, stan techniczny, dokumenty. Potem home staging, zdjęcia i rzut. Dopiero wtedy oferta idzie w świat.",
  ],
  [
    "02",
    "Prezentacje i negocjacje",
    "Dobieramy kupujących z naszej bazy poszukiwań, zanim wystawimy ofertę na portale. Każdą prezentację prowadzi agent, nigdy właściciel sam.",
  ],
  [
    "03",
    "Umowa i przekazanie",
    "Pilnujemy księgi wieczystej, zaświadczeń i terminów u notariusza. Kończymy protokołem zdawczym i przepisaniem mediów.",
  ],
];

export function HomeKamienica({ wzor }: { wzor: string }) {
  const spot = getOffer("o1")!;
  const featured = DEMO_OFFERS.filter((o) => o.featured && o.id !== spot.id).slice(0, 3);
  const fresh = DEMO_OFFERS.filter((o) => o.fresh).slice(0, 3);
  const areas = districts().slice(0, 8);

  return (
    <>
      {/* ───────── nagłówek ───────── */}
      <section className="wz-wrap kam-hero">
        <div className="kam-hero__grid">
          <div>
            <p className="kam-hero__eyebrow">Biuro nieruchomości od 2009 roku</p>
            <h1>
              Mieszkania, które <em>zostają w pamięci</em>
            </h1>
            <p className="kam-hero__sub">
              Prowadzimy sprzedaż kamienic, apartamentów i domów w Krakowie. Bez obietnic bez pokrycia, za to z liczbami,
              które możesz sprawdzić.
            </p>
            <div className="kam-hero__meta" data-revs>
              {STATS.slice(0, 3).map(([n, l]) => (
                <div key={l}>
                  <b>{n}</b>
                  <span>{l}</span>
                </div>
              ))}
            </div>
          </div>

          <figure className="kam-hero__img wz-img" style={{ margin: 0 }}>
            <Image src="/wzory/kamienica.jpg" alt="Kamienica w centrum Krakowa" fill priority sizes="(max-width: 900px) 100vw, 45vw" />
          </figure>
        </div>

        <div className="kam-search" data-rev>
          <p className="kam-search__t">Czego szukasz</p>
          <WzSearch wzor={wzor} />
        </div>
      </section>

      {/* ───────── liczby ───────── */}
      <section className="wz-sec wz-sec--tight">
        <div className="wz-wrap">
          <div className="kam-stats" data-revs>
            {STATS.map(([n, l]) => (
              <div key={l}>
                <b>{n}</b>
                <span>{l}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── oferta tygodnia ───────── */}
      <section className="wz-sec" id="oferty">
        <div className="wz-wrap">
          <div className="kam-head">
            <div>
              <p className="wz-kick">Oferta tygodnia</p>
              <h2 className="wz-h2" style={{ fontWeight: 300 }}>
                Jedna, którą warto zobaczyć
              </h2>
            </div>
            <Link href={`/wzory/${wzor}/oferty`} className="wz-btn wz-btn--ghost">
              Wszystkie oferty
            </Link>
          </div>

          <div className="kam-spot" data-rev>
            <Link href={`/wzory/${wzor}/oferta/${spot.id}`} className="kam-spot__img wz-img">
              <Image src={spot.photos[0]} alt={spot.title} fill sizes="(max-width: 900px) 100vw, 55vw" />
            </Link>
            <div>
              <p className="kam-spot__no">{spot.no}</p>
              <h3>{spot.title}</h3>
              <p className="wz-lead" style={{ fontSize: 17 }}>
                {spot.lead}
              </p>
              <div className="kam-spot__params">
                <span>
                  <b>{spot.area}</b> m²
                </span>
                <span>
                  <b>{spot.rooms}</b> pokoje
                </span>
                <span>
                  piętro <b>{spot.floor}</b>
                </span>
                <span>
                  rok <b>{spot.year}</b>
                </span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: 16, marginBottom: 24 }}>
                <span className="kam-spot__price">{pln(spot.price)}</span>
                <span className="wz-muted">{pricePerM2(spot)}</span>
              </div>
              <Link href={`/wzory/${wzor}/oferta/${spot.id}`} className="wz-btn">
                Zobacz pełną ofertę
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── wybrane oferty ───────── */}
      <section className="wz-sec wz-sec--tight">
        <div className="wz-wrap">
          <div className="kam-head">
            <div>
              <p className="wz-kick">Wybrane z bazy</p>
              <h2 className="wz-h2" style={{ fontWeight: 300 }}>
                Polecamy w tym miesiącu
              </h2>
            </div>
          </div>
          <div className="wz-grid" data-revs>
            {featured.map((o) => (
              <OfferCard key={o.id} offer={o} wzor={wzor} />
            ))}
          </div>
        </div>
      </section>

      {/* ───────── manifest ───────── */}
      <section className="wz-sec kam-quote">
        <div className="wz-wrap kam-quote__grid">
          <blockquote data-rev>
            Nie sprzedajemy metrów. Sprzedajemy decyzję, przy której ktoś zostanie na dziesięć lat.
          </blockquote>
          <div className="kam-quote__side" data-revs>
            <p>
              <b>Każdą ofertę prowadzi jeden agent</b>
              <br />
              Ten sam człowiek od wyceny po notariusza. Nie przekazujemy klienta dalej w trakcie.
            </p>
            <p>
              <b>Zdjęcia robi fotograf</b>
              <br />
              Sesja, rzut i film są po naszej stronie i w naszym koszcie, niezależnie od ceny nieruchomości.
            </p>
            <p>
              <b>Raport co dwa tygodnie</b>
              <br />
              Ile było wyświetleń, ile telefonów, ile prezentacji i co mówili kupujący. Na piśmie.
            </p>
          </div>
        </div>
      </section>

      {/* ───────── jak pracujemy ───────── */}
      <section className="wz-sec" id="jak-pracujemy">
        <div className="wz-wrap">
          <div className="kam-head">
            <div>
              <p className="wz-kick">Jak pracujemy</p>
              <h2 className="wz-h2" style={{ fontWeight: 300 }}>
                Trzy etapy, żadnych niespodzianek
              </h2>
            </div>
          </div>
          <div className="kam-steps" data-revs>
            {STEPS.map(([n, t, d]) => (
              <article key={n}>
                <b>{n}</b>
                <h3>{t}</h3>
                <p>{d}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── nowości ───────── */}
      <section className="wz-sec wz-sec--tight">
        <div className="wz-wrap">
          <div className="kam-head">
            <div>
              <p className="wz-kick">Świeżo w bazie</p>
              <h2 className="wz-h2" style={{ fontWeight: 300 }}>
                Nowe w tym tygodniu
              </h2>
              <p className="wz-lead">
                Oferty trafiają tutaj automatycznie, w tej samej minucie, w której agent doda je w systemie biura.
              </p>
            </div>
          </div>
          <div className="wz-grid" data-revs>
            {fresh.map((o) => (
              <OfferCard key={o.id} offer={o} wzor={wzor} />
            ))}
          </div>
        </div>
      </section>

      {/* ───────── zespół ───────── */}
      <section className="wz-sec" id="zespol">
        <div className="wz-wrap">
          <div className="kam-head">
            <div>
              <p className="wz-kick">Ludzie</p>
              <h2 className="wz-h2" style={{ fontWeight: 300 }}>
                Cztery osoby, jedna odpowiedzialność
              </h2>
            </div>
            <Link href={`/wzory/${wzor}/zespol`} className="wz-btn wz-btn--ghost">
              Poznaj zespół
            </Link>
          </div>
          <div className="kam-team" data-revs>
            {DEMO_AGENTS.map((a) => (
              <figure key={a.id}>
                <div className="kam-team__img wz-img">
                  <Image src={a.photo} alt={a.name} fill sizes="(max-width: 900px) 50vw, 24vw" />
                </div>
                <b>{a.name}</b>
                <span>{a.role}</span>
                <br />
                <a href={`tel:${a.phone.replace(/\s/g, "")}`}>{a.phone}</a>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── dzielnice ───────── */}
      <section className="wz-sec wz-sec--tight">
        <div className="wz-wrap">
          <div className="kam-head">
            <div>
              <p className="wz-kick">Gdzie działamy</p>
              <h2 className="wz-h2" style={{ fontWeight: 300 }}>
                Dzielnice, które znamy z osobna
              </h2>
            </div>
          </div>
          <div className="kam-areas" data-revs>
            {areas.map((a) => (
              <Link key={a.name} href={`/wzory/${wzor}/oferty?dzielnica=${encodeURIComponent(a.name)}`}>
                {a.name} <i>{a.count}</i>
              </Link>
            ))}
            {Object.entries(KIND_LABELS)
              .slice(0, 3)
              .map(([v, l]) => (
                <Link key={v} href={`/wzory/${wzor}/oferty?typ=${v}`}>
                  {l} <i>wszystkie</i>
                </Link>
              ))}
          </div>
        </div>
      </section>

      {/* ───────── wiedza ───────── */}
      <section className="wz-sec" id="wiedza">
        <div className="wz-wrap">
          <div className="kam-head">
            <div>
              <p className="wz-kick">Poradnik</p>
              <h2 className="wz-h2" style={{ fontWeight: 300 }}>
                Wiedza, która oszczędza pieniądze
              </h2>
            </div>
          </div>
          <div className="kam-know" data-revs>
            {DEMO_ARTICLES.map((a) => (
              <article key={a.slug}>
                <div className="kam-know__img wz-img">
                  <Image src={a.photo} alt="" fill sizes="(max-width: 860px) 100vw, 33vw" />
                </div>
                <time>
                  {a.date} · {a.read} min
                </time>
                <h3>{a.title}</h3>
                <p>{a.lead}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── kontakt ───────── */}
      <section className="wz-sec" id="kontakt">
        <div className="wz-wrap kam-cta">
          <div>
            <p className="wz-kick">Rozmowa bez zobowiązań</p>
            <h2 className="wz-h2" style={{ fontWeight: 300, marginBottom: 20 }}>
              Chcesz wiedzieć, ile naprawdę warte jest Twoje mieszkanie?
            </h2>
            <p className="wz-lead" style={{ marginBottom: 26 }}>
              Przygotujemy wycenę na podstawie cen transakcyjnych z Twojej okolicy, a nie ofertowych z portali. Za darmo
              i bez zobowiązania do podpisania umowy.
            </p>
            <div className="kam-spot__params" style={{ marginTop: 0 }}>
              <span>
                <b>2 godziny</b> średni czas odpowiedzi
              </span>
              <span>
                <b>0 zł</b> za wycenę
              </span>
            </div>
          </div>
          <div className="kam-cta__box">
            <LeadForm kind="kontakt" />
          </div>
        </div>
      </section>
    </>
  );
}
