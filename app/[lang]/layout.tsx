import { notFound } from "next/navigation";
import { LOCALES, isLocale } from "@/lib/i18n";

/**
 * Warstwa języka dla strony marketingowej.
 *
 * `<html lang>` siedzi w layoutcie głównym, wspólnym z aplikacją, więc język
 * ustawiamy tutaj na kontenerze. `display: contents` sprawia, że ten element
 * nie istnieje dla układu strony - jest tylko nośnikiem atrybutu.
 */
export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  return (
    <div lang={lang} style={{ display: "contents" }}>
      {children}
    </div>
  );
}
