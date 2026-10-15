/**
 * Wbudowane szablony wiadomości do klientów. Biuro dopisuje własne w bazie
 * (message_templates, v49); te są zawsze, także przed migracją.
 *
 * Pisane tak, jak pisze dobry agent, a nie dział marketingu: krótko,
 * konkretnie, z jednym następnym krokiem. Zmienne w klamrach podstawia
 * kreator na podstawie karty klienta.
 */

export type SzablonWiadomosci = {
  id: string;
  kanal: "mail" | "sms";
  nazwa: string;
  temat?: string;
  tresc: string;
  wlasny?: boolean;
};

export const SZABLONY_WBUDOWANE: SzablonWiadomosci[] = [
  {
    id: "wb-po-prezentacji",
    kanal: "mail",
    nazwa: "Po prezentacji",
    temat: "Dziękuję za dzisiejsze spotkanie",
    tresc:
      "Dzień dobry {imie},\n\ndziękuję za dzisiejsze oglądanie. Chętnie poznam Pana/Pani wrażenia, także te mniej pozytywne, bo one najwięcej mówią o tym, czego szukamy dalej.\n\nJeśli chciałby Pan/chciałaby Pani zobaczyć mieszkanie jeszcze raz albo porozmawiać o cenie, proszę dać znać. Zadzwonię jutro, żeby krótko omówić dalsze kroki.\n\nPozdrawiam",
  },
  {
    id: "wb-nowa-oferta",
    kanal: "mail",
    nazwa: "Nowa oferta dla klienta",
    temat: "Mam coś, co może Pana/Panią zainteresować",
    tresc:
      "Dzień dobry {imie},\n\nwłaśnie trafiła do nas oferta, która dobrze pasuje do tego, czego Pan/Pani szuka. Zanim pojawi się na portalach, pokazujemy ją osobom, z którymi już współpracujemy.\n\nCzy pasowałby Panu/Pani termin oglądania w tym tygodniu?\n\nPozdrawiam",
  },
  {
    id: "wb-przypomnienie",
    kanal: "mail",
    nazwa: "Przypomnienie o spotkaniu",
    temat: "Przypomnienie o naszym spotkaniu",
    tresc:
      "Dzień dobry {imie},\n\nprzypominam o naszym spotkaniu. Gdyby coś się zmieniło, proszę o krótką informację, przełożymy termin bez problemu.\n\nDo zobaczenia",
  },
  {
    id: "wb-dokumenty",
    kanal: "mail",
    nazwa: "Prośba o dokumenty",
    temat: "Dokumenty potrzebne do transakcji",
    tresc:
      "Dzień dobry {imie},\n\nżeby sprawnie przygotować transakcję, potrzebne będą:\n\n- numer księgi wieczystej,\n- zaświadczenie o braku zaległości w opłatach,\n- zaświadczenie o osobach zameldowanych,\n- świadectwo charakterystyki energetycznej.\n\nJeśli któregoś dokumentu brakuje, proszę o informację, podpowiem, gdzie go najszybciej uzyskać.\n\nPozdrawiam",
  },
  {
    id: "wb-po-transakcji",
    kanal: "mail",
    nazwa: "Po transakcji: podziękowanie",
    temat: "Dziękuję za współpracę",
    tresc:
      "Dzień dobry {imie},\n\ndziękuję za zaufanie i współpracę. Jeśli współpraca była udana, kilka słów opinii albo polecenie znajomym, którzy planują sprzedaż lub zakup, bardzo nam pomoże.\n\nGdyby w przyszłości potrzebował Pan/potrzebowała Pani pomocy przy nieruchomościach, proszę śmiało pisać.\n\nPozdrawiam serdecznie",
  },
  {
    id: "wb-sms-prezentacja",
    kanal: "sms",
    nazwa: "Potwierdzenie prezentacji",
    tresc: "Dzień dobry, potwierdzam nasze spotkanie i oglądanie. W razie zmian proszę o SMS. {agent}",
  },
  {
    id: "wb-sms-po-prezentacji",
    kanal: "sms",
    nazwa: "Po prezentacji",
    tresc: "Dziękuję za spotkanie. Jak wrażenia po oglądaniu? Chętnie odpowiem na pytania. {agent}",
  },
  {
    id: "wb-sms-nie-odbiera",
    kanal: "sms",
    nazwa: "Nieodebrany telefon",
    tresc: "Dzień dobry, nie udało nam się połączyć w sprawie nieruchomości. Kiedy mogę oddzwonić? {agent}",
  },
];

/** Podstawia {imie}, {klient}, {agent}, {biuro}. Nieznane zmienne zostają widoczne. */
export function wypelnijSzablon(t: string, dane: { klient?: string | null; agent?: string | null; biuro?: string | null }): string {
  const imie = (dane.klient ?? "").trim().split(/\s+/)[0] ?? "";
  const mapa: Record<string, string> = {
    imie,
    klient: dane.klient ?? "",
    agent: dane.agent ?? "",
    biuro: dane.biuro ?? "",
  };
  return t.replace(/\{([a-z_]+)\}/g, (cale, n: string) => (n in mapa && mapa[n] ? mapa[n] : cale));
}
