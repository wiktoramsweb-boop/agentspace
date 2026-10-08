/**
 * Test warstwy, która przycina dane do widoku klienta.
 *
 * To jest jedyne miejsce w projekcie, w którym błąd oznacza pokazanie
 * cudzego numeru telefonu osobie trzeciej. Dlatego sprawdzamy wprost,
 * że treść wpisana przez agenta NIE pojawia się w niczym, co wychodzi
 * do klienta.
 */
import {
  nowyToken,
  poprawnyToken,
  stanDostepu,
  zdarzenieDlaKlienta,
  osCzasuDlaKlienta,
  podsumowanieDlaKlienta,
  powiadomienieOPrezentacji,
  siatkaMiesiaca,
  sasiedniMiesiac,
  dniWMiesiacu,
  opisPropozycjiCeny,
} from "./portal-klienta.ts";

let bledy = 0;
function sprawdz(opis, otrzymano, oczekiwano) {
  const a = JSON.stringify(otrzymano);
  const b = JSON.stringify(oczekiwano);
  if (a !== b) {
    console.error(`BŁĄD: ${opis}\n  otrzymano:  ${a}\n  oczekiwano: ${b}`);
    bledy++;
  }
}
function prawda(opis, warunek) {
  if (!warunek) {
    console.error(`BŁĄD: ${opis}`);
    bledy++;
  }
}

/* ── 1. Token ── */
const t = nowyToken(() => 0.5);
prawda("token ma 22 znaki", t.length === 22);
prawda("token przechodzi walidację", poprawnyToken(t));
prawda("token nie zawiera mylących znaków", !/[01loi]/.test(t));
prawda("pusty token odrzucony", !poprawnyToken(""));
prawda("token z wielką literą odrzucony", !poprawnyToken("ABCDEFGHIJKLMNOP"));
prawda("za krótki odrzucony", !poprawnyToken("abc"));

/* ── 2. Ważność dostępu ── */
const DZIS = "2026-10-08";
sprawdz("brak dostępu", stanDostepu(null, DZIS), { aktywny: false, powod: "brak" });
sprawdz(
  "odwołany",
  stanDostepu({ revoked_at: "2026-10-01T10:00:00Z", expires_at: "2027-01-01" }, DZIS),
  { aktywny: false, powod: "odwolany" },
);
sprawdz("wygasły", stanDostepu({ expires_at: "2026-10-07" }, DZIS), {
  aktywny: false,
  powod: "wygasl",
});
sprawdz("w dniu wygaśnięcia jeszcze działa", stanDostepu({ expires_at: DZIS }, DZIS), {
  aktywny: true,
});
sprawdz("bez daty końca działa", stanDostepu({}, DZIS), { aktywny: true });

/* ── 3. NAJWAŻNIEJSZE: treść agenta nie wychodzi do klienta ── */
const TAJNE = "Prezka mazowiecka, Bogdan 792 847 892";
const zdarzenie = {
  id: "a1",
  kind: "spotkanie",
  subject: TAJNE,
  client_note: "Prezentacja dla zainteresowanego",
  client_visible: true,
  status: "zaplanowane",
  due_at: "2026-10-09T17:30:00Z",
};
const widok = zdarzenieDlaKlienta(zdarzenie);
prawda("zdarzenie jest widoczne", widok !== null);
prawda(
  "treść agenta NIE pojawia się nigdzie w widoku klienta",
  !JSON.stringify(widok).includes("Bogdan") && !JSON.stringify(widok).includes("792"),
);
sprawdz("tytuł jest neutralny", widok.tytul, "Prezentacja nieruchomości");
sprawdz("opis bierze się z pola dla klienta", widok.opis, "Prezentacja dla zainteresowanego");

// Bez pola dla klienta opis zostaje pusty, a NIE podstawia się subject.
const bezNotatki = zdarzenieDlaKlienta({ ...zdarzenie, client_note: null });
sprawdz("brak notatki nie podstawia treści agenta", bezNotatki.opis, null);
prawda(
  "nadal nic z treści agenta",
  !JSON.stringify(bezNotatki).includes("Bogdan"),
);

/* ── 4. Domyślnie nic nie jest widoczne ── */
sprawdz("niezatwierdzone jest ukryte", zdarzenieDlaKlienta({ ...zdarzenie, client_visible: false }), null);
sprawdz("brak flagi = ukryte", zdarzenieDlaKlienta({ id: "x", kind: "spotkanie" }), null);
sprawdz(
  "anulowane jest ukryte mimo zatwierdzenia",
  zdarzenieDlaKlienta({ ...zdarzenie, status: "anulowane" }),
  null,
);

/* ── 5. Oś czasu ── */
const lista = [
  { ...zdarzenie, id: "a", due_at: "2026-10-05T10:00:00Z" },
  { ...zdarzenie, id: "b", due_at: "2026-10-09T17:30:00Z" },
  { ...zdarzenie, id: "c", client_visible: false },
  { id: "d", kind: "polaczenie", subject: TAJNE, client_visible: true, due_at: "2026-10-07T09:00:00Z" },
];
const os = osCzasuDlaKlienta(lista);
sprawdz("na osi tylko zatwierdzone", os.map((z) => z.id), ["b", "d", "a"]);
prawda("oś czasu nie przecieka", !JSON.stringify(os).includes("Bogdan"));
sprawdz("telefon ma własną nazwę", os.find((z) => z.id === "d").tytul, "Kontakt z zainteresowanym");

/* ── 6. Podsumowanie liczy też niezatwierdzone ── */
const p = podsumowanieDlaKlienta(lista, DZIS, "2026-10-05");
sprawdz("liczba prezentacji", p.prezentacje, 3);
sprawdz("prezentacje w tym tygodniu", p.prezentacjeWTymTygodniu, 3);
sprawdz("kontakty", p.kontakty, 1);
sprawdz("najbliższa prezentacja", p.najblizszaPrezentacja, "2026-10-09T17:30:00Z");

const pustе = podsumowanieDlaKlienta([], DZIS, "2026-10-05");
sprawdz("puste podsumowanie", pustе, {
  prezentacje: 0,
  prezentacjeWTymTygodniu: 0,
  kontakty: 0,
  najblizszaPrezentacja: null,
});

/* ── 7. Powiadomienie ── */
const pow = powiadomienieOPrezentacji("Mieszkanie, ul. Mazowiecka", "17:30");
sprawdz("tytuł powiadomienia", pow.tytul, "Dziś prezentacja");
prawda("powiadomienie bez danych osobowych", !/Bogdan|792/.test(JSON.stringify(pow)));

/* ── 8. Tytuł po celu działania ── */
const zCelem = zdarzenieDlaKlienta({
  id: "c1",
  kind: "spotkanie",
  purpose: "sesja_foto",
  subject: TAJNE,
  client_note: null,
  client_visible: true,
  status: "wykonane",
  due_at: "2026-10-08T14:00:00Z",
});
sprawdz("cel ze słownika daje nazwę dla klienta", zCelem?.tytul, "Sesja zdjęciowa");
prawda("cel nie przepuszcza treści agenta", !JSON.stringify(zCelem).includes("Bogdan"));

const celSpozaListy = zdarzenieDlaKlienta({
  id: "c2",
  kind: "spotkanie",
  // Cel wewnętrzny biura - klient ma zobaczyć neutralną nazwę rodzaju.
  purpose: "rozmowa_pozyskowa",
  client_visible: true,
  status: "zaplanowane",
  due_at: "2026-10-09T10:00:00Z",
});
sprawdz("cel spoza białej listy spada na nazwę rodzaju", celSpozaListy?.tytul, "Prezentacja nieruchomości");

/* ── 9. Siatka kalendarza ── */
sprawdz("październik 2026 ma 31 dni", dniWMiesiacu(2026, 10), 31);
sprawdz("luty 2024 ma 29 dni", dniWMiesiacu(2024, 2), 29);
sprawdz("luty 2026 ma 28 dni", dniWMiesiacu(2026, 2), 28);

const siatka = siatkaMiesiaca(2026, 10, { "2026-10-08": 2 }, "2026-10-08");
prawda("siatka ma pełne tygodnie", siatka.length % 7 === 0);
prawda("siatka zaczyna się od poniedziałku", new Date(`${siatka[0].klucz}T12:00:00`).getDay() === 1);
sprawdz("liczba dni miesiąca w siatce", siatka.filter((d) => d.wTymMiesiacu).length, 31);
const osmy = siatka.find((d) => d.klucz === "2026-10-08");
sprawdz("dzień z wpisami ma licznik", osmy?.ile, 2);
prawda("dzisiaj oznaczone", osmy?.dzisiaj === true);
prawda("dni spoza miesiąca oznaczone", siatka.some((d) => !d.wTymMiesiacu));

sprawdz("miesiąc wstecz przez próg roku", sasiedniMiesiac(2026, 1, -1), { rok: 2025, miesiac: 12 });
sprawdz("miesiąc naprzód przez próg roku", sasiedniMiesiac(2026, 12, 1), { rok: 2027, miesiac: 1 });

/* ── 10. Propozycja ceny ── */
sprawdz("obniżka o 5 procent", opisPropozycjiCeny(1000000, 950000), {
  kierunek: "obnizka",
  roznica: 50000,
  procent: 5,
});
sprawdz("podwyżka rozpoznana", opisPropozycjiCeny(500000, 530000).kierunek, "podwyzka");
sprawdz("brak ceny wyjściowej nie wywraca liczenia", opisPropozycjiCeny(null, 300000).procent, null);

if (bledy > 0) {
  console.error(`\n${bledy} błędów w portalu klienta.`);
  process.exit(1);
}
console.log(
  "Portal klienta: wszystkie przypadki przechodzą (token, ważność dostępu, brak wycieku treści agenta, oś czasu, podsumowanie, kalendarz, propozycja ceny).",
);
