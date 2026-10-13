/**
 * Test warstwy tekstowej rozmowy głosowej (`npm run test:glos`).
 *
 * Znaczniki emocji trafiają do transkryptu i do oceny sesji. Bez tego testu
 * agent dostawał uwagi do zdań, których nie wypowiedział.
 */
import { bezZnacznikowMowy, pierwszeZdanie } from "./glos.ts";

let bledy = 0;
function sprawdz(opis, otrzymano, oczekiwano) {
  if (otrzymano !== oczekiwano) {
    console.error(`BŁĄD: ${opis}\n  otrzymano:  ${JSON.stringify(otrzymano)}\n  oczekiwano: ${JSON.stringify(oczekiwano)}`);
    bledy++;
  }
}

sprawdz(
  "znacznik na początku i w środku",
  bezZnacznikowMowy("[neutral] Dzień dobry panu. [hesitant] Tak, słyszę pana."),
  "Dzień dobry panu. Tak, słyszę pana.",
);
sprawdz(
  "kilka znaczników w jednym zdaniu",
  bezZnacznikowMowy("[thoughtful] No wie pan, [slow] ta cena jest [hesitant] wysoka."),
  "No wie pan, ta cena jest wysoka.",
);
sprawdz("sam znacznik zostawia pusty tekst", bezZnacznikowMowy("[neutral]"), "");
sprawdz("tekst bez znaczników zostaje bez zmian", bezZnacznikowMowy("Dzień dobry."), "Dzień dobry.");
sprawdz(
  "liczby w nawiasach to nie znacznik",
  bezZnacznikowMowy("Mieszkanie [3] pokoje"),
  "Mieszkanie [3] pokoje",
);
sprawdz("pierwsze zdanie przy telefonie", pierwszeZdanie("cold_calling"), "Słucham?");
sprawdz("pierwsze zdanie przy spotkaniu", pierwszeZdanie("spotkanie"), "Dzień dobry, zapraszam, proszę siadać.");

if (bledy > 0) {
  console.error(`\n${bledy} błędów w warstwie głosowej.`);
  process.exit(1);
}
console.log("Rozmowa głosowa w porządku (znaczniki emocji wycięte, pierwsze zdanie zależne od scenariusza).");
