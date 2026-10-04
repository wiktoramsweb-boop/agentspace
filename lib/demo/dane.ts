import { DZIELNICE } from "./dzielnice";

/**
 * Generatory danych konta demo.
 *
 * Czysta logika, bez zapisu do bazy: dzięki temu korzysta z niej zarówno
 * skrypt z terminala, jak i automatyczne odświeżanie po stronie serwera.
 *
 * Wszystkie daty liczymy względem „teraz", a nie od sztywnego punktu.
 * Pokaz może się odbyć za tydzień albo za dwa miesiące i kalendarz ma
 * wtedy wyglądać tak samo: wypełniony w tył i w przód.
 */

export const IMIONA = ["Anna", "Piotr", "Katarzyna", "Marcin", "Magdalena", "Tomasz", "Joanna", "Paweł", "Agnieszka", "Michał", "Ewa", "Krzysztof"];
export const NAZWISKA = ["Kowalska", "Nowak", "Wiśniewski", "Wójcik", "Kowalczyk", "Kamiński", "Lewandowska", "Zieliński", "Szymański", "Woźniak", "Dąbrowska", "Mazur"];

const STANY = ["do_wprowadzenia", "do_odswiezenia", "do_remontu"];
const WNETRZA = ["salon.jpg", "kuchnia.jpg", "sypialnia.jpg", "salon-widok.jpg", "wnetrze-slonce.jpg", "loft.jpg", "lounge.jpg", "taras.jpg"];
const BUDYNKI = ["kamienica.jpg", "cegla.jpg", "szklo.jpg", "wieza.jpg", "dziedziniec.jpg", "schody.jpg", "dom.jpg", "widok.jpg"];

const NOTATKI = [
  "Zainteresowany, prosi o drugie oglądanie w weekend.",
  "Czeka na decyzję kredytową, termin do końca miesiąca.",
  "Cena do negocjacji, właściciel schodzi maksymalnie o 3 procent.",
  "Szuka od trzech miesięcy, obejrzał już sześć mieszkań.",
  "Sprzedaje, bo przeprowadza się za granicę. Termin elastyczny.",
  "Kontakt telefoniczny, nie odbiera przed 16.",
];

/**
 * Skład zespołu w koncie demo.
 *
 * Nazwiska MUSZĄ być zmyślone. Pierwsza wersja miała tu prawdziwych
 * pracowników Spectry, co na pokazie u obcego klienta wygląda fatalnie
 * i niepotrzebnie ujawnia, kto pracuje w biurze.
 */
export const ZESPOL = [
  { imie: "Zofia", nazwisko: "Malinowska", rola: "manager", celMiesieczny: 18000 },
  { imie: "Adam", nazwisko: "Wróbel", rola: "agent", celMiesieczny: 14000 },
  { imie: "Klara", nazwisko: "Sikorska", rola: "agent", celMiesieczny: 12000 },
  { imie: "Bartosz", nazwisko: "Lis", rola: "agent", celMiesieczny: 11000 },
  { imie: "Emilia", nazwisko: "Rutkowska", rola: "agent", celMiesieczny: 9000 },
];

/* ── losowość powtarzalna ─────────────────────────────────── */

/**
 * Generator z ziarnem: ten sam dzień daje ten sam zestaw danych, więc
 * odświeżenie w trakcie pokazu nie przetasuje nagle całego biura.
 */
export function utworzLosowanie(ziarno: number) {
  let stan = ziarno;
  const rnd = () => {
    stan = (stan * 1103515245 + 12345) % 2147483648;
    return stan / 2147483648;
  };
  return {
    rnd,
    pick: <T>(arr: T[]): T => arr[Math.floor(rnd() * arr.length)],
    between: (a: number, b: number) => a + rnd() * (b - a),
    int: (a: number, b: number) => Math.floor(a + rnd() * (b - a + 1)),
  };
}

/** Ziarno z dzisiejszej daty: dane są stabilne w obrębie jednego dnia. */
export function ziarnoDnia(now: Date): number {
  return Number(`${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, "0")}${String(now.getUTCDate()).padStart(2, "0")}`);
}

/* ── pomocnicze daty ──────────────────────────────────────── */

export function przesun(now: Date, dni: number, godzina?: number, minuta = 0): Date {
  const d = new Date(now);
  d.setDate(d.getDate() + dni);
  if (godzina != null) d.setHours(godzina, minuta, 0, 0);
  return d;
}

/** Dzień roboczy: pokaz w poniedziałek ma wyglądać tak samo jak w piątek. */
export function najblizszyRoboczy(d: Date): Date {
  const x = new Date(d);
  while (x.getDay() === 0 || x.getDay() === 6) x.setDate(x.getDate() + 1);
  return x;
}

/* ── generatory ───────────────────────────────────────────── */

type Los = ReturnType<typeof utworzLosowanie>;

export function generujKlientow(los: Los, agencyId: string, agenci: string[], now: Date, ile = 24) {
  const out: Record<string, unknown>[] = [];
  for (let i = 0; i < ile; i++) {
    const typ = los.pick(["kupujacy", "sprzedajacy", "kupujacy", "najem"]);
    out.push({
      agency_id: agencyId,
      agent_id: los.pick(agenci),
      name: `${los.pick(IMIONA)} ${los.pick(NAZWISKA)}`,
      phone: `5${los.int(10, 99)} ${los.int(100, 999)} ${los.int(100, 999)}`,
      email: `kontakt${i}@przyklad.pl`,
      type: typ,
      status: los.pick(["nowy", "w_kontakcie", "oglada", "negocjacje", "zamkniety"]),
      budget_pln: typ === "kupujacy" ? los.int(45, 130) * 10000 : null,
      property: typ === "kupujacy" ? `${los.int(2, 4)} pokoje, ${los.pick(DZIELNICE).nazwa}` : null,
      notes: los.pick(NOTATKI),
      source: "demo",
      last_contact_at: przesun(now, -los.int(0, 40)).toISOString(),
    });
  }
  return out;
}

export function generujOferty(los: Los, agencyId: string, agenci: string[], now: Date, ile = 38, sprzedanych = 16) {
  const out: Record<string, unknown>[] = [];
  for (let i = 0; i < ile; i++) {
    const d = los.pick(DZIELNICE);
    const area = Math.round(los.between(28, 96));
    const stan = los.pick(STANY);
    const korekta = stan === "do_remontu" ? 0.88 : stan === "do_odswiezenia" ? 0.95 : 1;
    const cenaM2 = d.cenaM2 * korekta * los.between(0.92, 1.08);
    const sprzedane = i < sprzedanych;
    const pokoje = area < 34 ? 1 : area < 50 ? 2 : area < 72 ? 3 : 4;
    const pieter = los.int(3, 8);
    const rok = los.int(1935, 2023);

    const elewacja = BUDYNKI[i % BUDYNKI.length];
    const zdjecia = [elewacja, ...[0, 1, 2, 3].map((k) => WNETRZA[(i + k) % WNETRZA.length])].map((plik, k) => ({
      url: `/wzory/${plik}`,
      caption: k === 0 ? "Budynek" : (["Salon", "Kuchnia", "Sypialnia", "Taras"][k - 1] ?? "Wnętrze"),
      export: true,
      print: k < 3,
    }));

    out.push({
      agency_id: agencyId,
      agent_id: los.pick(agenci),
      offer_no: `DEMO-${String(i + 1).padStart(3, "0")}`,
      title: `${pokoje} pok., ${area} m², ${d.nazwa}`,
      deal_kind: "sprzedaz",
      property_type: "mieszkanie",
      status: sprzedane ? "sfinalizowana" : "aktywna",
      city: "Kraków",
      address: `${los.pick(d.ulice)} ${los.int(1, 80)}, Kraków`,
      lat: d.lat + los.between(-0.006, 0.006),
      lng: d.lng + los.between(-0.008, 0.008),
      price_pln: Math.round((cenaM2 * area) / 1000) * 1000,
      area_m2: area,
      rooms: pokoje,
      floor: los.int(0, pieter),
      floors_total: pieter,
      year_built: rok,
      condition_std: stan,
      market: los.rnd() > 0.85 ? "pierwotny" : "wtorny",
      description:
        `Mieszkanie ${pokoje}-pokojowe o powierzchni ${area} m² w dzielnicy ${d.nazwa}. ` +
        `Budynek z ${rok} roku, ${stan === "do_wprowadzenia" ? "gotowe do wprowadzenia" : stan === "do_odswiezenia" ? "do odświeżenia" : "do remontu"}. ` +
        "Dane przykładowe, oferta demonstracyjna.",
      photos: zdjecia,
      export_to_web: true,
      updated_at: przesun(now, -(sprzedane ? los.int(20, 500) : los.int(1, 60))).toISOString(),
    });
  }
  return out;
}

/* ── działania: kalendarz w tył i w przód ─────────────────── */

const TEMATY_TELEFON = [
  "Telefon pozyskowy z ogłoszenia",
  "Oddzwonienie do właściciela",
  "Follow-up po prezentacji",
  "Telefon do klienta kupującego",
  "Ustalenie terminu oglądania",
];
const TEMATY_SPOTKANIE = [
  "Spotkanie pozyskowe u właściciela",
  "Podpisanie umowy pośrednictwa",
  "Prezentacja mieszkania",
  "Drugie oglądanie z rodziną",
  "Spotkanie z doradcą kredytowym",
];
const TEMATY_ZADANIE = [
  "Przygotować zestawienie cen z ulicy",
  "Zamówić sesję zdjęciową",
  "Wysłać ofertę do klienta",
  "Zebrać dokumenty do aktu",
  "Zaktualizować opis oferty",
];
const TEMATY_WYDARZENIE = ["Akt notarialny", "Odbiór kluczy", "Przegląd techniczny z rzeczoznawcą"];

/**
 * Kalendarz konta demo.
 *
 * Trzydzieści dni wstecz wypełniamy wykonanymi telefonami i spotkaniami,
 * żeby rytm dnia i statystyki miały z czego powstać. Trzy tygodnie w przód
 * planujemy spotkania i prezentacje, bo pusty kalendarz na pokazie wygląda
 * jak system, z którego nikt nie korzysta.
 */
export function generujDzialania(
  los: Los,
  agencyId: string,
  osoby: string[],
  klienci: { id: string }[],
  oferty: { id: string }[],
  now: Date,
) {
  const out: Record<string, unknown>[] = [];

  const dodaj = (
    osoba: string,
    dzien: number,
    godzina: number,
    kind: string,
    subject: string,
    status: string,
    opts: { priority?: string; purpose?: string } = {},
  ) => {
    const due = przesun(now, dzien, godzina, los.pick([0, 15, 30, 45]));
    out.push({
      agency_id: agencyId,
      created_by: osoba,
      kind,
      purpose: opts.purpose ?? null,
      subject,
      description: null,
      status,
      priority: opts.priority ?? "normalny",
      due_at: due.toISOString(),
      client_id: klienci.length ? los.pick(klienci).id : null,
      property_id: oferty.length && los.rnd() > 0.5 ? los.pick(oferty).id : null,
      assignee_ids: [osoba],
      include_in_report: true,
      ...(status === "wykonane"
        ? { completed_at: due.toISOString(), duration_s: kind === "polaczenie" ? los.int(90, 600) : null }
        : {}),
    });
  };

  // Każda osoba dostaje własny kalendarz, łącznie z właścicielem.
  //
  // Kalendarz domyślnie pokazuje działania zalogowanego użytkownika, a nie
  // całego biura. Pierwsza wersja przypisywała wszystko agentom, więc CEO,
  // na którego loguje się prowadzący pokaz, widział pusty ekran i komunikat
  // „brak wykonanych telefonów".
  for (const osoba of osoby) {
    // ── ostatnie 30 dni roboczych: wykonane ──
    for (let dzien = -30; dzien <= -1; dzien++) {
      const data = przesun(now, dzien);
      if (data.getDay() === 0 || data.getDay() === 6) continue;

      for (let i = 0; i < los.int(3, 7); i++) {
        dodaj(osoba, dzien, los.pick([9, 10, 11, 12, 14, 15, 16, 17]), "polaczenie", los.pick(TEMATY_TELEFON), "wykonane", {
          purpose: los.pick(["pozyskowa", "aktualizacyjna", "prezentacja"]),
        });
      }
      if (los.rnd() > 0.45) {
        dodaj(osoba, dzien, los.pick([10, 12, 16, 18]), "spotkanie", los.pick(TEMATY_SPOTKANIE), "wykonane");
      }
      if (los.rnd() > 0.7) dodaj(osoba, dzien, los.pick([13, 15]), "zadanie", los.pick(TEMATY_ZADANIE), "wykonane");
    }

    // ── dzisiaj: część odhaczona, część jeszcze przed nami ──
    for (let i = 0; i < los.int(3, 5); i++) {
      dodaj(osoba, 0, los.pick([8, 9, 10, 11]), "polaczenie", los.pick(TEMATY_TELEFON), "wykonane", { purpose: "pozyskowa" });
    }
    dodaj(osoba, 0, los.pick([13, 14]), "spotkanie", los.pick(TEMATY_SPOTKANIE), "zaplanowane", { priority: "wysoki" });
    dodaj(osoba, 0, 16, "polaczenie", los.pick(TEMATY_TELEFON), "zaplanowane", { purpose: "aktualizacyjna" });
    dodaj(osoba, 0, 17, "zadanie", los.pick(TEMATY_ZADANIE), "zaplanowane", { priority: "wysoki" });

    // ── jutro i pojutrze gęściej: to widać zaraz po wejściu w kalendarz ──
    for (const dzien of [1, 2]) {
      const data = przesun(now, dzien);
      if (data.getDay() === 0 || data.getDay() === 6) continue;
      for (let i = 0; i < los.int(2, 4); i++) {
        dodaj(osoba, dzien, los.pick([9, 10, 11, 14, 16]), "polaczenie", los.pick(TEMATY_TELEFON), "zaplanowane", {
          purpose: los.pick(["pozyskowa", "aktualizacyjna"]),
        });
      }
      dodaj(osoba, dzien, los.pick([12, 15, 17]), "spotkanie", los.pick(TEMATY_SPOTKANIE), "zaplanowane", {
        priority: los.rnd() > 0.6 ? "wysoki" : "normalny",
      });
    }

    // ── kolejne trzy tygodnie: rzadziej, ale kalendarz nie jest pusty ──
    for (let dzien = 3; dzien <= 21; dzien++) {
      const data = przesun(now, dzien);
      if (data.getDay() === 0 || data.getDay() === 6) continue;

      if (los.rnd() > 0.35) {
        dodaj(osoba, dzien, los.pick([10, 12, 15, 17]), "spotkanie", los.pick(TEMATY_SPOTKANIE), "zaplanowane", {
          priority: los.rnd() > 0.75 ? "wysoki" : "normalny",
        });
      }
      for (let i = 0; i < los.int(1, 3); i++) {
        dodaj(osoba, dzien, los.pick([9, 11, 14, 16]), "polaczenie", los.pick(TEMATY_TELEFON), "zaplanowane", {
          purpose: los.pick(["pozyskowa", "aktualizacyjna"]),
        });
      }
      if (los.rnd() > 0.8) dodaj(osoba, dzien, 13, "zadanie", los.pick(TEMATY_ZADANIE), "zaplanowane");
      if (los.rnd() > 0.9) {
        dodaj(osoba, dzien, los.pick([11, 13]), "wydarzenie", los.pick(TEMATY_WYDARZENIE), "zaplanowane", { priority: "wysoki" });
      }
    }
  }

  return out;
}

/* ── cele i dzienne wyniki ────────────────────────────────── */

export function generujCele(agencyId: string, zespol: { id: string; celMiesieczny: number }[]) {
  return zespol.map((os) => ({
    agency_id: agencyId,
    agent_id: os.id,
    annual_income_pln: os.celMiesieczny * 12,
    avg_commission_pln: 9000,
    workdays_per_week: 5,
    calls_per_meeting: 12,
    meetings_per_listing: 3,
    listings_per_sale: 1.6,
  }));
}

/**
 * Dzienny dziennik wyników z ostatnich tygodni.
 *
 * Bez niego tracker celu i historia realizacji są puste, a to one pokazują,
 * że system żyje codziennie, a nie raz na kwartał.
 */
export function generujDziennik(los: Los, agencyId: string, agenci: string[], now: Date, dni = 42) {
  const out: Record<string, unknown>[] = [];
  for (const agentId of agenci) {
    for (let dzien = -dni; dzien <= 0; dzien++) {
      const data = przesun(now, dzien);
      if (data.getDay() === 0 || data.getDay() === 6) continue;

      const telefony = los.int(3, 14);
      out.push({
        agency_id: agencyId,
        agent_id: agentId,
        log_date: data.toISOString().slice(0, 10),
        cold_calls: telefony,
        meetings: los.rnd() > 0.55 ? los.int(1, 2) : 0,
        listings: los.rnd() > 0.82 ? 1 : 0,
        buyers: los.rnd() > 0.75 ? 1 : 0,
        sales: los.rnd() > 0.93 ? 1 : 0,
      });
    }
  }
  return out;
}

/* ── leady ────────────────────────────────────────────────── */

const KAMPANIE = [
  { campaign: "Mieszkania 2 pokoje", ad: "Karuzela, zdjęcia wnętrz", form: "Zostaw numer" },
  { campaign: "Sprzedaj mieszkanie", ad: "Wideo, opinia klienta", form: "Bezpłatna wycena" },
  { campaign: "Domy pod miastem", ad: "Zdjęcie ogrodu", form: "Umów oglądanie" },
  { campaign: "Najem długoterminowy", ad: "Reels, spacer po mieszkaniu", form: "Zapytaj o ofertę" },
];

const WIADOMOSCI_LEADA = [
  "Proszę o kontakt po 16, jestem w pracy.",
  "Szukam czegoś do 600 tysięcy, najlepiej z balkonem.",
  "Chcę sprzedać mieszkanie po babci, nie wiem od czego zacząć.",
  "Interesuje mnie wynajem od września.",
  "Czy ta oferta jest jeszcze aktualna?",
];

/**
 * Leady z Meta Ads i z formularza na stronie.
 *
 * Część zostaje bez opiekuna (pula biura), żeby na pokazie było widać,
 * po co jest przycisk przypisania agenta.
 */
export function generujLeady(los: Los, agencyId: string, agenci: string[], now: Date, ile = 18) {
  const out: Record<string, unknown>[] = [];
  for (let i = 0; i < ile; i++) {
    const k = los.pick(KAMPANIE);
    const zMety = los.rnd() < 0.7;
    const telefon = `6${los.int(10, 99)}${los.int(100, 999)}${los.int(100, 999)}`;
    const wPuli = los.rnd() < 0.3;
    out.push({
      agency_id: agencyId,
      agent_id: wPuli ? null : los.pick(agenci),
      name: `${los.pick(IMIONA)} ${los.pick(NAZWISKA)}`,
      phone: `+48 ${telefon.slice(0, 3)} ${telefon.slice(3, 6)} ${telefon.slice(6)}`,
      phone_digits: telefon,
      email: `lead${i}@przyklad.pl`,
      city: los.pick(DZIELNICE).nazwa,
      message: los.pick(WIADOMOSCI_LEADA),
      source: zMety ? "meta" : "strona",
      campaign: zMety ? k.campaign : null,
      ad_name: zMety ? k.ad : null,
      form_name: zMety ? k.form : null,
      platform: zMety ? los.pick(["facebook", "instagram"]) : null,
      submitted_at: przesun(now, -los.int(0, 21), los.int(8, 19)).toISOString(),
      status: wPuli ? "nowy" : los.pick(["nowy", "w_kontakcie", "w_kontakcie", "umowione", "odrzucony"]),
      notes: null,
    });
  }
  return out;
}

/* ── poszukiwania ─────────────────────────────────────────── */

/**
 * Zlecenia poszukiwania od kupujących. Dopasowania liczy sama aplikacja,
 * więc wystarczy, że kryteria trafiają w istniejące oferty.
 */
export function generujPoszukiwania(
  los: Los,
  agencyId: string,
  agenci: string[],
  klienci: { id: string }[],
  ile = 9,
) {
  const out: Record<string, unknown>[] = [];
  for (let i = 0; i < ile; i++) {
    const d = los.pick(DZIELNICE);
    const najem = los.rnd() < 0.25;
    const budzet = najem ? los.int(25, 60) * 100 : los.int(45, 120) * 10000;
    out.push({
      agency_id: agencyId,
      agent_id: los.pick(agenci),
      client_id: klienci[i % Math.max(1, klienci.length)]?.id ?? null,
      search_no: `P/${String(i + 1).padStart(3, "0")}`,
      title: `${najem ? "Najem" : "Kupno"}: ${los.int(2, 4)} pokoje, ${d.nazwa}`,
      deal_kind: najem ? "wynajem" : "sprzedaz",
      property_types: ["mieszkanie"],
      price_min: Math.round(budzet * 0.8),
      price_max: budzet,
      area_min: los.int(35, 50),
      area_max: los.int(60, 95),
      rooms_min: los.int(2, 3),
      rooms_max: los.int(3, 5),
      locations: [d.nazwa],
      status: los.pick(["aktualne", "aktualne", "aktualne", "wstrzymane"]),
      notes: los.pick(NOTATKI),
    });
  }
  return out;
}

/* ── faktury ──────────────────────────────────────────────── */

/** Faktury za pośrednictwo, wystawione do zamkniętych transakcji. */
export function generujFaktury(
  los: Los,
  agencyId: string,
  autor: string,
  transakcje: { commission_pln: number; title: string }[],
  now: Date,
  ile = 6,
) {
  const out: Record<string, unknown>[] = [];
  for (let i = 0; i < Math.min(ile, transakcje.length); i++) {
    const t = transakcje[i];
    const wystawiona = przesun(now, -los.int(5, 70));
    const data = (d: Date) => d.toISOString().slice(0, 10);
    out.push({
      agency_id: agencyId,
      created_by: autor,
      number: `${i + 1}/${wystawiona.getUTCMonth() + 1}/${wystawiona.getUTCFullYear()}`,
      seller_key: "firma",
      buyer_name: `${los.pick(IMIONA)} ${los.pick(NAZWISKA)}`,
      buyer_address: `ul. ${los.pick(["Polna", "Ogrodowa", "Lipowa", "Słoneczna"])} ${los.int(1, 60)}`,
      buyer_city: los.pick(DZIELNICE).nazwa,
      buyer_postcode: `${los.int(10, 89)}-${los.int(100, 999)}`,
      place: "",
      issue_date: data(wystawiona),
      sale_date: data(wystawiona),
      payment_date: data(przesun(wystawiona, 14)),
      payment_method: "Przelew",
      items: [{ name: "Pośrednictwo w obrocie nieruchomościami", qty: 1, unitPrice: t.commission_pln }],
      total_pln: t.commission_pln,
      paid_pln: los.rnd() < 0.7 ? t.commission_pln : 0,
      // Na fakturze nie ma po co powtarzać opisu mieszkania z transakcji:
      // „3 pok., 70 m², Bronowice" w uwagach wygląda jak pomyłka.
      description: null,
    });
  }
  return out;
}
