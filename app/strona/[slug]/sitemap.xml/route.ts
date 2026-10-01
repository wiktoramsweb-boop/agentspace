import { getSiteBySlug } from "@/lib/site/config";
import { siteOffers, sitePosts } from "@/lib/site/data";

// Zwykły route zamiast pliku sitemap.ts: Next 16.3 nie przekazuje już
// parametrów adresu do sitemap.ts w dynamicznym segmencie i build padał.
export const dynamic = "force-dynamic";

type Entry = { url: string; changefreq: string; priority: number };

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Mapa strony biura. Adres bierzemy z własnej domeny, jeśli jest podpięta,
 * żeby Google nie indeksował tej samej treści pod dwoma adresami.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const site = await getSiteBySlug(slug);
  if (!site || !site.published) return new Response("Not found", { status: 404 });

  const origin = site.domain ? `https://${site.domain}` : `https://agentspace.pl/strona/${site.slug}`;
  const [offers, posts] = await Promise.all([siteOffers(site.agencyId), sitePosts(site.agencyId)]);
  const now = new Date().toISOString();

  const pages = ["", "/oferty", "/sprzedaj", "/zespol", "/kontakt", "/poradnik", "/kalkulator", "/zglos-nieruchomosc", "/zlec-poszukiwanie"];

  const entries: Entry[] = [
    ...pages.map((p) => ({ url: `${origin}${p}`, changefreq: p === "/oferty" ? "daily" : "weekly", priority: p === "" ? 1 : 0.7 })),
    ...offers.map((o) => ({ url: `${origin}/oferta/${o.id}`, changefreq: "weekly", priority: 0.8 })),
    ...posts.map((p) => ({ url: `${origin}/poradnik/${p.slug}`, changefreq: "monthly", priority: 0.6 })),
  ];

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    entries
      .map((e) => `<url><loc>${esc(e.url)}</loc><lastmod>${now}</lastmod><changefreq>${e.changefreq}</changefreq><priority>${e.priority}</priority></url>`)
      .join("\n") +
    `\n</urlset>\n`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
