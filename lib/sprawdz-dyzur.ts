/**
 * Sprawdzenie Dyżuru AI (`npm run test:dyzur`).
 *
 * Podpis Twilio chroni kredyty biura przed fałszywymi połączeniami, a stan
 * rozmowy i TwiML decydują, czy dzwoniący w ogóle coś usłyszy.
 */

import { createHmac } from "node:crypto";
import { podpisTwilioOk, stanDoParametru, stanZParametru, twimlKoniec, twimlRozmowa } from "./dyzur-twilio.ts";

let bledy = 0;
function sprawdz(opis: string, warunek: boolean, szczegol = "") {
  if (!warunek) {
    bledy++;
    console.error(`BŁĄD  ${opis}${szczegol ? ` (${szczegol})` : ""}`);
  }
}

const token = "sekret-testowy";
const url = "https://www.agentspace.pl/api/dyzur/glos?s=abc";
const params = { CallSid: "CA123", From: "+48500100200", To: "+48123456789", SpeechResult: "Chcę sprzedać mieszkanie" };
// Algorytm z dokumentacji Twilio: adres + parametry posortowane po nazwie, HMAC-SHA1, base64.
const dobry = createHmac("sha1", token)
  .update(url + "CallSidCA123" + "From+48500100200" + "SpeechResultChcę sprzedać mieszkanie" + "To+48123456789", "utf8")
  .digest("base64");
sprawdz("poprawny podpis przechodzi", podpisTwilioOk(url, params, dobry, token));
sprawdz("podmieniony parametr odpada", !podpisTwilioOk(url, { ...params, To: "+48999999999" }, dobry, token));
sprawdz("podmieniony adres (stan) odpada", !podpisTwilioOk(url.replace("abc", "xyz"), params, dobry, token));
sprawdz("brak podpisu odpada", !podpisTwilioOk(url, params, null, token));
sprawdz("brak klucza na serwerze odpada", !podpisTwilioOk(url, params, dobry, ""));

const stan = { a: "biuro-1", l: null, h: [[1, "Dzień dobry, w czym mogę pomóc?"], [0, "Szukam mieszkania & „cudzysłów”"]] as [0 | 1, string][], t: 1 };
const odczyt = stanZParametru(stanDoParametru(stan));
sprawdz("stan wraca bez zmian", JSON.stringify(odczyt) === JSON.stringify(stan));
sprawdz("śmieci w stanie dają null", stanZParametru("%%%nie-base64") === null);
sprawdz("stan po 6 wypowiedziach mieści się w adresie", stanDoParametru({ ...stan, h: Array.from({ length: 6 }, (_, i) => [(i % 2) as 0 | 1, "x".repeat(250)]) }).length < 2600);

const r = twimlRozmowa('Pan "Kowalski" & syn <test>', "/api/dyzur/glos?s=a&b");
sprawdz("TwiML ma Gather z polskim rozpoznawaniem", r.includes('<Gather input="speech" language="pl-PL"'));
sprawdz("TwiML ucieka znaki specjalne", r.includes("&quot;Kowalski&quot; &amp; syn &lt;test&gt;") && r.includes("s=a&amp;b"));
sprawdz("koniec rozmowy się rozłącza", twimlKoniec("Do usłyszenia").includes("<Hangup/>"));

if (bledy) {
  console.error(`\nDyżur AI: ${bledy} błędów.`);
  process.exit(1);
}
console.log("Dyżur AI w porządku.");
