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
  /** Ile osób wchodzi w cenę podstawową. Bez tego pola to po prostu maxAgents. */
  includedAgents?: number;
  /** Dopłata miesięczna za każdą osobę ponad to, co wchodzi w cenę. */
  extraAgentPrice?: number;
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
      "AI Coach: 24 scenariusze rozmów, 15 charakterów klienta",
      "Panel właściciela - ranking, mocne i słabe obszary",
      "Asystent AI na każdym ekranie i pisanie follow-upów",
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
    includedAgents: 15,
    extraAgentPrice: 49,
    tagline: "Dla większych biur i zespołów z menedżerami",
    features: [
      "15 osób w cenie, każda kolejna 49 zł/mc",
      "Wszystko z Pro",
      "Role i uprawnienia: dziewięć stanowisk, dostęp nadawany per osoba",
      "Zespoły z menedżerami, każdy widzi swoich agentów",
      "Wdrożenie 1:1 i szkolenie zespołu",
      "Priorytetowe wsparcie",
    ],
  },
];

/**
 * Plan dla agenta, który pracuje sam albo chce trenować na własną rękę.
 * Osobno od PLANS, bo cennik biur na stronie ma trzy kolumny i jedną logikę
 * „za biuro”. Solo pokazujemy jako osobną ofertę obok.
 */
export const PLAN_SOLO: Plan = {
  id: "solo",
  name: "Solo",
  price: 129,
  maxAgents: 1,
  tagline: "Dla agenta, który pracuje sam",
  features: [
    "1 osoba",
    "AI Coach: ścieżka nauki, 24 rozmowy, 15 charakterów klienta",
    "Rozmowa głosowa i analiza po każdej rozmowie",
    "Biblioteka technik i skrypty rozmów",
    "CRM klientów, oferty i kalendarz",
    "1500 kredytów AI miesięcznie (około 60 minut rozmów głosowych)",
  ],
};

/** Wszystkie plany, które da się zamówić: Solo i plany biur. */
export const WSZYSTKIE_PLANY: Plan[] = [PLAN_SOLO, ...PLANS];

/**
 * Miesięczna cena pakietu dla konkretnej liczby osób.
 *
 * Do piętnastu osób płaci się za biuro, powyżej dochodzi dopłata od głowy.
 * Bez tego dwudziestoosobowa sieć płaciła tyle samo co ośmioosobowe biuro,
 * a to ona zużywa najwięcej wsparcia i najwięcej AI.
 */
export function cenaPakietu(plan: Plan, agentow: number): number {
  const wCenie = plan.includedAgents ?? plan.maxAgents;
  const ponad = Math.max(0, agentow - wCenie);
  return plan.price + ponad * (plan.extraAgentPrice ?? 0);
}

/** Pakiet rekomendowany dla podanej liczby agentów. */
export function planForAgents(agents: number): Plan {
  return PLANS.find((p) => agents <= p.maxAgents) ?? PLANS[PLANS.length - 1];
}
