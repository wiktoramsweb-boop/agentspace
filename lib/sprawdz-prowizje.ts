/**
 * Sprawdzenie zasad prowizji (`npm run test:prowizje`).
 */
import { nastepnyProg, oczyscProgi, podzialMiesciSie, rozliczTransakcje, udzialZProgow, ZASADY_PUSTE } from "./zasady-prowizji.ts";

let bledy = 0;
function sprawdz(opis: string, ok: boolean) {
  if (!ok) {
    bledy++;
    console.error(`✗ ${opis}`);
  } else console.log(`✓ ${opis}`);
}

const progi = [
  { od: 60000, pct: 60 },
  { od: 0, pct: 50 },
  { od: 120000, pct: 70 },
];
sprawdz("progi sortują się rosnąco", oczyscProgi(progi).map((p) => p.od).join() === "0,60000,120000");
sprawdz("śmieci z formularza odpadają", oczyscProgi([{ od: 10, pct: 0 }, { od: "x", pct: 140 }, null]).length === 0);
sprawdz("początek roku = pierwszy próg", udzialZProgow(progi, 0) === 50);
sprawdz("tuż pod progiem zostaje niższy", udzialZProgow(progi, 59999) === 50);
sprawdz("równo próg = wyższy udział", udzialZProgow(progi, 60000) === 60);
sprawdz("powyżej ostatniego progu", udzialZProgow(progi, 500000) === 70);
sprawdz("bez progów nic nie narzucamy", udzialZProgow([], 100000) === null);
sprawdz("brakuje do następnego progu", nastepnyProg(progi, 45000)?.brakuje === 15000 && nastepnyProg(progi, 45000)?.pct === 60);
sprawdz("po ostatnim progu nie ma następnego", nastepnyProg(progi, 200000) === null);

// 12 300 zł brutto = 10 000 netto. Agent 50% = 5000, współagent 10% = 1000,
// menedżer 5% = 500, sieć 8% = 800, biuru zostaje 2700.
const r = rozliczTransakcje({
  brutto: 12300,
  dodatki: 0,
  agentZarobek: 5000,
  podzialy: [{ profileId: "b", rola: "wspolagent", pct: 10 }],
  zasady: { progi: [], nadprowizjaMenedzera: 5, oplataSieci: 8, nazwaSieci: "Sieć" },
  maMenedzera: true,
});
sprawdz("netto z brutto", r.netto === 10000);
sprawdz("współagent liczony od netto", r.wspolni[0].kwota === 1000);
sprawdz("nadprowizja menedżera", r.menedzer === 500);
sprawdz("opłata dla sieci", r.siec === 800);
sprawdz("biuru zostaje reszta", r.biuro === 2700);

const bezMen = rozliczTransakcje({ brutto: 12300, dodatki: 0, agentZarobek: 5000, podzialy: [], zasady: { ...ZASADY_PUSTE, nadprowizjaMenedzera: 5 }, maMenedzera: false });
sprawdz("bez menedżera nie ma nadprowizji", bezMen.menedzer === 0 && bezMen.biuro === 5000);

const zDodatkiem = rozliczTransakcje({ brutto: 12300, dodatki: 500, agentZarobek: 5500, podzialy: [], zasady: ZASADY_PUSTE, maMenedzera: false });
sprawdz("dodatek wypłacony agentowi nie obniża wyniku biura", zDodatkiem.biuro === 5000);

sprawdz("podział mieści się w 100%", podzialMiesciSie(60, [{ pct: 40 }]));
sprawdz("podział ponad 100% odrzucony", !podzialMiesciSie(60, [{ pct: 30 }, { pct: 20 }]));

if (bledy) {
  console.error(`\nProwizje: ${bledy} błędów.`);
  process.exit(1);
}
console.log("\nProwizje w porządku.");
