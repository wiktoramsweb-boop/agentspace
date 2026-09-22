import Link from "next/link";
import Image from "next/image";
import { WzSearch } from "../search";
import { OfferCard } from "../offer-card";
import { LeadForm } from "../lead-form";
import { WzMap } from "../map";
import { DEMO_AGENTS, DEMO_OFFERS, KIND_LABELS, districts, type DemoKind } from "@/lib/wzory/data";

const WHY: [string, string, string][] = [
  ["01", "Oferta w 24 godziny", "Od podpisania umowy do publikacji na stronie, portalach i w bazie poszukiwań mija jeden dzień roboczy."],
  ["02", "Zdjęcia i rzut w cenie", "Sesja fotograficzna, rzut 2D i spacer 3D robimy zawsze, niezależnie od wartości nieruchomości."],
  ["03", "Raport co tydzień", "Wyświetlenia, telefony, prezentacje i uwagi kupujących. Wysyłamy automatycznie w poniedziałek rano."],
  ["04", "Baza poszukiwań", "Zanim oferta trafi na portale, system sprawdza 340 aktywnych poszukiwań naszych klientów."],
];

const COMPARE: [string, string, string][] = [
  ["Publikacja na portalach", "Otodom, OLX, Nieruchomosci-online", "w cenie"],
  ["Sesja zdjęciowa", "Fotograf wnętrz, 25 zdjęć po obróbce", "w cenie"],
  ["Rzut i spacer 3D", "Pomiar na miejscu, rzut 2D i model 3D", "w cenie"],
  ["Home staging", "Konsultacja i drobne poprawki przed sesją", "w cenie"],
  ["Sprawdzenie dokumentów", "Księga wieczysta, zaświadczenia, zadłużenie", "w cenie"],
  ["Obsługa u notariusza", "Przygotowanie aktu i obecność na podpisaniu", "w cenie"],
];

export function HomeSiatka({ wzor }: { wzor: string }) {
  const newest = DEMO_OFFERS.slice(0, 6);
  const areas = districts();
  const kinds = (Object.keys(KIND_LABELS) as DemoKind[]).map((k) => ({
    k,
    label: KIND_LABELS[k],
    count: DEMO_OFFERS.filter((o) => o.kind === k).length,
  }));

  return (
    <>
      {/* ───────── nagłówek z wyszukiwarką ───────── */}
      <section className="wz-wrap sia-hero">
        <div className="sia-hero__grid">
          <div>
            <h1>
              Znajdź mieszkanie <span>bez przewijania</span> setek ogłoszeń
            </h1>
            <p className="sia-hero__sub">
              {DEMO_OFFERS.length} aktualnych ofert w Krakowie i okolicach. Każda z pełnymi danymi: cena za metr, czynsz,
              piętro, rok budowy i klasa energetyczna.
            </p>
            <div className="sia-hero__chips">
              {areas.slice(0, 5).map((a) => (
                <Link key={a.name} href={`/wzory/${wzor}/oferty?dzielnica=${encodeURIComponent(a.name)}`}>
                  {a.name}
                </Link>
              ))}
              <Link href={`/wzory/${wzor}/oferty`}>Wszystkie</Link>
            </div>
          </div>

          <div className="sia-panel" data-rev>
            <div className="sia-panel__t">
              <b>Wyszukiwarka</b>
              <span>Wynik odświeża się na żywo</span>
            </div>
            <WzSearch wzor={wzor} compact />
          </div>
        </div>
      </section>

      {/* ───────── pasek liczb ───────── */}
      <section className="wz-sec wz-sec--tight" style={{ paddingTop: 0 }}>
        <div className="wz-wrap">
          <div className="sia-bar" data-revs>
            <div>
              <b>{DEMO_OFFERS.length}</b>
              <span>ofert w bazie</span>
            </div>
            <div>
              <b>{areas.length}</b>
              <span>dzielnic i miejscowości</span>
            </div>
            <div>
              <b>340</b>
              <span>aktywnych poszukiwań</span>
            </div>
            <div>
              <b>19 min</b>
              <span>średni czas odpowiedzi</span>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── kategorie ───────── */}
      <section className="wz-sec wz-sec--tight">
        <div className="wz-wrap">
          <div className="sia-head">
            <h2>Przeglądaj według rodzaju</h2>
          </div>
          <div className="sia-tiles" data-revs>
            {kinds.map((k) => (
              <Link key={k.k} href={`/wzory/${wzor}/oferty?typ=${k.k}`}>
                <i>→</i>
                <b>{k.label}</b>
                <span>{k.count} w bazie</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── najnowsze ───────── */}
      <section className="wz-sec wz-sec--tight" id="oferty">
        <div className="wz-wrap">
          <div className="sia-head">
            <h2>Najnowsze oferty</h2>
            <Link href={`/wzory/${wzor}/oferty`} className="wz-btn wz-btn--ghost">
              Zobacz wszystkie {DEMO_OFFERS.length}
            </Link>
          </div>
          <div className="wz-grid" data-revs>
            {newest.map((o, i) => (
              <OfferCard key={o.id} offer={o} wzor={wzor} priority={i < 3} />
            ))}
          </div>
        </div>
      </section>

      {/* ───────── mapa ───────── */}
      <section className="wz-sec wz-sec--tight">
        <div className="wz-wrap">
          <div className="sia-head">
            <div>
              <h2>Szukaj na mapie</h2>
              <p className="wz-lead" style={{ marginTop: 10 }}>
                Pinezka pokazuje cenę od razu, bez wchodzenia w ofertę.
              </p>
            </div>
          </div>
          <div className="sia-map" data-rev>
            <WzMap offers={DEMO_OFFERS} wzor={wzor} />
          </div>
        </div>
      </section>

      {/* ───────── dlaczego ───────── */}
      <section className="wz-sec wz-sec--tight">
        <div className="wz-wrap">
          <div className="sia-head">
            <h2>Cztery rzeczy, które robimy inaczej</h2>
          </div>
          <div className="sia-why" data-revs>
            {WHY.map(([n, t, d]) => (
              <article key={n}>
                <b>{n}</b>
                <h3>{t}</h3>
                <p>{d}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── co w cenie ───────── */}
      <section className="wz-sec wz-sec--tight">
        <div className="wz-wrap">
          <div className="sia-head">
            <div>
              <h2>Co dostaje właściciel</h2>
              <p className="wz-lead" style={{ marginTop: 10 }}>
                Jedno wynagrodzenie, bez dopłat po drodze. Poniżej wszystko, co jest w nim zawarte.
              </p>
            </div>
          </div>
          <div style={{ overflowX: "auto" }} data-rev>
            <table className="sia-table">
              <thead>
                <tr>
                  <th>Element obsługi</th>
                  <th>Co obejmuje</th>
                  <th>Koszt</th>
                </tr>
              </thead>
              <tbody>
                {COMPARE.map(([a, b, c]) => (
                  <tr key={a}>
                    <td>{a}</td>
                    <td className="no">{b}</td>
                    <td className="ok">{c}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ───────── zespół ───────── */}
      <section className="wz-sec wz-sec--tight">
        <div className="wz-wrap">
          <div className="sia-head">
            <h2>Kto odbierze telefon</h2>
            <Link href={`/wzory/${wzor}/zespol`} className="wz-btn wz-btn--ghost">
              Cały zespół
            </Link>
          </div>
          <div className="wz-grid" data-revs style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
            {DEMO_AGENTS.map((a) => (
              <div key={a.id} className="wza">
                <div className="wza__ph">
                  <Image src={a.photo} alt={a.name} width={76} height={76} />
                </div>
                <div>
                  <p className="wza__name">{a.name}</p>
                  <p className="wza__role">{a.role}</p>
                  <div className="wza__links">
                    <a href={`tel:${a.phone.replace(/\s/g, "")}`} className="wz-btn wz-btn--sm wz-btn--ghost">
                      {a.phone}
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── kontakt ───────── */}
      <section className="wz-sec" id="kontakt">
        <div className="wz-wrap">
          <div className="sia-cta">
            <div>
              <p className="wz-kick">Wycena nieruchomości</p>
              <h2 className="wz-h2" style={{ marginBottom: 18 }}>
                Sprawdź, za ile realnie sprzedasz
              </h2>
              <p className="wz-lead" style={{ marginBottom: 22 }}>
                Wysyłamy zestawienie cen transakcyjnych z Twojego budynku i sąsiednich ulic z ostatnich dwunastu
                miesięcy. Bez zobowiązań i bez wizyty, jeśli nie chcesz.
              </p>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 10, fontSize: 15.5 }}>
                <li>Odpowiedź w ciągu dwóch godzin roboczych</li>
                <li>Raport w PDF na maila</li>
                <li>Rozmowa tylko wtedy, gdy sam poprosisz</li>
              </ul>
            </div>
            <div className="sia-cta__box">
              <LeadForm kind="zglos" />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
