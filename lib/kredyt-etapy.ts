// Etapy sprawy kredytowej i domyślne dokumenty. Bez importów: czyta to serwer,
// przeglądarka i portal klienta.

export type EtapKredytu = "nowe" | "analiza" | "dokumenty" | "wniosek" | "decyzja" | "umowa" | "odrzucone";

export const ETAPY_KREDYTU: { id: EtapKredytu; nazwa: string; dlaKlienta: string; kolor: string }[] = [
  { id: "nowe", nazwa: "Nowe polecenie", dlaKlienta: "Doradca kredytowy wkrótce się z Tobą skontaktuje", kolor: "bg-sky-100 text-sky-800" },
  { id: "analiza", nazwa: "Analiza i dobór ofert", dlaKlienta: "Doradca porównuje oferty banków", kolor: "bg-violet-100 text-violet-800" },
  { id: "dokumenty", nazwa: "Zbieranie dokumentów", dlaKlienta: "Kompletujemy dokumenty do wniosku", kolor: "bg-amber-100 text-amber-800" },
  { id: "wniosek", nazwa: "Wniosek w banku", dlaKlienta: "Wniosek kredytowy jest w banku", kolor: "bg-blue-100 text-blue-800" },
  { id: "decyzja", nazwa: "Decyzja pozytywna", dlaKlienta: "Bank wydał pozytywną decyzję", kolor: "bg-emerald-100 text-emerald-800" },
  { id: "umowa", nazwa: "Umowa podpisana", dlaKlienta: "Umowa kredytowa podpisana", kolor: "bg-emerald-600 text-white" },
  { id: "odrzucone", nazwa: "Odrzucone lub rezygnacja", dlaKlienta: "Sprawa kredytowa zamknięta", kolor: "bg-slate-200 text-slate-600" },
];

export const ETAPY_AKTYWNE: EtapKredytu[] = ["nowe", "analiza", "dokumenty", "wniosek", "decyzja"];

export const etapKredytu = (id: string | null | undefined) => ETAPY_KREDYTU.find((e) => e.id === id) ?? ETAPY_KREDYTU[0];

export const RODZAJE_KREDYTU = [
  { id: "hipoteczny", nazwa: "Hipoteczny" },
  { id: "gotowkowy", nazwa: "Gotówkowy" },
  { id: "firmowy", nazwa: "Firmowy" },
  { id: "refinansowanie", nazwa: "Refinansowanie" },
];

/** Typowa lista do kredytu hipotecznego. Doradca dopisuje swoje i odhacza. */
export const DOKUMENTY_HIPOTECZNE = [
  "Dowód osobisty",
  "Zaświadczenie o dochodach albo PIT",
  "Wyciągi z konta (3–6 miesięcy)",
  "Umowa przedwstępna lub rezerwacyjna",
  "Odpis księgi wieczystej",
  "Operat szacunkowy",
  "Potwierdzenie wkładu własnego",
];

export const DOKUMENTY_GOTOWKOWE = ["Dowód osobisty", "Zaświadczenie o dochodach albo PIT", "Wyciągi z konta (3 miesiące)"];

export type Dokument = { nazwa: string; jest: boolean };

export function domyslneDokumenty(rodzaj: string): Dokument[] {
  return (rodzaj === "hipoteczny" || rodzaj === "refinansowanie" ? DOKUMENTY_HIPOTECZNE : DOKUMENTY_GOTOWKOWE).map((nazwa) => ({ nazwa, jest: false }));
}
