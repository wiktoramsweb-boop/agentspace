import type { MetadataRoute } from "next";
import { getAllPostsMeta } from "@/lib/blog";
import { INTEGRATIONS } from "@/lib/marketing/integrations";
import { MODULES } from "@/lib/marketing/modules";
import { LOCALES, localeHref } from "@/lib/i18n/config";

const BASE_URL = "https://agentspace.pl";

/** Ten sam adres w obu językach, z wzajemnym hreflang. */
function bothLocales(
  plPath: string,
  lastModified: Date,
  changeFrequency: "weekly" | "monthly" | "yearly",
  priority: number,
): MetadataRoute.Sitemap {
  const languages = Object.fromEntries(
    LOCALES.map((code) => [code, `${BASE_URL}${localeHref(code, plPath)}`]),
  );

  return LOCALES.map((code) => ({
    url: `${BASE_URL}${localeHref(code, plPath)}`,
    lastModified,
    changeFrequency,
    priority: code === "pl" ? priority : priority - 0.1,
    alternates: { languages },
  }));
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticPages = [
    ["/", "weekly", 1.0],
    ["/cennik", "monthly", 0.9],
    ["/demo", "monthly", 0.8],
    ["/dla-wlascicieli", "monthly", 0.9],
    ["/dla-agentow", "monthly", 0.8],
    ["/o-nas", "monthly", 0.7],
    ["/kontakt", "monthly", 0.7],
    ["/blog", "weekly", 0.8],
    ["/integracje", "monthly", 0.8],
    ["/polityka-prywatnosci", "yearly", 0.3],
    ["/regulamin", "yearly", 0.3],
  ] as const;

  return [
    ...staticPages.flatMap(([path, freq, priority]) => bothLocales(path, now, freq, priority)),
    // Strony modułów - długi ogon fraz produktowych.
    ...MODULES.flatMap((mod) => bothLocales(`/produkt/${mod.slug}`, now, "monthly", 0.8)),
    // Strony integracji - łapią wyszukiwania „[system] + integracja".
    ...INTEGRATIONS.flatMap((item) => bothLocales(`/integracje/${item.slug}`, now, "monthly", 0.7)),
    // Wpisy blogowe powstają po polsku, więc do mapy trafia tylko polski adres.
    ...getAllPostsMeta().map((post) => ({
      url: `${BASE_URL}/blog/${post.slug}`,
      lastModified: new Date(post.date),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
