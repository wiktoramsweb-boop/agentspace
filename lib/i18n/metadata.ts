import type { Metadata } from "next";
import { LOCALES, localeHref, type Locale } from "./config";

const SITE = "https://agentspace.pl";

/** Kody języka w formacie, którego oczekuje hreflang i Open Graph. */
const OG_LOCALE: Record<Locale, string> = { pl: "pl_PL", en: "en_US" };
const HREFLANG: Record<Locale, string> = { pl: "pl-PL", en: "en" };

/**
 * Metadane strony marketingowej w danym języku.
 *
 * `plPath` to zawsze polska ścieżka (np. `/cennik`) - adresy dla obu wersji
 * wyliczamy z niej, więc hreflang nie rozjedzie się z linkami w nawigacji.
 */
export function pageMetadata(
  lang: Locale,
  plPath: string,
  title: string,
  description: string,
  extra?: Metadata,
): Metadata {
  const canonical = `${SITE}${localeHref(lang, plPath)}`;

  const languages = Object.fromEntries(
    LOCALES.map((code) => [HREFLANG[code], `${SITE}${localeHref(code, plPath)}`]),
  );

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: { ...languages, "x-default": `${SITE}${localeHref("pl", plPath)}` },
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "AgentSpace",
      locale: OG_LOCALE[lang],
      type: "website",
    },
    twitter: { card: "summary_large_image", title, description },
    ...extra,
  };
}
