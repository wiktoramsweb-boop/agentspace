// Plik iCalendar dla subskrypcji w Google, Apple i Outlooku. Bez importów: test `npm run test:cele`.

export type ZdarzenieIcs = { id: string; tytul: string; start: string; sekundy: number | null; opis?: string | null; wykonane?: boolean };

const tekst = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
const czas = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

/** Linie dłuższe niż 75 bajtów trzeba zawijać, inaczej Apple ucina tytuły. */
function zawin(linia: string): string {
  const koder = new TextEncoder();
  const wynik: string[] = [];
  let biezaca = "";
  for (const znak of linia) {
    if (koder.encode(biezaca + znak).length > (wynik.length ? 74 : 75)) {
      wynik.push(biezaca);
      biezaca = "";
    }
    biezaca += znak;
  }
  wynik.push(biezaca);
  return wynik.join("\r\n ");
}

export function plikIcs(nazwa: string, zdarzenia: ZdarzenieIcs[], teraz = new Date()): string {
  const linie = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//AgentSpace//Kalendarz//PL", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", `X-WR-CALNAME:${tekst(nazwa)}`, "X-WR-TIMEZONE:Europe/Warsaw", "REFRESH-INTERVAL;VALUE=DURATION:PT1H", "X-PUBLISHED-TTL:PT1H"];
  for (const z of zdarzenia) {
    const start = new Date(z.start);
    if (Number.isNaN(start.getTime())) continue;
    const koniec = new Date(start.getTime() + (z.sekundy && z.sekundy > 0 ? z.sekundy : 3600) * 1000);
    linie.push("BEGIN:VEVENT", `UID:${z.id}@agentspace.pl`, `DTSTAMP:${czas(teraz)}`, `DTSTART:${czas(start)}`, `DTEND:${czas(koniec)}`, `SUMMARY:${tekst(z.tytul)}`);
    if (z.opis) linie.push(`DESCRIPTION:${tekst(z.opis)}`);
    linie.push(`STATUS:${z.wykonane ? "CONFIRMED" : "TENTATIVE"}`, "END:VEVENT");
  }
  linie.push("END:VCALENDAR");
  return linie.map(zawin).join("\r\n") + "\r\n";
}
