import Image from "next/image";
import Link from "next/link";
import { Head, Counter, Faq, Steps, Marquee } from "../bits";
import { LeadForm, type LeadKind } from "../lead-form";
import { OfferCard } from "../offer-card";
import { DEMO_REVIEWS, DEMO_OFFERS, FAQ_NAJEM, FAQ_SPRZEDAZ, type DemoOffer } from "@/lib/wzory/data";

export type ServiceContent = {
  kick: string;
  title: string;
  lead: string;
  photo: string;
  /** Liczby nad zakładką: wartość, sufiks, podpis. */
  stats: [number, string, string][];
  /** Co dostaje klient: tytuł i opis. */
  includes: [string, string][];
  steps: [string, string][];
  faq: [string, string][];
  formKind: LeadKind;
  formTitle: string;
  formLead: string;
  /** Oferty pokazane na dole (np. ostatnio sprzedane albo wolne lokale). */
  offers: DemoOffer[];
  offersTitle: string;
  bullets: string[];
};

/**
 * Strona usługi (sprzedaż, najem). Buduje zaufanie po kolei: obietnica,
 * liczby, co dokładnie robimy, jak to wygląda krok po kroku, pytania
 * i dopiero na końcu formularz.
 */
export function ServicePage({ wzor, c }: { wzor: string; c: ServiceContent }) {
  const base = `/wzory/${wzor}`;
  return (
    <>
      <section className="wz-sec wz-sec--tight">
        <div className="wz-wrap wz-split">
          <div>
            <p className="wz-kick">{c.kick}</p>
            <h1 className="wz-h2" style={{ marginBottom: 18 }}>
              {c.title}
            </h1>
            <p className="wz-lead" style={{ marginBottom: 26 }}>
              {c.lead}
            </p>
            <ul className="wz-ticks" data-revs>
              {c.bullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 30 }}>
              <Link href={`/wzory/${wzor}/kontakt`} className="wz-btn">
                Umów rozmowę
              </Link>
              <Link href={`/wzory/${wzor}/oferty`} className="wz-btn wz-btn--ghost">
                Zobacz nasze oferty
              </Link>
            </div>
          </div>

          <figure className="wz-img wz-media" style={{ margin: 0, aspectRatio: "4 / 5" }} data-rev data-rev-zoom>
            <Image src={c.photo} alt="" fill sizes="(max-width: 900px) 100vw, 40vw" priority />
          </figure>
        </div>
      </section>

      <section className="wz-sec wz-sec--tight">
        <div className="wz-wrap">
          <div className="wz-stats-row" data-revs>
            {c.stats.map(([v, suffix, label]) => (
              <Counter key={label} value={v} suffix={suffix} label={label} />
            ))}
          </div>
        </div>
      </section>

      <section className="wz-sec wz-sec--tight">
        <div className="wz-wrap">
          <Head kick="Zakres" title="Co dokładnie robimy" lead="Bez gwiazdek i dopłat w trakcie. Wszystko poniżej jest w jednym wynagrodzeniu." />
          <div className="wz-cards" data-revs>
            {c.includes.map(([t, d]) => (
              <article key={t} className="wz-box">
                <h3 className="wz-h3" style={{ marginBottom: 10 }}>
                  {t}
                </h3>
                <p className="wz-muted">{d}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="wz-sec wz-sec--tight">
        <div className="wz-wrap">
          <Head kick="Przebieg" title="Jak to wygląda krok po kroku" />
          <Steps items={c.steps} />
        </div>
      </section>

      <section className="wz-sec wz-sec--tight">
        <div className="wz-wrap">
          <Head kick="Opinie" title="Co mówią ci, którzy już przez to przeszli" />
        </div>
        <Marquee speed={46} gap={20}>
          {DEMO_REVIEWS.map((r) => (
            <figure key={r.who} className="wz-review">
              <p className="wz-review__stars" aria-label="Ocena pięć na pięć">
                ★★★★★
              </p>
              <blockquote>{r.text}</blockquote>
              <figcaption>
                <span className="wz-review__av" aria-hidden="true">
                  {r.initials}
                </span>
                <span>
                  <b>{r.who}</b>
                  <span>{r.what}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </Marquee>
      </section>

      <section className="wz-sec wz-sec--tight">
        <div className="wz-wrap wz-split">
          <div>
            <Head kick="Pytania" title="To, o co pytają najczęściej" />
            <Faq items={c.faq} />
          </div>
          <div className="wz-box wz-sticky" data-rev>
            <h2 className="wz-h3" style={{ marginBottom: 8 }}>
              {c.formTitle}
            </h2>
            <p className="wz-muted" style={{ fontSize: 14.5, marginBottom: 18 }}>
              {c.formLead}
            </p>
            <LeadForm kind={c.formKind} />
          </div>
        </div>
      </section>

      {c.offers.length > 0 && (
        <section className="wz-sec wz-sec--tight">
          <div className="wz-wrap">
            <Head
              kick="Z naszej bazy"
              title={c.offersTitle}
              action={
                <Link href={`/wzory/${wzor}/oferty`} className="wz-btn wz-btn--ghost">
                  Wszystkie oferty
                </Link>
              }
            />
            <div className="wz-grid" data-revs>
              {c.offers.slice(0, 3).map((o) => (
                <OfferCard key={o.id} offer={o} base={base} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

export const SPRZEDAZ = (): ServiceContent => ({
  kick: "Sprzedaż nieruchomości",
  title: "Sprzedamy drożej, niż sprzedałbyś sam",
  lead: "Nie dlatego, że znamy tajnego kupca. Dlatego, że cena wyjściowa jest policzona z aktów notarialnych, zdjęcia robi fotograf, a negocjacje prowadzi ktoś, kto robi to codziennie i nie jest emocjonalnie związany z mieszkaniem.",
  photo: "/wzory/salon-widok.jpg",
  stats: [
    [128, "", "transakcji w 2025 roku"],
    [98, "%", "ceny ofertowej średnio"],
    [21, "", "dni mediana sprzedaży"],
    [0, " zł", "kosztów z góry"],
  ],
  bullets: [
    "Wycena z cen transakcyjnych, nie z ogłoszeń",
    "Sesja zdjęciowa, rzut i spacer 3D w cenie",
    "Publikacja na portalach i w systemie wymiany ofert",
    "Prezentacje prowadzi agent, nie właściciel",
    "Wynagrodzenie dopiero po akcie notarialnym",
  ],
  includes: [
    ["Wycena i strategia", "Zestawienie aktów notarialnych z okolicy, analiza konkurencji i rekomendacja ceny wyjściowej z widełkami negocjacyjnymi."],
    ["Przygotowanie nieruchomości", "Konsultacja home staging, drobne poprawki przed sesją i sprzątanie. Wiemy, co kupujący zauważa w pierwszych dziesięciu sekundach."],
    ["Materiały", "Sesja fotograficzna, rzut 2D, spacer 3D i film pionowy na media społecznościowe. Wszystko zostaje Twoją własnością."],
    ["Marketing", "Portale, nasza strona, baza poszukiwań, kampania płatna i wysyłka do biur współpracujących w systemie wymiany."],
    ["Prezentacje i negocjacje", "Odbieramy telefony także wieczorem, weryfikujemy kupujących i prowadzimy negocjacje na piśmie."],
    ["Dokumenty i notariusz", "Kompletujemy zaświadczenia, pilnujemy terminów i jesteśmy przy podpisaniu aktu oraz przy przekazaniu kluczy."],
  ],
  steps: [
    ["Rozmowa i wycena", "Spotykamy się na miejscu, oglądamy nieruchomość i w ciągu dwóch dni dostajesz wycenę na piśmie."],
    ["Przygotowanie", "Home staging, sesja zdjęciowa, rzut i komplet dokumentów. Zwykle trzy do pięciu dni."],
    ["Rynek", "Publikacja, prezentacje i cotygodniowy raport z liczbą wyświetleń, telefonów i uwagami kupujących."],
    ["Finał", "Negocjacje, umowa przedwstępna, akt notarialny i protokół zdawczy z przepisaniem mediów."],
  ],
  faq: FAQ_SPRZEDAZ,
  formKind: "zglos",
  formTitle: "Zacznij od bezpłatnej wyceny",
  formLead: "Odpowiadamy w dwie godziny robocze. Wycena nie zobowiązuje Cię do podpisania umowy.",
  offers: DEMO_OFFERS.filter((o) => o.deal === "sprzedaz").slice(0, 3),
  offersTitle: "Co teraz sprzedajemy",
});

export const NAJEM = (): ServiceContent => ({
  kick: "Obsługa najmu",
  title: "Wynajem, o którym nie musisz pamiętać",
  lead: "Sprawdzamy najemcę, przygotowujemy umowę, robimy protokół i rozliczamy media. Właściciel dostaje raz w miesiącu jeden przelew i jedno zestawienie, a telefony o cieknącym kranie odbieramy my.",
  photo: "/wzory/kuchnia.jpg",
  stats: [
    [264, "", "obsłużonych najmów"],
    [9, "", "dni średnio do najemcy"],
    [0, "", "spraw sądowych o eksmisję"],
    [24, " h", "reakcja na awarię"],
  ],
  bullets: [
    "Weryfikacja najemcy i historii płatności",
    "Umowa najmu okazjonalnego z notariuszem",
    "Protokół zdawczy ze zdjęciami i licznikami",
    "Rozliczanie mediów i czynszu administracyjnego",
    "Obsługa awarii przez sprawdzonych fachowców",
  ],
  includes: [
    ["Wycena czynszu", "Porównanie z realnie zawartymi umowami z okolicy, nie z ogłoszeń, które wiszą trzeci miesiąc."],
    ["Zdjęcia i ogłoszenie", "Sesja, opis i publikacja. Mieszkanie pokazujemy tak, żeby przyciągnąć najemcę, który zostanie na dłużej."],
    ["Selekcja najemców", "Weryfikacja tożsamości, dochodu i rejestrów dłużników. Właściciel dostaje raport przed decyzją."],
    ["Umowa i notariusz", "Najem okazjonalny z pełną dokumentacją i zgłoszeniem do urzędu skarbowego w terminie."],
    ["Wydanie i odbiór", "Protokół ze zdjęciami, spisanie liczników i przekazanie kluczy. To samo przy zakończeniu najmu."],
    ["Obsługa w trakcie", "Kontakt z najemcą, awarie, przeglądy i windykacja od pierwszego dnia opóźnienia."],
  ],
  steps: [
    ["Wycena i przygotowanie", "Oglądamy mieszkanie, ustalamy czynsz i przygotowujemy je do sesji."],
    ["Szukanie najemcy", "Publikacja, prezentacje i selekcja. Przedstawiamy Ci kandydatów z dokumentami."],
    ["Umowa", "Najem okazjonalny u notariusza, protokół zdawczy i wydanie kluczy."],
    ["Opieka", "Rozliczenia, awarie i kontakt z najemcą przez cały okres trwania umowy."],
  ],
  faq: FAQ_NAJEM,
  formKind: "zglos",
  formTitle: "Oddaj mieszkanie pod opiekę",
  formLead: "Napisz, gdzie jest mieszkanie i od kiedy jest wolne. Odezwiemy się tego samego dnia.",
  offers: DEMO_OFFERS.filter((o) => o.deal === "wynajem").slice(0, 3),
  offersTitle: "Co teraz wynajmujemy",
});
