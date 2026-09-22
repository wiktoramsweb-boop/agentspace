import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSiteBySlug } from "@/lib/site/config";
import { sitePosts } from "@/lib/site/data";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; post: string }>;
}): Promise<Metadata> {
  const { slug, post } = await params;
  const site = await getSiteBySlug(slug);
  const posts = site ? await sitePosts(site.agencyId) : [];
  const a = posts.find((p) => p.slug === post);
  return { title: `${a?.title ?? "Wpis"} | ${site?.brand.officeName ?? "Biuro"}`, description: a?.lead };
}

export default async function Page({ params }: { params: Promise<{ slug: string; post: string }> }) {
  const { slug, post } = await params;
  const site = await getSiteBySlug(slug);
  if (!site || !site.published) notFound();

  const base = `/strona/${site.slug}`;
  const posts = await sitePosts(site.agencyId);
  const a = posts.find((p) => p.slug === post);
  if (!a) notFound();

  const others = posts.filter((p) => p.slug !== a.slug).slice(0, 3);

  return (
    <>
      <section className="wz-sec wz-sec--tight" style={{ paddingBottom: 0 }}>
        <div className="wz-wrap wz-narrow">
          <p className="wz-muted" style={{ fontSize: 14, marginBottom: 16 }}>
            <Link href={base}>Strona główna</Link> · <Link href={`${base}/poradnik`}>Poradnik</Link> · {a.tag}
          </p>
          <h1 className="wz-h2" style={{ marginBottom: 16 }}>
            {a.title}
          </h1>
          {a.lead && (
            <p className="wz-lead" style={{ marginBottom: 20 }}>
              {a.lead}
            </p>
          )}
          <p className="wz-muted" style={{ fontSize: 14.5 }}>
            {[a.author, a.date, `${a.read} min czytania`].filter(Boolean).join(" · ")}
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
              Napisz albo zadzwoń, także wtedy, gdy nie planujesz jeszcze żadnej transakcji.
            </p>
            <Link href={`${base}/kontakt`} className="wz-btn">
              Zadaj pytanie
            </Link>
          </div>
        </div>
      </section>

      {others.length > 0 && (
        <section className="wz-sec wz-sec--tight">
          <div className="wz-wrap">
            <p className="wz-kick">Czytaj dalej</p>
            <h2 className="wz-h2" style={{ marginBottom: 30 }}>
              Inne wpisy
            </h2>
            <div className="wz-grid" data-revs>
              {others.map((p) => (
                <Link key={p.slug} href={`${base}/poradnik/${p.slug}`} className="wzc" style={{ display: "block" }}>
                  <span className="wzc__media">
                    <Image src={p.photo} alt="" fill sizes="33vw" />
                  </span>
                  <span className="wzc__body" style={{ display: "grid", gap: 8 }}>
                    <span className="wzc__loc">{p.date}</span>
                    <span className="wzc__title" style={{ fontFamily: "var(--d-display)" }}>
                      {p.title}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
