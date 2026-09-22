import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getWzor } from "@/lib/wzory/themes";
import { DEMO_AGENTS, DEMO_OFFERS } from "@/lib/wzory/data";
import { OfferCard } from "../../../components/wzory/offer-card";

export async function generateMetadata({ params }: { params: Promise<{ wzor: string }> }): Promise<Metadata> {
  const { wzor } = await params;
  const w = getWzor(wzor);
  return { title: `Zespół | ${w?.office ?? "Wzór"} | wzór AgentSpace`, robots: { index: false, follow: true } };
}

export default async function ZespolPage({ params }: { params: Promise<{ wzor: string }> }) {
  const { wzor } = await params;
  const w = getWzor(wzor);
  if (!w) notFound();

  return (
    <>
      <section className="wz-sec wz-sec--tight">
        <div className="wz-wrap">
          <p className="wz-kick">Zespół</p>
          <h1 className="wz-h2" style={{ marginBottom: 14 }}>
            Ludzie, którzy poprowadzą Twoją sprawę
          </h1>
          <p className="wz-lead">
            U nas jeden agent prowadzi transakcję od pierwszej rozmowy do przekazania kluczy. Nie przekazujemy klientów
            dalej i nie odsyłamy do „kolegi z działu”.
          </p>

          <div style={{ display: "grid", gap: "clamp(20px, 3vw, 34px)", marginTop: 40 }} data-revs>
            {DEMO_AGENTS.map((a, i) => {
              const own = DEMO_OFFERS.filter((o) => o.agentId === a.id);
              return (
                <article
                  key={a.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(0, 300px) minmax(0, 1fr)",
                    gap: "clamp(18px, 3vw, 40px)",
                    alignItems: "start",
                    borderTop: i === 0 ? "none" : "1px solid var(--d-line)",
                    paddingTop: i === 0 ? 0 : "clamp(20px, 3vw, 34px)",
                  }}
                >
                  <div className="wz-img" style={{ aspectRatio: "4 / 5", borderRadius: "var(--d-radius-lg)" }}>
                    <Image src={a.photo} alt={a.name} fill sizes="(max-width: 800px) 100vw, 300px" />
                  </div>

                  <div>
                    <h2 className="wz-h3" style={{ marginBottom: 4 }}>
                      {a.name}
                    </h2>
                    <p className="wz-muted" style={{ marginBottom: 16 }}>
                      {a.role}
                    </p>
                    <p style={{ fontSize: 16.5, color: "var(--d-muted-strong)", maxWidth: "60ch", marginBottom: 18 }}>
                      {a.bio}
                    </p>

                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
                      {a.areas.map((ar) => (
                        <span
                          key={ar}
                          style={{
                            padding: "8px 13px",
                            border: "1px solid var(--d-line-strong)",
                            borderRadius: "var(--d-radius)",
                            fontSize: 14,
                          }}
                        >
                          {ar}
                        </span>
                      ))}
                      <span
                        style={{
                          padding: "8px 13px",
                          borderRadius: "var(--d-radius)",
                          fontSize: 14,
                          background: "var(--d-accent-soft)",
                          color: "var(--d-accent)",
                          fontWeight: 600,
                        }}
                      >
                        {a.deals} transakcji
                      </span>
                    </div>

                    <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                      <a href={`tel:${a.phone.replace(/\s/g, "")}`} className="wz-btn wz-btn--sm">
                        {a.phone}
                      </a>
                      <a href={`mailto:${a.email}`} className="wz-btn wz-btn--sm wz-btn--ghost">
                        {a.email}
                      </a>
                    </div>

                    {own.length > 0 && (
                      <div style={{ marginTop: 26 }}>
                        <p className="wz-kick" style={{ marginBottom: 14 }}>
                          Oferty {a.name.split(" ")[0]}
                        </p>
                        <div className="wz-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}>
                          {own.slice(0, 3).map((o) => (
                            <OfferCard key={o.id} offer={o} wzor={w.slug} sizes="240px" />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
