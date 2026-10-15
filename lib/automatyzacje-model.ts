/**
 * Automatyzacje: model bez dostępu do bazy, żeby dało się go sprawdzić testem
 * (`npm run test:automatyzacje`).
 *
 * Reguła to zdanie: „Kiedy <zdarzenie>, jeśli <warunki>, to <akcje>".
 * Jedna reguła może mieć kilka akcji naraz, np. zadanie dla opiekuna
 * i powiadomienie dla CEO. U konkurencji jedna reguła to jedna akcja,
 * więc ten sam scenariusz wymaga trzech reguł, które rozjeżdżają się przy edycji.
 */

// ── Zdarzenia ──────────────────────────────────────────────

export type Zdarzenie =
  | "nowy_klient"
  | "zmiana_statusu_klienta"
  | "nowy_lead"
  | "nowa_oferta"
  | "zmiana_etapu_oferty"
  | "zmiana_ceny_oferty"
  | "prezentacja_wykonana"
  | "oferta_pasuje_do_poszukiwania"
  | "transakcja_zamknieta"
  | "klient_bez_kontaktu"
  | "oferta_bez_prezentacji";

/** Zdarzenia sprawdzane raz dziennie przez cron, a nie w chwili zapisu. */
export const ZDARZENIA_CZASOWE: Zdarzenie[] = ["klient_bez_kontaktu", "oferta_bez_prezentacji"];

export type OpisZdarzenia = {
  id: Zdarzenie;
  nazwa: string;
  /** Dokończenie zdania „Kiedy…" w kreatorze. */
  zdanie: string;
  grupa: "Klienci" | "Leady" | "Oferty" | "Transakcje";
  czego: "klient" | "oferta" | "lead" | "transakcja";
};

export const ZDARZENIA: OpisZdarzenia[] = [
  { id: "nowy_klient", nazwa: "Nowy klient", zdanie: "w bazie pojawi się nowy klient", grupa: "Klienci", czego: "klient" },
  { id: "zmiana_statusu_klienta", nazwa: "Zmiana statusu klienta", zdanie: "klient przejdzie do innego etapu", grupa: "Klienci", czego: "klient" },
  { id: "klient_bez_kontaktu", nazwa: "Klient bez kontaktu", zdanie: "z klientem nie było kontaktu przez określoną liczbę dni", grupa: "Klienci", czego: "klient" },
  { id: "nowy_lead", nazwa: "Nowy lead", zdanie: "przyjdzie nowy lead z formularza, portalu albo strony", grupa: "Leady", czego: "lead" },
  { id: "nowa_oferta", nazwa: "Nowa oferta", zdanie: "w bazie pojawi się nowa oferta", grupa: "Oferty", czego: "oferta" },
  { id: "zmiana_etapu_oferty", nazwa: "Zmiana etapu oferty", zdanie: "oferta przejdzie do innego etapu obsługi", grupa: "Oferty", czego: "oferta" },
  { id: "zmiana_ceny_oferty", nazwa: "Zmiana ceny oferty", zdanie: "zmieni się cena oferty", grupa: "Oferty", czego: "oferta" },
  { id: "prezentacja_wykonana", nazwa: "Prezentacja wykonana", zdanie: "prezentacja nieruchomości zostanie oznaczona jako wykonana", grupa: "Oferty", czego: "oferta" },
  { id: "oferta_pasuje_do_poszukiwania", nazwa: "Oferta pasuje do poszukiwania", zdanie: "nowa oferta będzie pasować do czyjegoś poszukiwania", grupa: "Oferty", czego: "oferta" },
  { id: "oferta_bez_prezentacji", nazwa: "Oferta bez prezentacji", zdanie: "oferta nie miała prezentacji przez określoną liczbę dni", grupa: "Oferty", czego: "oferta" },
  { id: "transakcja_zamknieta", nazwa: "Transakcja zamknięta", zdanie: "transakcja zostanie zamknięta", grupa: "Transakcje", czego: "transakcja" },
];

export function opisZdarzenia(id: string): OpisZdarzenia | undefined {
  return ZDARZENIA.find((z) => z.id === id);
}

// ── Warunki ────────────────────────────────────────────────

export type WarunkiReguly = {
  /** Status klienta, do którego przeszedł (zmiana statusu). */
  statusNa?: string[];
  /** Typ klienta: sprzedajacy, kupujacy… */
  typKlienta?: string[];
  /** Źródło klienta albo leada. */
  zrodlo?: string[];
  /** Etap oferty, do którego przeszła. */
  etapNa?: string[];
  /** Sprzedaż albo wynajem. */
  rodzajOferty?: string[];
  /** Obniżka, podwyżka albo każda zmiana ceny. */
  kierunekCeny?: "obnizka" | "podwyzka" | "dowolna";
  /** Minimalna zmiana ceny w procentach. */
  minZmianaProcent?: number;
  /** Zdarzenia czasowe: po ilu dniach. */
  dni?: number;
};

/** Kontekst zdarzenia: wszystko, co reguła może sprawdzić i wstawić do treści. */
export type Kontekst = {
  zdarzenie: Zdarzenie;
  klientId?: string | null;
  ofertaId?: string | null;
  leadId?: string | null;
  transakcjaId?: string | null;
  poszukiwanieId?: string | null;
  /** Osoba, która wywołała zdarzenie. Pusta przy zdarzeniach czasowych. */
  autorId?: string | null;
  /** Opiekun rekordu, którego dotyczy zdarzenie. */
  opiekunId?: string | null;
  statusKlienta?: string | null;
  typKlienta?: string | null;
  zrodlo?: string | null;
  etapOferty?: string | null;
  rodzajOferty?: string | null;
  staraCena?: number | null;
  nowaCena?: number | null;
  /** Do zdarzeń czasowych: ile dni minęło. */
  dni?: number | null;
  /** Do szablonów treści. */
  nazwaKlienta?: string | null;
  nazwaOferty?: string | null;
  adresOferty?: string | null;
  /** Ustawione, gdy zdarzenie wywołała inna automatyzacja: nie łańcuchujemy. */
  zAutomatyzacji?: boolean;
};

export function spelniaWarunki(w: WarunkiReguly, k: Kontekst): boolean {
  if (w.statusNa?.length && !w.statusNa.includes(k.statusKlienta ?? "")) return false;
  if (w.typKlienta?.length && !w.typKlienta.includes(k.typKlienta ?? "")) return false;
  if (w.zrodlo?.length && !w.zrodlo.includes(k.zrodlo ?? "")) return false;
  if (w.etapNa?.length && !w.etapNa.includes(k.etapOferty ?? "")) return false;
  if (w.rodzajOferty?.length && !w.rodzajOferty.includes(k.rodzajOferty ?? "")) return false;

  if (k.zdarzenie === "zmiana_ceny_oferty") {
    const stara = k.staraCena ?? null;
    const nowa = k.nowaCena ?? null;
    if (stara == null || nowa == null || stara === nowa) {
      // Pierwsze ustawienie ceny albo jej skasowanie to nie „obniżka" ani „podwyżka".
      if (w.kierunekCeny && w.kierunekCeny !== "dowolna") return false;
    } else {
      if (w.kierunekCeny === "obnizka" && !(nowa < stara)) return false;
      if (w.kierunekCeny === "podwyzka" && !(nowa > stara)) return false;
      if (w.minZmianaProcent && w.minZmianaProcent > 0) {
        const procent = (Math.abs(nowa - stara) / stara) * 100;
        if (procent + 1e-9 < w.minZmianaProcent) return false;
      }
    }
  }
  return true;
}

// ── Akcje ──────────────────────────────────────────────────

/** Kto dostaje zadanie albo powiadomienie. */
export type Odbiorca =
  | { kto: "opiekun" }
  | { kto: "autor" }
  | { kto: "ceo" }
  | { kto: "menedzer_opiekuna" }
  | { kto: "osoba"; id: string };

export type Akcja =
  | {
      typ: "zadanie";
      rodzaj: "zadanie" | "polaczenie";
      tytul: string;
      opis?: string;
      za_dni: number;
      godzina?: string;
      priorytet?: "niski" | "normalny" | "wysoki";
      dla: Odbiorca;
    }
  | {
      typ: "powiadomienie";
      tytul: string;
      tresc?: string;
      dla: Odbiorca[];
      mail?: boolean;
    }
  | {
      typ: "przypisz";
      /** Kandydaci. Wybieramy tę osobę, która ma najmniej otwartych spraw. */
      osoby: string[];
      /** Tylko gdy rekord nie ma jeszcze opiekuna. */
      tylkoBezOpiekuna?: boolean;
    }
  | { typ: "status_klienta"; status: string }
  | { typ: "etap_oferty"; etap: string }
  | {
      typ: "mail_do_klienta";
      temat: string;
      tresc: string;
      /** Wymagaj zgody na kontakt mailowy (zgody RODO z v49). */
      wymagajZgody?: boolean;
    };

export type TypAkcji = Akcja["typ"];

export const AKCJE: { typ: TypAkcji; nazwa: string; opis: string }[] = [
  { typ: "zadanie", nazwa: "Utwórz zadanie", opis: "Zadanie albo telefon w kalendarzu, z terminem i osobą." },
  { typ: "powiadomienie", nazwa: "Wyślij powiadomienie", opis: "Dzwonek w aplikacji, push na telefon, opcjonalnie mail." },
  { typ: "przypisz", nazwa: "Przypisz opiekuna", opis: "Najmniej obciążonej osobie z wybranych." },
  { typ: "status_klienta", nazwa: "Zmień status klienta", opis: "Przesuń klienta na inny etap." },
  { typ: "etap_oferty", nazwa: "Zmień etap oferty", opis: "Przesuń ofertę na inny etap obsługi." },
  { typ: "mail_do_klienta", nazwa: "Wyślij mail do klienta", opis: "Z szablonu, z poczty biura, z kopią w korespondencji." },
];

/** Które akcje mają sens przy danym zdarzeniu. */
export function akcjeDlaZdarzenia(z: Zdarzenie): TypAkcji[] {
  const czego = opisZdarzenia(z)?.czego;
  const wspolne: TypAkcji[] = ["zadanie", "powiadomienie"];
  if (czego === "klient") return [...wspolne, "przypisz", "status_klienta", "mail_do_klienta"];
  if (czego === "lead") return [...wspolne, "przypisz"];
  if (czego === "oferta") return [...wspolne, "przypisz", "etap_oferty"];
  return wspolne;
}

// ── Treści ─────────────────────────────────────────────────

export const ZMIENNE: { klucz: string; opis: string }[] = [
  { klucz: "klient", opis: "imię i nazwisko klienta" },
  { klucz: "imie", opis: "samo imię klienta" },
  { klucz: "oferta", opis: "tytuł oferty" },
  { klucz: "adres", opis: "adres oferty" },
  { klucz: "cena", opis: "aktualna cena oferty" },
  { klucz: "stara_cena", opis: "cena przed zmianą" },
  { klucz: "dni", opis: "liczba dni (zdarzenia czasowe)" },
  { klucz: "agent", opis: "opiekun rekordu" },
  { klucz: "biuro", opis: "nazwa biura" },
];

function cena(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return "";
  return `${Math.round(v).toLocaleString("pl-PL").replace(/ /g, " ")} zł`;
}

/**
 * Podstawia {zmienne}. Nieznana zmienna zostaje w nawiasach, żeby było widać
 * literówkę w szablonie, a nie znikające po cichu słowo.
 */
export function wypelnij(
  szablon: string,
  k: Kontekst,
  dodatki: { agent?: string | null; biuro?: string | null } = {},
): string {
  const imie = (k.nazwaKlienta ?? "").trim().split(/\s+/)[0] ?? "";
  const wartosci: Record<string, string> = {
    klient: k.nazwaKlienta ?? "",
    imie,
    oferta: k.nazwaOferty ?? "",
    adres: k.adresOferty ?? k.nazwaOferty ?? "",
    cena: cena(k.nowaCena),
    stara_cena: cena(k.staraCena),
    dni: k.dni != null ? String(k.dni) : "",
    agent: dodatki.agent ?? "",
    biuro: dodatki.biuro ?? "",
  };
  return szablon
    .replace(/\{([a-z_]+)\}/g, (cale, nazwa: string) => (nazwa in wartosci ? wartosci[nazwa] : cale))
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

/**
 * Klucz, który nie pozwala jednej regule zadziałać dwa razy na to samo.
 *
 * Dla zdarzeń czasowych w kluczu siedzi data ostatniego kontaktu: klient
 * bez kontaktu od 14 dni dostaje jedno zadanie, a nie nowe każdego ranka.
 * Gdy ktoś do niego zadzwoni i znów minie 14 dni, data jest inna, więc
 * reguła zadziała ponownie.
 */
export function kluczZdarzenia(k: Kontekst, znacznikCzasu?: string | null): string {
  const id = k.klientId ?? k.ofertaId ?? k.leadId ?? k.transakcjaId ?? "brak";
  switch (k.zdarzenie) {
    case "zmiana_statusu_klienta":
      return `${k.zdarzenie}:${id}:${k.statusKlienta}:${znacznikCzasu ?? ""}`;
    case "zmiana_etapu_oferty":
      return `${k.zdarzenie}:${id}:${k.etapOferty}:${znacznikCzasu ?? ""}`;
    case "zmiana_ceny_oferty":
      return `${k.zdarzenie}:${id}:${k.staraCena}->${k.nowaCena}`;
    case "oferta_pasuje_do_poszukiwania":
      return `${k.zdarzenie}:${id}:${k.poszukiwanieId ?? ""}`;
    case "prezentacja_wykonana":
      return `${k.zdarzenie}:${id}:${znacznikCzasu ?? ""}`;
    case "klient_bez_kontaktu":
    case "oferta_bez_prezentacji":
      return `${k.zdarzenie}:${id}:${znacznikCzasu ?? ""}`;
    default:
      return `${k.zdarzenie}:${id}`;
  }
}

/** Zdanie opisujące regułę na liście, po ludzku. */
export function opisReguly(r: { trigger: string; trigger_config: WarunkiReguly; actions: Akcja[] }): string {
  const z = opisZdarzenia(r.trigger);
  const kiedy = z ? `Kiedy ${z.zdanie}` : "Kiedy zajdzie zdarzenie";
  const w = r.trigger_config ?? {};
  const warunki: string[] = [];
  // Wartości z bazy („w_kontakcie”) zamieniamy na czytelne słowa. Model nie
  // importuje słowników z lib/types, żeby test działał w gołym node.
  const ludzko = (l: string[]) => l.map((v) => v.replace(/_/g, " ")).join(" lub ");
  if (w.statusNa?.length) warunki.push(`tylko na etap: ${ludzko(w.statusNa)}`);
  if (w.etapNa?.length) warunki.push(`tylko na etap: ${ludzko(w.etapNa)}`);
  if (w.typKlienta?.length) warunki.push(`klient: ${ludzko(w.typKlienta)}`);
  if (w.zrodlo?.length) warunki.push(`źródło: ${ludzko(w.zrodlo)}`);
  if (w.rodzajOferty?.length) warunki.push(`oferta: ${ludzko(w.rodzajOferty)}`);
  if (w.dni) warunki.push(`po ${w.dni} ${w.dni === 1 ? "dniu" : "dniach"}`);
  if (w.kierunekCeny === "obnizka") warunki.push("tylko przy obniżce");
  if (w.kierunekCeny === "podwyzka") warunki.push("tylko przy podwyżce");
  if (w.minZmianaProcent) warunki.push(`o co najmniej ${w.minZmianaProcent}%`);
  const akcje = (r.actions ?? []).map((a) => AKCJE.find((x) => x.typ === a.typ)?.nazwa.toLowerCase() ?? a.typ);
  return `${kiedy}${warunki.length ? ` (${warunki.join(", ")})` : ""}: ${akcje.join(", ") || "brak akcji"}.`;
}

/** Termin zadania: dziś w Warszawie + n dni, o podanej godzinie. Zwraca klucz dnia i godzinę. */
export function terminZadania(dzisKlucz: string, zaDni: number, godzina = "09:00"): { dzien: string; godzina: string } {
  const [r, m, d] = dzisKlucz.split("-").map(Number);
  const t = new Date(Date.UTC(r, m - 1, d + Math.max(0, Math.round(zaDni))));
  const dzien = t.toISOString().slice(0, 10);
  const g = /^\d{2}:\d{2}$/.test(godzina) ? godzina : "09:00";
  return { dzien, godzina: g };
}

// ── Gotowe reguły ──────────────────────────────────────────

export type SzablonReguly = {
  klucz: string;
  nazwa: string;
  /** Po co to jest, jednym zdaniem dla właściciela biura. */
  poCo: string;
  trigger: Zdarzenie;
  trigger_config: WarunkiReguly;
  actions: Akcja[];
};

/**
 * Reguły, które biura i tak ustawiłyby same jako pierwsze. Każdą można
 * włączyć jednym kliknięciem, a potem dowolnie zmienić.
 */
export const SZABLONY_REGUL: SzablonReguly[] = [
  {
    klucz: "po_prezentacji",
    nazwa: "Telefon dzień po prezentacji",
    poCo: "Najwięcej transakcji przepada w ciszy po oglądaniu. Ten telefon ją przerywa.",
    trigger: "prezentacja_wykonana",
    trigger_config: {},
    actions: [
      {
        typ: "zadanie",
        rodzaj: "polaczenie",
        tytul: "Zapytaj o wrażenia po prezentacji: {oferta}",
        opis: "Co się podobało, co przeszkadza, czy chcą zobaczyć drugi raz. Zapisz obiekcje w notatce.",
        za_dni: 1,
        godzina: "10:00",
        priorytet: "wysoki",
        dla: { kto: "opiekun" },
      },
    ],
  },
  {
    klucz: "nowy_lead",
    nazwa: "Nowy lead do najmniej obciążonej osoby",
    poCo: "Lead, który czeka na właściciela biura do wieczora, jest już u konkurencji.",
    trigger: "nowy_lead",
    trigger_config: {},
    actions: [
      { typ: "przypisz", osoby: [], tylkoBezOpiekuna: true },
      {
        typ: "zadanie",
        rodzaj: "polaczenie",
        tytul: "Oddzwoń do leada: {klient}",
        opis: "Pierwszy kontakt w ciągu godziny podwaja szansę na spotkanie.",
        za_dni: 0,
        godzina: "09:00",
        priorytet: "wysoki",
        dla: { kto: "opiekun" },
      },
    ],
  },
  {
    klucz: "bez_kontaktu_14",
    nazwa: "Klient bez kontaktu przez 14 dni",
    poCo: "Klient, do którego nikt nie dzwoni od dwóch tygodni, właśnie szuka innego agenta.",
    trigger: "klient_bez_kontaktu",
    trigger_config: { dni: 14 },
    actions: [
      {
        typ: "zadanie",
        rodzaj: "polaczenie",
        tytul: "Odezwij się do {klient}, cisza od {dni} dni",
        za_dni: 0,
        godzina: "09:30",
        priorytet: "normalny",
        dla: { kto: "opiekun" },
      },
    ],
  },
  {
    klucz: "oferta_bez_prezentacji_21",
    nazwa: "Oferta bez prezentacji przez 21 dni",
    poCo: "Trzy tygodnie bez oglądania to sygnał, że cena albo zdjęcia nie działają.",
    trigger: "oferta_bez_prezentacji",
    trigger_config: { dni: 21 },
    actions: [
      {
        typ: "zadanie",
        rodzaj: "zadanie",
        tytul: "Porozmawiaj z właścicielem o cenie lub zdjęciach: {oferta}",
        opis: "Od {dni} dni bez prezentacji. Przygotuj porównanie z ofertami w okolicy.",
        za_dni: 0,
        godzina: "11:00",
        priorytet: "normalny",
        dla: { kto: "opiekun" },
      },
      {
        typ: "powiadomienie",
        tytul: "Oferta stoi od {dni} dni: {oferta}",
        dla: [{ kto: "menedzer_opiekuna" }],
      },
    ],
  },
  {
    klucz: "obnizka_ceny",
    nazwa: "Obniżka ceny: daj znać zespołowi",
    poCo: "Kupujący, który odpadł przez cenę, może wrócić. Ktoś musi do niego zadzwonić.",
    trigger: "zmiana_ceny_oferty",
    trigger_config: { kierunekCeny: "obnizka", minZmianaProcent: 2 },
    actions: [
      {
        typ: "powiadomienie",
        tytul: "Obniżka: {oferta}",
        tresc: "Cena spadła z {stara_cena} na {cena}. Sprawdź klientów, którzy odpadli przez cenę.",
        dla: [{ kto: "opiekun" }, { kto: "ceo" }],
      },
    ],
  },
  {
    klucz: "negocjacje_rezerwacja",
    nazwa: "Negocjacje: przygotuj umowę rezerwacyjną",
    poCo: "Klient, który się zgodził, za tydzień może się rozmyślić. Papier zamyka sprawę.",
    trigger: "zmiana_statusu_klienta",
    trigger_config: { statusNa: ["negocjacje"] },
    actions: [
      {
        typ: "zadanie",
        rodzaj: "zadanie",
        tytul: "Przygotuj umowę rezerwacyjną dla {klient}",
        opis: "Generator w Dokumentach uzupełni dane klienta i oferty sam.",
        za_dni: 0,
        godzina: "12:00",
        priorytet: "wysoki",
        dla: { kto: "opiekun" },
      },
    ],
  },
  {
    klucz: "zamknieta_opinia",
    nazwa: "Po transakcji poproś o opinię",
    poCo: "Zadowolony klient to najtańszy kolejny klient. Opinia działa tylko, gdy ktoś o nią poprosi.",
    trigger: "transakcja_zamknieta",
    trigger_config: {},
    actions: [
      {
        typ: "zadanie",
        rodzaj: "polaczenie",
        tytul: "Poproś {klient} o opinię i polecenie",
        za_dni: 7,
        godzina: "17:00",
        priorytet: "normalny",
        dla: { kto: "opiekun" },
      },
    ],
  },
  {
    klucz: "dopasowanie",
    nazwa: "Nowa oferta pasuje do poszukiwania",
    poCo: "Agent dowiaduje się o ofercie dla swojego kupującego w chwili jej dodania, a nie przy porannej kawie.",
    trigger: "oferta_pasuje_do_poszukiwania",
    trigger_config: {},
    actions: [
      {
        typ: "powiadomienie",
        tytul: "Oferta dla Twojego klienta: {oferta}",
        tresc: "Pasuje do poszukiwania klienta {klient}. Cena {cena}.",
        dla: [{ kto: "opiekun" }],
      },
    ],
  },
];
