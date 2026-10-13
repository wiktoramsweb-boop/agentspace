/**
 * Zapis archiwum ZIP bez żadnej zależności.
 *
 * Potrzebne do jednego przycisku „pobierz wszystkie dane biura". Można było
 * dołożyć bibliotekę, ale cały format w wersji bez kompresji to trzy nagłówki
 * i suma kontrolna, a to jest kod, który raz napisany nie zmienia się nigdy.
 * Mniej zależności w projekcie, który trzyma cudze bazy klientów, to wartość
 * sama w sobie.
 *
 * Pliki zapisujemy metodą „store", czyli bez kompresji. CSV-ki biura ważą
 * kilka megabajtów, a brak kompresji oznacza brak całej klasy błędów przy
 * strumieniowaniu i stałe zużycie pamięci.
 */

/** Tablica CRC32, liczona raz przy pierwszym użyciu. */
let tablicaCrc: Uint32Array | null = null;

function crc32(dane: Uint8Array): number {
  if (!tablicaCrc) {
    tablicaCrc = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      tablicaCrc[i] = c >>> 0;
    }
  }
  let crc = 0xffffffff;
  for (let i = 0; i < dane.length; i++) {
    crc = tablicaCrc[(crc ^ dane[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/** Data i godzina w formacie MS-DOS, którego wymaga nagłówek ZIP. */
function dataDos(d: Date): { czas: number; data: number } {
  return {
    czas: (d.getHours() << 11) | (d.getMinutes() << 5) | (Math.floor(d.getSeconds() / 2) & 0x1f),
    data: ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate(),
  };
}

export type PlikDoArchiwum = { nazwa: string; dane: Uint8Array };

export function spakuj(pliki: PlikDoArchiwum[], kiedy: Date = new Date()): Uint8Array {
  const { czas, data } = dataDos(kiedy);
  const kodownik = new TextEncoder();

  const czesci: Uint8Array[] = [];
  const centralne: Uint8Array[] = [];
  let przesuniecie = 0;

  for (const plik of pliki) {
    const nazwa = kodownik.encode(plik.nazwa);
    const suma = crc32(plik.dane);

    const naglowek = new DataView(new ArrayBuffer(30));
    naglowek.setUint32(0, 0x04034b50, true); // podpis nagłówka lokalnego
    naglowek.setUint16(4, 20, true); // wymagana wersja
    // Bit 11 mówi, że nazwa pliku jest w UTF-8. Bez niego polskie znaki
    // w nazwach rozsypują się przy rozpakowaniu na Windowsie.
    naglowek.setUint16(6, 0x0800, true);
    naglowek.setUint16(8, 0, true); // metoda: bez kompresji
    naglowek.setUint16(10, czas, true);
    naglowek.setUint16(12, data, true);
    naglowek.setUint32(14, suma, true);
    naglowek.setUint32(18, plik.dane.length, true);
    naglowek.setUint32(22, plik.dane.length, true);
    naglowek.setUint16(26, nazwa.length, true);
    naglowek.setUint16(28, 0, true); // brak pola dodatkowego

    czesci.push(new Uint8Array(naglowek.buffer), nazwa, plik.dane);

    const wpis = new DataView(new ArrayBuffer(46));
    wpis.setUint32(0, 0x02014b50, true); // podpis wpisu katalogu centralnego
    wpis.setUint16(4, 20, true);
    wpis.setUint16(6, 20, true);
    wpis.setUint16(8, 0x0800, true);
    wpis.setUint16(10, 0, true);
    wpis.setUint16(12, czas, true);
    wpis.setUint16(14, data, true);
    wpis.setUint32(16, suma, true);
    wpis.setUint32(20, plik.dane.length, true);
    wpis.setUint32(24, plik.dane.length, true);
    wpis.setUint16(28, nazwa.length, true);
    wpis.setUint32(42, przesuniecie, true);

    centralne.push(new Uint8Array(wpis.buffer), nazwa);
    przesuniecie += 30 + nazwa.length + plik.dane.length;
  }

  const dlugoscCentralnego = centralne.reduce((s, c) => s + c.length, 0);

  const koniec = new DataView(new ArrayBuffer(22));
  koniec.setUint32(0, 0x06054b50, true); // podpis końca katalogu
  koniec.setUint16(8, pliki.length, true);
  koniec.setUint16(10, pliki.length, true);
  koniec.setUint32(12, dlugoscCentralnego, true);
  koniec.setUint32(16, przesuniecie, true);

  const wszystko = [...czesci, ...centralne, new Uint8Array(koniec.buffer)];
  const razem = wszystko.reduce((s, c) => s + c.length, 0);

  const wynik = new Uint8Array(razem);
  let i = 0;
  for (const c of wszystko) {
    wynik.set(c, i);
    i += c.length;
  }
  return wynik;
}
