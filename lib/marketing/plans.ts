/**
 * Pakiety cenowe - jedno źródło prawdy.
 *
 * Trzymane poza komponentem, bo używa ich zarówno cennik (client component),
 * jak i strony ofertowe renderowane po stronie serwera.
 *
 * Zmieniasz cenę? Zmień też:
 *  - app/components/schema-markup.tsx (schema `offers`)
 *  - public/llms.txt i public/llms-full.txt
 */

export type Plan = {
  id: string;
  name: string;
  price: number;
  priceFrom?: boolean;
  maxAgents: number;
  tagline: string;
  features: string[];
};

export const PLANS: Plan[] = [
  {
    id: "start",
    name: "Start",
    price: 299,
    maxAgents: 5,
    tagline: "Dla biur, które porządkują podstawy",
    features: [
      "Do 5 agentów",
      "CRM klientów - karty, notatki, pipeline",
      "Wspólna baza nieruchomości",
      "Zadania i pulpit dnia",
      "Cele i lejek sprzedażowy",
      "Rozliczanie prowizji",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: 599,
    maxAgents: 15,
    tagline: "Dla biur, które chcą rozwijać zespół",
    features: [
      "Do 15 agentów",
      "Wszystko ze Start",
      "AI Coach - 13+ scenariuszy, 9 osobowości klienta",
      "Panel właściciela - ranking, mocne i słabe obszary",
      "AI Asystent Dnia i pisanie follow-upów",
      "Raporty miesięczne na e-mail",
      "Karta transakcji i umowy rezerwacyjne (PDF)",
    ],
  },
  {
    id: "biuro",
    name: "Biuro",
    price: 999,
    priceFrom: true,
    maxAgents: 999,
    tagline: "Dla sieci i biur wielooddziałowych",
    features: [
      "Bez limitu agentów",
      "Wszystko z Pro",
      "Role i uprawnienia: osiem stanowisk, dostęp nadawany per osoba",
      "Wielooddziałowość i podział zespołów",
      "Wdrożenie 1:1 i szkolenie zespołu",
      "Priorytetowe wsparcie",
    ],
  },
];

/** Pakiet rekomendowany dla podanej liczby agentów. */
export function planForAgents(agents: number): Plan {
  return PLANS.find((p) => agents <= p.maxAgents) ?? PLANS[PLANS.length - 1];
}
