// Pomocnicze funkcje szybkiego wpisu. Bez importów: test (`npm run test:wpis`)
// i serwer liczą to samo.

export const DNI_TYGODNIA = ["poniedziałek", "wtorek", "środa", "czwartek", "piątek", "sobota", "niedziela"];

/** Telefon do porównań: ostatnie 9 cyfr, bez +48, spacji i myślników. */
export function cyfryTelefonu(t: string | null | undefined): string {
  const c = String(t ?? "").replace(/\D/g, "");
  return c.length >= 9 ? c.slice(-9) : "";
}

const proste = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ł/g, "l")
    .replace(/[^a-z ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export type KandydatKlienta = { id: string; name: string; phone: string | null };

/**
 * Czy klient z dyktowania już jest w bazie. Najpierw telefon (pewny), potem
 * pełne imię i nazwisko. Samo imię („Pani Anna”) nie wystarcza: w biurze
 * jest wiele Ann, a dopisanie notatki do złej osoby jest gorsze niż duplikat.
 */
export function znajdzKlienta(imie: string, telefon: string | null | undefined, klienci: KandydatKlienta[]): { klient: KandydatKlienta; po: "telefon" | "nazwisko" } | null {
  const cyfry = cyfryTelefonu(telefon);
  if (cyfry) {
    const k = klienci.find((x) => cyfryTelefonu(x.phone) === cyfry);
    if (k) return { klient: k, po: "telefon" };
  }
  const n = proste(imie).replace(/^(pan|pani|panstwo)\s+/, "");
  if (n.split(" ").length < 2) return null;
  const pasujacy = klienci.filter((x) => proste(x.name).replace(/^(pan|pani|panstwo)\s+/, "") === n);
  return pasujacy.length === 1 ? { klient: pasujacy[0], po: "nazwisko" } : null;
}

export function poprawnaGodzina(g: string | null | undefined): string | null {
  const m = String(g ?? "").trim().match(/^(\d{1,2})[:.](\d{2})$/);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  return h < 24 && min < 60 ? `${String(h).padStart(2, "0")}:${m[2]}` : null;
}

export function poprawnaData(d: string | null | undefined, dzis: string): string | null {
  const v = String(d ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
  const [y, m, day] = v.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, day));
  if (t.getUTCFullYear() !== y || t.getUTCMonth() !== m - 1 || t.getUTCDate() !== day) return null;
  // Spotkanie sprzed tygodnia albo za dwa lata to prawie na pewno pomyłka rozpoznawania.
  const [ty, tm, td] = dzis.split("-").map(Number);
  const roznica = (t.getTime() - Date.UTC(ty, tm - 1, td)) / 86_400_000;
  return roznica >= -1 && roznica <= 400 ? v : null;
}

/** Kwota z tekstu AI: „650 tys.”, „1,2 mln”, „650000” → liczba złotych. */
export function kwota(v: unknown): number | null {
  if (typeof v === "number") return Number.isFinite(v) && v > 0 ? Math.round(v) : null;
  const s = String(v ?? "").toLowerCase().replace(/\s/g, "").replace(",", ".");
  const m = s.match(/^(\d+(?:\.\d+)?)(tys|k|mln|m)?/);
  if (!m) return null;
  const n = Number(m[1]) * (m[2]?.startsWith("t") || m[2] === "k" ? 1000 : m[2]?.startsWith("m") ? 1_000_000 : 1);
  return n > 0 ? Math.round(n) : null;
}

function dodajDni(key: string, n: number): string {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}
function dzienTygodnia(key: string): number {
  const [y, m, d] = key.split("-").map(Number);
  return (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7;
}



/** Instrukcja dla AI szybkiego wpisu. Osobno od trasy, żeby test sprawdzał dokładnie to samo. */
export function systemWpisu(dzis: string): string {
  const tydzien = Array.from({ length: 8 }, (_, i) => {
    const d = dodajDni(dzis, i);
    return `${DNI_TYGODNIA[dzienTygodnia(d)]} ${d}`;
  }).join(", ");
  return `Jesteś asystentem agenta nieruchomości. Agent dyktuje relację po rozmowie albo spotkaniu (mowa zamieniona na tekst, bywa niechlujna). Wyciągasz z niej dane do CRM.

DZIŚ: ${DNI_TYGODNIA[dzienTygodnia(dzis)]} ${dzis}. Najbliższe dni: ${tydzien}.
Daty zawsze jako RRRR-MM-DD. „Jutro”, „w czwartek”, „za tydzień” zamieniasz na konkretną datę z listy wyżej. „W czwartek” to najbliższy czwartek po dziś.

Zasady:
- client_name: imię i nazwisko klienta, popraw oczywiste błędy rozpoznawania mowy. Bez „Pan/Pani”.
- phone, email: tylko jeśli padły. Telefon jako cyfry.
- client_type: sprzedajacy (właściciel sprzedaje, spotkanie pozyskowe), kupujacy, wynajmujacy (właściciel wynajmuje), najemca, inny.
- client_status: nowy (pierwszy kontakt), w_kontakcie (rozmowa, umówione spotkanie), oglada (ogląda oferty, był na prezentacji), negocjacje (rozmowa o cenie, ofercie, umowie).
- budget_pln: budżet kupującego lub najemcy w złotych, jeśli padł.
- address, city: adres nieruchomości i miasto, tylko jeśli padły. Nie zgaduj miasta.
- create_property: true, gdy jest adres nieruchomości właściciela (sprzedającego lub wynajmującego).
- property_title: krótka nazwa, np. „Mieszkanie 3 pok., ul. Prądnicka 34”.
- property_area, property_rooms, property_price: tylko jeśli padły.
- deal_kind: sprzedaz albo wynajem.
- spotkanie: tylko spotkanie na żywo umówione na konkretny dzień (pozyskowe, prezentacja, podpisanie umowy, oględziny). jest=true, data, godzina (HH:MM, pusta gdy nie padła), temat (np. „Spotkanie pozyskowe, Prądnicka 34”). Telefon do klienta to nie spotkanie, tylko zadanie. Gdy brak spotkania: jest=false i puste pola.
- zadania: konkretne rzeczy do zrobienia przez agenta, które padły w relacji (zadzwonić, wysłać podsumowanie, przygotować analizę cen, zebrać dokumenty). Każda rzecz tylko raz: to, co jest spotkaniem, nie trafia do zadań. tytul krótko, w trybie rozkazującym. termin jako data albo pusty. Nie wymyślaj zadań, których nie było.
- nastepny_kontakt: data kolejnego kontaktu, jeśli wynika z relacji, inaczej pusta.
- note: notatka z rozmowy, zachowaj sens i szczegóły, lekko uporządkowane, po polsku, bez myślników (— i –).`;
}

export const SCHEMAT_WPISU = {
        type: "object",
        properties: {
          client_name: { type: "string" },
          phone: { type: "string" },
          email: { type: "string" },
          client_type: { type: "string", enum: ["sprzedajacy", "kupujacy", "wynajmujacy", "najemca", "inny"] },
          client_status: { type: "string", enum: ["nowy", "w_kontakcie", "oglada", "negocjacje"] },
          budget_pln: { type: "string" },
          address: { type: "string" },
          city: { type: "string" },
          create_property: { type: "boolean" },
          property_title: { type: "string" },
          property_area: { type: "string" },
          property_rooms: { type: "string" },
          property_price: { type: "string" },
          deal_kind: { type: "string", enum: ["sprzedaz", "wynajem"] },
          spotkanie: {
            type: "object",
            properties: { jest: { type: "boolean" }, data: { type: "string" }, godzina: { type: "string" }, temat: { type: "string" } },
            required: ["jest", "data", "godzina", "temat"],
            additionalProperties: false,
          },
          zadania: {
            type: "array",
            items: { type: "object", properties: { tytul: { type: "string" }, termin: { type: "string" } }, required: ["tytul", "termin"], additionalProperties: false },
          },
          nastepny_kontakt: { type: "string" },
          note: { type: "string" },
        },
        required: ["client_name", "phone", "email", "client_type", "client_status", "budget_pln", "address", "city", "create_property", "property_title", "property_area", "property_rooms", "property_price", "deal_kind", "spotkanie", "zadania", "nastepny_kontakt", "note"],
        additionalProperties: false,
      } as const;
