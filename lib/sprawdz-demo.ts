/**
 * Sprawdzenie wersji demo (`npm run test:demo`).
 * Od tych dwóch funkcji zależy, czy gość demo może cokolwiek zmienić w bazie.
 */

import { DEMO_EMAIL, demoMozeZapisac, emailZCiasteczek } from "./demo/tryb.ts";

let bledy = 0;
function sprawdz(opis: string, warunek: boolean) {
  if (!warunek) {
    bledy++;
    console.error(`BŁĄD  ${opis}`);
  }
}

const b64 = (s: string) => Buffer.from(s).toString("base64url");
const jwt = (email: string) => `${b64('{"alg":"HS256"}')}.${b64(JSON.stringify({ email }))}.podpis`;
const sesja = (email: string) => "base64-" + b64(JSON.stringify({ access_token: jwt(email), user: { user_metadata: { full_name: "Łukasz Żółć" } } }));

sprawdz("pojedyncze ciasteczko", emailZCiasteczek([{ name: "sb-abc-auth-token", value: sesja(DEMO_EMAIL) }]) === DEMO_EMAIL);
const calosc = sesja("Jan@Biuro.pl");
sprawdz(
  "ciasteczko w kawałkach, w dowolnej kolejności",
  emailZCiasteczek([
    { name: "sb-abc-auth-token.1", value: calosc.slice(40) },
    { name: "sb-abc-auth-token.0", value: calosc.slice(0, 40) },
  ]) === "jan@biuro.pl",
);
sprawdz("stary format bez base64", emailZCiasteczek([{ name: "sb-abc-auth-token", value: encodeURIComponent(JSON.stringify([jwt("a@b.pl")])) }]) === "a@b.pl");
sprawdz("śmieci nie wywracają", emailZCiasteczek([{ name: "sb-abc-auth-token", value: "base64-%%%" }]) === null);
sprawdz("brak ciasteczka", emailZCiasteczek([{ name: "inne", value: "x" }]) === null);

sprawdz("trening dozwolony", demoMozeZapisac("/app/trening/negocjacja-prowizji"));
sprawdz("sesja dozwolona", demoMozeZapisac("/app/sesja/123"));
sprawdz("asystent dozwolony", demoMozeZapisac("/api/assistant/chat"));
sprawdz("wejście dozwolone", demoMozeZapisac("/wejdz-demo"));
sprawdz("klienci zablokowani", !demoMozeZapisac("/app/klienci"));
sprawdz("lista treningów bez slugu zablokowana", !demoMozeZapisac("/app/trening"));
sprawdz("ustawienia zablokowane", !demoMozeZapisac("/app/ustawienia/zespol"));
sprawdz("podobny prefiks nie przechodzi", !demoMozeZapisac("/app/treningi-zle") && !demoMozeZapisac("/wejdz-demo-x/../app"));

if (bledy) {
  console.error(`\nDemo: ${bledy} błędów.`);
  process.exit(1);
}
console.log("Demo w porządku.");
