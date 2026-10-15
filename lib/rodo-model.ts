/**
 * Zgody i obowiązek informacyjny RODO: część bez dostępu do bazy.
 *
 * Rejestr działa przez dopisywanie. Wycofanie zgody to nowy wpis, a nie
 * skasowanie starego: przy kontroli trzeba pokazać, że zgoda była, od kiedy
 * jej nie ma i kto to odnotował. Stan „teraz" to najnowszy wpis danego rodzaju.
 */

export type RodzajZgody =
  | "obowiazek_informacyjny"
  | "przetwarzanie"
  | "marketing_mail"
  | "marketing_tel"
  | "marketing_sms"
  | "udostepnienie";

export const RODZAJE_ZGOD: { value: RodzajZgody; nazwa: string; opis: string; marketing?: boolean }[] = [
  {
    value: "obowiazek_informacyjny",
    nazwa: "Klauzula informacyjna przekazana",
    opis: "Klient dostał informację z art. 13 RODO: kto przetwarza dane, w jakim celu i jakie ma prawa.",
  },
  {
    value: "przetwarzanie",
    nazwa: "Przetwarzanie danych w celu obsługi",
    opis: "Zgoda na przetwarzanie danych w celu przedstawiania ofert i obsługi transakcji.",
  },
  { value: "marketing_mail", nazwa: "Informacje handlowe e-mailem", opis: "Wysyłka ofert i informacji handlowych na adres e-mail.", marketing: true },
  { value: "marketing_tel", nazwa: "Kontakt telefoniczny w celach marketingowych", opis: "Telefony z ofertami, które nie dotyczą bieżącej sprawy klienta.", marketing: true },
  { value: "marketing_sms", nazwa: "Informacje handlowe SMS-em", opis: "Wysyłka ofert i powiadomień marketingowych SMS-em.", marketing: true },
  {
    value: "udostepnienie",
    nazwa: "Udostępnienie danych biurom współpracującym",
    opis: "Przekazanie danych innym pośrednikom przy współpracy przy transakcji.",
  },
];

export type ZrodloZgody = "ustnie" | "formularz" | "mail" | "umowa" | "portal" | "strona";

export const ZRODLA_ZGODY: { value: ZrodloZgody; nazwa: string }[] = [
  { value: "ustnie", nazwa: "Ustnie, odnotowane przez agenta" },
  { value: "formularz", nazwa: "Podpisany formularz" },
  { value: "mail", nazwa: "Wiadomość e-mail" },
  { value: "umowa", nazwa: "Zapis w umowie" },
  { value: "portal", nazwa: "Portal klienta" },
  { value: "strona", nazwa: "Formularz na stronie biura" },
];

export type WpisZgody = {
  id: string;
  kind: RodzajZgody;
  granted: boolean;
  source: ZrodloZgody;
  note: string | null;
  recorded_at: string;
  recorded_by: string | null;
};

/** Najnowszy wpis każdego rodzaju. Wpisy wejściowe w dowolnej kolejności. */
export function stanZgod(wpisy: WpisZgody[]): Partial<Record<RodzajZgody, WpisZgody>> {
  const stan: Partial<Record<RodzajZgody, WpisZgody>> = {};
  for (const w of wpisy) {
    const obecny = stan[w.kind];
    if (!obecny || w.recorded_at > obecny.recorded_at) stan[w.kind] = w;
  }
  return stan;
}

/** Czy klient ma dziś jakąkolwiek zgodę marketingową. Do starego pola `marketing_consent`. */
export function maZgodeMarketingowa(stan: Partial<Record<RodzajZgody, WpisZgody>>): boolean {
  return RODZAJE_ZGOD.filter((r) => r.marketing).some((r) => stan[r.value]?.granted === true);
}

export type DaneAdministratora = {
  nazwa: string;
  adres: string;
  nip?: string | null;
  email?: string | null;
  telefon?: string | null;
};

/**
 * Treść klauzuli informacyjnej z art. 13 RODO dla klienta biura nieruchomości.
 * Akapity z pogrubieniami w składni `**...**`, jak w pozostałych dokumentach PDF.
 */
export function klauzulaInformacyjna(a: DaneAdministratora): { tytul: string; akapity: string[] } {
  const kontakt = [a.email ? `e-mail: ${a.email}` : null, a.telefon ? `telefon: ${a.telefon}` : null].filter(Boolean).join(", ");
  return {
    tytul: "Informacja o przetwarzaniu danych osobowych",
    akapity: [
      "Zgodnie z art. 13 ust. 1 i 2 rozporządzenia Parlamentu Europejskiego i Rady (UE) 2016/679 z dnia 27 kwietnia 2016 r. (RODO) informujemy, że:",
      `**1. Administrator danych.** Administratorem Pani/Pana danych osobowych jest ${a.nazwa}, ${a.adres}${a.nip ? `, NIP ${a.nip}` : ""}.${kontakt ? ` Kontakt w sprawach danych osobowych: ${kontakt}.` : ""}`,
      "**2. Cele i podstawy przetwarzania.** Dane przetwarzamy w celu: (a) podjęcia działań przed zawarciem umowy pośrednictwa oraz jej wykonania, w tym przedstawiania ofert, organizowania prezentacji i obsługi transakcji (art. 6 ust. 1 lit. b RODO), (b) wypełnienia obowiązków prawnych, w szczególności podatkowych, rachunkowych i wynikających z ustawy o przeciwdziałaniu praniu pieniędzy oraz finansowaniu terroryzmu (art. 6 ust. 1 lit. c RODO), (c) ustalenia, dochodzenia lub obrony roszczeń oraz kontaktu w sprawach bieżącej współpracy, co stanowi nasz prawnie uzasadniony interes (art. 6 ust. 1 lit. f RODO), (d) przesyłania informacji handlowych i kontaktu marketingowego, wyłącznie na podstawie odrębnej zgody (art. 6 ust. 1 lit. a RODO).",
      "**3. Odbiorcy danych.** Dane mogą zostać przekazane podmiotom, które świadczą na naszą rzecz usługi informatyczne i hostingowe, w tym dostawcy systemu, w którym prowadzimy bazę klientów, biuru rachunkowemu, kancelariom prawnym, a w zakresie niezbędnym do zawarcia transakcji także notariuszom, bankom i drugiej stronie transakcji. Przy współpracy z innymi biurami nieruchomości dane przekazujemy wyłącznie za odrębną zgodą.",
      "**4. Okres przechowywania.** Dane przechowujemy przez czas trwania umowy pośrednictwa i współpracy, a następnie przez okres przedawnienia roszczeń oraz przez okres wymagany przepisami podatkowymi i ustawą o przeciwdziałaniu praniu pieniędzy. Dane przetwarzane na podstawie zgody przechowujemy do czasu jej wycofania.",
      "**5. Pani/Pana prawa.** Przysługuje Pani/Panu prawo dostępu do danych, ich sprostowania, usunięcia, ograniczenia przetwarzania, przenoszenia danych, wniesienia sprzeciwu wobec przetwarzania opartego na prawnie uzasadnionym interesie oraz cofnięcia zgody w dowolnym momencie, bez wpływu na zgodność z prawem przetwarzania dokonanego przed jej cofnięciem.",
      "**6. Skarga.** Przysługuje Pani/Panu prawo wniesienia skargi do Prezesa Urzędu Ochrony Danych Osobowych, ul. Stawki 2, 00-193 Warszawa.",
      "**7. Dobrowolność.** Podanie danych jest dobrowolne, lecz niezbędne do zawarcia i wykonania umowy pośrednictwa. Dane nie służą do zautomatyzowanego podejmowania decyzji, w tym profilowania, i nie są przekazywane poza Europejski Obszar Gospodarczy, chyba że wymaga tego obsługa systemu informatycznego na zasadach określonych w rozdziale V RODO.",
    ],
  };
}
