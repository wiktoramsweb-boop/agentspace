import Image from "next/image";
import Link from "next/link";
import { Head, Counter, Faq, Marquee, Portals } from "../bits";
import { LeadForm, type LeadKind } from "../lead-form";
import { RateCalculator } from "../calculator";
import { FavoritesList } from "../favorites-list";
import {
  DEMO_AGENTS,
  DEMO_ARTICLES,
  DEMO_PORTALS,
  DEMO_REVIEWS,
  FAQ_ZAKUP,
  type DemoArticle,
} from "@/lib/wzory/data";
import type { Wzor } from "@/lib/wzory/themes";

/* ───────────────────────── O nas ───────────────────────── */

const VALUES: [string, string][] = [
  ["Mówimy, ile to naprawdę warte", "Nawet gdy prawda jest o sto tysięcy niższa od oczekiwań. Zawyżona cena kosztuje właściciela miesiące, a nas wiarygodność."],
  ["Jeden opiekun od początku do końca", "Nie przekazujemy klienta dalej. Ta sama osoba wycenia, pokazuje, negocjuje i jest przy akcie notarialnym."],
  ["Wszystko na piśmie", "Wycena, plan działań i raport z rynku. Nic nie zostaje w formie „mówiliśmy przez telefon”."],
  ["Nie bierzemy każdego zlecenia", "Jeśli nie widzimy, jak pomóc, mówimy to od razu. Lepiej stracić zlecenie niż pół roku obu stron."],
];

export function AboutPage({ wzor }: { wzor: Wzor }) {
  return (
    <>
      <section className="wz-sec wz-sec--tight">
        <div className="wz-wrap wz-split">
          <div>
            <p className="wz-kick">O biurze</p>
            <h1 className="wz-h2" style={{ marginBottom: 18 }}>
              Zaczęliśmy od jednego biurka przy Starowiślnej
            </h1>
            <div style={{ display: "grid", gap: 14, fontSize: 17, color: "var(--d-muted-strong)" }}>
              <p>
                {wzor.office} powstało w 2009 roku, kiedy rynek był w dołku i wszyscy mówili, że to najgorszy moment na
                otwieranie biura nieruchomości. Może dlatego od początku pracujemy na liczbach, a nie na entuzjazmie.
              </p>
              <p>
                Dzisiaj jest nas czworo i prowadzimy około stu trzydziestu transakcji rocznie. Świadomie nie rośniemy
                szybciej, bo przy większym zespole nie dałoby się utrzymać zasady, że każdą sprawę prowadzi jedna osoba
                od pierwszego telefonu do przekazania kluczy.
              </p>
              <p>
                Znamy Kraków ulica po ulicy. Wiemy, w którym budynku wspólnota planuje remont elewacji, gdzie hałasuje
                tramwaj o piątej rano i która szkoła ma rekrutację zamkniętą dla spoza obwodu. To wiedza, której nie ma
                w żadnym portalu.
              </p>
            </div>
          </div>

          <div style={{ display: "grid", gap: 12 }}>
            <figure className="wz-img wz-media" style={{ margin: 0, aspectRatio: "4 / 3" }} data-rev data-rev-zoom>
              <Image src="/wzory/dziedziniec.jpg" alt="Biuro" fill sizes="(max-width: 900px) 100vw, 40vw" priority />
            </figure>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <figure className="wz-img wz-media" style={{ margin: 0, aspectRatio: "1 / 1" }} data-rev>
                <Image src="/wzory/schody.jpg" alt="" fill sizes="20vw" />
              </figure>
              <figure className="wz-img wz-media" style={{ margin: 0, aspectRatio: "1 / 1" }} data-rev>
                <Image src="/wzory/cegla.jpg" alt="" fill sizes="20vw" />
              </figure>
            </div>
          </div>
        </div>
      </section>

      <section className="wz-sec wz-sec--tight">
        <div className="wz-wrap">
          <div className="wz-stats-row" data-revs>
            <Counter value={17} label="lat na krakowskim rynku" />
            <Counter value={1840} label="obsłużonych transakcji" />
            <Counter value={4.9} decimals={1} label="średnia ocen w Google" />
            <Counter value={86} suffix="%" label="klientów z polecenia" />
          </div>
        </div>
      </section>

      <section className="wz-sec wz-sec--tight">
        <div className="wz-wrap">
          <Head kick="Zasady" title="Cztery rzeczy, od których nie odstępujemy" />
          <div className="wz-cards" data-revs>
            {VALUES.map(([t, d]) => (
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
          <Head
            kick="Zespół"
            title="Ludzie, nie skrzynka kontaktowa"
            action={
              <Link href={`/wzory/${wzor.slug}/zespol`} className="wz-btn wz-btn--ghost">
                Poznaj zespół
              </Link>
            }
          />
          <div className="wz-cards" data-revs>
            {DEMO_AGENTS.slice(0, 3).map((a) => (
              <article key={a.id} className="wz-box" style={{ display: "grid", gap: 14 }}>
                <figure className="wz-img wz-media" style={{ margin: 0, aspectRatio: "4 / 3" }}>
                  <Image src={a.photo} alt={a.name} fill sizes="30vw" />
                </figure>
                <div>
                  <p className="wz-h3">{a.name}</p>
                  <p className="wz-muted" style={{ fontSize: 14 }}>
                    {a.role}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="wz-sec wz-sec--tight">
        <div className="wz-wrap">
          <Head kick="Gdzie nas widać" title="Publikujemy oferty tam, gdzie szukają kupujący" />
        </div>
        <Portals items={DEMO_PORTALS} />
      </section>
    </>
  );
}

/* ───────────────────────── Poradnik ───────────────────────── */

export function BlogListPage({ wzor }: { wzor: Wzor }) {
  const [lead, ...rest] = DEMO_ARTICLES;
  return (
    <section className="wz-sec wz-sec--tight">
      <div className="wz-wrap">
        <p className="wz-kick">Poradnik</p>
        <h1 className="wz-h2" style={{ marginBottom: 14 }}>
          Wiedza, która oszczędza pieniądze
        </h1>
        <p className="wz-lead" style={{ marginBottom: 40 }}>
          Piszemy o tym, o co klienci pytają nas najczęściej. Bez lania wody i bez przepisywania ustaw.
        </p>

        <Link href={`/wzory/${wzor.slug}/poradnik/${lead.slug}`} className="wz-feature" data-rev>
          <figure className="wz-img" style={{ margin: 0 }}>
            <Image src={lead.photo} alt="" fill sizes="(max-width: 900px) 100vw, 60vw" priority />
          </figure>
          <div>
            <p className="wz-kick" style={{ marginBottom: 12 }}>
              {lead.tag} · {lead.read} min czytania
            </p>
            <h2 className="wz-h3" style={{ marginBottom: 12 }}>
              {lead.title}
            </h2>
            <p className="wz-muted">{lead.lead}</p>
            <p style={{ marginTop: 18, color: "var(--d-accent)", fontWeight: 600 }}>Czytaj dalej →</p>
          </div>
        </Link>

        <div className="wz-grid" style={{ marginTop: 28 }} data-revs>
          {rest.map((a) => (
            <ArticleCard key={a.slug} a={a} wzor={wzor.slug} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ArticleCard({ a, wzor }: { a: DemoArticle; wzor: string }) {
  return (
    <Link href={`/wzory/${wzor}/poradnik/${a.slug}`} className="wzc" style={{ display: "block" }}>
      <span className="wzc__media">
        <Image src={a.photo} alt="" fill sizes="(max-width: 700px) 100vw, 33vw" />
        <span className="wzc__tags">
          <span className="wzc__tag">{a.tag}</span>
        </span>
      </span>
      <span className="wzc__body" style={{ display: "grid", gap: 9 }}>
        <span className="wzc__loc">
          {a.date} · {a.read} min
        </span>
        <span className="wzc__title" style={{ fontFamily: "var(--d-display)" }}>
          {a.title}
        </span>
        <span className="wz-muted" style={{ fontSize: 15 }}>
          {a.lead}
        </span>
      </span>
    </Link>
  );
}

export function ArticlePage({ wzor, a }: { wzor: Wzor; a: DemoArticle }) {
  const others = DEMO_ARTICLES.filter((x) => x.slug !== a.slug);
  return (
    <>
      <section className="wz-sec wz-sec--tight" style={{ paddingBottom: 0 }}>
        <div className="wz-wrap wz-narrow">
          <p className="wz-muted" style={{ fontSize: 14, marginBottom: 16 }}>
            <Link href={`/wzory/${wzor.slug}`}>Strona główna</Link> ·{" "}
            <Link href={`/wzory/${wzor.slug}/poradnik`}>Poradnik</Link> · {a.tag}
          </p>
          <h1 className="wz-h2" style={{ marginBottom: 16 }}>
            {a.title}
          </h1>
          <p className="wz-lead" style={{ marginBottom: 20 }}>
            {a.lead}
          </p>
          <p className="wz-muted" style={{ fontSize: 14.5 }}>
            {a.author} · {a.date} · {a.read} min czytania
          </p>
        </div>
        <div className="wz-wrap" style={{ marginTop: 30 }}>
          <figure className="wz-img wz-media" style={{ margin: 0, aspectRatio: "21 / 9" }} data-rev data-rev-zoom>
            <Image src={a.photo} alt="" fill sizes="100vw" priority />
          </figure>
        </div>
      </section>

      <section className="wz-sec">
        <div className="wz-wrap wz-narrow wz-prose">
          {a.body.map((block, i) => (
            <div key={i}>
              {block.h && <h2>{block.h}</h2>}
              {block.p.map((p, j) => (
                <p key={j}>{p}</p>
              ))}
            </div>
          ))}

          <div className="wz-box wz-box--accent" style={{ marginTop: 34 }}>
            <p className="wz-h3" style={{ marginBottom: 8 }}>
              Masz pytanie do tego tematu?
            </p>
            <p className="wz-muted" style={{ marginBottom: 16 }}>
              Napisz albo zadzwoń. Odpowiadamy także wtedy, gdy nie planujesz jeszcze żadnej transakcji.
            </p>
            <Link href={`/wzory/${wzor.slug}/kontakt`} className="wz-btn">
              Zadaj pytanie
            </Link>
          </div>
        </div>
      </section>

      <section className="wz-sec wz-sec--tight">
        <div className="wz-wrap">
          <Head kick="Czytaj dalej" title="Inne wpisy" />
          <div className="wz-grid" data-revs>
            {others.map((x) => (
              <ArticleCard key={x.slug} a={x} wzor={wzor.slug} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

/* ───────────────────────── Kalkulator ───────────────────────── */

const COSTS: [string, string][] = [
  ["Podatek od czynności cywilnoprawnych", "2% ceny przy rynku wtórnym. Przy pierwszym mieszkaniu możesz być z niego zwolniony."],
  ["Taksa notarialna", "Od 1000 do 3000 zł przy typowej transakcji, plus VAT i wypisy aktu."],
  ["Wpis do księgi wieczystej", "200 zł za wpis własności i 200 zł za wpis hipoteki, plus 19 zł za każdy wniosek."],
  ["Koszty kredytu", "Prowizja banku, wycena nieruchomości i ubezpieczenia. Zwykle od 1 do 3 procent kwoty kredytu."],
];

export function CalculatorPage({ wzor }: { wzor: Wzor }) {
  return (
    <>
      <section className="wz-sec wz-sec--tight">
        <div className="wz-wrap">
          <p className="wz-kick">Kalkulator</p>
          <h1 className="wz-h2" style={{ marginBottom: 14 }}>
            Policz ratę, zanim zaczniesz oglądać
          </h1>
          <p className="wz-lead" style={{ marginBottom: 34 }}>
            Ustaw cenę, wkład własny i okres kredytowania. Rata liczy się metodą annuitetową, dokładnie tak, jak liczy
            ją bank.
          </p>
          <div className="wz-box" data-rev>
            <RateCalculator price={780_000} />
          </div>
        </div>
      </section>

      <section className="wz-sec wz-sec--tight">
        <div className="wz-wrap wz-split">
          <div>
            <Head kick="Poza ratą" title="O czym jeszcze trzeba pamiętać przy zakupie" />
            <div className="wz-cards" style={{ gridTemplateColumns: "1fr 1fr" }} data-revs>
              {COSTS.map(([t, d]) => (
                <article key={t} className="wz-box">
                  <h3 className="wz-h3" style={{ marginBottom: 8, fontSize: 19 }}>
                    {t}
                  </h3>
                  <p className="wz-muted" style={{ fontSize: 15 }}>
                    {d}
                  </p>
                </article>
              ))}
            </div>
          </div>

          <div className="wz-box wz-sticky" data-rev>
            <h2 className="wz-h3" style={{ marginBottom: 8 }}>
              Sprawdź zdolność kredytową
            </h2>
            <p className="wz-muted" style={{ fontSize: 14.5, marginBottom: 18 }}>
              Współpracujemy z niezależnym doradcą, który porówna oferty banków. Badanie jest bezpłatne i nie zobowiązuje
              Cię do wzięcia kredytu.
            </p>
            <LeadForm kind="kontakt" />
          </div>
        </div>
      </section>

      <section className="wz-sec wz-sec--tight">
        <div className="wz-wrap">
          <Head kick="Pytania" title="Zanim zadzwonisz do banku" />
          <div style={{ maxWidth: 900 }}>
            <Faq items={FAQ_ZAKUP} />
          </div>
        </div>
      </section>
    </>
  );
}

/* ───────────────────────── Ulubione ───────────────────────── */

export function FavoritesPage({ wzor }: { wzor: Wzor }) {
  return (
    <section className="wz-sec wz-sec--tight">
      <div className="wz-wrap">
        <p className="wz-kick">Twoja lista</p>
        <h1 className="wz-h2" style={{ marginBottom: 14 }}>
          Ulubione oferty
        </h1>
        <p className="wz-lead" style={{ marginBottom: 34 }}>
          Oferty zapisane sercem zostają w tej przeglądarce. Gdy wyślesz nam zapytanie, agent zobaczy, co Cię
          interesowało, i przygotuje rozmowę zamiast pytać o wszystko od zera.
        </p>
        <FavoritesList wzor={wzor.slug} />
      </div>
    </section>
  );
}

/* ───────────────────────── Formularz na osobnej stronie ───────────────────────── */

export function FormPage({
  wzor,
  kind,
  kick,
  title,
  lead,
  bullets,
  photo,
  faq,
}: {
  wzor: Wzor;
  kind: LeadKind;
  kick: string;
  title: string;
  lead: string;
  bullets: string[];
  photo: string;
  faq?: [string, string][];
}) {
  return (
    <>
      <section className="wz-sec wz-sec--tight">
        <div className="wz-wrap wz-split">
          <div>
            <p className="wz-kick">{kick}</p>
            <h1 className="wz-h2" style={{ marginBottom: 18 }}>
              {title}
            </h1>
            <p className="wz-lead" style={{ marginBottom: 26 }}>
              {lead}
            </p>
            <ul className="wz-ticks" data-revs>
              {bullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>

            <figure className="wz-img wz-media" style={{ margin: "32px 0 0", aspectRatio: "16 / 9" }} data-rev data-rev-zoom>
              <Image src={photo} alt="" fill sizes="(max-width: 900px) 100vw, 50vw" />
            </figure>
          </div>

          <div className="wz-box wz-sticky" data-rev>
            <LeadForm kind={kind} />
          </div>
        </div>
      </section>

      {faq && faq.length > 0 && (
        <section className="wz-sec wz-sec--tight">
          <div className="wz-wrap" style={{ maxWidth: 900 }}>
            <Head kick="Pytania" title="Zanim wyślesz" />
            <Faq items={faq} />
          </div>
        </section>
      )}
    </>
  );
}

/* ───────────────────────── Kontakt ───────────────────────── */

export function ContactPage({ wzor }: { wzor: Wzor }) {
  return (
    <>
      <section className="wz-sec wz-sec--tight">
        <div className="wz-wrap">
          <p className="wz-kick">Kontakt</p>
          <h1 className="wz-h2" style={{ marginBottom: 14 }}>
            Najprościej zadzwonić
          </h1>
          <p className="wz-lead" style={{ marginBottom: 36 }}>
            Odbieramy w godzinach pracy biura, a poza nimi oddzwaniamy następnego dnia rano. Każde zgłoszenie z tej
            strony trafia od razu do konkretnego agenta, nie na wspólną skrzynkę.
          </p>

          <div className="wz-contact" data-revs>
            <a href={`tel:${wzor.phone.replace(/\s/g, "")}`} className="wz-box wz-contact__tile">
              <span className="wz-kick">Telefon</span>
              <b>{wzor.phone}</b>
              <span className="wz-muted">Poniedziałek do piątku, 9:00 do 18:00</span>
            </a>
            <a href={`mailto:${wzor.email}`} className="wz-box wz-contact__tile">
              <span className="wz-kick">E-mail</span>
              <b style={{ overflowWrap: "anywhere" }}>{wzor.email}</b>
              <span className="wz-muted">Odpowiadamy zwykle w dwie godziny</span>
            </a>
            <div className="wz-box wz-contact__tile">
              <span className="wz-kick">Biuro</span>
              <b>{wzor.address[0]}</b>
              <span className="wz-muted">{wzor.address[1]}, parking od podwórza</span>
            </div>
          </div>
        </div>
      </section>

      <section className="wz-sec wz-sec--tight" style={{ paddingTop: 0 }}>
        <div className="wz-wrap wz-split">
          <div className="wz-box" data-rev>
            <h2 className="wz-h3" style={{ marginBottom: 8 }}>
              Napisz wiadomość
            </h2>
            <p className="wz-muted" style={{ fontSize: 14.5, marginBottom: 20 }}>
              Pytanie o ofertę, o wycenę albo o to, jak w ogóle wygląda współpraca. Każde jest dobre.
            </p>
            <LeadForm kind="kontakt" />
          </div>

          <div style={{ display: "grid", gap: 18 }}>
            <Link href={`/wzory/${wzor.slug}/zglos-nieruchomosc`} className="wz-box wz-linkbox">
              <b>Chcę sprzedać albo wynająć</b>
              <span className="wz-muted">Osobny formularz z miejscem na adres i metraż, żebyśmy od razu mogli przygotować wycenę.</span>
              <span className="wz-linkbox__go">Przejdź →</span>
            </Link>
            <Link href={`/wzory/${wzor.slug}/zlec-poszukiwanie`} className="wz-box wz-linkbox">
              <b>Szukam czegoś konkretnego</b>
              <span className="wz-muted">Opisz kryteria, a odezwiemy się, gdy pojawi się dopasowanie. Także przed publikacją na portalach.</span>
              <span className="wz-linkbox__go">Przejdź →</span>
            </Link>
            <div className="wz-box">
              <b style={{ display: "block", marginBottom: 10, fontFamily: "var(--d-display)", fontSize: 19 }}>
                Wolisz spotkanie?
              </b>
              <p className="wz-muted" style={{ fontSize: 15 }}>
                Przyjdź do biura bez zapowiedzi w godzinach pracy albo umów się na konkretną godzinę, także wieczorem i
                w sobotę.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="wz-sec wz-sec--tight">
        <div className="wz-wrap">
          <Head kick="Opinie" title="Zanim do nas napiszesz" />
        </div>
        <Marquee speed={52} gap={20}>
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
    </>
  );
}

