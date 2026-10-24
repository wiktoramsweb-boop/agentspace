import { Readable } from "node:stream";
import { Client } from "basic-ftp";

export type DaneFtp = { host: string; port: number; login: string; haslo: string; katalog: string; secure: boolean };

/** Komunikat po polsku zamiast surowego błędu FTP: agent ma wiedzieć, co poprawić. */
export function opisBleduFtp(e: unknown): string {
  const m = e instanceof Error ? e.message : String(e);
  const kod = (e as { code?: string | number })?.code;
  if (kod === "ENOTFOUND" || /ENOTFOUND|getaddrinfo/.test(m)) return "Nie znaleziono serwera. Sprawdź adres FTP (host).";
  if (kod === "ECONNREFUSED" || /ECONNREFUSED/.test(m)) return "Serwer odrzucił połączenie. Sprawdź port i czy portal włączył Twoje konto.";
  if (/timeout|ETIMEDOUT/i.test(m)) return "Serwer nie odpowiada. Spróbuj za chwilę albo sprawdź adres i port.";
  if (kod === 530 || /530|login|password|authentication/i.test(m)) return "Serwer nie przyjął loginu albo hasła.";
  if (kod === 550 || /550/.test(m)) return "Brak dostępu do katalogu. Sprawdź katalog docelowy.";
  if (/TLS|SSL|certificate/i.test(m)) return "Problem z szyfrowanym połączeniem. Spróbuj z wyłączonym FTPS.";
  return `Błąd FTP: ${m.slice(0, 200)}`;
}

async function zPolaczeniem<T>(d: DaneFtp, fn: (c: Client) => Promise<T>): Promise<T> {
  const c = new Client(20000);
  try {
    await c.access({ host: d.host, port: d.port, user: d.login, password: d.haslo, secure: d.secure });
    if (d.katalog && d.katalog !== "/") await c.cd(d.katalog);
    return await fn(c);
  } finally {
    c.close();
  }
}

/** Logowanie i odczyt katalogu, bez wysyłania niczego: portal mógłby potraktować plik testowy jak import. */
export async function testujFtp(d: DaneFtp): Promise<{ ok: true; plikow: number } | { ok: false; blad: string }> {
  try {
    const lista = await zPolaczeniem(d, (c) => c.list());
    return { ok: true, plikow: lista.length };
  } catch (e) {
    return { ok: false, blad: opisBleduFtp(e) };
  }
}

/**
 * Wysyłka pliku pod tymczasową nazwą i zmiana nazwy na końcu: portal co kilka
 * minut zbiera pliki z serwera i nie może trafić na w połowie wgrany ZIP.
 */
export async function wyslijPlikFtp(d: DaneFtp, nazwa: string, dane: Buffer): Promise<void> {
  await zPolaczeniem(d, async (c) => {
    const tymczasowa = `${nazwa}.part`;
    await c.uploadFrom(Readable.from(dane), tymczasowa);
    await c.rename(tymczasowa, nazwa);
  });
}

/** Kilka plików jednym połączeniem: zdjęcia ofert idą w jednej sesji FTP, a nie po jednej na plik. */
export async function wyslijPlikiFtp(d: DaneFtp, pliki: { nazwa: string; dane: () => Promise<Buffer | null> }[], poKazdym?: (nazwa: string) => void): Promise<{ wyslane: string[]; nieudane: string[] }> {
  const wyslane: string[] = [];
  const nieudane: string[] = [];
  await zPolaczeniem(d, async (c) => {
    for (const p of pliki) {
      const dane = await p.dane().catch(() => null);
      if (!dane) {
        nieudane.push(p.nazwa);
        continue;
      }
      const tymczasowa = `${p.nazwa}.part`;
      await c.uploadFrom(Readable.from(dane), tymczasowa);
      await c.rename(tymczasowa, p.nazwa);
      wyslane.push(p.nazwa);
      poKazdym?.(p.nazwa);
    }
  });
  return { wyslane, nieudane };
}
