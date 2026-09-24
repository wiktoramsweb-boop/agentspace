/**
 * Napisy w makietach produktu na stronie marketingowej.
 *
 * Makiety są jedynym miejscem, gdzie anglojęzyczny odwiedzający widzi sam
 * interfejs, więc muszą być po angielsku - inaczej cała prezentacja wygląda
 * na produkt nie dla niego. Klucz to polski oryginał, wartość to tłumaczenie.
 */
const EN: Record<string, string> = {
  // pulpit
  "Środa, 23 września": "Wednesday, 23 September",
  "Dzień dobry, Marta": "Good morning, Marta",
  Telefony: "Calls",
  Spotkania: "Meetings",
  Oferty: "Listings",
  "Prowizja w tym miesiącu": "Commission this month",
  "14 200 zł": "14,200 PLN",
  "Oddzwoń do pana Kowalskiego": "Call Mr Kowalski back",
  "Prezentacja, ul. Wielicka 134": "Viewing, 134 Wielicka St.",
  "Follow-up: rodzina Nowak": "Follow-up: the Nowak family",
  "Trening AI Coach: obiekcje": "AI Coach practice: objections",
  wieczorem: "this evening",

  // oferty
  Wszystkie: "All",
  Sprzedaż: "For sale",
  Wynajem: "To rent",
  Filtry: "Filters",
  "Apartament z widokiem na Wawel": "Apartment with a castle view",
  "Zabłocie · 84 m² · 3 pok.": "Zabłocie · 84 m² · 3 rooms",
  "1 690 000 zł": "1,690,000 PLN",
  "Dom przy lesie, gotowy do wejścia": "House by the forest, move-in ready",
  "Zielonki · 214 m² · 6 pok.": "Zielonki · 214 m² · 6 rooms",
  "2 150 000 zł": "2,150,000 PLN",
  "Loft w dawnej fabryce": "Loft in a former factory",
  "Podgórze · 96 m² · 2 pok.": "Podgórze · 96 m² · 2 rooms",
  "1 240 000 zł": "1,240,000 PLN",
  Publikacja: "Published to",
  "Strona biura": "Agency website",
  "Nieruchomosci-online": "Nieruchomosci-online",

  // panel właściciela
  "Zespół w tym miesiącu": "The team this month",
  "187 transakcji": "187 deals",
  "34 200 zł": "34,200 PLN",
  "143 transakcje": "143 deals",
  "21 800 zł": "21,800 PLN",
  "264 najmy": "264 rentals",
  "12 400 zł": "12,400 PLN",
  "96 transakcji": "96 deals",
  "9 100 zł": "9,100 PLN",
  "Prowizje, miesiąc": "Commissions, month",
  "77 500 zł": "77,500 PLN",
  "Telefony, tydzień": "Calls, week",
  "Oferty aktywne": "Active listings",
  "Wymaga uwagi": "Needs attention",
  "Tomasz nie dzwonił od czterech dni, a ma sześć zaległych kontaktów.":
    "Thomas has not called in four days and has six overdue contacts.",

  // cele
  "Cel roczny": "Annual target",
  "420 000 zł prowizji": "420,000 PLN in commission",
  "62% planu": "62% of plan",
  "Dziś do zrobienia": "To do today",
  Rozmowy: "Conversations",
  Umowy: "Agreements",
  "62%": "62%",
  "Passa: 9 dni z rzędu": "Streak: 9 days in a row",
  "Zrób jeszcze 6 telefonów, żeby nie przerwać serii.":
    "Six more calls to keep the streak alive.",

  // kalendarz
  Tydzień: "Week",
  "Telefon: pan Kowalski": "Call: Mr Kowalski",
  "Prezentacja, ul. Wielicka": "Viewing, Wielicka St.",
  "Podpisanie umowy, notariusz": "Signing at the notary",
  "O której najczęściej dzwonisz": "When you actually call",

  // transakcje
  Umowa: "Agreement",
  Zadatek: "Deposit",
  Kredyt: "Mortgage",
  Akt: "Deed",
  Rozliczenie: "Settlement",
  Cena: "Price",
  Prowizja: "Commission",
  "41 400 zł": "41,400 PLN",
  "Twój udział": "Your share",
  "20 700 zł": "20,700 PLN",
  "Dokumenty transakcji": "Deal documents",
  "Umowa pośrednictwa.pdf": "Agency agreement.pdf",
  "Zaświadczenie ze wspólnoty.pdf": "Housing association certificate.pdf",
  "Świadectwo energetyczne.pdf": "Energy certificate.pdf",
  "ul. Nadwiślańska 12/34": "12/34 Nadwiślańska St.",
  "w toku": "in progress",

  // karta klienta
  "Małgorzata Zielińska": "Margaret Green",
  "Kupująca · budżet do 900 000 zł · Podgórze": "Buyer · budget up to 900,000 PLN · Podgórze",
  "Historia kontaktu": "Contact history",
  "Dopasowania z bazy: 3 oferty": "Matches in the database: 3 listings",
  "+ Dodaj": "+ Add",
  ogląda: "viewing",
  "dziś, 10:12": "today, 10:12",
  "Telefon, 4 min 12 s": "Call, 4 min 12 s",
  "Prosi o drugie oglądanie w sobotę": "Asked for a second viewing on Saturday",
  "12 września": "12 September",
  "Prezentacja, ul. Kalwaryjska": "Viewing, Kalwaryjska St.",
  "Za mała kuchnia, reszta na tak": "Kitchen too small, everything else works",
  "4 września": "4 September",
  "Telefon, 2 min 40 s": "Call, 2 min 40 s",
  "Pierwszy kontakt z ogłoszenia": "First contact from the listing",
  "System sam sprawdził poszukiwanie i znalazł nowe mieszkanie na Kalwaryjskiej.":
    "The system checked the saved search on its own and found a new apartment on Kalwaryjska.",

  // dokumenty
  "Dokumenty oferty": "Listing documents",
  "Umowa pośrednictwa": "Agency agreement",
  "PDF · 240 kB": "PDF · 240 kB",
  podpisana: "signed",
  "Odpis z księgi wieczystej": "Land register extract",
  "PDF · 1,1 MB": "PDF · 1.1 MB",
  aktualny: "current",
  "Świadectwo energetyczne": "Energy certificate",
  "PDF · 380 kB": "PDF · 380 kB",
  "ważne do 2035": "valid to 2035",
  "Zaświadczenie o zameldowaniu": "Residence certificate",
  "PDF · 120 kB": "PDF · 120 kB",
  "do odebrania": "to collect",
  "Zdjęcia po obróbce": "Retouched photos",
  "ZIP · 24 MB": "ZIP · 24 MB",
  gotowe: "ready",
  Zdjęcia: "Photos",
  "Pliki leżą przy ofercie i przy kliencie naraz, a link do pobrania wygasa, więc nie krąży po WhatsAppie.":
    "Files sit with the listing and the client at the same time, and the download link expires, so it does not circulate on WhatsApp.",
};

/** Funkcja tłumacząca napis makiety; po polsku zwraca oryginał. */
export function shotText(lang: string) {
  return (text: string) => (lang === "en" ? (EN[text] ?? text) : text);
}
