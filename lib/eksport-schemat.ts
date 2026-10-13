import type { Zbior } from "./eksport-csv";

/**
 * Które tabele i kolumny wychodzą w eksporcie.
 *
 * Wyciągnięte z trasy do osobnego pliku, bo korzysta z tego także pobranie
 * całości biura jednym archiwum. Jeden opis zbiorów znaczy, że eksport
 * pojedynczy i zbiorczy nie mogą się rozjechać.
 */

export type Kolumna = { klucz: string; naglowek: string };

export const SCHEMAT: Record<Zbior, { tabela: string; kolumny: Kolumna[] }> = {
  klienci: {
    tabela: "clients",
    kolumny: [
      { klucz: "name", naglowek: "Imię i nazwisko" },
      { klucz: "type", naglowek: "Typ" },
      { klucz: "status", naglowek: "Status" },
      { klucz: "phone", naglowek: "Telefon" },
      { klucz: "email", naglowek: "Email" },
      { klucz: "city", naglowek: "Miasto" },
      { klucz: "address", naglowek: "Adres" },
      { klucz: "budget_pln", naglowek: "Budżet (zł)" },
      { klucz: "property", naglowek: "Nieruchomość" },
      { klucz: "notes", naglowek: "Notatki" },
      { klucz: "last_contact_at", naglowek: "Ostatni kontakt" },
      { klucz: "next_contact_at", naglowek: "Następny kontakt" },
      { klucz: "created_at", naglowek: "Dodano" },
    ],
  },
  nieruchomosci: {
    tabela: "properties",
    kolumny: [
      { klucz: "title", naglowek: "Nazwa" },
      { klucz: "deal_kind", naglowek: "Rodzaj" },
      { klucz: "property_type", naglowek: "Typ" },
      { klucz: "status", naglowek: "Status" },
      { klucz: "city", naglowek: "Miasto" },
      { klucz: "address", naglowek: "Adres" },
      { klucz: "price_pln", naglowek: "Cena (zł)" },
      { klucz: "area_m2", naglowek: "Powierzchnia (m2)" },
      { klucz: "rooms", naglowek: "Pokoje" },
      { klucz: "floor", naglowek: "Piętro" },
      { klucz: "description", naglowek: "Opis" },
      { klucz: "created_at", naglowek: "Dodano" },
    ],
  },
  transakcje: {
    tabela: "deals",
    kolumny: [
      { klucz: "title", naglowek: "Transakcja" },
      { klucz: "status", naglowek: "Status" },
      { klucz: "transaction_value_pln", naglowek: "Wartość transakcji (zł)" },
      { klucz: "commission_pln", naglowek: "Prowizja biura (zł)" },
      { klucz: "commission_seller_pln", naglowek: "Prowizja od sprzedającego (zł)" },
      { klucz: "commission_buyer_pln", naglowek: "Prowizja od kupującego (zł)" },
      { klucz: "commission_landlord_pln", naglowek: "Prowizja od wynajmującego (zł)" },
      { klucz: "commission_tenant_pln", naglowek: "Prowizja od najemcy (zł)" },
      { klucz: "extras_pln", naglowek: "Dodatki (zł)" },
      { klucz: "agent_split_pct", naglowek: "Udział agenta (%)" },
      { klucz: "agent_earnings_pln", naglowek: "Zarobek agenta (zł)" },
      { klucz: "expected_close", naglowek: "Planowane zamknięcie" },
      { klucz: "created_at", naglowek: "Dodano" },
    ],
  },
  leady: {
    tabela: "leads",
    kolumny: [
      { klucz: "name", naglowek: "Imię i nazwisko" },
      { klucz: "phone", naglowek: "Telefon" },
      { klucz: "email", naglowek: "Email" },
      { klucz: "city", naglowek: "Miasto" },
      { klucz: "source", naglowek: "Źródło" },
      { klucz: "campaign", naglowek: "Kampania" },
      { klucz: "ad_name", naglowek: "Reklama" },
      { klucz: "platform", naglowek: "Platforma" },
      { klucz: "message", naglowek: "Wiadomość" },
      { klucz: "created_at", naglowek: "Dodano" },
    ],
  },
  dzialania: {
    tabela: "activities",
    kolumny: [
      { klucz: "subject", naglowek: "Temat" },
      { klucz: "kind", naglowek: "Rodzaj" },
      { klucz: "status", naglowek: "Status" },
      { klucz: "priority", naglowek: "Priorytet" },
      { klucz: "purpose", naglowek: "Cel" },
      { klucz: "description", naglowek: "Opis" },
      { klucz: "due_at", naglowek: "Termin" },
      { klucz: "completed_at", naglowek: "Zrobione" },
      { klucz: "created_at", naglowek: "Dodano" },
    ],
  },
};
