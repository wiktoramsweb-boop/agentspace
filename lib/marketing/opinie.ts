/**
 * Opinie klientów na stronie www.
 *
 * Dopisujemy WYŁĄCZNIE prawdziwe opinie, z pisemną zgodą autora na publikację
 * imienia, nazwiska i nazwy biura. Od 2023 r. (dyrektywa Omnibus, art. 7
 * pkt 23b-23c ustawy o przeciwdziałaniu nieuczciwym praktykom rynkowym)
 * zmyślona albo „podrasowana” opinia to nieuczciwa praktyka rynkowa, za którą
 * UOKiK nakłada kary do 10% obrotu. Dlatego:
 *  - tekst opinii wklejamy dosłownie, poprawiamy najwyżej literówki,
 *  - `zrodlo` mówi, skąd opinia pochodzi (mail, Google, rozmowa nagrana za zgodą),
 *  - `data` to dzień, w którym autor zatwierdził treść.
 * Pusta lista = sekcja pokazuje uczciwą informację, że opinie są zbierane.
 */

export type Opinia = {
  tresc: string;
  imie: string;
  rola: string;
  biuro: string;
  miasto: string;
  /** Zdjęcie autora w public/opinie/, tylko za jego zgodą. */
  zdjecie?: string;
  zrodlo: "mail" | "google" | "rozmowa" | "ankieta";
  /** Link do opinii w Google, jeśli jest publiczna. */
  link?: string;
  data: string;
  /** Od ilu miesięcy biuro korzysta z AgentSpace w chwili wystawienia opinii. */
  miesiecy?: number;
};

export const OPINIE: Opinia[] = [];
