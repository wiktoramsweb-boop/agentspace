import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSiteBySlug } from "@/lib/site/config";
import { siteOffers, sitePosts, siteTeam } from "@/lib/site/data";
import { getWzor } from "@/lib/wzory/themes";
import { ASSET_BUCKET, publicAssetUrl } from "@/lib/storage";
import { WzSearch } from "../../components/wzory/search";
import { OfferCard } from "../../components/wzory/offer-card";
import { SiteLeadForm } from "../../components/wzory/site-lead-form";
import { Head, Marquee } from "../../components/wzory/bits";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const site = await getSiteBySlug(slug);
  if (!site) return { robots: { index: false, follow: false } };
  return {
    title: `${site.brand.officeName} | ${site.brand.claim}`,
    description: site.content.heroLead,
  };
}

export default async function SiteHome({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const site = await getSiteBySlug(slug);
  if (!site || !site.published) notFound();

  const base = `/strona/${site.slug}`;
  const theme = getWzor(site.template);
  const [offers, team, posts] = await Promise.all([
    siteOffers(site.agencyId),
    siteTeam(site.agencyId),
    sitePosts(site.agencyId),
  ]);

  const hero = site.brand.heroPath ? publicAssetUrl(ASSET_BUCKET, site.brand.heroPath) : "/wzory/kamienica.jpg";
  const featured = offers.slice(0, 6);
  const dark = theme?.dark ?? false;

  return (
    <>
      {/* ───────── nagłówek ───────── */}
      <section className={dark ? "str-hero" : "wz-sec wz-sec--tight"}>
        {dark && (
          <div className="str-hero__bg" data-par="6">
            <Image src={hero} alt="" fill priority sizes="100vw" />
          </div>
        )}

        <div className={dark ? "wz-wrap str-hero__in" : "wz-wrap wz-split--even"} style={{ display: dark ? undefined : "grid" }}>
          <div>
            <p className="wz-kick">{site.content.heroKick}</p>
            <h1 className="wz-h2" style={{ fontSize: "clamp(36px, 5.2vw, 68px)", marginBottom: 18 }}>
              {site.content.heroTitle}
            </h1>
            <p className="wz-lead" style={{ marginBottom: 26 }}>
              {site.content.heroLead}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              <Link href={`${base}/oferty`} className="wz-btn">
                Zobacz {offers.length > 0 ? `${offers.length} ofert` : "oferty"}
              </Link>
              <Link href={`${base}/zglos-nieruchomosc`} className="wz-btn wz-btn--ghost">
                Bezpłatna wycena
              </Link>
            </div>
          </div>

          {!dark && (
            <figure className="wz-img wz-media" style={{ margin: 0, aspectRatio: "4 / 3" }} data-rev data-rev-zoom>
              <Image src={hero} alt="" fill priority sizes="(max-width: 900px) 100vw, 46vw" />
            </figure>
          )}
        </div>
      </section>

      {/* ───────── wyszukiwarka ───────── */}
      {offers.length > 0 && (
        <section className="wz-sec wz-sec--tight" style={{ paddingTop: 0 }}>
          <div className="wz-wrap">
            <div className="wz-box" data-rev>
              <WzSearch base={base} offers={offers} compact />
            </div>
          </div>
        </section>
      )}

      {/* ───────── liczby ───────── */}
      {site.content.stats.length > 0 && (
        <section className="wz-sec wz-sec--tight">
          <div className="wz-wrap">
            <div className="wz-stats-row" data-revs>
              {site.content.stats.map((s) => (
                <div key={s.label} className="wz-stat">
                  <b>{s.value}</b>
                  <span>{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ───────── oferty ───────── */}
      <section className="wz-sec wz-sec--tight" id="oferty">
        <div className="wz-wrap">
          <Head
            kick="Oferty"
            title="Aktualne nieruchomości"
            action={
              <Link href={`${base}/oferty`} className="wz-btn wz-btn--ghost">
                Wszystkie oferty
              </Link>
            }
          />
          {featured.length === 0 ? (
            <div className="wzl__empty">
              <p className="wz-h3" style={{ marginBottom: 10 }}>
                Trwa aktualizacja bazy ofert
              </p>
              <p className="wz-muted">
                Zadzwoń albo napisz, a powiemy, co mamy w tej chwili. Część ofert pokazujemy tylko bezpośrednio.
              </p>
            </div>
          ) : (
            <div className="wz-grid" data-revs>
              {featured.map((o, i) => (
                <OfferCard key={o.id} offer={o} base={base} priority={i < 3} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ───────── dlaczego my ───────── */}
      {site.content.reasons.length > 0 && (
        <section className="wz-sec wz-sec--tight">
          <div className="wz-wrap">
            <Head kick="Dlaczego my" title="Co nas wyróżnia" />
            <div className="wz-cards" data-revs>
              {site.content.reasons.map((r) => (
                <article key={r.title} className="wz-box">
                  <h3 className="wz-h3" style={{ marginBottom: 10 }}>
                    {r.title}
                  </h3>
                  <p className="wz-muted">{r.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ───────── o nas ───────── */}
      <section className="wz-sec wz-sec--tight">
        <div className="wz-wrap wz-split">
          <div>
            <Head kick="O biurze" title={site.content.aboutTitle} />
            <div style={{ display: "grid", gap: 14, fontSize: 17, color: "var(--d-muted-strong)" }}>
              {site.content.aboutBody.split(/\n{2,}/).map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
            <div style={{ marginTop: 26 }}>
              <Link href={`${base}/zespol`} className="wz-btn wz-btn--ghost">
                Poznaj zespół
              </Link>
            </div>
          </div>
          <figure className="wz-img wz-media" style={{ margin: 0, aspectRatio: "4 / 3" }} data-rev data-rev-zoom>
            <Image src={hero} alt="" fill sizes="(max-width: 900px) 100vw, 40vw" />
          </figure>
        </div>
      </section>

      {/* ───────── zespół ───────── */}
      {team.length > 0 && (
        <section className="wz-sec wz-sec--tight">
          <div className="wz-wrap">
            <Head
              kick="Zespół"
              title="Kto odbierze telefon"
              action={
                <Link href={`${base}/zespol`} className="wz-btn wz-btn--ghost">
                  Cały zespół
                </Link>
              }
            />
            <div className="wz-cards" data-revs>
              {team.slice(0, 3).map((a) => (
                <article key={a.id} className="wz-box" style={{ display: "grid", gap: 14 }}>
                  <figure className="wz-img wz-media" style={{ margin: 0, aspectRatio: "4 / 3" }}>
                    <Image src={a.photo} alt={a.name} fill sizes="30vw" />
                  </figure>
                  <div>
                    <p className="wz-h3">{a.name}</p>
                    <p className="wz-muted" style={{ fontSize: 14, marginBottom: 10 }}>
                      {a.role}
                    </p>
                    {a.phone && (
                      <a href={`tel:${a.phone.replace(/\s/g, "")}`} className="wz-btn wz-btn--sm">
                        {a.phone}
                      </a>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ───────── opinie ───────── */}
      {site.content.reviews.length > 0 && (
        <section className="wz-sec wz-sec--tight">
          <div className="wz-wrap">
            <Head kick="Opinie" title="Co mówią klienci" />
          </div>
          <Marquee speed={52} gap={20}>
            {site.content.reviews.map((r, i) => (
              <figure key={i} className="wz-review">
                <p className="wz-review__stars">★★★★★</p>
                <blockquote>{r.text}</blockquote>
                <figcaption>
                  <span className="wz-review__av">{r.who.slice(0, 2).toUpperCase()}</span>
                  <span>
                    <b>{r.who}</b>
                    <span>{r.what}</span>
                  </span>
                </figcaption>
              </figure>
            ))}
          </Marquee>
        </section>
      )}

      {/* ───────── poradnik ───────── */}
      {posts.length > 0 && (
        <section className="wz-sec wz-sec--tight">
          <div className="wz-wrap">
            <Head
              kick="Poradnik"
              title="Wiedza, która oszczędza pieniądze"
              action={
                <Link href={`${base}/poradnik`} className="wz-btn wz-btn--ghost">
                  Wszystkie wpisy
                </Link>
              }
            />
            <div className="wz-grid" data-revs>
              {posts.slice(0, 3).map((p) => (
                <Link key={p.slug} href={`${base}/poradnik/${p.slug}`} className="wzc" style={{ display: "block" }}>
                  <span className="wzc__media">
                    <Image src={p.photo} alt="" fill sizes="(max-width: 700px) 100vw, 33vw" />
                    <span className="wzc__tags">
                      <span className="wzc__tag">{p.tag}</span>
                    </span>
                  </span>
                  <span className="wzc__body" style={{ display: "grid", gap: 9 }}>
                    <span className="wzc__loc">
                      {p.date} · {p.read} min
                    </span>
                    <span className="wzc__title" style={{ fontFamily: "var(--d-display)" }}>
                      {p.title}
                    </span>
                    <span className="wz-muted" style={{ fontSize: 15 }}>
                      {p.lead}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ───────── kontakt ───────── */}
      <section className="wz-sec" id="kontakt">
        <div className="wz-wrap wz-split">
          <div>
            <Head kick="Kontakt" title={site.content.ctaTitle} lead={site.content.ctaLead} />
            <div style={{ display: "grid", gap: 10, fontSize: 16.5 }}>
              {site.contact.phone && (
                <p>
                  <a href={`tel:${site.contact.phone.replace(/\s/g, "")}`} style={{ fontSize: 22, fontFamily: "var(--d-display)" }}>
                    {site.contact.phone}
                  </a>
                </p>
              )}
              {site.contact.email && (
                <p>
                  <a href={`mailto:${site.contact.email}`}>{site.contact.email}</a>
                </p>
              )}
              {site.contact.addressLine && (
                <p className="wz-muted">
                  {site.contact.addressLine}
                  {site.contact.addressCity ? `, ${site.contact.addressCity}` : ""}
                </p>
              )}
              {site.contact.hours && <p className="wz-muted">{site.contact.hours}</p>}
            </div>
          </div>
          <div className="wz-box" data-rev>
            <SiteLeadForm agencyId={site.agencyId} base={base} kind="kontakt" />
          </div>
        </div>
      </section>
    </>
  );
}
