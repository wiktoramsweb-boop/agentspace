import { SCORING_MODEL } from "./client";
import { odpowiedzJson } from "./struktura";
import type { Property, Search } from "../types";

/**
 * Ranking ofert AI dla poszukiwania.
 *
 * Reguły w lib/matching.ts sprawdzają liczby: cenę, metraż, pokoje. Nie
 * przeczytają notatki „ma psa, pracuje zdalnie, nie chce parteru od ulicy".
 * Tu model dostaje kandydatów, którzy już przeszli przez reguły, i układa ich
 * według tego, co klient naprawdę mówił. Nie dobiera ofert spoza listy, więc
 * nie zaproponuje niczego, czego biuro nie ma.
 */

export type WynikDopasowania = {
  propertyId: string;
  ocena: number;
  dlaczego: string;
  uwaga?: string;
};

const SYSTEM = `Jesteś doświadczonym agentem nieruchomości w Polsce. Dostajesz potrzeby klienta (kryteria i notatki z rozmów) oraz listę ofert biura, które wstępnie spełniają kryteria liczbowe.

Ułóż ranking: które oferty agent powinien pokazać temu klientowi najpierw. Kieruj się przede wszystkim tym, co klient mówił w notatkach (styl życia, rodzina, praca, zwierzęta, dojazdy, czego nie chce), a dopiero potem liczbami.

Dla każdej oferty z listy podaj:
- ocena 1-10 (10 = idealnie trafia w to, co klient mówił),
- dlaczego: jedno zdanie po polsku, konkretnie, z odwołaniem do potrzeby klienta i cechy oferty,
- uwaga (opcjonalnie): jedno zdanie o ryzyku albo pytaniu, które agent powinien zadać przed prezentacją.

Nie wymyślaj cech, których nie ma w danych oferty. Jeśli czegoś nie wiadomo, napisz to w uwadze. Pisz zwyczajnie, jak agent do agenta. Nie używaj myślnika ani półpauzy.`;

function opisOferty(p: Property): string {
  const cechy = Object.entries(p.features ?? {}).filter(([, v]) => v).map(([k]) => k);
  return [
    `ID: ${p.id}`,
    `${p.title}`,
    [p.address, p.city].filter(Boolean).join(", "),
    p.price_pln ? `cena ${p.price_pln} zł` : "",
    p.area_m2 ? `${p.area_m2} m²` : "",
    p.rooms ? `${p.rooms} pok.` : "",
    p.floor != null ? `piętro ${p.floor}${p.floors_total ? `/${p.floors_total}` : ""}` : "",
    p.year_built ? `rok ${p.year_built}` : "",
    p.condition_std ? `stan: ${p.condition_std}` : "",
    cechy.length ? `cechy: ${cechy.join(", ")}` : "",
    p.description ? `opis: ${p.description.replace(/\s+/g, " ").slice(0, 600)}` : "",
  ]
    .filter(Boolean)
    .join(" | ");
}

export async function rankingAi(search: Search, notatki: string[], kandydaci: Property[]): Promise<WynikDopasowania[]> {
  const potrzeby = [
    search.title && `Tytuł poszukiwania: ${search.title}`,
    `Rodzaj: ${search.deal_kind === "wynajem" ? "najem" : "kupno"}`,
    search.locations.length && `Lokalizacje: ${search.locations.join(", ")}`,
    (search.price_min || search.price_max) && `Budżet: ${search.price_min ?? "?"} - ${search.price_max ?? "?"} zł`,
    (search.area_min || search.area_max) && `Metraż: ${search.area_min ?? "?"} - ${search.area_max ?? "?"} m²`,
    (search.rooms_min || search.rooms_max) && `Pokoje: ${search.rooms_min ?? "?"} - ${search.rooms_max ?? "?"}`,
    Object.keys(search.must_have ?? {}).length && `Musi mieć: ${Object.entries(search.must_have).filter(([, v]) => v).map(([k]) => k).join(", ")}`,
    search.notes && `Uwagi do poszukiwania: ${search.notes}`,
  ].filter(Boolean);

  const wynik = await odpowiedzJson<{ ranking: WynikDopasowania[] }>({
    model: SCORING_MODEL,
    maxTokens: 2500,
    system: SYSTEM,
    schemat: {
      type: "object",
      properties: {
        ranking: {
          type: "array",
          items: {
            type: "object",
            properties: {
              propertyId: { type: "string" },
              ocena: { type: "integer" },
              dlaczego: { type: "string" },
              uwaga: { type: "string" },
            },
            required: ["propertyId", "ocena", "dlaczego"],
            additionalProperties: false,
          },
        },
      },
      required: ["ranking"],
      additionalProperties: false,
    },
    messages: [
      {
        role: "user",
        content:
          `POTRZEBY KLIENTA\n${potrzeby.join("\n")}\n\n` +
          `NOTATKI Z ROZMÓW (od najnowszej)\n${notatki.length ? notatki.map((n) => `- ${n}`).join("\n") : "brak notatek"}\n\n` +
          `OFERTY BIURA\n${kandydaci.map(opisOferty).join("\n")}\n\nUłóż ranking wszystkich ofert z listy.`,
      },
    ],
  });

  const dozwolone = new Set(kandydaci.map((k) => k.id));
  return (wynik.ranking ?? [])
    .filter((r) => dozwolone.has(r.propertyId))
    .map((r) => ({
      propertyId: r.propertyId,
      ocena: Math.max(1, Math.min(10, Math.round(Number(r.ocena) || 1))),
      dlaczego: String(r.dlaczego ?? "").slice(0, 400),
      ...(r.uwaga ? { uwaga: String(r.uwaga).slice(0, 300) } : {}),
    }))
    .sort((a, b) => b.ocena - a.ocena);
}
