/**
 * Portale ogłoszeniowe w AgentSpace, ułożone jak w ASARI: lista portali,
 * a przy każdym logowanie albo dane FTP od portalu.
 *
 * `PORTALE_FTP` to portale, na które wysyłamy oferty plikiem przez FTP. Dane
 * serwera (host, login, hasło) biuro dostaje od portalu po założeniu konta
 * biznesowego. `format` to nazwa formatu pliku, którego portal oczekuje.
 *
 * `PORTALE_W_PRZYGOTOWANIU` to portale, których format pliku dostaje się
 * dopiero po umowie partnerskiej portalu z dostawcą programu. Biuro zgłasza
 * chęć wystawiania, a my załatwiamy specyfikację z portalem.
 */
export type PortalFtp = {
  id: string;
  nazwa: string;
  format: string;
  zasieg: string;
  /** Jak biuro zdobywa dane FTP, krok po kroku. */
  kroki: string[];
  kontakt: { email?: string; telefon?: string };
  /** Plik: NOE (XML + zdjęcia osobno) albo paczka ZIP (XML i zdjęcia razem). */
  paczka: "noe" | "zip";
};

export const PORTALE_FTP: PortalFtp[] = [
  {
    id: "nieruchomosci-online",
    nazwa: "Nieruchomosci-online.pl",
    format: "NOE 2.0",
    zasieg: "Jeden z największych portali z ofertami biur, mocny w mniejszych miastach.",
    kroki: [
      "Załóż konto biura na Nieruchomosci-online.pl albo zaloguj się na istniejące.",
      "Napisz albo zadzwoń do obsługi portalu, że wysyłasz oferty z programu AgentSpace w formacie NOE 2.0. Gotową wiadomość skopiujesz niżej.",
      "Portal odeśle dane FTP: serwer, login i hasło. Wpisz je w formularzu poniżej, a my sprawdzimy połączenie.",
    ],
    kontakt: { email: "support@nieruchomosci-online.pl", telefon: "33 486 90 55" },
    paczka: "noe",
  },
  {
    id: "tabelaofert",
    nazwa: "TabelaOfert.pl",
    format: "TabelaOfert (ZIP z XML)",
    zasieg: "Portal z cenami ofert z rynku pierwotnego i wtórnego, z dużym ruchem z wyszukiwarek.",
    kroki: [
      "Załóż konto agencji na TabelaOfert.pl albo zaloguj się na istniejące.",
      "Napisz do Biura Obsługi Klienta, że chcesz importować oferty z programu AgentSpace w formacie importu TabelaOfert. Gotową wiadomość skopiujesz niżej.",
      "Portal przekaże dane FTP do importu. Wpisz je w formularzu poniżej, a my sprawdzimy połączenie.",
    ],
    kontakt: { email: "bok@tabelaofert.pl", telefon: "22 318 72 00" },
    paczka: "zip",
  },
];

export type PortalWPrzygotowaniu = { id: string; nazwa: string; zasieg: string };

export const PORTALE_W_PRZYGOTOWANIU: PortalWPrzygotowaniu[] = [
  { id: "gratka-morizon", nazwa: "Gratka.pl i Morizon.pl", zasieg: "Jedna grupa portali: ogłoszenie trafia na Gratkę, Morizon i serwisy partnerskie." },
  { id: "domiporta", nazwa: "Domiporta.pl", zasieg: "Duży portal nieruchomości z ofertami biur i deweloperów." },
  { id: "adresowo", nazwa: "Adresowo.pl", zasieg: "Portal ofert biur nieruchomości z mapą i wyszukiwarką po adresie." },
  { id: "domy-pl", nazwa: "Domy.pl", zasieg: "Portal z ofertami mieszkań i domów z rynku wtórnego i pierwotnego." },
  { id: "sprzedajemy", nazwa: "Sprzedajemy.pl", zasieg: "Serwis ogłoszeniowy z działem nieruchomości." },
  { id: "lento", nazwa: "Lento.pl", zasieg: "Lokalny serwis ogłoszeń, popularny w mniejszych miejscowościach." },
];

export const portalFtp = (id: string) => PORTALE_FTP.find((p) => p.id === id) ?? null;
export const portalWPrzygotowaniu = (id: string) => PORTALE_W_PRZYGOTOWANIU.find((p) => p.id === id) ?? null;

/** Gotowa wiadomość do obsługi portalu z prośbą o dane FTP. */
export function wiadomoscDoPortalu(p: PortalFtp, biuro: string): string {
  return `Dzień dobry,\n\nprowadzimy biuro nieruchomości ${biuro} i chcemy wysyłać oferty na ${p.nazwa} z programu AgentSpace (agentspace.pl), w formacie ${p.format}.\n\nProsimy o przekazanie danych FTP do importu ofert: adres serwera, login, hasło i ewentualnie katalog docelowy.\n\nPozdrawiamy,\n${biuro}`;
}
