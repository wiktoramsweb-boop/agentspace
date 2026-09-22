import Image from "next/image";
import Link from "next/link";
import { WzSearch } from "../search";
import { OfferCard } from "../offer-card";
import { LeadForm } from "../lead-form";
import { WzMap } from "../map";
import { Counter, Head, Marquee } from "../bits";
import { DEMO_OFFERS, DEMO_REVIEWS } from "@/lib/wzory/data";

const CARDS: [string, string, string][] = [
  ["🌳", "Domy z ogrodem", "Wolnostojące i bliźniaki w promieniu trzydziestu minut od centrum. Sprawdzamy nasłonecznienie działki i realny czas dojazdu w godzinach szczytu."],
  ["📐", "Działki budowlane", "Warunki zabudowy, media, dojazd i służebności. Mówimy wprost, czego nie da się na danej działce postawić."],
  ["🏡", "Domy z rynku wtórnego", "Wiemy, po czym poznać dom, w którym za trzy lata trzeba wymienić dach. Oglądamy razem z Tobą i z fachowcem."],
];

const DIST: [string, string][] = [
  ["Centrum Krakowa", "22 minuty samochodem"],
  ["Szkoła podstawowa", "6 minut pieszo"],
  ["Przedszkole", "8 minut pieszo"],
  ["Sklep i piekarnia", "4 minuty pieszo"],
  ["Przystanek autobusowy", "3 minuty pieszo"],
  ["Las i ścieżki biegowe", "za płotem"],
];

export function HomeOgrod({ wzor }: { wzor: string }) {
  const houses = DEMO_OFFERS.filter((o) => o.kind === "dom" || o.kind === "dzialka");
  const rest = DEMO_OFFERS.filter((o) => !houses.includes(o)).slice(0, 3);

  return (
    <>
      {/* ───────── nagłówek ───────── */}
      <section className="wz-wrap ogr-hero">
        <div className="ogr-hero__grid">
          <div>
            <p className="wz-kick">Domy i działki pod Krakowem</p>
            <h1>
              Miejsce, w którym <em>słychać ptaki</em>, a nie tramwaj
            </h1>
            <p className="ogr-hero__sub">
              Specjalizujemy się w domach i działkach na północ i zachód od Krakowa. Znamy te okolice, bo sami tu
              mieszkamy i wiemy, gdzie naprawdę warto kupić.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 28 }}>
              <Link href={`/wzory/${wzor}/oferty?typ=dom`} className="wz-btn">
                Zobacz domy
              </Link>
              <Link href={`/wzory/${wzor}/oferty?typ=dzialka`} className="wz-btn wz-btn--ghost">
                Działki budowlane
              </Link>
            </div>
          </div>

          <div style={{ position: "relative" }}>
            <div className="ogr-hero__img wz-img" data-rev data-rev-zoom>
              <Image src="/wzory/dom-las.jpg" alt="Dom przy lesie" fill priority sizes="(max-width: 920px) 100vw, 44vw" />
            </div>
            <span className="ogr-hero__leaf">
              22 minuty
              <br />
              do Rynku
            </span>
          </div>
        </div>

        <div className="ogr-search" data-rev>
          <WzSearch wzor={wzor} />
        </div>
      </section>

      {/* ───────── w czym pomagamy ───────── */}
      <section className="wz-sec wz-sec--tight">
        <div className="wz-wrap">
          <Head kick="Specjalizacja" title="Trzy rzeczy, w których jesteśmy naprawdę dobrzy" />
          <div className="ogr-cards" data-revs>
            {CARDS.map(([ico, t, d]) => (
              <article key={t} className="ogr-card">
                <span className="ogr-card__ico" aria-hidden="true">
                  {ico}
                </span>
                <h3>{t}</h3>
                <p>{d}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── oferty ───────── */}
      <section className="wz-sec wz-sec--tight" id="oferty">
        <div className="wz-wrap">
          <Head
            kick="Nasze oferty"
            title="Domy i działki w sprzedaży"
            action={
              <Link href={`/wzory/${wzor}/oferty`} className="wz-btn wz-btn--ghost">
                Wszystkie oferty
              </Link>
            }
          />
          <div className="wz-grid" data-revs>
            {houses.map((o, i) => (
              <OfferCard key={o.id} offer={o} wzor={wzor} priority={i === 0} />
            ))}
          </div>
        </div>
      </section>

      {/* ───────── okolica ───────── */}
      <section className="wz-sec wz-sec--tight">
        <div className="wz-wrap ogr-area">
          <div className="ogr-area__img wz-img" data-rev data-rev-zoom>
            <Image src="/wzory/park.jpg" alt="Okolica" fill sizes="(max-width: 900px) 100vw, 45vw" />
          </div>
          <div>
            <Head
              kick="Okolica"
              title="Sprawdzamy to, o co i tak zapytasz"
              lead="Przy każdej ofercie podajemy realne czasy dojazdu i to, co jest w zasięgu spaceru. Bez zaokrąglania w swoją stronę."
            />
            <ul className="ogr-dist" style={{ listStyle: "none", margin: 0, padding: 0 }} data-revs>
              {DIST.map(([a, b]) => (
                <li key={a}>
                  <span>{a}</span>
                  <b>{b}</b>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ───────── mapa ───────── */}
      <section className="wz-sec wz-sec--tight">
        <div className="wz-wrap">
          <Head kick="Na mapie" title="Gdzie są nasze oferty" />
          <div className="ogr-map" data-rev>
            <WzMap offers={DEMO_OFFERS} wzor={wzor} />
          </div>
        </div>
      </section>

      {/* ───────── liczby ───────── */}
      <section className="wz-sec wz-sec--tight">
        <div className="wz-wrap">
          <div className="wz-stats-row" data-revs>
            <Counter value={186} label="sprzedanych domów" />
            <Counter value={74} label="dni mediana sprzedaży domu" />
            <Counter value={12} label="gmin, które znamy na wylot" />
            <Counter value={4.9} decimals={1} label="ocena w Google" />
          </div>
        </div>
      </section>

      {/* ───────── mieszkania też ───────── */}
      <section className="wz-sec wz-sec--tight">
        <div className="wz-wrap">
          <Head kick="Nie tylko domy" title="Mamy też mieszkania w mieście" />
          <div className="wz-grid" data-revs>
            {rest.map((o) => (
              <OfferCard key={o.id} offer={o} wzor={wzor} />
            ))}
          </div>
        </div>
      </section>

      {/* ───────── opinie ───────── */}
      <section className="wz-sec wz-sec--tight">
        <div className="wz-wrap">
          <Head kick="Opinie" title="Co mówią sąsiedzi" />
        </div>
        <Marquee speed={58} gap={20}>
          {DEMO_REVIEWS.map((r) => (
            <figure key={r.who} className="wz-review">
              <p className="wz-review__stars">★★★★★</p>
              <blockquote>{r.text}</blockquote>
              <figcaption>
                <span className="wz-review__av">{r.initials}</span>
                <span>
                  <b>{r.who}</b>
                  <span>{r.what}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </Marquee>
      </section>

      {/* ───────── kontakt ───────── */}
      <section className="wz-sec" id="kontakt">
        <div className="wz-wrap">
          <div className="ogr-cta" data-rev>
            <div>
              <p className="wz-kick">Zapraszamy na spacer</p>
              <h2 className="wz-h2" style={{ marginBottom: 16 }}>
                Pokażemy okolicę, zanim pokażemy dom
              </h2>
              <p className="wz-lead">
                Umawiamy się na miejscu i zaczynamy od spaceru po okolicy. Dopiero potem wchodzimy do środka, bo dom
                można wyremontować, a sąsiedztwa nie.
              </p>
            </div>
            <div className="wz-box">
              <LeadForm kind="kontakt" />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
