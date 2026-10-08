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

if (bledy > 0) {
  console.error(`\n${bledy} błędów w portalu klienta.`);
  process.exit(1);
}
console.log(
  "Portal klienta: wszystkie przypadki przechodzą (token, ważność dostępu, brak wycieku treści agenta, oś czasu, podsumowanie).",
);
