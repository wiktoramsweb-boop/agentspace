import { permanentRedirect } from "next/navigation";
import { localeHref, toLocale } from "@/lib/i18n";

/**
 * Strona internetowa biura ma własną, pełną stronę pod /wzory: osiem wzorów
 * z podglądem na żywo, podstronami i cennikiem dodatku. Opis modułu był przy
 * niej ubogi i dublował temat, więc kierujemy w jedno miejsce.
 */
export default async function StronaWwwRedirect({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  permanentRedirect(localeHref(toLocale(lang), "/wzory"));
}
