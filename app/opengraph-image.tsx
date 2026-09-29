import { OG_SIZE, ogImage } from "@/lib/og-image";

export const alt = "AgentSpace - system operacyjny dla biura nieruchomości";
export const size = OG_SIZE;
export const contentType = "image/png";

/** Podgląd dla tras spoza warstwy językowej: logowanie, rejestracja, 404. */
export default function Image() {
  return ogImage("pl");
}
