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
    opis: "Ten sam token, co w Vercel → Environment Variables → DIAG_TOKEN",
    poCo: "pozwala odczytać stan systemu przez npm run diagnostyka",
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
  // Ukrywanie wpisywanych znaków wymaga prawdziwego terminala. Gdy skrypt
  // dostaje wejście z potoku (np. przy sprawdzaniu, czy w ogóle działa),
  // czytamy normalnie - i tak nie ma wtedy czego ukrywać przed nikim.
  if (!process.stdin.isTTY) {
    process.stdout.write(pytanie);
    const linia = zPotoku.shift() ?? "";
    process.stdout.write("\n");
    return Promise.resolve(linia.trim());
  }
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    process.stdout.write(pytanie);
    const wejscie = rl.input;
    const byloRaw = wejscie.isRaw;
    let bufor = "";

    function naKlawisz(ch) {
      const znak = ch.toString("utf8");
      if (znak === "\r" || znak === "\n") {
        wejscie.removeListener("data", naKlawisz);
        if (wejscie.setRawMode) wejscie.setRawMode(byloRaw ?? false);
        rl.close();
        process.stdout.write("\n");
        resolve(bufor.trim());
        return;
      }
      if (znak === "\u0003") {
        process.stdout.write("\n");
        process.exit(130);
      }
      if (znak === "\u007f") {
        bufor = bufor.slice(0, -1);
        return;
      }
      bufor += znak;
    }

    if (wejscie.setRawMode) wejscie.setRawMode(true);
    wejscie.on("data", naKlawisz);
  });
}

console.log("\nUstawianie tokenów w .env.local");
console.log("Wklejane wartości nie pojawią się na ekranie. Enter bez wklejania = pomiń.\n");

let tresc = wczytajPlik();
let zmian = 0;

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
  tresc = ustaw(tresc, k.nazwa, wartosc);
  zmian++;
  console.log(`   zapisane (${wartosc.length} znaków)\n`);
}

if (zmian === 0) {
  console.log("Nic nie zmieniono.");
  process.exit(0);
}

// Kopia zapasowa przed nadpisaniem: plik zawiera wszystkie klucze do produkcji.
fs.copyFileSync(PLIK, `${PLIK}.bak`);
fs.writeFileSync(PLIK, tresc, "utf8");
console.log(`Zapisano ${zmian} wartości w .env.local (kopia poprzedniej wersji: .env.local.bak).`);

console.log("\nStan po zmianach:");
const po = fs.readFileSync(PLIK, "utf8");
for (const k of KLUCZE) {
  console.log(`  ${k.nazwa}: ${maWartosc(po, k.nazwa) ? "ustawiony" : "nadal pusty"}`);
}
