import fs from "node:fs";
import path from "node:path";
import Image from "next/image";
import { slot } from "@/lib/marketing/sloty-zdjec";

/**
 * Zdjęcie z rejestru miejsc (lib/marketing/sloty-zdjec.ts).
 *
 * Plik sprawdzamy przy budowaniu strony. Jest: pokazujemy go. Nie ma: na
 * produkcji zdjęcie zastępcze, lokalnie ramka z nazwą miejsca, żeby było
 * widać, co jeszcze trzeba wygenerować.
 */
export function SlotZdjecia({
  id, lang = "pl", className = "", priority = false, sizes = "(min-width: 1024px) 50vw, 100vw",
}: {
  id: string;
  lang?: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
}) {
  const s = slot(id);
  const jest = fs.existsSync(path.join(process.cwd(), "public", s.plik));
  const alt = lang === "en" ? s.altEn : s.alt;

  if (!jest && process.env.NODE_ENV !== "production") {
    return (
      <div
        className={`relative flex items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-amber-400 bg-amber-50 ${className}`}
        style={{ aspectRatio: s.proporcje }}
      >
        <Image src={s.zastepcze} alt={alt} fill sizes={sizes} className="object-cover opacity-40" />
        <div className="relative m-4 rounded-lg bg-white/95 p-3 text-xs text-slate-700 shadow">
          <p className="font-semibold">Miejsce na zdjęcie: {s.id}</p>
          <p className="mt-1">Plik: public{s.plik}</p>
          <p className="mt-1 text-slate-500">Opis do Nano Banana Pro: STRONA-ZDJECIA-PROMPTY.md</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-xl ${className}`} style={{ aspectRatio: s.proporcje }}>
      <Image src={jest ? s.plik : s.zastepcze} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" />
    </div>
  );
}
