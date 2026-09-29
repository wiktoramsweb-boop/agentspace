import { OG_SIZE, ogImage } from "@/lib/og-image";
import { LOCALES, toLocale } from "@/lib/i18n";

export const alt = "AgentSpace";
export const size = OG_SIZE;
export const contentType = "image/png";

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export default async function Image({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return ogImage(toLocale(lang));
}
