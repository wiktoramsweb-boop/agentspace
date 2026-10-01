/**
 * Kontrola wczytywania leadów: `npm run test:leady`.
 *
 * Sprawdzamy na plikach w trzech kształtach, w jakich faktycznie przychodzą:
 * eksport z Meta po angielsku, polski eksport ze średnikiem oraz plik
 * z tabulatorem i UTF-16, który Business Suite potrafi oddać jako „CSV".
 */
import {
  cyfryTelefonu, dopasujKolumny, odczytajTekst, parsujCsv,
  wierszeNaLeady, zgadnijSeparator,
} from "./leady-import.ts";
import { arkuszNaWiersze, parsujArkuszXml } from "./xlsx-czytnik.ts";

const bledy: string[] = [];
function sprawdz(nazwa: string, warunek: boolean, szczegol = "") {
  if (!warunek) bledy.push(`${nazwa}${szczegol ? ": " + szczegol : ""}`);
}

// ── 1. Eksport z Meta, przecinki, angielskie nagłówki ──────────────────
const meta = [
  'id,created_time,ad_name,campaign_name,form_name,platform,full_name,phone_number,email',
  '"l_8812","1758794580","Mieszkania Kraków - wideo","Pozysk Q3","Wycena mieszkania","fb","Anna Nowak","+48 530 313 220","anna@example.com"',
  '"l_8813","1758880980","Mieszkania Kraków - karuzela","Pozysk Q3","Wycena mieszkania","ig","Marek Lis","666 951 570","marek@example.com"',
].join("\n");
{
  const w = parsujCsv(meta);
  const m = dopasujKolumny(Object.keys(w[0]));
  const leady = wierszeNaLeady(w, m);
  sprawdz("Meta: dwa wiersze", leady.length === 2, String(leady.length));
  sprawdz("Meta: nazwisko", leady[0].name === "Anna Nowak", String(leady[0].name));
  sprawdz("Meta: telefon", leady[0].phone === "+48 530 313 220", String(leady[0].phone));
  sprawdz("Meta: kampania", leady[0].campaign === "Pozysk Q3", String(leady[0].campaign));
  sprawdz("Meta: czas uniksowy na date", (leady[0].submitted_at ?? "").startsWith("2025-"), String(leady[0].submitted_at));
  sprawdz("Meta: id zewnetrzne", leady[0].external_id === "l_8812", String(leady[0].external_id));
}

// ── 2. Polski eksport ze średnikiem ────────────────────────────────────
const polski = [
  "Imię i nazwisko;Numer telefonu;Adres e-mail;Miasto;Wiadomość;Data utworzenia",
  "Jan Kowalski;530-313-220;jan@example.com;Kraków;Proszę o wycenę mieszkania;25.09.2026 12:43",
  "Ewa Bąk;+48 601 950 652;ewa@example.com;Wieliczka;;01.09.2026 21:08",
].join("\n");
{
  sprawdz("Polski: separator", zgadnijSeparator(polski) === ";", zgadnijSeparator(polski));
  const w = parsujCsv(polski);
  const m = dopasujKolumny(Object.keys(w[0]));
  const leady = wierszeNaLeady(w, m);
  sprawdz("Polski: dwa wiersze", leady.length === 2, String(leady.length));
  sprawdz("Polski: ogonki w nagłówku", leady[0].name === "Jan Kowalski", String(leady[0].name));
  sprawdz("Polski: miasto", leady[0].city === "Kraków", String(leady[0].city));
  sprawdz("Polski: wiadomość", (leady[0].message ?? "").includes("wycenę"), String(leady[0].message));
  sprawdz("Polski: data dd.mm.rrrr", (leady[0].submitted_at ?? "").startsWith("2026-09-25"), String(leady[0].submitted_at));
}

// ── 3. Tabulatory i UTF-16 ─────────────────────────────────────────────
{
  const tsv = "full_name\tphone_number\temail\nZofia Mak\t734796325\tzofia@example.com\n";
  const bajty = new Uint8Array(2 + tsv.length * 2);
  bajty[0] = 0xff;
  bajty[1] = 0xfe;
  for (let i = 0; i < tsv.length; i++) {
    const k = tsv.charCodeAt(i);
    bajty[2 + i * 2] = k & 0xff;
    bajty[3 + i * 2] = k >> 8;
  }
  const tekst = odczytajTekst(bajty.buffer);
  sprawdz("UTF-16: odczyt", tekst.startsWith("full_name"), tekst.slice(0, 20));
  sprawdz("UTF-16: separator", zgadnijSeparator(tekst) === "\t");
  const leady = wierszeNaLeady(parsujCsv(tekst), dopasujKolumny(["full_name", "phone_number", "email"]));
  sprawdz("UTF-16: lead", leady[0]?.name === "Zofia Mak", String(leady[0]?.name));
}

// ── 4. Odsiewanie i numery ─────────────────────────────────────────────
{
  const bezKontaktu = parsujCsv("Imię;Telefon;Email\nKtoś;;\nInny;530313220;");
  const leady = wierszeNaLeady(bezKontaktu, dopasujKolumny(["Imię", "Telefon", "Email"]));
  sprawdz("Bez telefonu i maila odpada", leady.length === 1, String(leady.length));
  sprawdz("Numer do porównań", cyfryTelefonu("+48 530 313 220") === "530313220", String(cyfryTelefonu("+48 530 313 220")));
  sprawdz("Ten sam numer inaczej zapisany", cyfryTelefonu("530-313-220") === cyfryTelefonu("+48 530 313 220"));
  sprawdz("Za krótki numer odpada", cyfryTelefonu("12345") === null);
}

// ── 5. Cudzysłowy i przecinek w wartości ───────────────────────────────
{
  const w = parsujCsv('Imię,Telefon,Wiadomość\n"Nowak, Anna",530313220,"Mieszkanie 2 pok., Kraków"');
  const leady = wierszeNaLeady(w, dopasujKolumny(["Imię", "Telefon", "Wiadomość"]));
  sprawdz("Przecinek w cudzysłowie", leady[0]?.name === "Nowak, Anna", String(leady[0]?.name));
  sprawdz("Przecinek w wiadomości", leady[0]?.message === "Mieszkanie 2 pok., Kraków", String(leady[0]?.message));
}

// ── 6. Arkusz Excela ───────────────────────────────────────────────────
{
  const wspolne = ["Imię i nazwisko", "Numer telefonu", "Miasto", "Anna Nowak", "530313220", "Kraków", "Ewa Bąk", "Zabierzów"];
  // Druga osoba nie podała telefonu: Excel zapisuje taką komórkę jako <c r="B3"/>.
  const xml =
    '<sheetData>' +
    '<row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c><c r="C1" t="s"><v>2</v></c></row>' +
    '<row r="2"><c r="A2" t="s"><v>3</v></c><c r="B2" t="s"><v>4</v></c><c r="C2" t="s"><v>5</v></c></row>' +
    '<row r="3"><c r="A3" t="s"><v>6</v></c><c r="B3"/><c r="C3" t="s"><v>7</v></c></row>' +
    '<row r="4"><c r="A4" t="inlineStr"><is><t>Jan Test</t></is></c><c r="B4"><v>601950652</v></c><c r="C4" t="s"><v>5</v></c></row>' +
    '</sheetData>';
  const w = parsujArkuszXml(xml, wspolne);
  sprawdz("Excel: cztery wiersze", w.length === 4, String(w.length));
  sprawdz("Excel: pusta komórka nie rozjeżdża kolumn", w[2][2] === "Zabierzów", JSON.stringify(w[2]));
  sprawdz("Excel: pusty telefon zostaje pusty", w[2][1] === "", JSON.stringify(w[2][1]));
  sprawdz("Excel: tekst w komórce", w[3][0] === "Jan Test", String(w[3][0]));

  const obiekty = arkuszNaWiersze(w);
  const leady = wierszeNaLeady(obiekty, dopasujKolumny(Object.keys(obiekty[0])));
  sprawdz("Excel: bez telefonu odpada", leady.length === 2, String(leady.length));
  sprawdz("Excel: miasto trafia na miejsce", leady[0].city === "Kraków", String(leady[0].city));
}

// ── 7. Data z Excela (liczba dni od 1899) ──────────────────────────────
{
  const w = parsujCsv("Telefon;Data utworzenia\n530313220;46296");
  const leady = wierszeNaLeady(w, dopasujKolumny(["Telefon", "Data utworzenia"]));
  sprawdz("Excel: numer seryjny daty", (leady[0].submitted_at ?? "").startsWith("2026-"), String(leady[0].submitted_at));
}

if (bledy.length) {
  console.error(`\n${bledy.length} błędów:`);
  for (const b of bledy) console.error("  - " + b);
  process.exit(1);
}
console.log("Wczytywanie leadów: wszystkie sprawdzenia przeszły.");
