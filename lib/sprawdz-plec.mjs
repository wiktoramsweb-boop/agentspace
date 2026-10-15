/**
 * Test zamiany płci postaci w AI Coachu: `npm run test:plec`.
 */
import assert from "node:assert/strict";
import { zmienPlecTekstu, imiePostaci } from "./plec-postaci.ts";

let n = 0;
const t = (nazwa, fn) => { try { fn(); n++; } catch (e) { console.error("✗", nazwa); throw e; } };

t("Pan Krzysztof → Pani Krystyna w różnych przypadkach", () =>
  assert.equal(
    zmienPlecTekstu("Dzwonisz do Pana Krzysztofa. Pan Krzysztof sprzedaje. Rozmawiasz z Panem Krzysztofem. Przekonaj Pana Krzysztofa.", "k"),
    "Dzwonisz do Pani Krystyny. Pani Krystyna sprzedaje. Rozmawiasz z Panią Krystyną. Przekonaj Panią Krystynę.",
  ));
t("Pani Ewa → Pan Emil", () =>
  assert.equal(zmienPlecTekstu("Spotkanie u Pani Ewy. Pani Ewa ma dom. Mówisz o Pani Ewie. Zapytaj Panią Ewę.", "m"),
    "Spotkanie u Pana Emila. Pan Emil ma dom. Mówisz o Panu Emilu. Zapytaj Pana Emila."));
t("narzędnik w instrukcji", () => assert.equal(zmienPlecTekstu("Jesteś Krzysztofem, 48 lat.", "k"), "Jesteś Krystyną, 48 lat."));
t("ta sama płeć bez zmian", () => assert.equal(zmienPlecTekstu("Dzwonisz do Pana Marka.", "m"), "Dzwonisz do Pana Marka."));
t("obce słowa nietknięte", () => assert.equal(zmienPlecTekstu("Mieszkanie przy ul. Długiej, Pan wie.", "k"), "Mieszkanie przy ul. Długiej, Pan wie."));
t("imię w mianowniku", () => assert.equal(imiePostaci("Dzwonisz do Pani Krystyny."), "Krystyna"));

console.log(`✓ ${n} testów płci postaci`);
