import { cache } from "react";
import { createSupabaseAdmin } from "./supabase/admin";
import { getAgencySettings } from "./agency-settings";
import { maModul, type Modul } from "./role";
import { stanDostepu } from "./abonament-cennik";
import type { ProfileWithAgency } from "./types";

/**
 * Przewodnik „od czego zacząć” dla nowego biura.
 *
 * Każdy krok sam sprawdza, czy jest zrobiony, więc lista nie wymaga od
 * nikogo odhaczania. Dzięki temu nie da się jej oszukać ani zostawić
 * nieaktualnej, gdy ktoś zrobi coś z innego ekranu.
 */

export type KrokPrzewodnika = {
  id: string;
  tytul: string;
  /** Po co to robić. Jedno zdanie, językiem biura, nie systemu. */
  po_co: string;
  /** Co dokładnie kliknąć. */
  jak: string;
  href: string;
  cta: string;
  zrobiony: boolean;
  /** Bez tego reszta nie ma sensu, więc pokazujemy jako wymagany. */
  wymagany: boolean;
};

export type SekcjaPrzewodnika = {
  tytul: string;
  opis: string;
  kroki: KrokPrzewodnika[];
};

export type Przewodnik = {
  sekcje: SekcjaPrzewodnika[];
  zrobione: number;
  wszystkich: number;
  /** Czy całość jest domknięta i można schować baner z pulpitu. */
  ukonczony: boolean;
};

async function ile(tabela: string, agencyId: string): Promise<number> {
  const admin = createSupabaseAdmin();
  const { count, error } = await admin
    .from(tabela)
    .select("id", { count: "exact", head: true })
    .eq("agency_id", agencyId);
  return error ? 0 : (count ?? 0);
}

/**
 * Przewodnik liczy kilkanaście zapytań, a w jednym renderze pyta o niego
 * i layout (menu), i pulpit (baner). Cache per żądanie robi z tego jedno
 * zapytanie zamiast dwóch kompletów.
 */
export const getPrzewodnik = cache(async function getPrzewodnik(
  user: ProfileWithAgency,
): Promise<Przewodnik> {
  const agencyId = user.agency_id;
  const osoba = { id: user.id, role: user.role, permissions: user.permissions };
  const ma = (m: Modul) => maModul(osoba, m);
  const czyCeo = user.role === "owner";

  if (!agencyId) {
    return { sekcje: [], zrobione: 0, wszystkich: 0, ukonczony: true };
  }

  const ustawienia = await getAgencySettings(agencyId, user.agency?.name);
  const [ofert, klientow, osob, transakcji] = await Promise.all([
    ile("properties", agencyId),
    ile("clients", agencyId),
    ile("profiles", agencyId),
    ile("deals", agencyId),
  ]);

  const admin = createSupabaseAdmin();
  const { count: sesji } = await admin
    .from("training_sessions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);
  const { data: cel } = await admin
    .from("goals")
    .select("id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  const c = ustawienia.company;
  const dostep = stanDostepu(user.agency ?? null);

  const sekcje: SekcjaPrzewodnika[] = [];

  if (czyCeo) {
    sekcje.push({
      tytul: "1. Ustaw biuro",
      opis: "Zrób to raz, a wszystkie dokumenty, oferty i strona będą od razu z Waszymi danymi.",
      kroki: [
        {
          id: "firma",
          tytul: "Wpisz dane firmy",
          po_co: "Te dane wchodzą na umowy rezerwacyjne, protokoły, aneksy i faktury. Bez nich dokumenty wyjdą puste.",
          jak: "Ustawienia → Dane firmy. Uzupełnij nazwę, adres i NIP.",
          href: "/app/ustawienia/firma",
          cta: "Uzupełnij dane",
          zrobiony: Boolean(c.name && c.nip && c.city),
          wymagany: true,
        },
        {
          id: "logo",
          tytul: "Wgraj logo",
          po_co: "Logo trafia na ofertówkę, kalkulatory i dokumenty, które wysyłacie klientom.",
          jak: "Ustawienia → Dane firmy, kafelek „Logo firmy” po prawej.",
          href: "/app/ustawienia/firma",
          cta: "Wgraj logo",
          zrobiony: Boolean(ustawienia.logo_path),
          wymagany: false,
        },
        {
          id: "sprzedawcy",
          tytul: "Dodaj sprzedawcę na fakturach",
          po_co: "Bez numeru rachunku faktura wyjdzie bez danych do przelewu.",
          jak: "Ustawienia → Dane firmy, na dole „Sprzedawcy na fakturach”.",
          href: "/app/ustawienia/firma",
          cta: "Dodaj sprzedawcę",
          zrobiony: ustawienia.sellers.some((s) => s.name && s.account),
          wymagany: false,
        },
        {
          id: "znak-wodny",
          tytul: "Ustaw znak wodny na zdjęcia",
          po_co: "Zdjęcia ofert krążą po portalach. Znak wodny pilnuje, żeby wracały do Was.",
          jak: "Ustawienia → Znak wodny i stemple.",
          href: "/app/ustawienia/znak-wodny",
          cta: "Ustaw znak wodny",
          zrobiony: Boolean(ustawienia.watermark.path),
          wymagany: false,
        },
      ],
    });

    sekcje.push({
      tytul: "2. Wpuść zespół",
      opis: "Każdy pracuje na swoim koncie, więc widać, kto co zrobił, i nikt nie traci dostępu przy zmianie hasła.",
      kroki: [
        {
          id: "zespol",
          tytul: "Zaproś ludzi",
          po_co: "Wspólna baza ma sens dopiero wtedy, gdy wszyscy w niej pracują.",
          jak: "Zespół → Zaproś osobę. Wpisz e-mail, przyjdzie link z zaproszeniem.",
          href: "/app/zespol",
          cta: "Zaproś zespół",
          zrobiony: osob > 1,
          wymagany: true,
        },
        {
          id: "role",
          tytul: "Ustaw role i dostępy",
          po_co: "Księgowa nie musi widzieć bazy klientów, a stażysta prowizji. Role ustawiasz raz, na karcie osoby.",
          jak: "Zespół → kliknij osobę → sekcja „Rola i dostęp”.",
          href: "/app/zespol",
          cta: "Ustaw role",
          zrobiony: osob > 1,
          wymagany: false,
        },
      ],
    });
  }

  const kroki_praca: KrokPrzewodnika[] = [];
  if (ma("nieruchomosci")) {
    kroki_praca.push({
      id: "oferta",
      tytul: "Dodaj pierwszą ofertę",
      po_co: "Od oferty zaczyna się reszta: ofertówka, analiza cenowa, dopasowania do poszukiwań.",
      jak: "Nieruchomości → Dodaj nieruchomość. Kreator poprowadzi przez pola.",
      href: "/app/nieruchomosci",
      cta: "Dodaj ofertę",
      zrobiony: ofert > 0,
      wymagany: true,
    });
  }
  if (ma("klienci")) {
    kroki_praca.push({
      id: "klient",
      tytul: "Dodaj pierwszego klienta",
      po_co: "Notatki i terminy kontaktu w jednym miejscu. Nikt nie wypada z obiegu, bo zginął w telefonie.",
      jak: "Klienci → Dodaj klienta.",
      href: "/app/klienci",
      cta: "Dodaj klienta",
      zrobiony: klientow > 0,
      wymagany: true,
    });
  }
  if (ma("prowizje")) {
    kroki_praca.push({
      id: "transakcja",
      tytul: "Zapisz pierwszą transakcję",
      po_co: "Stąd biorą się prowizje, cele i raporty. Bez transakcji panel właściciela jest pusty.",
      jak: "Prowizje → Dodaj transakcję.",
      href: "/app/prowizje",
      cta: "Dodaj transakcję",
      zrobiony: transakcji > 0,
      wymagany: false,
    });
  }
  if (kroki_praca.length) {
    sekcje.push({
      tytul: czyCeo ? "3. Wprowadź dane" : "1. Zacznij pracę",
      opis: "Najszybciej przekonacie się, czy system pasuje, na prawdziwej ofercie i prawdziwym kliencie.",
      kroki: kroki_praca,
    });
  }

  const kroki_rozwoj: KrokPrzewodnika[] = [];
  if (ma("coach")) {
    kroki_rozwoj.push({
      id: "cel",
      tytul: "Ustaw swój cel na miesiąc",
      po_co: "System rozbije go na telefony, spotkania i umowy, i pokaże, ile zostało na dziś.",
      jak: "Cele → wpisz kwotę, którą chcesz zarobić.",
      href: "/app/cele",
      cta: "Ustaw cel",
      zrobiony: Boolean(cel),
      wymagany: false,
    });
    kroki_rozwoj.push({
      id: "coach",
      tytul: "Zrób pierwszą sesję AI Coach",
      po_co: "Trening rozmowy bez palenia prawdziwego leada. Zacznij od klienta życzliwego.",
      jak: "AI Coach → wybierz scenariusz → poziom łatwy.",
      href: "/app/trening",
      cta: "Trenuj",
      zrobiony: (sesji ?? 0) > 0,
      wymagany: false,
    });
  }
  if (kroki_rozwoj.length) {
    sekcje.push({
      tytul: czyCeo ? "4. Rozwijaj zespół" : "2. Rozwijaj się",
      opis: "To część, której nie ma żaden inny system dla biur nieruchomości.",
      kroki: kroki_rozwoj,
    });
  }

  if (czyCeo && dostep.probny) {
    sekcje.push({
      tytul: "5. Zostańcie na dłużej",
      opis: "Okres próbny trwa 7 dni. Dane zostają w całości niezależnie od decyzji.",
      kroki: [
        {
          id: "abonament",
          tytul: "Wybierz pakiet",
          po_co: "Po okresie próbnym dostęp się wstrzymuje, a zespół zostaje bez systemu w środku dnia.",
          jak: "Abonament → wybierz okres rozliczeniowy i pakiet.",
          href: "/abonament",
          cta: "Zobacz pakiety",
          zrobiony: false,
          wymagany: false,
        },
      ],
    });
  }

  const wszystkie = sekcje.flatMap((s) => s.kroki);
  const zrobione = wszystkie.filter((k) => k.zrobiony).length;

  return {
    sekcje,
    zrobione,
    wszystkich: wszystkie.length,
    // Baner znika, gdy domknięte są kroki wymagane: reszta to dodatki,
    // które nie powinny wiecznie straszyć na pulpicie.
    ukonczony: wszystkie.filter((k) => k.wymagany).every((k) => k.zrobiony),
  };
});
