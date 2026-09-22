import Image from "next/image";
import Link from "next/link";
import { WzSearch } from "../search";
import { OfferCard } from "../offer-card";
import { LeadForm } from "../lead-form";
import { RateCalculator } from "../calculator";
import { DEMO_AGENTS, DEMO_OFFERS } from "@/lib/wzory/data";

const HELP: [string, string, string, string, string][] = [
  ["🔑", "Kupuję", "Podpowiemy, ile realnie kosztuje utrzymanie i co sprawdzić przed podpisaniem. Jeździmy na oglądanie razem z Tobą.", "Zobacz oferty", "/oferty"],
  ["🏷️", "Sprzedaję", "Wycena z cen transakcyjnych, zdjęcia, rozmowy z kupującymi i pilnowanie terminów. Ty podpisujesz tylko dwa razy.", "Zgłoś nieruchomość", "/kontakt#zglos"],
  ["📆", "Wynajmuję", "Sprawdzamy najemcę, przygotowujemy umowę i protokół, rozliczamy media. Możesz mieszkać w innym mieście.", "Porozmawiajmy", "/kontakt"],
];

const STEPS: [string, string][] = [
  ["Rozmowa przy kawie", "Bez umowy i bez zobowiązań. Słuchamy, co chcesz osiągnąć i w jakim czasie."],
  ["Plan i wycena", "Dostajesz na piśmie cenę wyjściową, plan działań i harmonogram na najbliższe tygodnie."],
  ["Prezentacje", "Przejmujemy telefony i pokazy. Ty dostajesz podsumowanie po każdym tygodniu."],
  ["Podpisanie", "Pilnujemy dokumentów i terminów. Jesteśmy z Tobą u notariusza i przy przekazaniu kluczy."],
];

const QUOTES: [string, string, string, string][] = [
  [
    "Sprzedaliśmy mieszkanie po babci w trzy tygodnie. Największa ulga to była ta, że nie musieliśmy odbierać dwudziestu telefonów dziennie.",
    "Agnieszka i Marek",
    "sprzedaż mieszkania, Podgórze",
    "/wzory/kuchnia.jpg",
  ],
  [
    "Kupowaliśmy pierwszy raz i bałam się każdego papierka. Pani Karolina tłumaczyła wszystko po ludzku, dwa razy, bez pośpiechu.",
    "Ewelina",
    "zakup mieszkania, Bronowice",
    "/wzory/sypialnia.jpg",
  ],
  [
    "Wynajmuję z drugiego końca Polski. Dostaję raz w miesiącu przelew i krótki raport, i tyle muszę o tym myśleć.",
    "Piotr",
    "obsługa najmu, Grzegórzki",
    "/wzory/salon.jpg",
  ],
];

export function HomePrzystan({ wzor }: { wzor: string }) {
  const picks = DEMO_OFFERS.filter((o) => o.deal === "sprzedaz").slice(0, 3);
  const agent = DEMO_AGENTS[2];

  return (
    <>
      {/* ───────── nagłówek ───────── */}
      <section className="wz-wrap prz-hero">
        <div className="prz-hero__grid">
          <div>
            <span className="prz-hero__badge">⭐ 4,9 na 5 w opiniach Google (186 ocen)</span>
            <h1>
              Biuro, w którym ktoś <span>odbiera telefon</span>
            </h1>
            <p className="prz-hero__sub">
              Jesteśmy małym, rodzinnym biurem z Podgórza. Prowadzimy kilkadziesiąt transakcji rocznie i znamy każdego
              swojego klienta z imienia.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 28 }}>
              <Link href={`/wzory/${wzor}/oferty`} className="wz-btn">
                Zobacz oferty
              </Link>
              <a href={`tel:+48124304050`} className="wz-btn wz-btn--ghost">
                Zadzwoń: 12 430 40 50
              </a>
            </div>
          </div>

          <div style={{ position: "relative" }}>
            <div className="prz-hero__img wz-img">
              <Image src="/wzory/dom.jpg" alt="Dom z ogrodem" fill priority sizes="(max-width: 920px) 100vw, 45vw" />
            </div>
            <div className="prz-hero__card">
              <Image src={agent.photo} alt={agent.name} width={46} height={46} />
              <span>
                <b>{agent.name}</b>
                <span>odpowiada zwykle w 12 minut</span>
              </span>
            </div>
          </div>
        </div>

        <div className="prz-search" data-rev>
          <WzSearch wzor={wzor} />
        </div>
      </section>

      {/* ───────── w czym pomagamy ───────── */}
      <section className="wz-sec wz-sec--tight">
        <div className="wz-wrap">
          <div className="prz-help" data-revs>
            {HELP.map(([ico, t, d, cta, href]) => (
              <Link key={t} href={`/wzory/${wzor}${href}`}>
                <span className="prz-help__ico" aria-hidden="true">
                  {ico}
                </span>
                <h3>{t}</h3>
                <p>{d}</p>
                <b>{cta} →</b>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── polecane ───────── */}
      <section className="wz-sec wz-sec--tight" id="oferty">
        <div className="wz-wrap">
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: 16, marginBottom: 30 }}>
            <div>
              <p className="wz-kick">Wybrane dla Ciebie</p>
              <h2 className="wz-h2">Świeże oferty z naszej bazy</h2>
            </div>
            <Link href={`/wzory/${wzor}/oferty`} className="wz-btn wz-btn--ghost">
              Wszystkie oferty
            </Link>
          </div>
          <div className="wz-grid" data-revs>
            {picks.map((o, i) => (
              <OfferCard key={o.id} offer={o} wzor={wzor} priority={i === 0} />
            ))}
          </div>
        </div>
      </section>

      {/* ───────── kroki ───────── */}
      <section className="wz-sec wz-sec--tight">
        <div className="wz-wrap">
          <div style={{ marginBottom: 30 }}>
            <p className="wz-kick">Jak to wygląda</p>
            <h2 className="wz-h2">Cztery kroki, zero niespodzianek</h2>
          </div>
          <div className="prz-steps" data-revs>
            {STEPS.map(([t, d]) => (
              <article key={t}>
                <h3>{t}</h3>
                <p>{d}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── kalkulator ───────── */}
      <section className="wz-sec wz-sec--tight" id="kalkulator">
        <div className="wz-wrap">
          <div className="prz-calc" data-rev>
            <div style={{ marginBottom: 26 }}>
              <p className="wz-kick">Kalkulator raty</p>
              <h2 className="wz-h2" style={{ marginBottom: 10 }}>
                Sprawdź, na co Cię stać
              </h2>
              <p className="wz-lead">
                Przesuń suwaki i zobacz miesięczną ratę. Jeśli chcesz to policzyć dokładnie, umówimy Cię z doradcą
                kredytowym, z którym pracujemy od ośmiu lat.
              </p>
            </div>
            <RateCalculator price={850_000} />
          </div>
        </div>
      </section>

      {/* ───────── opinie ───────── */}
      <section className="wz-sec wz-sec--tight">
        <div className="wz-wrap">
          <div style={{ marginBottom: 30 }}>
            <p className="wz-kick">Opinie</p>
            <h2 className="wz-h2">Co mówią nasi klienci</h2>
          </div>
          <div className="prz-quotes" data-revs>
            {QUOTES.map(([q, who, what, photo]) => (
              <figure key={who}>
                <p className="prz-stars" aria-label="Pięć na pięć gwiazdek">
                  ★★★★★
                </p>
                <blockquote>„{q}”</blockquote>
                <figcaption>
                  <Image src={photo} alt="" width={42} height={42} />
                  <span>
                    <b>{who}</b>
                    <span>{what}</span>
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── zespół ───────── */}
      <section className="wz-sec wz-sec--tight" id="zespol">
        <div className="wz-wrap">
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: 16, marginBottom: 30 }}>
            <div>
              <p className="wz-kick">Nasi ludzie</p>
              <h2 className="wz-h2">Zadzwoń do konkretnej osoby</h2>
            </div>
            <Link href={`/wzory/${wzor}/zespol`} className="wz-btn wz-btn--ghost">
              Więcej o zespole
            </Link>
          </div>
          <div className="prz-team" data-revs>
            {DEMO_AGENTS.map((a) => (
              <article key={a.id}>
                <div className="prz-team__img wz-img">
                  <Image src={a.photo} alt={a.name} fill sizes="(max-width: 900px) 50vw, 24vw" />
                </div>
                <b>{a.name}</b>
                <span>{a.role}</span>
                <a href={`tel:${a.phone.replace(/\s/g, "")}`} className="wz-btn wz-btn--sm">
                  {a.phone}
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── kontakt ───────── */}
      <section className="wz-sec" id="kontakt">
        <div className="wz-wrap">
          <div className="prz-cta">
            <div>
              <h2 style={{ marginBottom: 16 }}>Napisz, oddzwonimy tego samego dnia</h2>
              <p style={{ fontSize: 17, marginBottom: 20 }}>
                Nie wiesz jeszcze, czy chcesz sprzedawać? To dobry moment na rozmowę. Powiemy, ile Twoja nieruchomość
                jest dziś warta i czy warto czekać.
              </p>
              <p style={{ fontSize: 15 }}>
                ul. Zamoyskiego 27, Kraków
                <br />
                Poniedziałek do piątku, 9:00 do 18:00
                <br />
                Sobota po umówieniu
              </p>
            </div>
            <div className="prz-cta__box">
              <LeadForm kind="kontakt" />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
