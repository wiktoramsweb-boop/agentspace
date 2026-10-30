// Test: cele stanowisk i obliczenia kredytowe. `npm run test:cele`
import { celeStanowiska, tempo } from "./cele-rol.ts";
import { plikIcs } from "./ics.ts";
import { analizaFinansow, nastepnyKrok, rataKredytu } from "./banki.ts";

let bledy = 0;
const sprawdz = (n: string, w: unknown, o: unknown) => {
  if (JSON.stringify(w) === JSON.stringify(o)) console.log(`  ok  ${n}`);
  else {
    bledy++;
    console.log(`  BŁĄD ${n}: ${JSON.stringify(w)} zamiast ${JSON.stringify(o)}`);
  }
};
const klucze = (r: string) => celeStanowiska(r)?.mierniki.map((m) => m.klucz).join(" ") ?? null;
sprawdz("doradca nie ma telefonów", /telefon|cold/.test(klucze("credit_advisor") ?? ""), false);
sprawdz("doradca liczy kredyty", (klucze("credit_advisor") ?? "").includes("wolumen"), true);
sprawdz("agent i menedżer zostają na lejku", [celeStanowiska("agent"), celeStanowiska("manager")], [null, null]);
sprawdz("CEO ma cele biura", (klucze("owner") ?? "").includes("prowizje_biura"), true);
sprawdz("stażysta bez prowizji", /prowiz/.test(klucze("trainee") ?? ""), false);
sprawdz("tempo w planie", tempo(10, 5, 15, 30), { procent: 50, zaPlanem: true });
sprawdz("tempo za planem", tempo(10, 2, 15, 30), { procent: 20, zaPlanem: false });
sprawdz("procent nie przekracza 100", tempo(10, 20, 15, 30).procent, 100);
sprawdz("rata 500 tys., 7%, 25 lat", Math.round(rataKredytu(500000, 7, 25)), 3534);
const a = analizaFinansow(500000, { cena: 600000, dochod: 10000, zobowiazania: 500 });
sprawdz("LTV i DTI", [a.ltv, a.dti], [83, 40]);
sprawdz("LTV 83% ostrzega", a.uwagi[0].ton, "uwaga");
sprawdz("brak danych bez obliczeń", analizaFinansow(null, {}).rata, null);
sprawdz("dosyłka wyprzedza resztę", nastepnyKrok("wniosek", 2, [{ status: "dosylka" }]).startsWith("Bank czeka"), true);
sprawdz("wszystkie odmowy", nastepnyKrok("wniosek", 0, [{ status: "negatywna" }]).startsWith("Wszystkie banki"), true);
const ics = plikIcs("AgentSpace", [{ id: "1", tytul: "Prezentacja, ul. Długa; test", start: "2026-11-02T10:00:00.000Z", sekundy: 1800 }]);
sprawdz("ics: znaki specjalne", ics.includes(String.raw`SUMMARY:Prezentacja\, ul. Długa; test`), true);
sprawdz("ics: czas końca", ics.includes("DTEND:20261102T103000Z"), true);
sprawdz("ics: linie CRLF", ics.split("\r\n").length > 5, true);
sprawdz("ics: zawijanie długich", plikIcs("x", [{ id: "2", tytul: "ą".repeat(100), start: "2026-11-02T10:00:00Z", sekundy: null }]).split("\r\n").every((l) => new TextEncoder().encode(l).length <= 75), true);
console.log(bledy ? `\n${bledy} błędów` : "\nWszystko OK");
process.exit(bledy ? 1 : 0);
