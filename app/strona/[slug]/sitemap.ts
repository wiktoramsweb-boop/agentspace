import type { MetadataRoute } from "next";
import { getSiteBySlug } from "@/lib/site/config";
import { siteOffers, sitePosts } from "@/lib/site/data";

/**
 * Mapa strony biura. Adres bierzemy z własnej domeny, jeśli jest podpięta,
 * żeby Google nie indeksował tej samej treści pod dwoma adresami.
 */
export default async function sitemap({ params }: { params: { slug: string } }): Promise<MetadataRoute.Sitemap> {
  const site = await getSiteBySlug(params.slug);
  if (!site || !site.published) return [];

  const origin = site.domain ? `https://${site.domain}` : `https://agentspace.pl/strona/${site.slug}`;
  const [offers, posts] = await Promise.all([siteOffers(site.agencyId), sitePosts(site.agencyId)]);
  const now = new Date();

  const pages = ["", "/oferty", "/sprzedaj", "/zespol", "/kontakt", "/poradnik", "/kalkulator", "/zglos-nieruchomosc", "/zlec-poszukiwanie"];

  return [
    ...pages.map((p) => ({
      url: `${origin}${p}`,
      lastModified: now,
      changeFrequency: (p === "/oferty" ? "daily" : "weekly") as "daily" | "weekly",
      priority: p === "" ? 1 : 0.7,
    })),
    ...offers.map((o) => ({
      url: `${origin}/oferta/${o.id}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...posts.map((p) => ({
      url: `${origin}/poradnik/${p.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
