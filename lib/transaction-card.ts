// Karta transakcji sprzedaży nieruchomości - etapy 1-5 + checklista dokumentów.
// Cała karta zapisywana jako JSON w deals.transaction_card (SETUP v15).

export type DocStatus = "brak" | "w_toku" | "gotowe" | "nd";
export type CardDoc = { key: string; label: string; hint?: string; status: DocStatus; custom?: boolean };

export type TransactionCard = {
  // Nagłówek
  propertyAddress: string;
  reservationDate: string;

  // Etap 1 - weryfikacja prawna i podatkowa
  podstawaNabycia: "" | "kupno" | "spadek" | "darowizna";
  dataNabycia: string;
  pit5lat: "" | "tak" | "nie";
  hipoteka: "" | "nie" | "tak";

  // Etap 2 - profil kupującego
  profilKupujacego: "" | "gotowka" | "kredyt" | "kredyt_nasz";

  // Etap 3A - wariant kredytowy
  kredytTerminPrzyrzeczonej: string;
  kredytZadatek: string;
  kredytDokDoradca: boolean;
  kredytRzeczoznawca: boolean;
  kredytDecyzja: boolean;
  kredytUmowaPodpisana: boolean;
  kredytNotariuszTermin: boolean;

  // Etap 3B - wariant gotówkowy
  gotowkaPrzedwstepna: "" | "podpisano" | "pominieto";
  gotowkaPrzedwstepnaData: string;
  gotowkaZaplata: "" | "natychmiast" | "depozyt" | "zwykly";

  // Etap 4 - umowa końcowa
  pcc: "" | "kupujacy" | "zwolniony";
  dowodyWazne: boolean;

  // Etap 5 - po akcie
  przelewWykonany: boolean;
  kredytUruchomiony: boolean;
  liczniki: boolean;
  klucze: boolean;
  protokolPodpisany: "" | "tak" | "nie";

  documents: CardDoc[];
  notes: string;
};

export const DOC_STATUS_LABELS: Record<DocStatus, string> = {
  brak: "Brak / nie złożono",
  w_toku: "W trakcie",
  gotowe: "Gotowe / odebrane",
  nd: "Nie dotyczy",
};

// Kolejność cyklu przy klikaniu statusu dokumentu.
export const DOC_STATUS_CYCLE: DocStatus[] = ["brak", "w_toku", "gotowe", "nd"];

export const DEFAULT_DOCUMENTS: CardDoc[] = [
  { key: "podstawa_nabycia", label: "Podstawa nabycia", hint: "Akt notarialny / postanowienie sądu / akt poświadczenia dziedziczenia", status: "brak" },
  { key: "kw", label: "Numer Księgi Wieczystej", hint: "Weryfikacja treści online", status: "brak" },
  { key: "zameldowanie", label: "Zaświadczenie o braku osób zameldowanych", hint: "Z Urzędu Miasta", status: "brak" },
  { key: "zaleglosci", label: "Zaświadczenie o braku zaległości w opłatach", hint: "Spółdzielnia / Wspólnota / Administrator", status: "brak" },
  { key: "rewitalizacja", label: "Zaświadczenie o rewitalizacji", hint: "Czy budynek jest w strefie rewitalizacji", status: "brak" },
  { key: "energetyczne", label: "Świadectwo Charakterystyki Energetycznej", hint: "Obowiązkowe do aktu", status: "brak" },
  { key: "us", label: "Zaświadczenie z Urzędu Skarbowego", hint: "Tylko przy spadku / darowiźnie", status: "brak" },
  { key: "promesa", label: "Promesa bankowa", hint: "Tylko jeśli jest hipoteka", status: "brak" },
  { key: "rejestr_gruntow", label: "Wypis z rejestru gruntów", hint: "Przy wydzielaniu KW lub sprzedaży domu", status: "brak" },
  { key: "przeksztalcenie", label: "Zaświadczenie o spłacie opłaty przekształceniowej", hint: "Do wykreślenia roszczenia z dz. III KW", status: "brak" },
  // Dodatkowe, częste w praktyce:
  { key: "podatek_nieruchomosci", label: "Zaświadczenie o niezaleganiu w podatku od nieruchomości", hint: "Urząd Miasta / Gminy", status: "brak" },
  { key: "samodzielnosc", label: "Zaświadczenie o samodzielności lokalu", hint: "Przy wydzieleniu / nowej KW", status: "brak" },
  { key: "mpzp", label: "Wypis i wyrys z MPZP / decyzja WZ", hint: "Przy działce / domu", status: "brak" },
];

export const DEFAULT_CARD: TransactionCard = {
  propertyAddress: "",
  reservationDate: "",
  podstawaNabycia: "",
  dataNabycia: "",
  pit5lat: "",
  hipoteka: "",
  profilKupujacego: "",
  kredytTerminPrzyrzeczonej: "",
  kredytZadatek: "",
  kredytDokDoradca: false,
  kredytRzeczoznawca: false,
  kredytDecyzja: false,
  kredytUmowaPodpisana: false,
  kredytNotariuszTermin: false,
  gotowkaPrzedwstepna: "",
  gotowkaPrzedwstepnaData: "",
  gotowkaZaplata: "",
  pcc: "",
  dowodyWazne: false,
  przelewWykonany: false,
  kredytUruchomiony: false,
  liczniki: false,
  klucze: false,
  protokolPodpisany: "",
  documents: DEFAULT_DOCUMENTS.map((d) => ({ ...d })),
  notes: "",
};

/** Scala zapisany JSON z domyślną kartą (odporne na dodane w przyszłości pola/dokumenty). */
export function mergeCard(raw: unknown): TransactionCard {
  const r = raw && typeof raw === "object" ? (raw as Partial<TransactionCard>) : {};
  const base: TransactionCard = { ...DEFAULT_CARD, ...r } as TransactionCard;

  const saved = Array.isArray(r.documents) ? (r.documents as CardDoc[]) : [];
  const byKey = new Map(saved.map((d) => [d.key, d]));
  const merged = DEFAULT_DOCUMENTS.map((d) => ({ ...d, status: byKey.get(d.key)?.status ?? "brak" }));
  const customs = saved.filter((d) => d.custom && !DEFAULT_DOCUMENTS.some((dd) => dd.key === d.key));
  base.documents = [...merged, ...customs];
  return base;
}

/** Postęp dokumentów: załatwione = gotowe lub „nie dotyczy". */
export function docsProgress(card: TransactionCard): { done: number; total: number; pct: number } {
  const total = card.documents.length;
  const done = card.documents.filter((d) => d.status === "gotowe" || d.status === "nd").length;
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
}
