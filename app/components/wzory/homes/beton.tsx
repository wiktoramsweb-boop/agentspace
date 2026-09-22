import Image from "next/image";
import Link from "next/link";
import { WzSearch } from "../search";
import { OfferCard } from "../offer-card";
import { LeadForm } from "../lead-form";
import { Faq, Head, Marquee } from "../bits";
import { DEMO_OFFERS, FAQ_SPRZEDAZ, KIND_LABELS, offerSummary, priceLabel } from "@/lib/wzory/data";

const DO: [string, string, string][] = [
  ["01", "Sprzedaż", "Wycena z aktów notarialnych, sesja, portale i negocjacje. Płacisz dopiero po podpisaniu aktu."],
  ["02", "Najem", "Weryfikacja najemcy, umowa okazjonalna, protokół i rozliczenia. Bez telefonów w niedzielę."],
  ["03", "Inwestycje", "Liczymy rentowność przed zakupem. Lokale, kawalerki i kamienice pod najem."],
];

export function HomeBeton({ wzor }: { wzor: string }) {
  const list = DEMO_OFFERS.slice(0, 8);
  const cards = DEMO_OFFERS.filter((o) => o.featured).slice(0, 3);

  return (
    <>
      {/* ───────── nagłówek ───────── */}
      <section className="wz-wrap bet-hero">
        <h1 data-rev>
          Mieszkania
          <br />
          w Krakowie <em>bez</em>
          <br />
          ściemy
        </h1>

        <div className="bet-hero__row">
          <div>
            <p className="bet-hero__lead">
              Mówimy, ile to jest warte, a nie ile chciałbyś usłyszeć. Pokazujemy akty notarialne z Twojej ulicy i
              sprzedajemy w cenie, która ma pokrycie w rynku.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 24 }}>
              <Link href={`/wzory/${wzor}/oferty`} className="wz-btn">
                Zobacz oferty
              </Link>
              <Link href={`/wzory/${wzor}/zglos-nieruchomosc`} className="wz-btn wz-btn--ghost">
                Wyceń moje mieszkanie
              </Link>
            </div>
          </div>

          <figure className="bet-hero__img" style={{ margin: 0 }} data-rev data-rev-zoom>
            <Image src="/wzory/hala.jpg" alt="" fill priority sizes="(max-width: 900px) 100vw, 40vw" />
          </figure>
        </div>

        <div className="bet-search" data-rev>
          <WzSearch wzor={wzor} compact />
        </div>
      </section>

      {/* ───────── pasek ───────── */}
      <div className="bet-band" style={{ marginTop: "clamp(34px, 5vw, 70px)" }}>
        <Marquee speed={26} gap={0}>
          {["Sprzedaż", "Najem", "Wycena", "Inwestycje", "Kraków"].map((t) => (
            <span key={t}>
              {t} <i>✦</i>
            </span>
          ))}
        </Marquee>
      </div>

      {/* ───────── katalog ───────── */}
      <section className="wz-sec wz-sec--tight" id="oferty">
        <div className="wz-wrap">
          <Head
            kick="Katalog"
            title="Aktualna baza"
            action={
              <Link href={`/wzory/${wzor}/oferty`} className="wz-btn wz-btn--ghost">
                Wszystkie {DEMO_OFFERS.length}
              </Link>
            }
          />
          <div className="bet-list" data-revs>
            {list.map((o, i) => (
              <Link key={o.id} href={`/wzory/${wzor}/oferta/${o.id}`} className="bet-row">
                <span className="bet-row__n">{String(i + 1).padStart(2, "0")}</span>
                <span className="bet-row__t">{o.title}</span>
                <span className="bet-row__m">
                  {o.district} · {KIND_LABELS[o.kind]}
                </span>
                <span className="bet-row__m">{offerSummary(o).join(" · ")}</span>
                <span className="bet-row__p">{priceLabel(o)}</span>
                <span className="bet-row__go">Zobacz →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── co robimy ───────── */}
      <section className="wz-sec wz-sec--tight">
        <div className="wz-wrap">
          <Head kick="Zakres" title="Trzy rzeczy" />
          <div className="bet-do" data-revs>
            {DO.map(([n, t, d]) => (
              <article key={n}>
                <b>{n}</b>
                <h3>{t}</h3>
                <p>{d}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── wyróżnione ───────── */}
      <section className="wz-sec wz-sec--tight">
        <div className="wz-wrap">
          <Head kick="Polecane" title="Warto zobaczyć" />
          <div className="wz-grid" data-revs>
            {cards.map((o) => (
              <OfferCard key={o.id} offer={o} wzor={wzor} />
            ))}
          </div>
        </div>
      </section>

      {/* ───────── liczby ───────── */}
      <section className="wz-sec wz-sec--tight">
        <div className="wz-wrap">
          <div className="bet-nums" data-revs>
            <div>
              <b>128</b>
              <span>transakcji w 2025</span>
            </div>
            <div>
              <b>21</b>
              <span>dni mediana</span>
            </div>
            <div>
              <b>98%</b>
              <span>ceny ofertowej</span>
            </div>
            <div>
              <b>0</b>
              <span>opłat z góry</span>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── pytania ───────── */}
      <section className="wz-sec wz-sec--tight">
        <div className="wz-wrap" style={{ maxWidth: 980 }}>
          <Head kick="FAQ" title="Pytania bez owijania" />
          <Faq items={FAQ_SPRZEDAZ} />
        </div>
      </section>

      {/* ───────── kontakt ───────── */}
      <section className="wz-sec" id="kontakt">
        <div className="wz-wrap">
          <div className="bet-cta" data-rev>
            <div>
              <h2>Napisz, oddzwonimy dziś</h2>
              <p style={{ marginTop: 16, fontSize: 17, maxWidth: "40ch" }}>
                Bez prezentacji w PowerPoincie i bez wciskania umowy na wyłączność na pierwszym spotkaniu.
              </p>
            </div>
            <div style={{ background: "#fff", border: "2px solid #0a0a0a", padding: "clamp(18px, 2.4vw, 28px)" }}>
              <LeadForm kind="kontakt" />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
