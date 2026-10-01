/**
 * Wczytywanie leadów z pliku.
 *
 * Meta Ads pozwala pobrać kontakty z formularza, ale „CSV" z Business Suite
 * bywa rozdzielony przecinkiem, średnikiem albo tabulatorem i raz jest w UTF-8,
 * a raz w UTF-16. Do tego nagłówki zależą od tego, jak biuro nazwało pytania
 * w formularzu, więc po polsku bywa „Imię i nazwisko", a po angielsku
 * „full_name". Dlatego nie zakładamy jednego formatu, tylko rozpoznajemy plik:
 * kodowanie, separator i znaczenie kolumn. To samo przyjmie też plik z Otodom,
 * z nieruchomosci-online albo zwykłą listę z Excela zapisaną jako CSV.
 */

export type WierszPliku = Record<string, string>;

export type PoleLeada =
  | "name" | "phone" | "email" | "city" | "address" | "message"
  | "campaign" | "ad_name" | "form_name" | "platform" | "external_id" | "submitted_at";

/**
 * Po czym poznajemy kolumnę. Dopasowanie po fragmencie nazwy, bez ogonków
 * i wielkości liter, więc „Numer telefonu" i „phone_number" trafiają w to samo.
 */
const WZORCE: { pole: PoleLeada; frazy: string[] }[] = [
  { pole: "external_id", frazy: ["id leada", "lead id", "leadid", "^id$"] },
  { pole: "submitted_at", frazy: ["created_time", "czas utworzenia", "data utworzenia", "utworzono", "data zgloszenia", "submitted"] },
  { pole: "name", frazy: ["full_name", "imie i nazwisko", "imie_i_nazwisko", "nazwa", "name", "imie", "first_name"] },
  { pole: "phone", frazy: ["phone_number", "phone", "numer telefonu", "telefon", "tel"] },
  { pole: "email", frazy: ["email", "e-mail", "adres email", "mail"] },
  { pole: "city", frazy: ["city", "miasto", "miejscowosc", "lokalizacja"] },
  { pole: "address", frazy: ["street_address", "adres", "ulica", "address"] },
  { pole: "message", frazy: ["wiadomosc", "message", "komentarz", "uwagi", "pytanie", "opis"] },
  { pole: "campaign", frazy: ["campaign_name", "campaign", "kampania", "nazwa kampanii"] },
  { pole: "ad_name", frazy: ["ad_name", "nazwa reklamy", "reklama", "adset_name", "zestaw reklam"] },
  { pole: "form_name", frazy: ["form_name", "nazwa formularza", "formularz"] },
  { pole: "platform", frazy: ["platform", "platforma"] },
];

function bezOgonkow(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ł/g, "l")
    .trim();
}

/** Tekst pliku niezależnie od kodowania. Meta potrafi oddać UTF-16 LE. */
export function odczytajTekst(bufor: ArrayBuffer): string {
  const b = new Uint8Array(bufor);
  if (b.length >= 2 && b[0] === 0xff && b[1] === 0xfe) {
    return new TextDecoder("utf-16le").decode(b.subarray(2));
  }
  if (b.length >= 2 && b[0] === 0xfe && b[1] === 0xff) {
    return new TextDecoder("utf-16be").decode(b.subarray(2));
  }
  const tekst = new TextDecoder("utf-8").decode(b);
  return tekst.charCodeAt(0) === 0xfeff ? tekst.slice(1) : tekst;
}

/** Separator zgadujemy z pierwszej linii: wygrywa ten, który dzieli ją na najwięcej części. */
export function zgadnijSeparator(tekst: string): string {
  const linia = tekst.split(/\r?\n/, 1)[0] ?? "";
  const kandydaci = [",", ";", "\t", "|"];
  let najlepszy = ",";
  let najwiecej = 0;
  for (const s of kandydaci) {
    const ile = rozbijLinie(linia, s).length;
    if (ile > najwiecej) {
      najwiecej = ile;
      najlepszy = s;
    }
  }
  return najlepszy;
}

/** Rozbicie linii z poszanowaniem cudzysłowów i podwójnych cudzysłowów w środku. */
function rozbijLinie(linia: string, sep: string): string[] {
  const out: string[] = [];
  let biezace = "";
  let wCudzyslowie = false;
  for (let i = 0; i < linia.length; i++) {
    const c = linia[i];
    if (c === '"') {
      if (wCudzyslowie && linia[i + 1] === '"') {
        biezace += '"';
        i++;
      } else {
        wCudzyslowie = !wCudzyslowie;
      }
      continue;
    }
    if (c === sep && !wCudzyslowie) {
      out.push(biezace);
      biezace = "";
      continue;
    }
    biezace += c;
  }
  out.push(biezace);
  return out;
}

/** Cały plik na wiersze. Obsługuje wartości z łamaniem linii w cudzysłowie. */
export function parsujCsv(tekst: string, sep?: string): WierszPliku[] {
  const separator = sep ?? zgadnijSeparator(tekst);
  const linie: string[] = [];
  let biezaca = "";
  let wCudzyslowie = false;
  for (let i = 0; i < tekst.length; i++) {
    const c = tekst[i];
    if (c === '"') wCudzyslowie = !wCudzyslowie;
    if ((c === "\n" || c === "\r") && !wCudzyslowie) {
      if (c === "\r" && tekst[i + 1] === "\n") i++;
      linie.push(biezaca);
      biezaca = "";
      continue;
    }
    biezaca += c;
  }
  if (biezaca.trim()) linie.push(biezaca);

  const niepuste = linie.filter((l) => l.trim());
  if (niepuste.length < 2) return [];

  const naglowki = rozbijLinie(niepuste[0], separator).map((h) => h.trim());
  return niepuste.slice(1).map((l) => {
    const pola = rozbijLinie(l, separator);
    const w: WierszPliku = {};
    naglowki.forEach((h, i) => {
      w[h] = (pola[i] ?? "").trim();
    });
    return w;
  });
}

/** Który nagłówek odpowiada któremu polu leada. Zwraca mapę pole -> nagłówek. */
export function dopasujKolumny(naglowki: string[]): Partial<Record<PoleLeada, string>> {
  const mapa: Partial<Record<PoleLeada, string>> = {};
  const uzyte = new Set<string>();
  for (const { pole, frazy } of WZORCE) {
    for (const fraza of frazy) {
      const dokladne = fraza.startsWith("^");
      const szukane = dokladne ? fraza.slice(1, -1) : fraza;
      const trafienie = naglowki.find((h) => {
        if (uzyte.has(h)) return false;
        const n = bezOgonkow(h);
        return dokladne ? n === szukane : n.includes(szukane);
      });
      if (trafienie) {
        mapa[pole] = trafienie;
        uzyte.add(trafienie);
        break;
      }
    }
  }
  return mapa;
}

export type LeadZPliku = {
  name: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  address: string | null;
  message: string | null;
  campaign: string | null;
  ad_name: string | null;
  form_name: string | null;
  platform: string | null;
  external_id: string | null;
  submitted_at: string | null;
  raw: WierszPliku;
};

/** Same cyfry numeru, do porównywania i wykrywania duplikatów. */
export function cyfryTelefonu(tel: string | null | undefined): string | null {
  if (!tel) return null;
  const d = tel.replace(/\D/g, "");
  if (d.length < 9) return null;
  return d.slice(-9);
}

function data(v: string | undefined): string | null {
  if (!v) return null;
  const t = v.trim();
  // Meta oddaje czas uniksowy albo ISO; w polskich eksportach bywa 25.09.2026 12:43
  if (/^\d{10}$/.test(t)) return new Date(Number(t) * 1000).toISOString();
  if (/^\d{13}$/.test(t)) return new Date(Number(t)).toISOString();
  // Excel trzyma daty jako liczbę dni od 30.12.1899. Zakres 20000-80000 to
  // mniej więcej lata 1954-2119, więc nie pomylimy go z niczym sensownym.
  if (/^\d{4,5}(\.\d+)?$/.test(t)) {
    const dni = Number(t);
    if (dni > 20000 && dni < 80000) {
      return new Date(Math.round((dni - 25569) * 86400 * 1000)).toISOString();
    }
  }
  const pl = t.match(/^(\d{2})[.\-/](\d{2})[.\-/](\d{4})[ T]?(\d{2})?:?(\d{2})?/);
  if (pl) {
    const [, d, m, r, g = "00", min = "00"] = pl;
    const iso = new Date(`${r}-${m}-${d}T${g}:${min}:00`);
    return Number.isNaN(iso.getTime()) ? null : iso.toISOString();
  }
  const x = new Date(t);
  return Number.isNaN(x.getTime()) ? null : x.toISOString();
}

export function wierszeNaLeady(
  wiersze: WierszPliku[],
  mapa: Partial<Record<PoleLeada, string>>,
): LeadZPliku[] {
  const we = (w: WierszPliku, p: PoleLeada) => {
    const kol = mapa[p];
    const v = kol ? (w[kol] ?? "").trim() : "";
    return v || null;
  };
  return wiersze
    .map((w) => ({
      name: we(w, "name"),
      phone: we(w, "phone"),
      email: we(w, "email"),
      city: we(w, "city"),
      address: we(w, "address"),
      message: we(w, "message"),
      campaign: we(w, "campaign"),
      ad_name: we(w, "ad_name"),
      form_name: we(w, "form_name"),
      platform: we(w, "platform"),
      external_id: we(w, "external_id"),
      submitted_at: data(mapa.submitted_at ? w[mapa.submitted_at] : undefined),
      raw: w,
    }))
    // Lead bez telefonu i bez maila jest bezużyteczny, nie ma do kogo zadzwonić.
    .filter((l) => l.phone || l.email);
}
