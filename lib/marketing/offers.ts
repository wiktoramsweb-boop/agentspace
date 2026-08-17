/**
 * Personalizowane strony ofertowe: agentspace.pl/oferta/[slug]
 *
 * Zamiast wysyłać PDF, wysyłasz link. Strona wita biuro po nazwie, pokazuje
 * policzoną ofertę dla ICH liczby agentów i ma jedno wezwanie do działania.
 *
 * JAK DODAĆ NOWĄ OFERTĘ:
 * 1. Dopisz obiekt do tablicy OFFERS poniżej.
 * 2. Zacommituj i wypchnij - Vercel zbuduje stronę automatycznie.
 * 3. Wyślij link: https://agentspace.pl/oferta/[slug]
 *
 * Strony są `noindex` - nie trafiają do Google ani do sitemapy.
 */

import { PLANS, type Plan } from "./plans";

export type Offer = {
  slug: string;
  /** Nazwa biura - pojawia się w nagłówku. */
  officeName: string;
  city: string;
  /** Imię osoby decyzyjnej - użyte w powitaniu. */
  contactFirstName: string;
  agents: number;
  /** Pakiet, który proponujesz (id z PLANS). */
  planId: string;
  /** Cena po negocjacji; jeśli pusta - cena z cennika. */
  customPrice?: number;
  /** 2-3 zdania nawiązujące do rozmowy. Tu robisz personalizację. */
  intro: string;
  /** Konkretne rzeczy, o których rozmawialiście - ich problemy. */
  painPoints: string[];
  /** Do kiedy oferta obowiązuje (format: "31 sierpnia 2026"). */
  validUntil: string;
};

export const OFFERS: Offer[] = [
  {
    slug: "przyklad",
    officeName: "Biuro Przykładowe",
    city: "Kraków",
    contactFirstName: "Anno",
    agents: 8,
    planId: "pro",
    intro:
      "Dziękuję za rozmowę. Zebrałem to, o czym mówiliśmy, w jedno miejsce - żebyś nie musiała szukać tego w mailach. Poniżej konkretna propozycja dla ośmiu agentów.",
    painPoints: [
      "Baza klientów rozrzucona między Excelem a telefonami agentów",
      "Brak wglądu w to, ile realnie dzieje się między odprawami",
      "Rozliczenie prowizji domykane ręcznie na koniec miesiąca",
    ],
    validUntil: "31 sierpnia 2026",
  },
];

export function getOffer(slug: string): Offer | undefined {
  return OFFERS.find((o) => o.slug === slug);
}

export function getOfferPlan(offer: Offer): Plan {
  return PLANS.find((p) => p.id === offer.planId) ?? PLANS[1];
}
