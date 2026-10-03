/**
 * Wpisanie tokenów do .env.local bez otwierania edytora.
 *
 * Powstało, bo edytowanie pliku konfiguracyjnego ręcznie to najłatwiejszy
 * sposób, żeby zepsuć coś niewidocznie: spacja po znaku równości, cudzysłów
 * dookoła wartości albo skasowana przez przypadek linia obok.
 *
 * Wartości wczytujemy z wyłączonym echem, więc token NIE pojawia się na
 * ekranie ani w historii poleceń. Skrypt nigdy nie wypisuje wartości,
 * pokazuje tylko, czy dany klucz jest już ustawiony.
 */
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { randomBytes } from "node:crypto";

const PLIK = path.join(process.cwd(), ".env.local");

/**
 * Wejście z potoku czytamy RAZ, na starcie.
 * Osobny readline na każde pytanie zjadał cały strumień przy pierwszym
 * z nich i skrypt zawisał na drugim.
 */
const zPotoku = process.stdin.isTTY ? [] : fs.readFileSync(0, "utf8").split("\n");

const KLUCZE = [
  {
    nazwa: "ANTHROPIC_API_KEY",
    opis: "Klucz do AI (console.anthropic.com → API Keys → Create Key)",
    poCo: "pozwala testować AI lokalnie, bez wdrażania na produkcję",
  },
  {
    nazwa: "DIAG_TOKEN",
    opis: "Wklej wartość albo wpisz: generuj",
    poCo: "pozwala odczytać stan systemu przez npm run diagnostyka",
    // Zmienne oznaczone w Vercelu jako Sensitive są zapisywalne, ale nie da
    // się ich odczytać z powrotem. Jedynym wyjściem jest nowa wartość
    // ustawiona w obu miejscach naraz, więc skrypt umie ją wymyślić.
    generowalny: true,
  },
  {
    nazwa: "VERCEL_TOKEN",
    opis: "Token Vercela (vercel.com → Account Settings → Tokens → Create)",
    poCo: "pozwala czytać logi produkcyjne i kasować stare wdrożenia",
  },
];

function wczytajPlik() {
  if (!fs.existsSync(PLIK)) {
    console.error(`Nie znalazłem pliku ${PLIK}.`);
    process.exit(1);
  }
  return fs.readFileSync(PLIK, "utf8");
}

/** Czy klucz ma już jakąkolwiek wartość. */
function maWartosc(tresc, nazwa) {
  const m = tresc.match(new RegExp(`^${nazwa}=(.*)$`, "m"));
  return Boolean(m && m[1].trim());
}

/**
 * Podmiana wartości w miejscu albo dopisanie na końcu.
 * Zostawiamy resztę pliku nietkniętą, łącznie z komentarzami.
 */
function ustaw(tresc, nazwa, wartosc) {
  const linia = `${nazwa}=${wartosc}`;
  const wzor = new RegExp(`^${nazwa}=.*$`, "m");
  if (wzor.test(tresc)) return tresc.replace(wzor, linia);
  return tresc.replace(/\n*$/, "\n") + linia + "\n";
}

/** Pytanie z wyłączonym echem - wpisywane znaki nie pojawiają się na ekranie. */
function zapytajCicho(pytanie) {
  // Gdy wejście idzie z potoku, nie ma czego ukrywać ani przed kim.
  if (!process.stdin.isTTY) {
    process.stdout.write(pytanie);
    const linia = zPotoku.shift() ?? "";
    process.stdout.write("\n");
    return Promise.resolve(linia.trim());
  }

  // UWAGA: świadomie BEZ readline.
  // Interfejs readline z `terminal: true` sam wypisuje wpisywane znaki i robi
  // to niezależnie od trybu raw nałożonego na strumień. Przez to pierwsza
  // wersja tego skryptu pokazywała wklejany klucz na ekranie, mimo obietnicy,
  // że go ukrywa. Czytamy więc wprost ze strumienia.
  return new Promise((resolve) => {
    const we = process.stdin;
    const byloRaw = we.isRaw === true;
    let bufor = "";

    function naDane(ch) {
      const tekst = ch.toString("utf8");
      for (const znak of tekst) {
        if (znak === "\r" || znak === "\n") {
          we.removeListener("data", naDane);
          if (we.setRawMode) we.setRawMode(byloRaw);
          we.pause();
          process.stdout.write("\n");
          resolve(bufor.trim());
          return;
        }
        if (znak === "\u0003") {
          if (we.setRawMode) we.setRawMode(byloRaw);
          process.stdout.write("\n");
          process.exit(130);
        }
        if (znak === "\u007f" || znak === "\b") {
          bufor = bufor.slice(0, -1);
          continue;
        }
        // Znaki sterujące pomijamy, reszta trafia do bufora - i NIC nie piszemy
        // na ekran, bo to jest cały sens tej funkcji.
        if (znak >= " ") bufor += znak;
      }
    }

    process.stdout.write(pytanie);
    if (we.setRawMode) we.setRawMode(true);
    we.resume();
    we.on("data", naDane);
  });
}

console.log("\nUstawianie tokenów w .env.local");
console.log("Wklejane wartości nie pojawią się na ekranie. Enter bez wklejania = pomiń.\n");

let tresc = wczytajPlik();
let zmian = 0;
/** Wartości wymyślone przez skrypt - trzeba je przenieść do Vercela. */
const doWklejeniaWVercel = [];

for (const k of KLUCZE) {
  const juz = maWartosc(tresc, k.nazwa);
  console.log(`── ${k.nazwa} ${juz ? "(już ustawiony)" : "(pusty)"}`);
  console.log(`   ${k.opis}`);
  console.log(`   Po co: ${k.poCo}`);
  const wartosc = await zapytajCicho("   Wklej i naciśnij Enter: ");
  if (!wartosc) {
    console.log("   pominięte\n");
    continue;
  }
  if (/\s/.test(wartosc)) {
    console.log("   UWAGA: wartość zawiera spację. Pomijam, żeby nie zepsuć pliku.\n");
    continue;
  }

  let docelowa = wartosc;
  if (k.generowalny && wartosc.toLowerCase() === "generuj") {
    docelowa = randomBytes(32).toString("base64url");
    doWklejeniaWVercel.push([k.nazwa, docelowa]);
  }

  tresc = ustaw(tresc, k.nazwa, docelowa);
  zmian++;
  console.log(`   zapisane (${docelowa.length} znaków)\n`);
}

if (zmian === 0) {
  console.log("Nic nie zmieniono.");
  process.exit(0);
}

// Kopia zapasowa przed nadpisaniem: plik zawiera wszystkie klucze do produkcji.
fs.copyFileSync(PLIK, `${PLIK}.bak`);
fs.writeFileSync(PLIK, tresc, "utf8");
console.log(`Zapisano ${zmian} wartości w .env.local (kopia poprzedniej wersji: .env.local.bak).`);

if (doWklejeniaWVercel.length > 0) {
  console.log("\n────────────────────────────────────────────────────────");
  console.log("DO PRZENIESIENIA DO VERCELA");
  console.log("Vercel → projekt agentspace → Environment Variables →");
  console.log("przy zmiennej trzy kropki → Edit → wklej poniższą wartość → Save.");
  console.log("Potem Deployments → Redeploy, bo zmienne wchodzą dopiero przy nowym wdrożeniu.\n");
  for (const [nazwa, wartosc] of doWklejeniaWVercel) {
    console.log(`${nazwa}=${wartosc}`);
  }
  console.log("────────────────────────────────────────────────────────");
}

console.log("\nStan po zmianach:");
const po = fs.readFileSync(PLIK, "utf8");
for (const k of KLUCZE) {
  console.log(`  ${k.nazwa}: ${maWartosc(po, k.nazwa) ? "ustawiony" : "nadal pusty"}`);
}
