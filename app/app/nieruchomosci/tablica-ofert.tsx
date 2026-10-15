"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Tablica, type KolumnaTablicy, type Przeniesienie } from "../components/tablica";
import { kwotaKrotko } from "../components/widok";
import { przeniesOferte } from "../tablica-actions";
import { PROCESS_STAGES } from "@/lib/types";
import type { KartaOferty } from "@/lib/data-tablica";

const KROPKA: Record<string, string> = {
  przyjeta: "bg-slate-400",
  male_zainteresowanie: "bg-amber-500",
  liczne_prezentacje: "bg-sky-500",
  zlozona_oferta: "bg-violet-500",
  oplata_rezerwacyjna: "bg-fuchsia-500",
  umowa_przedwstepna: "bg-cyan-500",
  wygrana: "bg-emerald-500",
};

function inicjaly(n: string | null): string {
  if (!n) return "?";
  return n.split(/\s+/).slice(0, 2).map((x) => x[0]?.toUpperCase() ?? "").join("");
}

export function TablicaOfert({ karty }: { karty: KartaOferty[] }) {
  const router = useRouter();

  const kolumny: KolumnaTablicy[] = PROCESS_STAGES.map((s) => ({
    id: s.value,
    nazwa: s.label,
    kolor: KROPKA[s.value] ?? "bg-slate-400",
    dopisek: s.value === "wygrana" ? "Z ostatnich 60 dni" : undefined,
    podsumowanie: (lista) => {
      const suma = (lista as KartaOferty[]).reduce((a, k) => a + (k.deal_kind === "sprzedaz" ? k.price_pln ?? 0 : 0), 0);
      return suma > 0 ? <>Wartość: <span className="font-semibold text-slate-700">{kwotaKrotko(suma)}</span></> : null;
    },
  }));

  async function przenies(p: Przeniesienie) {
    const blad = await przeniesOferte(p.id, p.kolumna, p.kolejnosc);
    if (!blad) router.refresh();
    return blad;
  }

  return (
    <Tablica
      kolumny={kolumny}
      karty={karty}
      onPrzenies={przenies}
      etykietaKarty={(k) => k.title}
      renderKarta={(k) => <KartaOfertyWidok k={k} />}
      pusta="Przeciągnij tu ofertę"
    />
  );
}

function KartaOfertyWidok({ k }: { k: KartaOferty }) {
  const dni = k.od ? Math.floor((Date.now() - Date.parse(k.od)) / 86_400_000) : null;
  const cena =
    k.price_pln == null
      ? "Cena do ustalenia"
      : `${Number(k.price_pln).toLocaleString("pl-PL")} zł${k.deal_kind === "wynajem" ? "/mc" : ""}`;
  return (
    <Link
      href={`/app/nieruchomosci/${k.id}`}
      className="block overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-900/5 transition hover:border-slate-300 hover:shadow-md"
    >
      <div className="relative h-28 bg-slate-100">
        {k.zdjecie ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={k.zdjecie} alt="" loading="lazy" className="h-full w-full object-cover" draggable={false} />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-400">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75" />
            </svg>
          </div>
        )}
        <span className="absolute left-2 top-2 rounded-md bg-slate-900/80 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
          {k.deal_kind === "wynajem" ? "Najem" : "Sprzedaż"}
        </span>
        {k.obnizka != null && k.obnizka > 0 && (
          <span className="absolute bottom-2 left-2 rounded-md bg-emerald-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
            −{k.obnizka}% w 30 dni
          </span>
        )}
      </div>
      <div className="p-3.5 pr-10">
        <p className="line-clamp-2 text-sm font-semibold leading-snug text-slate-900">{k.title}</p>
        <p className="mt-1 text-xs text-slate-500">
          {cena}
          {k.area_m2 ? ` · ${Number(k.area_m2).toLocaleString("pl-PL")} m²` : ""}
          {k.rooms ? ` · ${k.rooms} pok.` : ""}
        </p>
        <div className="mt-3 flex items-center justify-between gap-2 text-xs text-slate-500">
          <span className="flex min-w-0 items-center gap-1.5">
            <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-slate-200 text-[9px] font-bold text-slate-700">
              {inicjaly(k.opiekun)}
            </span>
            <span className="truncate">{k.opiekun ?? "Pula biura"}</span>
          </span>
          {dni != null && (
            <span className={`flex-shrink-0 text-[11px] ${dni > 30 && k.kolumna !== "wygrana" ? "font-medium text-amber-600" : "text-slate-400"}`}>
              {dni === 0 ? "od dziś" : `${dni} d. w etapie`}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
