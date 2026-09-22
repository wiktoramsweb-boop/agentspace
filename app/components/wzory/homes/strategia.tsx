import Image from "next/image";
import Link from "next/link";
import { WzSearch } from "../search";
import { OfferCard } from "../offer-card";
import { LeadForm } from "../lead-form";
import { Counter, Head, Marquee, Portals } from "../bits";
import { DEMO_OFFERS, DEMO_PORTALS, DEMO_REVIEWS, KIND_LABELS, districts, type DemoKind } from "@/lib/wzory/data";

const GOALS: [string, string, string, string, string][] = [
  ["01", "Sprzedaję", "Wycena z aktów notarialnych, sesja zdjęciowa i negocjacje po naszej stronie. Wynagrodzenie dopiero po akcie.", "Sprzedaj nieruchomość", "/sprzedaj"],
  ["02", "Wynajmuję", "Weryfikacja najemcy, umowa okazjonalna i rozliczanie mediów. Jeden przelew i jeden raport w miesiącu.", "Oddaj w zarządzanie", "/wynajmij"],
  ["03", "Kupuję", "Szukamy także poza portalami i sprawdzamy stan prawny, zanim pojedziesz oglądać. Dla kupującego bezpłatnie.", "Zleć poszukiwanie", "/zlec-poszukiwanie"],
  ["04", "Wyceniam", "Zestawienie cen transakcyjnych z Twojego budynku i sąsiednich ulic. Bez zobowiązań i bez wizyty, jeśli nie chcesz.", "Zamów wycenę", "/zglos-nieruchomosc"],
];

const PILLARS: [string, string, string][] = [
  ["◆", "Maksymalizacja ceny", "Weryfikujemy kupujących przed prezentacją i bronimy ceny na piśmie. Średnio kończymy na 98 procentach ceny ofertowej."],
  ["▲", "Bezpieczeństwo prawne", "Księga wieczysta, zaświadczenia, uchwały wspólnoty i decyzje administracyjne. Raport dostajesz przed umową przedwstępną."],
  ["●", "Przejmujemy chaos", "Telefony, prezentacje, fotograf, notariusz i przekazanie mediów. Ty pojawiasz się dwa razy: przy umowie i przy akcie."],
];

export function HomeStrategia({ wzor }: { wzor: string }) {
  const featured = DEMO_OFFERS.filter((o) => o.featured).slice(0, 3);
  const newest = DEMO_OFFERS.slice(0, 6);
  const areas = districts().slice(0, 5);
  const kinds = (Object.keys(KIND_LABELS) as DemoKind[]).slice(0, 5);

  return (
    <>
      {/* ───────── nagłówek ───────── */}
      <header className="str-hero">
        <div className="str-hero__bg" data-par="6">
          <Image src="/wzory/wieza.jpg" alt="Kraków" fill priority sizes="100vw" />
        </div>
        <div className="wz-wrap str-hero__in">
          <span className="str-hero__tag">
            <b>★ 4,9</b> na 5 w opiniach Google · 186 ocen
          </span>
          <h1>Twoja nieruchomość zasługuje na strategię, nie na przypadek</h1>
          <p>
            Prowadzimy sprzedaż, najem i zakup w Krakowie. Zaczynamy od liczb, a kończymy podpisem u notariusza. Wszystko
            pomiędzy bierzemy na siebie.
          </p>

          <div className="str-search" data-rev>
            <WzSearch wzor={wzor} compact />
          </div>

          <div className="str-hero__facts">
            <span>
              <b>128</b> transakcji w 2025
            </span>
            <span>
              <b>21 dni</b> mediana sprzedaży
            </span>
            <span>
              <b>0 zł</b> kosztów z góry
            </span>
            <span>
              <b>17 lat</b> na rynku
            </span>
          </div>
        </div>
      </header>

      {/* ───────── cele klienta ───────── */}
      <section className="wz-sec wz-sec--tight">
        <div className="wz-wrap">
          <Head
            kick="Wybierz swój cel"
            title="Od czego chcesz zacząć?"
            lead="Każda z tych dróg ma osobną stronę z konkretami: co robimy, ile to trwa i ile kosztuje."
          />
          <div className="str-goals" data-revs>
            {GOALS.map(([n, t, d, cta, href]) => (
              <Link key={n} href={`/wzory/${wzor}${href}`} className="str-goal">
                <span className="str-goal__n">{n}</span>
                <h3>{t}</h3>
                <p>{d}</p>
                <b>{cta} →</b>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── filary ───────── */}
      <section className="wz-sec wz-sec--tight">
        <div className="wz-wrap">
          <Head kick="Twarde dane, nie obietnice" title="Trzy rzeczy, za które nam płacicie" />
          <div className="str-pillars" data-revs>
            {PILLARS.map(([ico, t, d]) => (
              <article key={t}>
                <span className="str-pillars__ico" aria-hidden="true">
                  {ico}
                </span>
                <h3>{t}</h3>
                <p>{d}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── oferty specjalne ───────── */}
      <section className="wz-sec wz-sec--tight" id="oferty">
        <div className="wz-wrap">
          <Head
            kick="Selekcja"
            title="Oferty specjalne"
            action={
              <Link href={`/wzory/${wzor}/oferty`} className="wz-btn wz-btn--ghost">
                Eksploruj pełną bazę
              </Link>
            }
          />
          <div className="wz-grid" data-revs>
            {featured.map((o, i) => (
              <OfferCard key={o.id} offer={o} wzor={wzor} priority={i === 0} />
            ))}
          </div>
        </div>
      </section>

      {/* ───────── kredyt ───────── */}
      <section className="wz-sec wz-sec--tight">
        <div className="wz-wrap">
          <div className="str-credit" data-rev>
            <div>
              <p className="wz-kick" style={{ color: "var(--d-accent)" }}>
                Doradztwo kredytowe
              </p>
              <h2>Twoja nowa nieruchomość, nasz najtańszy kredyt</h2>
              <p>
                Nie trać czasu na chodzenie po bankach. Niezależny ekspert porówna oferty dwudziestu dwóch banków i
                wynegocjuje warunki, których nie dostaniesz z ulicy.
              </p>
              <ul>
                <li>Badanie zdolności w 15 minut</li>
                <li>Ekspert prowadzi Cię do końca</li>
                <li>Prowizja dla Ciebie 0 zł</li>
                <li>Pomoc przy wkładzie własnym</li>
              </ul>
              <div style={{ marginTop: 26 }}>
                <Link href={`/wzory/${wzor}/kalkulator`} className="wz-btn">
                  Zbadaj zdolność kredytową
                </Link>
              </div>
            </div>
            <div className="str-credit__rate">
              <b>5,58%</b>
              <span>najniższe RRSO od</span>
              <p style={{ fontSize: 12, color: "#8b95a6", marginTop: 14 }}>
                Przykład reprezentatywny dostępny u doradcy. To wzór strony, dane są przykładowe.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── najnowsze ───────── */}
      <section className="wz-sec wz-sec--tight">
        <div className="wz-wrap">
          <Head
            kick="Świeżo na rynku"
            title="Najnowsze nieruchomości"
            action={
              <Link href={`/wzory/${wzor}/oferty`} className="wz-btn wz-btn--ghost">
                Przeglądaj wszystkie
              </Link>
            }
          />
          <div className="wz-grid" data-revs>
            {newest.map((o) => (
              <OfferCard key={o.id} offer={o} wzor={wzor} />
            ))}
          </div>
        </div>
      </section>

      {/* ───────── kategorie ───────── */}
      <section className="wz-sec wz-sec--tight">
        <div className="wz-wrap">
          <Head kick="Czego szukasz" title="Wejdź od razu w swoją kategorię" />
          <div className="str-cats" data-revs>
            {kinds.map((k, i) => (
              <Link key={k} href={`/wzory/${wzor}/oferty?typ=${k}`} className="str-cat">
                <Image
                  src={DEMO_OFFERS.filter((o) => o.kind === k)[0]?.photos[0] ?? "/wzory/park.jpg"}
                  alt=""
                  fill
                  sizes="(max-width: 900px) 50vw, 20vw"
                  priority={i === 0}
                />
                <span>
                  {KIND_LABELS[k]}
                  <small>{DEMO_OFFERS.filter((o) => o.kind === k).length} ofert</small>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── liczby ───────── */}
      <section className="wz-sec wz-sec--tight">
        <div className="wz-wrap">
          <Head kick="Liczby i fakty" title="Nie musisz wierzyć nam na słowo" />
          <div className="wz-stats-row" data-revs>
            <Counter value={94} suffix="%" label="skuteczność sprzedaży" />
            <Counter value={21} label="dni średni czas" />
            <Counter value={640} label="wycen w 2025 roku" />
            <Counter value={4.9} decimals={1} label="ocena w Google" />
          </div>
        </div>
      </section>

      {/* ───────── portale ───────── */}
      <section className="wz-sec wz-sec--tight">
        <div className="wz-wrap">
          <Head kick="Zasięg" title="Wasza oferta jest wszędzie tam, gdzie szukają kupujący" />
        </div>
        <Portals items={DEMO_PORTALS} />
      </section>

      {/* ───────── opinie ───────── */}
      <section className="wz-sec wz-sec--tight">
        <div className="wz-wrap">
          <Head kick="Opinie" title="Ocena 5,0 z 86 opinii w Google" />
        </div>
        <Marquee speed={54} gap={20}>
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

      {/* ───────── dzielnice ───────── */}
      <section className="wz-sec wz-sec--tight">
        <div className="wz-wrap">
          <Head kick="Lokalizacje" title="Gdzie mamy najwięcej ofert" />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }} data-revs>
            {areas.map((a) => (
              <Link
                key={a.name}
                href={`/wzory/${wzor}/oferty?dzielnica=${encodeURIComponent(a.name)}`}
                className="wz-btn wz-btn--ghost"
              >
                {a.name} ({a.count})
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── kontakt ───────── */}
      <section className="wz-sec" id="kontakt">
        <div className="wz-wrap wz-split">
          <div>
            <Head
              kick="Zróbmy pierwszy krok"
              title="Skonkretyzujmy Twój cel"
              lead="Jedna rozmowa wystarczy, żeby wiedzieć, czy mamy sobie nawzajem coś do zaoferowania. Nie namawiamy do niczego na siłę."
            />
            <div className="wz-stats-row" style={{ gridTemplateColumns: "1fr 1fr" }} data-revs>
              <Counter value={2} suffix=" h" label="średni czas odpowiedzi" />
              <Counter value={0} suffix=" zł" label="za wycenę i konsultację" />
            </div>
          </div>
          <div className="wz-box" data-rev>
            <LeadForm kind="kontakt" />
          </div>
        </div>
      </section>
    </>
  );
}
