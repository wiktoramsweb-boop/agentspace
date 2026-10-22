/**
 * Sprawdzenie statystyk rozmowy (`npm run test:metryki`).
 * Ekran wyników pokazuje te liczby agentowi, więc nie mogą kłamać.
 */

import { indeksCytatu, metrykiRozmowy, ocenaUdzialu } from "./coach/metryki.ts";
import { klientSieRozlaczyl, bezZnacznikaRozlaczenia, realizmScenariusza, wersjaGlosowa } from "./coach/realizm.ts";

let bledy = 0;
function sprawdz(opis: string, warunek: boolean, szczegol = "") {
  if (!warunek) {
    bledy++;
    console.error(`BŁĄD  ${opis}${szczegol ? ` (${szczegol})` : ""}`);
  }
}

const rozmowa = [
  { role: "client" as const, content: "Halo?", t: 0 },
  { role: "agent" as const, content: "Dzień dobry, Wiktor z biura Spectra. Dzwonię w sprawie ogłoszenia na Podgórzu.", t: 3 },
  { role: "client" as const, content: "Napisałem wyraźnie, bez biur.", t: 9 },
  { role: "agent" as const, content: "Rozumiem. Co sprawiło, że zdecydował się Pan sprzedawać sam? Czy miał Pan złe doświadczenia?", t: 12 },
  { role: "client" as const, content: "No, trochę tak.", t: 20 },
  { role: "agent" as const, content: "Yyy, w okolicy sprzedały się trzy mieszkania po 15 tys. zł za metr. Może czwartek o 17, panie Krzysztofie?", t: 24 },
];

const m = metrykiRozmowy(rozmowa, "Krzysztof");
sprawdz("liczy pytania", m.pytania === 3, String(m.pytania));
sprawdz("pytania otwarte", m.pytaniaOtwarte === 1, String(m.pytaniaOtwarte));
sprawdz("pierwsze pytanie w drugiej turze", m.doPierwszegoPytaniaTura === 2);
sprawdz("pierwsze pytanie w 12 sekundzie", m.doPierwszegoPytaniaS === 12);
sprawdz("wypełniacz yyy", m.wypelniacze === 1, String(m.wypelniacze));
sprawdz("konkretna liczba", m.konkretnaLiczba);
sprawdz("konkretny termin", m.konkretnyTermin);
sprawdz("po imieniu (odmiana)", m.poImieniu);
sprawdz("czas rozmowy", m.czasS === 24);
sprawdz("udział agenta w rozsądnym zakresie", m.udzialAgenta > 50 && m.udzialAgenta < 95, String(m.udzialAgenta));

const bez = metrykiRozmowy([{ role: "agent", content: "Dzień dobry." }, { role: "client", content: "Słucham." }]);
sprawdz("bez pytań", bez.pytania === 0 && bez.doPierwszegoPytaniaTura === null);
sprawdz("bez liczby i terminu", !bez.konkretnaLiczba && !bez.konkretnyTermin);
sprawdz("bez czasów", bez.czasS === null);
sprawdz("pusta rozmowa nie dzieli przez zero", metrykiRozmowy([]).udzialAgenta === 0);

sprawdz("udział 70% to za dużo", ocenaUdzialu(70) === "za_duzo");
sprawdz("udział 40% w porządku", ocenaUdzialu(40) === "dobrze");

sprawdz("cytat dosłowny", indeksCytatu(rozmowa, "Rozumiem. Co sprawiło") === 3);
sprawdz("cytat z poprawioną interpunkcją", indeksCytatu(rozmowa, "dzień dobry wiktor z biura spectra") === 1);
sprawdz("cytat spoza rozmowy", indeksCytatu(rozmowa, "zupełnie inne zdanie o pogodzie dzisiaj") === null);

sprawdz("znacznik rozłączenia", klientSieRozlaczyl("Do widzenia. [rozłącza się]"));
sprawdz("czyszczenie znacznika", bezZnacznikaRozlaczenia("Do widzenia. [rozłącza się]") === "Do widzenia.");
sprawdz("realia FSBO mają dopisek z ogłoszenia", realizmScenariusza("zimny-telefon-fsbo", "sredni").includes("bez pośredników"));
const glosowy = wersjaGlosowa(realizmScenariusza("polecony-klient", "sredni"));
sprawdz("głos: bez znacznika rozłączenia", !glosowy.includes("[rozłącza się]"));
sprawdz("głos: reguła ciszy podmieniona", !glosowy.includes("„…”, samo „yyy”") && glosowy.includes("szum na linii"));
sprawdz("realizm bez myślników", !realizmScenariusza("zimny-telefon-fsbo", "trudny").includes("—"));

if (bledy) {
  console.error(`\nMetryki: ${bledy} błędów.`);
  process.exit(1);
}
console.log("Metryki i realizm w porządku.");
