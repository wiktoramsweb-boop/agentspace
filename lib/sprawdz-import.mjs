/**
 * Test importu danych z cudzych plików (`npm run test:import`).
 *
 * To jest kod, który dostaje nieznany plik i zapisuje z niego setki rekordów
 * do bazy biura. Pomyłka tutaj jest cicha: telefon ląduje w notatce i nikt
 * tego nie zauważy aż do pierwszego telefonu do klienta.
 */
import { czytajCsv, czytajCsvZNaglowkami, wykryjSeparator } from "./csv.ts";
import {
  POLA_KLIENTA,
  POLA_NIERUCHOMOSCI,
  kluczTelefonu,
  liczba,
  uprosc,
  zaproponujMapowanie,
  typKlienta,
  statusOferty,
  linkiZdjec,
  dopasujOsobe,
} from "./import-mapowanie.ts";

let bledy = 0;
function sprawdz(opis, otrzymano, oczekiwano) {
  const a = JSON.stringify(otrzymano);
  const b = JSON.stringify(oczekiwano);
  if (a !== b) {
    console.error(`BŁĄD: ${opis}\n  otrzymano:  ${a}\n  oczekiwano: ${b}`);
    bledy++;
  }
}

/* ── Separator ── */
sprawdz("polski Excel daje średnik", wykryjSeparator("imie;telefon;email"), ";");
sprawdz("przecinek gdy nie ma średnika", wykryjSeparator("name,phone,email"), ",");
sprawdz("tabulator", wykryjSeparator("a\tb\tc"), "\t");
sprawdz(
  "przecinek w cudzysłowie nie liczy się jako separator",
  wykryjSeparator('"Kowalski, Jan";telefon'),
  ";",
);

/* ── Czytanie ── */
sprawdz("prosty plik", czytajCsv("a;b\n1;2"), [["a", "b"], ["1", "2"]]);
sprawdz(
  "separator w cudzysłowie zostaje w polu",
  czytajCsv('imie;notatka\nJan;"dzwonił, prosi o kontakt"'),
  [["imie", "notatka"], ["Jan", "dzwonił, prosi o kontakt"]],
);
sprawdz(
  "podwojony cudzysłów to jeden znak",
  czytajCsv('opis\n"mieszkanie ""jak nowe"""'),
  [["opis"], ['mieszkanie "jak nowe"']],
);
sprawdz(
  "koniec linii w cudzysłowie nie dzieli wiersza",
  czytajCsv('imie;notatka\nJan;"pierwszy akapit\ndrugi akapit"'),
  [["imie", "notatka"], ["Jan", "pierwszy akapit\ndrugi akapit"]],
);
sprawdz("BOM z Excela nie wchodzi do nagłówka", czytajCsv("﻿imie;telefon")[0][0], "imie");
sprawdz("puste linie na końcu pomijamy", czytajCsv("a;b\n1;2\n\n\n").length, 2);
sprawdz(
  "wiersz krótszy niż nagłówki uzupełnia się pustymi",
  czytajCsvZNaglowkami("imie;telefon;email\nJan;500100200").wiersze[0],
  { imie: "Jan", telefon: "500100200", email: "" },
);

/* ── Dopasowanie kolumn ── */
sprawdz("nagłówek bez ogonków i wielkości liter", uprosc("Nr Telefonu"), "nr telefonu");
sprawdz("jednostka z potęgą", uprosc("Powierzchnia (m²)"), "powierzchnia m2");

const klient = zaproponujMapowanie(
  ["Imię i nazwisko", "Nr telefonu", "Adres e-mail", "Uwagi"],
  POLA_KLIENTA,
);
sprawdz("imię rozpoznane", klient.name, "Imię i nazwisko");
sprawdz("telefon rozpoznany", klient.phone, "Nr telefonu");
sprawdz("e-mail rozpoznany", klient.email, "Adres e-mail");
sprawdz("uwagi trafiają do notatek", klient.notes, "Uwagi");
/* To jest dokładnie ta pułapka, przez którą dopasowanie musi iść dwuetapowo:
   „Adres e-mail" zawiera słowo „adres" i bez etapu dokładnego trafiłby
   do pola Adres zamiast do E-maila. */
sprawdz("adres e-mail nie zabiera pola Adres", klient.address, undefined);

const oferta = zaproponujMapowanie(
  ["Nazwa oferty", "Miasto", "Cena ofertowa", "Powierzchnia", "Liczba pokoi"],
  POLA_NIERUCHOMOSCI,
);
sprawdz("nazwa oferty", oferta.title, "Nazwa oferty");
sprawdz("cena", oferta.price_pln, "Cena ofertowa");
sprawdz("powierzchnia", oferta.area_m2, "Powierzchnia");
sprawdz("pokoje", oferta.rooms, "Liczba pokoi");
sprawdz("jedna kolumna nie trafia do dwóch pól", new Set(Object.values(oferta)).size, Object.values(oferta).length);

/* ── Liczby z cudzego pliku ── */
sprawdz("spacje i waluta", liczba("1 250 000 zł"), 1250000);
sprawdz("przecinek dziesiętny", liczba("65,5 m²"), 65.5);
sprawdz("kropka jako separator tysięcy", liczba("1.250.000"), 1250000);
sprawdz("kropka dziesiętna", liczba("65.5"), 65.5);
sprawdz("skrót tysięcy", liczba("890 tys."), 890000);
sprawdz("skrót milionów", liczba("1,1 mln"), 1100000);
sprawdz("puste pole to brak liczby", liczba(""), null);
sprawdz("tekst bez liczby", liczba("do uzgodnienia"), null);

/* ── Duplikaty po telefonie ── */
sprawdz("kierunkowy nie robi drugiego klienta", kluczTelefonu("+48 500 100 200"), "500100200");
sprawdz("spacje i myślniki", kluczTelefonu("500-100-200"), "500100200");
sprawdz("ten sam numer w dwóch zapisach", kluczTelefonu("48500100200"), kluczTelefonu("500 100 200"));

/* ── Słowniki z innych systemów ── */
sprawdz("typ: sprzedający z ogonkami", typKlienta("Sprzedający"), "sprzedajacy");
sprawdz("typ: kupno", typKlienta("kupno"), "kupujacy");
sprawdz("typ: najemca przed wynajmującym", typKlienta("Najemca"), "najemca");
sprawdz("typ: wynajem", typKlienta("Wynajem"), "wynajmujacy");
sprawdz("typ: nieznany", typKlienta("VIP"), "inny");
sprawdz("status: brak kolumny = wybór z kreatora", statusOferty("", "aktywna"), "aktywna");
sprawdz("status: rezerwacja", statusOferty("Zarezerwowana", "archiwum"), "zarezerwowana");
sprawdz("status: sprzedana", statusOferty("SPRZEDANA", "aktywna"), "sfinalizowana");
sprawdz("status: wycofana", statusOferty("wycofana z rynku", "aktywna"), "archiwum");
sprawdz("status: aktywna", statusOferty("Aktywna", "archiwum"), "aktywna");
sprawdz("zdjęcia: kilka separatorów", linkiZdjec("https://a.pl/1.jpg; https://a.pl/2.jpg|http://b.pl/3.png\nhttps://a.pl/1.jpg"), ["https://a.pl/1.jpg", "https://a.pl/2.jpg", "http://b.pl/3.png"]);
sprawdz("zdjęcia: bez śmieci i ftp", linkiZdjec("brak, ftp://x/1.jpg, zdjecie.jpg"), []);
const osoby = [{ id: "1", email: "adam@biuro.pl", full_name: "Adam Wróbel" }, { id: "2", email: null, full_name: "Zofia Malinowska" }];
sprawdz("opiekun po mailu", dopasujOsobe("ADAM@biuro.pl", osoby), "1");
sprawdz("opiekun po nazwisku i imieniu w odwrotnej kolejności", dopasujOsobe("Malinowska Zofia", osoby), "2");
sprawdz("opiekun bez ogonków", dopasujOsobe("adam wrobel", osoby), "1");
sprawdz("nieznany opiekun", dopasujOsobe("Jan Nowak", osoby), null);

if (bledy > 0) {
  console.error(`\n${bledy} błędów w imporcie.`);
  process.exit(1);
}
console.log("Import w porządku (separatory, cudzysłowy, BOM, dopasowanie kolumn, liczby, duplikaty).");
