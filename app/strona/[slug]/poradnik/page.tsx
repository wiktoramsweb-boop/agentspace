import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSiteBySlug } from "@/lib/site/config";
import { sitePosts } from "@/lib/site/data";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const site = await getSiteBySlug(slug);
  return { title: `Poradnik | ${site?.brand.officeName ?? "Biuro nieruchomości"}` };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const site = await getSiteBySlug(slug);
  if (!site || !site.published) notFound();

  const base = `/strona/${site.slug}`;
  const posts = await sitePosts(site.agencyId);

  return (
    <section className="wz-sec wz-sec--tight">
      <div className="wz-wrap">
        <p className="wz-kick">Poradnik</p>
        <h1 className="wz-h2" style={{ marginBottom: 14 }}>
          Wiedza, która oszczędza pieniądze
        </h1>
        <p className="wz-lead" style={{ marginBottom: 40 }}>
          Piszemy o tym, o co klienci pytają nas najczęściej.
        </p>

        {posts.length === 0 ? (
          <div className="wzl__empty">
            <p className="wz-muted">Pierwsze wpisy pojawią się wkrótce.</p>
          </div>
        ) : (
          <div className="wz-grid" data-revs>
            {posts.map((p) => (
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
        )}
      </div>
    </section>
  );
}
