/**
 * Czytanie arkusza .xlsx bez biblioteki.
 *
 * Plik xlsx to zwykły zip z XML-em w środku, a przeglądarka od dawna potrafi
 * rozpakować strumień deflate (`DecompressionStream`). Dlatego zamiast dokładać
 * zależność rozpakowujemy go sami: to ~150 linii, które rozumiemy i które nie
 * przyniosą ze sobą cudzych podatności. Czytamy pierwszy arkusz i oddajemy
 * surowe wiersze, bo reszta pracy (rozpoznanie kolumn) dzieje się już
 * w `leady-import.ts`.
 *
 * Świadome ograniczenia: bierzemy pierwszy arkusz, nie czytamy formuł (tylko
 * zapisany wynik) i nie obsługujemy plików zabezpieczonych hasłem. Do eksportu
 * leadów z Meta czy Excela to wystarcza.
 */

type Wpis = { nazwa: string; dane: Uint8Array };

function u16(b: Uint8Array, i: number): number {
  return b[i] | (b[i + 1] << 8);
}
function u32(b: Uint8Array, i: number): number {
  return (b[i] | (b[i + 1] << 8) | (b[i + 2] << 16) | (b[i + 3] << 24)) >>> 0;
}

async function rozpakuj(dane: Uint8Array, metoda: number): Promise<Uint8Array> {
  if (metoda === 0) return dane;
  if (metoda !== 8) throw new Error(`Nieobsługiwana kompresja w pliku (${metoda}).`);
  if (typeof DecompressionStream === "undefined") {
    throw new Error("Ta przeglądarka nie potrafi rozpakować pliku xlsx. Zapisz plik jako CSV.");
  }
  const strumien = new Blob([dane as BlobPart]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(strumien).arrayBuffer());
}

/** Wyciąga z zipa tylko te pliki, które nas interesują. */
async function czytajZip(bufor: ArrayBuffer, chce: (nazwa: string) => boolean): Promise<Wpis[]> {
  const b = new Uint8Array(bufor);

  // Stopka katalogu centralnego: szukamy od końca, bo może mieć komentarz.
  let koniec = -1;
  for (let i = b.length - 22; i >= 0 && i > b.length - 22 - 65536; i--) {
    if (u32(b, i) === 0x06054b50) {
      koniec = i;
      break;
    }
  }
  if (koniec < 0) throw new Error("To nie jest poprawny plik xlsx.");

  const ile = u16(b, koniec + 10);
  let p = u32(b, koniec + 16);
  const wpisy: Wpis[] = [];

  for (let n = 0; n < ile; n++) {
    if (u32(b, p) !== 0x02014b50) break;
    const metoda = u16(b, p + 10);
    const rozmiarSkompresowany = u32(b, p + 20);
    const dlugoscNazwy = u16(b, p + 28);
    const dlugoscExtra = u16(b, p + 30);
    const dlugoscKomentarza = u16(b, p + 32);
    const offsetLokalny = u32(b, p + 42);
    const nazwa = new TextDecoder().decode(b.subarray(p + 46, p + 46 + dlugoscNazwy));
    p += 46 + dlugoscNazwy + dlugoscExtra + dlugoscKomentarza;

    if (!chce(nazwa)) continue;

    // Nagłówek lokalny ma własne długości nazwy i pola extra.
    const lokalnaNazwa = u16(b, offsetLokalny + 26);
    const lokalneExtra = u16(b, offsetLokalny + 28);
    const start = offsetLokalny + 30 + lokalnaNazwa + lokalneExtra;
    const surowe = b.subarray(start, start + rozmiarSkompresowany);
    wpisy.push({ nazwa, dane: await rozpakuj(surowe, metoda) });
  }
  return wpisy;
}

function odkoduj(s: string): string {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&amp;/g, "&");
}

/** Cały tekst z elementu, z pominięciem znaczników formatowania (`<rPr>` itd.). */
function tekstZElementu(xml: string): string {
  const kawalki = [...xml.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map((m) => odkoduj(m[1]));
  return kawalki.join("");
}

/** „C7" -> 2 (indeks kolumny liczony od zera). */
function kolumnaZAdresu(adres: string): number {
  const litery = adres.match(/^[A-Z]+/)?.[0] ?? "A";
  let n = 0;
  for (const c of litery) n = n * 26 + (c.charCodeAt(0) - 64);
  return n - 1;
}

/**
 * Arkusz jako tablica wierszy, każdy jako tablica tekstów.
 * Pierwszy wiersz to nagłówki; dalszą robotę wykonuje `leady-import.ts`.
 */
export async function czytajXlsx(bufor: ArrayBuffer): Promise<string[][]> {
  const wpisy = await czytajZip(
    bufor,
    (n) => n === "xl/sharedStrings.xml" || /^xl\/worksheets\/sheet\d+\.xml$/.test(n),
  );

  const tekst = (n: string) => {
    const w = wpisy.find((x) => x.nazwa === n);
    return w ? new TextDecoder().decode(w.dane) : null;
  };

  const wspolne: string[] = [];
  const ss = tekst("xl/sharedStrings.xml");
  if (ss) {
    for (const m of ss.matchAll(/<si>([\s\S]*?)<\/si>/g)) wspolne.push(tekstZElementu(m[1]));
  }

  // Pierwszy arkusz po numerze, bo kolejność w zipie bywa dowolna.
  const arkusze = wpisy
    .filter((w) => w.nazwa.startsWith("xl/worksheets/"))
    .sort((a, b) => a.nazwa.localeCompare(b.nazwa, undefined, { numeric: true }));
  if (!arkusze.length) throw new Error("W pliku nie ma żadnego arkusza.");
  const xml = new TextDecoder().decode(arkusze[0].dane);

  return parsujArkuszXml(xml, wspolne);
}

/**
 * Arkusz z XML-a na wiersze. Wydzielone, bo to tutaj mieszka cała logika
 * i tylko to warto testować bez pakowania pliku zip.
 *
 * Kolejność alternatyw w wyrażeniu ma znaczenie: pusta komórka zapisana jako
 * `<c r="B4"/>` musi zostać dopasowana PRZED wariantem z treścią, bo inaczej
 * `<c([^>]*)>` łyka ją jako znacznik otwierający i zjada wszystko aż do
 * następnego `</c>`. Przez to kolumny rozjeżdżały się o jedną pozycję,
 * a w telefonie lądował numer z puli tekstów.
 */
export function parsujArkuszXml(xml: string, wspolne: string[]): string[][] {
  const wiersze: string[][] = [];
  for (const w of xml.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)) {
    const komorki: string[] = [];
    for (const c of w[1].matchAll(/<c([^>]*?)\/>|<c([^>]*?)>([\s\S]*?)<\/c>/g)) {
      const pusta = c[1] !== undefined;
      const atrybuty = pusta ? c[1] : (c[2] ?? "");
      const srodek = pusta ? "" : (c[3] ?? "");
      const adres = atrybuty.match(/r="([A-Z]+\d+)"/)?.[1];
      const typ = atrybuty.match(/t="([^"]+)"/)?.[1];

      let wartosc = "";
      if (!pusta) {
        if (typ === "s") {
          const i = Number(srodek.match(/<v>(\d+)<\/v>/)?.[1] ?? -1);
          wartosc = wspolne[i] ?? "";
        } else if (typ === "inlineStr" || typ === "str") {
          wartosc = typ === "str" ? odkoduj(srodek.match(/<v>([\s\S]*?)<\/v>/)?.[1] ?? "") : tekstZElementu(srodek);
        } else {
          wartosc = odkoduj(srodek.match(/<v>([\s\S]*?)<\/v>/)?.[1] ?? "");
        }
      }

      const idx = adres ? kolumnaZAdresu(adres) : komorki.length;
      while (komorki.length < idx) komorki.push("");
      komorki[idx] = wartosc.trim();
    }
    if (komorki.some((k) => k)) wiersze.push(komorki);
  }
  return wiersze;
}

/** Wiersze arkusza na obiekty z nagłówkami, w tym samym kształcie co z CSV. */
export function arkuszNaWiersze(wiersze: string[][]): Record<string, string>[] {
  if (wiersze.length < 2) return [];
  const naglowki = wiersze[0].map((h, i) => h.trim() || `kolumna_${i + 1}`);
  return wiersze.slice(1).map((w) => {
    const o: Record<string, string> = {};
    naglowki.forEach((h, i) => {
      o[h] = w[i] ?? "";
    });
    return o;
  });
}
