// Ocena klienta i kroki etapu na pulpicie „Priorytety na dziś”.
// Bez importów z bazy, żeby test (npm run test:priorytety) liczył to samo co pulpit.

export type EtapKlienta = "nowy" | "w_kontakcie" | "oglada" | "negocjacje" | "zamkniety" | "stracony";

export type SygnalyKlienta = {
  status: EtapKlienta;
  type: string;
  budget_pln: number | null;
  phone: string | null;
  email: string | null;
  next_contact_at: string | null;
  last_contact_at: string | null;
  created_at: string;
  notatek: number;
  polaczenWykonanych: number;
  spotkanWykonanych: number;
  spotkanieNajblizsze: string | null; // ISO zaplanowanego spotkania od dziś
  ofert: number; // oferty, w których klient jest właścicielem
  transakcjaWToku: boolean;
  transakcjaTermin: string | null;
};

export type Temperatura = "goracy" | "cieply" | "zimny";

export type AkcjaKroku = "telefon" | "notatka" | "termin" | "spotkanie" | "oferta" | "transakcja" | "budzet";

export type KrokEtapu = {
  klucz: string;
  tytul: string;
  podpowiedz: string;
  wymagany: boolean;
  zrobiony: boolean;
  zablokowany: boolean; // czeka na wcześniejszy wymagany krok
  akcja: AkcjaKroku;
};

export type Ocena = {
  wynik: number; // 0-100
  temperatura: Temperatura;
  pilnosc: number; // do sortowania, może wyjść ponad 100
  powod: string; // dlaczego dziś
  kroki: KrokEtapu[];
  etapGotowy: boolean; // wszystkie wymagane kroki zrobione
  nastepnyEtap: EtapKlienta | null;
};

export const ETAPY_LEJKA: { value: EtapKlienta; label: string }[] = [
  { value: "nowy", label: "Nowy" },
  { value: "w_kontakcie", label: "W kontakcie" },
  { value: "oglada", label: "Ogląda" },
  { value: "negocjacje", label: "Negocjacje" },
  { value: "zamkniety", label: "Zamknięty" },
];

const WAGA_ETAPU: Record<EtapKlienta, number> = {
  nowy: 22,
  w_kontakcie: 38,
  oglada: 56,
  negocjacje: 74,
  zamkniety: 0,
  stracony: 0,
};

const DZIEN = 24 * 60 * 60 * 1000;

/** Liczba pełnych dni między kluczami dat „RRRR-MM-DD” (b - a). */
function dniMiedzy(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / DZIEN);
}

function sprzedajacy(type: string): boolean {
  return type === "sprzedajacy" || type === "wynajmujacy";
}

export function krokiEtapu(s: SygnalyKlienta): KrokEtapu[] {
  const rozmowa = s.polaczenWykonanych > 0 || s.last_contact_at != null;
  const spotkanie = s.spotkanWykonanych > 0 || s.spotkanieNajblizsze != null;
  const strona = sprzedajacy(s.type);
  const lista: Omit<KrokEtapu, "zablokowany">[] = [];
  const dodaj = (k: Omit<KrokEtapu, "zablokowany">) => lista.push(k);

  switch (s.status) {
    case "nowy":
      dodaj({ klucz: "telefon", tytul: "Pierwszy telefon", podpowiedz: "Najlepiej w ciągu doby od zgłoszenia.", wymagany: true, zrobiony: rozmowa, akcja: "telefon" });
      if (strona) {
        dodaj({ klucz: "oferta", tytul: "Dodaj nieruchomość do bazy", podpowiedz: "Adres, metraż i cena oczekiwana wystarczą na start.", wymagany: true, zrobiony: s.ofert > 0, akcja: "oferta" });
      } else {
        dodaj({ klucz: "budzet", tytul: "Ustal budżet", podpowiedz: "Bez budżetu nie dobierzesz ofert.", wymagany: true, zrobiony: (s.budget_pln ?? 0) > 0, akcja: "budzet" });
      }
      dodaj({ klucz: "termin", tytul: "Zaplanuj następny kontakt", podpowiedz: "Data w kalendarzu, żeby klient nie wypadł.", wymagany: false, zrobiony: s.next_contact_at != null, akcja: "termin" });
      break;
    case "w_kontakcie":
      dodaj({ klucz: "notatka", tytul: "Notatka z rozmowy", podpowiedz: "Potrzeby, terminy, kto decyduje.", wymagany: true, zrobiony: s.notatek > 0, akcja: "notatka" });
      dodaj({ klucz: "spotkanie", tytul: strona ? "Umów spotkanie w nieruchomości" : "Umów prezentację", podpowiedz: "Spotkanie zamienia rozmowę w realną sprawę.", wymagany: true, zrobiony: spotkanie, akcja: "spotkanie" });
      if (strona) dodaj({ klucz: "oferta", tytul: "Oferta w bazie", podpowiedz: "Zdjęcia i opis przed podpisaniem umowy.", wymagany: false, zrobiony: s.ofert > 0, akcja: "oferta" });
      break;
    case "oglada":
      dodaj({ klucz: "spotkanie", tytul: "Prezentacja odbyta", podpowiedz: "Zaznacz spotkanie jako wykonane w działaniach.", wymagany: true, zrobiony: s.spotkanWykonanych > 0, akcja: "spotkanie" });
      dodaj({ klucz: "notatka", tytul: "Opinia po prezentacji", podpowiedz: "Co się podobało, co przeszkadza, jaka cena wchodzi w grę.", wymagany: true, zrobiony: s.notatek > 1, akcja: "notatka" });
      dodaj({ klucz: "termin", tytul: "Termin decyzji", podpowiedz: "Umów się na konkretny dzień odpowiedzi.", wymagany: false, zrobiony: s.next_contact_at != null, akcja: "termin" });
      break;
    case "negocjacje":
      dodaj({ klucz: "transakcja", tytul: "Załóż transakcję", podpowiedz: "Prowizja i strony od razu w Prowizjach.", wymagany: true, zrobiony: s.transakcjaWToku, akcja: "transakcja" });
      dodaj({ klucz: "termin", tytul: "Termin podpisania", podpowiedz: "Data umowy przedwstępnej lub notariusza.", wymagany: true, zrobiony: s.transakcjaTermin != null || s.next_contact_at != null, akcja: "termin" });
      break;
    default:
      break;
  }

  // Kroki wymagane idą po kolei: następny odblokowuje się po zrobieniu poprzedniego.
  let czeka = false;
  return lista.map((k) => {
    const zablokowany = czeka && !k.zrobiony;
    if (k.wymagany && !k.zrobiony) czeka = true;
    return { ...k, zablokowany };
  });
}

export function ocenKlienta(s: SygnalyKlienta, dzis: string): Ocena {
  const kroki = krokiEtapu(s);
  const ostatni = s.last_contact_at ? dniMiedzy(s.last_contact_at.slice(0, 10), dzis) : null;
  const wiek = dniMiedzy(s.created_at.slice(0, 10), dzis);

  let wynik = WAGA_ETAPU[s.status];
  if ((s.budget_pln ?? 0) > 0) wynik += 5;
  if (s.phone) wynik += 3;
  wynik += Math.min(10, s.spotkanWykonanych * 5);
  if (s.spotkanieNajblizsze) wynik += 6;
  if (s.transakcjaWToku) wynik += 10;
  if (s.notatek > 0) wynik += Math.min(6, s.notatek * 2);
  if (ostatni != null) {
    if (ostatni <= 3) wynik += 8;
    else if (ostatni <= 7) wynik += 3;
    else if (ostatni > 21) wynik -= 12;
    else if (ostatni > 14) wynik -= 6;
  }
  wynik = Math.max(1, Math.min(99, Math.round(wynik)));
  const temperatura: Temperatura = wynik >= 70 ? "goracy" : wynik >= 45 ? "cieply" : "zimny";

  // Ocena waży połowę, resztę daje to, co wymaga ruchu dziś (termin, spotkanie, cisza).
  let pilnosc = Math.round(wynik / 2);
  let powod = "";
  const termin = s.next_contact_at?.slice(0, 10) ?? null;
  const spotkanieDzis = s.spotkanieNajblizsze?.slice(0, 10) === dzis;
  if (spotkanieDzis) {
    pilnosc += 80;
    powod = "Spotkanie dziś";
  } else if (termin && termin <= dzis) {
    const spoz = dniMiedzy(termin, dzis);
    pilnosc += 60 + Math.min(20, spoz * 3);
    powod = spoz === 0 ? "Zaplanowany kontakt na dziś" : `Kontakt zaplanowany ${spoz} ${spoz === 1 ? "dzień" : "dni"} temu`;
  } else if (s.status === "nowy" && ostatni == null) {
    pilnosc += 45 + Math.min(15, wiek * 3);
    powod = wiek === 0 ? "Nowy kontakt z dzisiaj" : "Nowy kontakt, jeszcze bez rozmowy";
  } else if (ostatni != null && ostatni >= 7 && temperatura !== "zimny") {
    pilnosc += 25 + Math.min(20, ostatni);
    powod = `Bez kontaktu od ${ostatni} dni`;
  } else if (s.status === "negocjacje") {
    pilnosc += 15;
    powod = "Etap negocjacji";
  } else {
    const otwarty = kroki.find((k) => !k.zrobiony && !k.zablokowany);
    powod = otwarty ? `Następny krok: ${otwarty.tytul.toLowerCase()}` : "Sprawa w toku";
  }
  // Kto ma termin w przyszłości, nie musi być dziś na górze.
  if (termin && termin > dzis && !spotkanieDzis) pilnosc -= 25;

  const etapGotowy = kroki.length > 0 && kroki.filter((k) => k.wymagany).every((k) => k.zrobiony);
  const idx = ETAPY_LEJKA.findIndex((e) => e.value === s.status);
  const nastepnyEtap = idx >= 0 && idx < ETAPY_LEJKA.length - 1 ? ETAPY_LEJKA[idx + 1].value : null;

  return { wynik, temperatura, pilnosc, powod, kroki, etapGotowy, nastepnyEtap };
}
