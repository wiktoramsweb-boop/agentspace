import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getWzor } from "@/lib/wzory/themes";
import { LeadForm } from "../../../components/wzory/lead-form";

export async function generateMetadata({ params }: { params: Promise<{ wzor: string }> }): Promise<Metadata> {
  const { wzor } = await params;
  const w = getWzor(wzor);
  return { title: `Kontakt | ${w?.office ?? "Wzór"} | wzór AgentSpace`, robots: { index: false, follow: true } };
}

export default async function KontaktPage({ params }: { params: Promise<{ wzor: string }> }) {
  const { wzor } = await params;
  const w = getWzor(wzor);
  if (!w) notFound();

  const box: React.CSSProperties = {
    border: "1px solid var(--d-line)",
    borderRadius: "var(--d-radius-lg)",
    padding: "clamp(20px, 3vw, 32px)",
    background: "var(--d-card)",
  };

  return (
    <>
      <section className="wz-sec wz-sec--tight">
        <div className="wz-wrap">
          <p className="wz-kick">Kontakt</p>
          <h1 className="wz-h2" style={{ marginBottom: 14 }}>
            Napisz albo zadzwoń
          </h1>
          <p className="wz-lead">
            Każde zgłoszenie z tej strony trafia u nas od razu do systemu i do konkretnego agenta, a nie na wspólną
            skrzynkę, którą ktoś przegląda raz dziennie.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "clamp(16px, 2vw, 24px)",
              margin: "36px 0 10px",
            }}
            data-revs
          >
            <div style={box}>
              <p className="wz-kick" style={{ marginBottom: 8 }}>
                Telefon
              </p>
              <p style={{ fontSize: 20, fontFamily: "var(--d-display)" }}>
                <a href={`tel:${w.phone.replace(/\s/g, "")}`}>{w.phone}</a>
              </p>
              <p className="wz-muted" style={{ fontSize: 14, marginTop: 6 }}>
                Poniedziałek do piątku, 9:00 do 18:00
              </p>
            </div>
            <div style={box}>
              <p className="wz-kick" style={{ marginBottom: 8 }}>
                E-mail
              </p>
              <p style={{ fontSize: 18, fontFamily: "var(--d-display)", overflowWrap: "anywhere" }}>
                <a href={`mailto:${w.email}`}>{w.email}</a>
              </p>
              <p className="wz-muted" style={{ fontSize: 14, marginTop: 6 }}>
                Odpowiadamy zwykle w dwie godziny
              </p>
            </div>
            <div style={box}>
              <p className="wz-kick" style={{ marginBottom: 8 }}>
                Biuro
              </p>
              <p style={{ fontSize: 18, fontFamily: "var(--d-display)" }}>
                {w.address.map((a) => (
                  <span key={a} style={{ display: "block" }}>
                    {a}
                  </span>
                ))}
              </p>
              <p className="wz-muted" style={{ fontSize: 14, marginTop: 6 }}>
                Parking dla klientów od podwórza
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="wz-sec wz-sec--tight" style={{ paddingTop: 0 }}>
        <div className="wz-wrap" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "clamp(20px, 3vw, 34px)" }}>
          <div style={box} id="wiadomosc">
            <h2 className="wz-h3" style={{ marginBottom: 6 }}>
              Zwykła wiadomość
            </h2>
            <p className="wz-muted" style={{ fontSize: 14.5, marginBottom: 18 }}>
              Masz pytanie o konkretną ofertę albo o to, jak pracujemy? Napisz, oddzwonimy.
            </p>
            <LeadForm kind="kontakt" />
          </div>

          <div style={box} id="zglos">
            <h2 className="wz-h3" style={{ marginBottom: 6 }}>
              Zgłoś nieruchomość
            </h2>
            <p className="wz-muted" style={{ fontSize: 14.5, marginBottom: 18 }}>
              Chcesz sprzedać albo wynająć. Przygotujemy wycenę i plan działania, zanim podejmiesz decyzję.
            </p>
            <LeadForm kind="zglos" />
          </div>

          <div style={box} id="poszukiwanie">
            <h2 className="wz-h3" style={{ marginBottom: 6 }}>
              Zleć poszukiwanie
            </h2>
            <p className="wz-muted" style={{ fontSize: 14.5, marginBottom: 18 }}>
              Nie ma na stronie tego, czego szukasz? Opisz kryteria, a odezwiemy się, gdy pojawi się dopasowanie.
            </p>
            <LeadForm kind="poszukiwanie" />
          </div>
        </div>
      </section>
    </>
  );
}
