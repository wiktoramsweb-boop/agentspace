import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getSiteBySlug } from "@/lib/site/config";
import { siteTeam } from "@/lib/site/data";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const site = await getSiteBySlug(slug);
  return { title: `Zespół | ${site?.brand.officeName ?? "Biuro nieruchomości"}` };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const site = await getSiteBySlug(slug);
  if (!site || !site.published) notFound();

  const team = await siteTeam(site.agencyId);

  return (
    <section className="wz-sec wz-sec--tight">
      <div className="wz-wrap">
        <p className="wz-kick">Zespół</p>
        <h1 className="wz-h2" style={{ marginBottom: 14 }}>
          Ludzie, którzy poprowadzą Twoją sprawę
        </h1>
        <p className="wz-lead" style={{ marginBottom: 40 }}>
          Każdą transakcję prowadzi jedna osoba od pierwszej rozmowy do przekazania kluczy.
        </p>

        {team.length === 0 ? (
          <div className="wzl__empty">
            <p className="wz-muted">Zespół pojawi się tutaj, gdy agenci uzupełnią swoje profile w systemie.</p>
          </div>
        ) : (
          <div className="wz-cards" data-revs>
            {team.map((a) => (
              <article key={a.id} className="wz-box" style={{ display: "grid", gap: 16 }}>
                <figure className="wz-img wz-media" style={{ margin: 0, aspectRatio: "4 / 5" }}>
                  <Image src={a.photo} alt={a.name} fill sizes="(max-width: 900px) 50vw, 30vw" />
                </figure>
                <div>
                  <p className="wz-h3">{a.name}</p>
                  <p className="wz-muted" style={{ fontSize: 14, marginBottom: 12 }}>
                    {a.role}
                  </p>
                  {a.bio && <p style={{ fontSize: 15.5, color: "var(--d-muted-strong)", marginBottom: 14 }}>{a.bio}</p>}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {a.phone && (
                      <a href={`tel:${a.phone.replace(/\s/g, "")}`} className="wz-btn wz-btn--sm">
                        {a.phone}
                      </a>
                    )}
                    {a.email && (
                      <a href={`mailto:${a.email}`} className="wz-btn wz-btn--sm wz-btn--ghost">
                        E-mail
                      </a>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
