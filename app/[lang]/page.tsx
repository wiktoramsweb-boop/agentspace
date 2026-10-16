import type { Metadata } from "next";
import { StronaGlowna } from "@/app/components/ld/strona-glowna";
import { nowaStrona } from "@/lib/marketing/nowa-strona";
import { DNI_PROBNE } from "@/lib/abonament-cennik";
import { toLocale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/i18n/metadata";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const locale = toLocale((await params).lang);
  const t = nowaStrona(locale, DNI_PROBNE).meta;
  return pageMetadata(locale, "/", t.title, t.description);
}

export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return <StronaGlowna lang={lang} />;
}
