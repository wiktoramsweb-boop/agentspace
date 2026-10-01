import type { RaportWlasciciela } from "@/lib/data-raporty";

/** Dane do obejrzenia składu raportu bez logowania i bez prawdziwej bazy. */
export const PRZYKLADOWY_RAPORT: RaportWlasciciela = {
  okres: "kwartal",
  od: "2026-07-01T00:00:00.000Z",
  pieniadze: {
    zamknieteSzt: 7,
    zamknietePln: 184_300,
    sredniaProwizja: 26_329,
    wTokuSzt: 11,
    wTokuPln: 296_400,
    prognozaPln: 118_560,
    przepadloSzt: 3,
    skutecznosc: 70,
    sredniDniDoZamkniecia: 63,
  },
  lejekOfert: [
    { etap: "przyjeta", label: "Przyjęta", ile: 34, przejscie: null },
    { etap: "male_zainteresowanie", label: "Małe zainter.", ile: 28, przejscie: 82 },
    { etap: "liczne_prezentacje", label: "Prezentacje", ile: 19, przejscie: 68 },
    { etap: "zlozona_oferta", label: "Oferta", ile: 7, przejscie: 37 },
    { etap: "oplata_rezerwacyjna", label: "Rezerwacja", ile: 5, przejscie: 71 },
    { etap: "umowa_przedwstepna", label: "Przedwstępna", ile: 4, przejscie: 80 },
    { etap: "wygrana", label: "Wygrana", ile: 4, przejscie: 100 },
  ],
  lejekKlientow: [
    { etap: "nowy", label: "Nowy", ile: 41, przejscie: null },
    { etap: "w_kontakcie", label: "W kontakcie", ile: 23, przejscie: null },
    { etap: "oglada", label: "Ogląda", ile: 12, przejscie: null },
    { etap: "negocjacje", label: "Negocjacje", ile: 5, przejscie: null },
    { etap: "zamkniety", label: "Zamknięty", ile: 7, przejscie: null },
    { etap: "stracony", label: "Stracony", ile: 9, przejscie: null },
  ],
  zrodla: [
    { zrodlo: "polecenie", label: "Polecenie", kontakty: 14, transakcje: 4, prowizja: 96_400, konwersja: 29 },
    { zrodlo: "portal", label: "Portal ogłoszeniowy", kontakty: 52, transakcje: 2, prowizja: 48_200, konwersja: 4 },
    { zrodlo: "strona", label: "Strona www", kontakty: 18, transakcje: 1, prowizja: 39_700, konwersja: 6 },
    { zrodlo: "cold_call", label: "Cold call", kontakty: 23, transakcje: 0, prowizja: 0, konwersja: 0 },
    { zrodlo: "brak", label: "Nie podano", kontakty: 11, transakcje: 0, prowizja: 0, konwersja: 0 },
  ],
  zespol: [
    { id: "1", name: "Patrycja Gdowska", telefony: 214, spotkania: 18, nowychKontaktow: 31, nowychOfert: 9, transakcje: 3, prowizja: 78_900, telefonowNaTransakcje: 71 },
    { id: "2", name: "Marek Zarębski", telefony: 186, spotkania: 14, nowychKontaktow: 27, nowychOfert: 11, transakcje: 2, prowizja: 54_200, telefonowNaTransakcje: 93 },
    { id: "3", name: "Iwona Reszka", telefony: 97, spotkania: 11, nowychKontaktow: 19, nowychOfert: 6, transakcje: 2, prowizja: 51_200, telefonowNaTransakcje: 49 },
    { id: "4", name: "Damian Wójtowicz", telefony: 203, spotkania: 6, nowychKontaktow: 23, nowychOfert: 4, transakcje: 0, prowizja: 0, telefonowNaTransakcje: null },
  ],
  tempo: [
    { tydzien: "08.07", dzialania: 62 }, { tydzien: "15.07", dzialania: 71 },
    { tydzien: "22.07", dzialania: 48 }, { tydzien: "29.07", dzialania: 80 },
    { tydzien: "05.08", dzialania: 77 }, { tydzien: "12.08", dzialania: 34 },
    { tydzien: "19.08", dzialania: 59 }, { tydzien: "26.08", dzialania: 66 },
    { tydzien: "02.09", dzialania: 84 }, { tydzien: "09.09", dzialania: 73 },
    { tydzien: "16.09", dzialania: 41 }, { tydzien: "23.09", dzialania: 69 },
  ],
  przychodMiesiacami: [
    { miesiac: "paź 25", pln: 42_100, szt: 2 }, { miesiac: "lis 25", pln: 0, szt: 0 },
    { miesiac: "gru 25", pln: 61_800, szt: 2 }, { miesiac: "sty 26", pln: 28_400, szt: 1 },
    { miesiac: "lut 26", pln: 54_900, szt: 2 }, { miesiac: "mar 26", pln: 77_300, szt: 3 },
    { miesiac: "kwi 26", pln: 33_200, szt: 1 }, { miesiac: "maj 26", pln: 69_500, szt: 3 },
    { miesiac: "cze 26", pln: 48_700, szt: 2 }, { miesiac: "lip 26", pln: 71_200, szt: 3 },
    { miesiac: "sie 26", pln: 52_400, szt: 2 }, { miesiac: "wrz 26", pln: 60_700, szt: 2 },
  ],
};
