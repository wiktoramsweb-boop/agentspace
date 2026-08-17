/**
 * Dane stron integracji (pSEO).
 *
 * UCZCIWOŚĆ: `status` mówi wprost, co działa, a co jest w przygotowaniu.
 * Strona "w przygotowaniu" ma sens SEO i zbiera zainteresowanie, ale NIE
 * może sugerować, że integracja jest gotowa. Gdy integracja ruszy -
 * zmień status na "live" i uzupełnij `syncs`.
 */

export type IntegrationStatus = "live" | "in-progress" | "planned";

export type Integration = {
  slug: string;
  name: string;
  /** Pełna nazwa używana w tytułach i tekście. */
  fullName: string;
  status: IntegrationStatus;
  /** Krótki opis systemu - kim jest, dla kogo. */
  about: string;
  /** Co realnie przepływa (lub przepłynie) między systemami. */
  syncs: string[];
  /** Dlaczego biura łączą te dwa systemy. */
  why: string;
};

export const STATUS_LABEL: Record<IntegrationStatus, string> = {
  live: "Dostępna",
  "in-progress": "W przygotowaniu",
  planned: "Planowana",
};

export const INTEGRATIONS: Integration[] = [
  {
    slug: "asari",
    name: "Asari",
    fullName: "Asari CRM",
    status: "in-progress",
    about:
      "Jeden z najpopularniejszych systemów CRM dla biur nieruchomości w Polsce. Biura używają go głównie do zarządzania ofertami i eksportu na portale.",
    syncs: [
      "Baza nieruchomości - oferty i statusy",
      "Kontakty klientów wraz z przypisaniem do agenta",
      "Historia zmian statusu oferty",
    ],
    why: "Biura, które trzymają oferty w Asari, chcą zachować eksport na portale, a jednocześnie prowadzić pracę zespołu, cele i prowizje w AgentSpace. Integracja pozwala nie przepisywać tych samych danych dwa razy.",
  },
  {
    slug: "galactica",
    name: "Galactica",
    fullName: "Galactica Virgo",
    status: "in-progress",
    about:
      "System do zarządzania ofertami i eksportu na portale, obecny w polskich biurach nieruchomości od lat. Mocny w obsłudze dużych baz ofertowych.",
    syncs: [
      "Oferty nieruchomości i ich statusy",
      "Dane kontaktowe właścicieli i klientów",
      "Przypisanie oferty do agenta prowadzącego",
    ],
    why: "Galactica dobrze obsługuje wystawianie ofert, ale nie odpowiada na pytanie „jak pracuje mój zespół”. AgentSpace dokłada cele, lejek, prowizje i trening - bez wymiany systemu ofertowego.",
  },
  {
    slug: "imo",
    name: "IMO",
    fullName: "IMO - system dla biur nieruchomości",
    status: "planned",
    about:
      "System obsługujący oferty, klientów i eksport na portale, używany przez biura o różnej wielkości.",
    syncs: [
      "Oferty nieruchomości",
      "Baza klientów kupujących i sprzedających",
      "Statusy transakcji",
    ],
    why: "Biura korzystające z IMO najczęściej szukają w AgentSpace tego, czego IMO nie robi: zarządzania celami zespołu, rozliczania prowizji i rozwoju agentów.",
  },
  {
    slug: "estiman",
    name: "Estiman",
    fullName: "Estiman",
    status: "planned",
    about:
      "System wspierający pracę biur nieruchomości w obszarze ofert i obsługi klienta.",
    syncs: [
      "Oferty nieruchomości",
      "Kontakty i historia współpracy z klientem",
    ],
    why: "Połączenie pozwala zachować dotychczasowy obieg ofert i dołożyć warstwę zarządzania zespołem - bez migracji całej bazy na start.",
  },
];

export function getIntegration(slug: string): Integration | undefined {
  return INTEGRATIONS.find((i) => i.slug === slug);
}
