import Image from "next/image";
import Link from "next/link";
import { WzSearch } from "../search";
import { OfferCard } from "../offer-card";
import { LeadForm } from "../lead-form";
import { DEMO_OFFERS, getOffer } from "@/lib/wzory/data";

const SERVICES: [string, string, string][] = [
  [
    "I",
    "Sprzedaż z dyskrecją",
    "Ofertę pokazujemy najpierw wąskiej grupie kupujących z naszej bazy. Na portale trafia dopiero wtedy, gdy właściciel tak zdecyduje.",
  ],
  [
    "II",
    "Najem długoterminowy",
    "Weryfikacja najemcy, umowa przygotowana przez prawnika, protokół i rozliczanie mediów. Właściciel dostaje raz w miesiącu jeden przelew i jeden raport.",
  ],
  [
    "III",
    "Doradztwo inwestycyjne",
    "Liczymy rentowność przed zakupem: czynsz możliwy do uzyskania, koszty, podatek i realna stopa zwrotu po roku.",
  ],
];

const STATS: [string, string][] = [
  ["54", "transakcje premium"],
  ["7,4 mln", "najwyższa transakcja"],
  ["31", "dni do umowy"],
  ["4", "języki obsługi"],
];

export function HomeNokturn({ wzor }: { wzor: string }) {
  const base = `/wzory/${wzor}`;
  const collection = DEMO_OFFERS.filter((o) => o.price > 1_000_000).slice(0, 3);
  const rest = DEMO_OFFERS.filter((o) => !collection.includes(o)).slice(0, 6);
  const spot = getOffer("o8")!;

  return (
    <>
      {/* ───────── nagłówek ───────── */}
      <header className="nok-hero">
        <div className="nok-hero__bg">
          <Image src="/wzory/miasto-noc.jpg" alt="Panorama miasta nocą" fill priority sizes="100vw" />
        </div>
        <div className="wz-wrap nok-hero__in">
          <div className="nok-hero__line" />
          <h1>Adresy, których nie ma na portalach</h1>
          <p>
            Kameralne biuro zajmujące się wyłącznie rynkiem premium w Krakowie. Prowadzimy kilkanaście transakcji
            rocznie, żeby każdej poświęcić tyle czasu, ile wymaga.
          </p>
          <div className="nok-hero__row">
            <Link href={`/wzory/${wzor}/oferty`} className="wz-btn">
              Zobacz kolekcję
            </Link>
            <Link href={`/wzory/${wzor}/kontakt`} className="wz-btn wz-btn--ghost">
              Prywatna prezentacja
            </Link>
          </div>
        </div>
        <span className="nok-hero__scroll">Przewiń</span>
      </header>

      {/* ───────── wyszukiwarka ───────── */}
      <section className="nok-search">
        <div className="wz-wrap nok-search__in">
          <WzSearch base={base} offers={DEMO_OFFERS} compact />
        </div>
      </section>

      {/* ───────── kolekcja ───────── */}
      <section className="wz-sec" id="oferty">
        <div className="wz-wrap">
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: 18, marginBottom: 46 }}>
            <div>
              <p className="wz-kick">Kolekcja</p>
              <h2 className="wz-h2">Wybrane apartamenty</h2>
            </div>
            <Link href={`/wzory/${wzor}/oferty`} className="wz-btn wz-btn--ghost">
              Pełna lista
            </Link>
          </div>
          <div className="nok-col" data-revs>
            {collection.map((o) => (
              <OfferCard key={o.id} offer={o} base={base} />
            ))}
          </div>
        </div>
      </section>

      {/* ───────── usługi ───────── */}
      <section className="wz-sec wz-sec--tight">
        <div className="wz-wrap nok-split">
          <figure className="nok-split__img wz-img" style={{ margin: 0 }} data-rev>
            <Image src="/wzory/lounge.jpg" alt="Wnętrze apartamentu" fill sizes="(max-width: 900px) 100vw, 45vw" />
          </figure>
          <div>
            <p className="wz-kick">Zakres obsługi</p>
            <h2 className="wz-h2" style={{ marginBottom: 30 }}>
              Trzy rzeczy, które robimy dobrze
            </h2>
            <div className="nok-serv" data-revs>
              {SERVICES.map(([n, t, d]) => (
                <article key={n}>
                  <b>{n}</b>
                  <div>
                    <h3>{t}</h3>
                    <p>{d}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ───────── liczby ───────── */}
      <section className="wz-sec wz-sec--tight">
        <div className="wz-wrap">
          <div className="nok-stats" data-revs>
            {STATS.map(([n, l]) => (
              <div key={l}>
                <b>{n}</b>
                <span>{l}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── wyróżniona oferta ───────── */}
      <section className="wz-sec wz-sec--tight">
        <div className="wz-wrap nok-split">
          <div>
            <p className="wz-kick">Oferta wyróżniona</p>
            <h2 className="wz-h2" style={{ marginBottom: 18 }}>
              {spot.title}
            </h2>
            <p className="wz-lead" style={{ marginBottom: 26 }}>
              {spot.lead}
            </p>
            <div className="nok-cta__list" style={{ marginTop: 0, marginBottom: 30 }}>
              <div>
                <b>{spot.area} m²</b>
                <span>powierzchnia</span>
              </div>
              <div>
                <b>{spot.district}</b>
                <span>lokalizacja</span>
              </div>
            </div>
            <Link href={`/wzory/${wzor}/oferta/${spot.id}`} className="wz-btn">
              Zobacz ofertę
            </Link>
          </div>
          <figure className="nok-split__img wz-img" style={{ margin: 0 }} data-rev>
            <Image src={spot.photos[0]} alt={spot.title} fill sizes="(max-width: 900px) 100vw, 45vw" />
          </figure>
        </div>
      </section>

      {/* ───────── klient zagraniczny ───────── */}
      <section className="wz-sec wz-sec--tight">
        <div className="wz-wrap">
          <div className="nok-intl" data-rev>
            <div>
              <p className="wz-kick">International clients</p>
              <h2 style={{ marginBottom: 16 }}>Obsługa po angielsku, niemiecku i ukraińsku</h2>
              <p>
                Prowadzimy klientów mieszkających poza Polską: od zdalnej prezentacji z kamerą po pełnomocnictwo u
                notariusza i odbiór kluczy w imieniu kupującego.
              </p>
            </div>
            <ul>
              <li>Prezentacja na żywo z telefonu, o dowolnej porze</li>
              <li>Tłumacz przysięgły przy akcie notarialnym</li>
              <li>Pomoc w otwarciu konta i uzyskaniu numeru PESEL</li>
              <li>Zarządzanie najmem po zakupie</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ───────── pozostałe oferty ───────── */}
      <section className="wz-sec wz-sec--tight">
        <div className="wz-wrap">
          <p className="wz-kick">Pozostałe</p>
          <h2 className="wz-h2" style={{ marginBottom: 40 }}>
            Cała baza biura
          </h2>
          <div className="wz-grid" data-revs>
            {rest.map((o) => (
              <OfferCard key={o.id} offer={o} base={base} />
            ))}
          </div>
        </div>
      </section>

      {/* ───────── kontakt ───────── */}
      <section className="wz-sec" id="kontakt">
        <div className="wz-wrap nok-cta">
          <div>
            <p className="wz-kick">Kontakt</p>
            <h2 className="wz-h2" style={{ marginBottom: 20 }}>
              Umówmy prezentację poza godzinami
            </h2>
            <p className="wz-lead">
              Większość naszych klientów ogląda nieruchomości wieczorem albo w weekend. Dopasowujemy się, także do
              różnicy czasu.
            </p>
            <div className="nok-cta__list">
              <div>
                <b>Dyskrecja</b>
                <span>Nie publikujemy adresu ani zdjęć bez zgody właściciela</span>
              </div>
              <div>
                <b>Jeden opiekun</b>
                <span>Ta sama osoba prowadzi sprawę od początku do końca</span>
              </div>
              <div>
                <b>Bez pośpiechu</b>
                <span>Prezentacja trwa tyle, ile potrzeba, nie czterdzieści minut</span>
              </div>
            </div>
          </div>
          <div className="nok-cta__box">
            <LeadForm kind="kontakt" />
          </div>
        </div>
      </section>
    </>
  );
}
