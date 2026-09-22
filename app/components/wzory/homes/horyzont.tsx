import Image from "next/image";
import Link from "next/link";
import { LeadForm } from "../lead-form";
import { UnitTable } from "../units";
import { WzMap } from "../map";
import { Counter, Faq, Head } from "../bits";
import { buildUnits } from "@/lib/wzory/units";
import { DEMO_OFFERS } from "@/lib/wzory/data";

const AMEN: [string, string, string][] = [
  ["/wzory/lobby.jpg", "Lobby z recepcją", "Odbiór paczek i ochrona przez całą dobę"],
  ["/wzory/basen.jpg", "Basen na dachu", "Podgrzewany, czynny od maja do września"],
  ["/wzory/lounge.jpg", "Strefa lounge", "Do pracy i na spotkania, tylko dla mieszkańców"],
  ["/wzory/park.jpg", "Zielony dziedziniec", "Plac zabaw i 40 drzew posadzonych na nowo"],
];

const TIME: [string, string, boolean][] = [
  ["Pozwolenie na budowę", "II kwartał 2024, prawomocne", true],
  ["Stan surowy zamknięty", "IV kwartał 2025, zakończony", true],
  ["Instalacje i elewacja", "III kwartał 2026, w trakcie", false],
  ["Odbiory i przekazanie kluczy", "II kwartał 2027", false],
];

const FAQ_DEV: [string, string][] = [
  ["Czy ceny w tabeli są ostateczne?", "Tak. Cena w tabeli to cena, którą wpisujemy do umowy deweloperskiej. Nie ma dopłat za piętro, ekspozycję ani wykończenie części wspólnych."],
  ["Jak wygląda harmonogram wpłat?", "Standardowo cztery transze powiązane z etapami budowy, rozliczane przez mieszkaniowy rachunek powierniczy zamknięty."],
  ["Czy można łączyć mieszkania?", "Do momentu zamknięcia stanu surowego tak, przy lokalach sąsiadujących na tym samym piętrze. Robimy wtedy indywidualną wycenę."],
  ["Co z miejscami postojowymi?", "Hala garażowa pod budynkiem, miejsce od 48 000 zł. Do każdego mieszkania powyżej 60 m² przypisujemy komórkę lokatorską w cenie."],
];

export function HomeHoryzont({ wzor }: { wzor: string }) {
  const base = `/wzory/${wzor}`;
  const units = buildUnits();
  const free = units.filter((u) => u.status === "wolne");
  const from = Math.min(...free.map((u) => u.price));
  const spot = DEMO_OFFERS[0];

  return (
    <>
      {/* ───────── nagłówek ───────── */}
      <header className="hor-hero">
        <div className="hor-hero__bg" data-par="7">
          <Image src="/wzory/szklo.jpg" alt="Wizualizacja inwestycji" fill priority sizes="100vw" />
        </div>
        <div className="wz-wrap hor-hero__in">
          <span className="hor-hero__badge">Etap II · w budowie · odbiory II kwartał 2027</span>
          <h1>Horyzont Zabłocie</h1>
          <p>
            Czterdzieści pięć mieszkań nad bulwarami, od kawalerki po penthouse z tarasem. Wszystkie ceny są na tej
            stronie, bez dzwonienia po cennik.
          </p>
          <div className="hor-hero__meta" data-revs>
            <div>
              <b>{free.length}</b>
              <span>wolnych mieszkań</span>
            </div>
            <div>
              <b>{new Intl.NumberFormat("pl-PL").format(from)} zł</b>
              <span>ceny od</span>
            </div>
            <div>
              <b>28 do 96 m²</b>
              <span>metraże</span>
            </div>
            <div>
              <b>2027</b>
              <span>termin oddania</span>
            </div>
          </div>
        </div>
      </header>

      {/* ───────── postęp ───────── */}
      <section className="wz-sec wz-sec--tight">
        <div className="wz-wrap">
          <div className="hor-progress" data-rev>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 12 }}>
              <p className="wz-h3">Postęp budowy</p>
              <p style={{ color: "var(--d-accent)", fontFamily: "var(--d-display)" }}>62%</p>
            </div>
            <div className="hor-progress__bar">
              <i style={{ width: "62%" }} />
            </div>
            <div className="hor-progress__steps">
              <span>
                <b>Stan surowy</b> zakończony
              </span>
              <span>
                <b>Elewacja</b> w trakcie
              </span>
              <span>
                <b>Instalacje</b> w trakcie
              </span>
              <span>
                <b>Odbiory</b> II kw. 2027
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── mieszkania ───────── */}
      <section className="wz-sec wz-sec--tight" id="mieszkania">
        <div className="wz-wrap">
          <Head
            kick="Wybierz mieszkanie"
            title="Wszystkie lokale i wszystkie ceny"
            lead="Filtruj po liczbie pokoi i piętrze. Status aktualizuje się razem z systemem sprzedaży, więc nie zobaczysz tu lokalu, który został wczoraj zarezerwowany."
          />
          <UnitTable units={units} />
        </div>
      </section>

      {/* ───────── udogodnienia ───────── */}
      <section className="wz-sec wz-sec--tight">
        <div className="wz-wrap">
          <Head kick="Budynek" title="To, czego nie widać na rzucie" />
          <div className="hor-amen" data-revs>
            {AMEN.map(([img, t, d]) => (
              <article key={t}>
                <Image src={img} alt="" fill sizes="(max-width: 900px) 50vw, 25vw" />
                <span>
                  <b>{t}</b>
                  <span>{d}</span>
                </span>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── harmonogram ───────── */}
      <section className="wz-sec wz-sec--tight">
        <div className="wz-wrap wz-split">
          <div>
            <Head kick="Harmonogram" title="Gdzie jesteśmy i co dalej" />
            <ul className="hor-time" style={{ listStyle: "none", margin: 0 }} data-revs>
              {TIME.map(([t, d, done]) => (
                <li key={t} className={done ? "is-done" : undefined}>
                  <b>{t}</b>
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="wz-box wz-sticky" data-rev>
            <h2 className="wz-h3" style={{ marginBottom: 8 }}>
              Zapytaj o konkretne mieszkanie
            </h2>
            <p className="wz-muted" style={{ fontSize: 14.5, marginBottom: 18 }}>
              Podaj numer lokalu z tabeli albo opisz, czego szukasz. Odpowiadamy w godzinach pracy biura sprzedaży.
            </p>
            <LeadForm kind="oferta" offerNo="Horyzont Zabłocie, etap II" />
          </div>
        </div>
      </section>

      {/* ───────── liczby ───────── */}
      <section className="wz-sec wz-sec--tight">
        <div className="wz-wrap">
          <div className="wz-stats-row" data-revs>
            <Counter value={45} label="mieszkań w etapie II" />
            <Counter value={8} label="kondygnacji" />
            <Counter value={96} label="miejsc w hali garażowej" />
            <Counter value={40} label="nowych drzew na dziedzińcu" />
          </div>
        </div>
      </section>

      {/* ───────── lokalizacja ───────── */}
      <section className="wz-sec wz-sec--tight">
        <div className="wz-wrap">
          <Head kick="Lokalizacja" title="Zabłocie, dwa kroki od bulwarów" />
          <div style={{ height: 440, borderRadius: "var(--d-radius-lg)", overflow: "hidden", border: "1px solid var(--d-line)" }} data-rev>
            <WzMap offers={[spot]} base={base} dark />
          </div>
        </div>
      </section>

      {/* ───────── pytania ───────── */}
      <section className="wz-sec wz-sec--tight">
        <div className="wz-wrap" style={{ maxWidth: 940 }}>
          <Head kick="Pytania" title="Zanim zarezerwujesz" />
          <Faq items={FAQ_DEV} />
          <div style={{ marginTop: 30, display: "flex", flexWrap: "wrap", gap: 12 }}>
            <Link href={`/wzory/${wzor}/kontakt`} className="wz-btn">
              Umów prezentację
            </Link>
            <Link href={`/wzory/${wzor}/kalkulator`} className="wz-btn wz-btn--ghost">
              Policz ratę kredytu
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
