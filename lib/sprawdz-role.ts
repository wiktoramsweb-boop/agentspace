/**
 * Sprawdzenie ról i uprawnień (`npm run test:role`).
 *
 * To decyduje, kto zobaczy prowizje, faktury i dane klientów. Błąd tutaj
 * oznacza albo wyciek między stanowiskami, albo zablokowanie komuś pracy,
 * więc pilnujemy obu stron.
 */

import {
  MODULY,
  ROLE,
  ROLE_LABELS,
  ZAKRESY,
  maModul,
  moduly,
  mozeZarzadzacRolami,
  oczyscUprawnienia,
  opisRoli,
  zakresDanych,
  type Modul,
  type UserRole,
} from "./role.ts";

let bledy = 0;
function sprawdz(opis: string, warunek: boolean, szczegol = "") {
  if (!warunek) {
    bledy++;
    console.error(`BŁĄD  ${opis}${szczegol ? ` (${szczegol})` : ""}`);
  }
}

const wszystkieModuly = MODULY.map((m) => m.id);
const osoba = (role: string, permissions = null as Parameters<typeof maModul>[0]["permissions"]) => ({
  id: "x",
  role,
  permissions,
});

// ── Katalog ─────────────────────────────────────────────────────────────
sprawdz("każda rola ma etykietę", ROLE.every((r) => Boolean(ROLE_LABELS[r.id])));
sprawdz("każda rola ma opis", ROLE.every((r) => r.opis.length > 10));
sprawdz(
  "role nie odwołują się do nieznanych modułów",
  ROLE.every((r) => r.moduly.every((m) => wszystkieModuly.includes(m))),
);
sprawdz(
  "każda rola ma znany zakres",
  ROLE.every((r) => ZAKRESY.some((z) => z.id === r.zakres)),
);
sprawdz("identyfikatory ról się nie powtarzają", new Set(ROLE.map((r) => r.id)).size === ROLE.length);
sprawdz(
  "identyfikatory modułów się nie powtarzają",
  new Set(wszystkieModuly).size === wszystkieModuly.length,
);

// ── CEO ─────────────────────────────────────────────────────────────────
sprawdz("CEO ma wszystkie moduły", moduly(osoba("owner")).length === wszystkieModuly.length);
sprawdz("CEO widzi całe biuro", zakresDanych(osoba("owner")) === "wszystko");
sprawdz("tylko CEO zarządza rolami", mozeZarzadzacRolami(osoba("owner")));
sprawdz("dyrektor nie zarządza rolami", !mozeZarzadzacRolami(osoba("director")));
sprawdz(
  "żadna inna rola nie zarządza rolami",
  ROLE.filter((r) => r.id !== "owner").every((r) => !mozeZarzadzacRolami(osoba(r.id))),
);

// ── Granice stanowisk ───────────────────────────────────────────────────
sprawdz("dyrektor nie wchodzi w ustawienia firmy", !maModul(osoba("director"), "ustawienia"));
sprawdz("dyrektor nie kupuje abonamentu", !maModul(osoba("director"), "abonament"));
sprawdz("księgowość nie widzi bazy klientów", !maModul(osoba("accountant"), "klienci"));
sprawdz("księgowość ma faktury", maModul(osoba("accountant"), "faktury"));
sprawdz("asystent nie ma faktur", !maModul(osoba("assistant"), "faktury"));
sprawdz("asystent nie ma prowizji", !maModul(osoba("assistant"), "prowizje"));
sprawdz("stażysta nie ma klientów", !maModul(osoba("trainee"), "klienci"));
sprawdz("stażysta ma AI Coacha", maModul(osoba("trainee"), "coach"));
sprawdz("agent nie wchodzi w zespół", !maModul(osoba("agent"), "zespol"));
sprawdz("agent nie ma faktur", !maModul(osoba("agent"), "faktury"));
sprawdz("menedżer nie ma faktur", !maModul(osoba("manager"), "faktury"));
sprawdz("menedżer prowadzi zespół", maModul(osoba("manager"), "zespol"));

sprawdz("agent widzi tylko swoje", zakresDanych(osoba("agent")) === "wlasne");
sprawdz("menedżer widzi swój zespół", zakresDanych(osoba("manager")) === "zespol");
sprawdz(
  "poza CEO i dyrektorem nikt nie ma domyślnie ustawień",
  ROLE.filter((r) => r.id !== "owner").every((r) => !r.moduly.includes("ustawienia")),
);

// ── Odstępstwa ──────────────────────────────────────────────────────────
const zFakturami = osoba("agent", { moduly: { faktury: true } });
sprawdz("dodany ręcznie moduł działa", maModul(zFakturami, "faktury"));
sprawdz("reszta roli zostaje bez zmian", maModul(zFakturami, "klienci"));

const bezKlientow = osoba("agent", { moduly: { klienci: false } });
sprawdz("odebrany ręcznie moduł działa", !maModul(bezKlientow, "klienci"));

const szerszyZakres = osoba("agent", { zakres: "wszystko" as const });
sprawdz("odstępstwo zakresu ma pierwszeństwo", zakresDanych(szerszyZakres) === "wszystko");

// ── Czyszczenie przed zapisem ───────────────────────────────────────────
sprawdz("null zostaje nullem", oczyscUprawnienia("agent", null) === null);
sprawdz(
  "zgodne z rolą nie zostaje zapisane",
  oczyscUprawnienia("agent", { moduly: { klienci: true } }) === null,
  JSON.stringify(oczyscUprawnienia("agent", { moduly: { klienci: true } })),
);
sprawdz(
  "odstępstwo zostaje zapisane",
  oczyscUprawnienia("agent", { moduly: { faktury: true } })?.moduly?.faktury === true,
);
sprawdz(
  "nieznany moduł jest odrzucany",
  oczyscUprawnienia("agent", { moduly: { cokolwiek: true } as Record<string, boolean> } as never) === null,
);
sprawdz(
  "nieznany zakres jest odrzucany",
  oczyscUprawnienia("agent", { zakres: "wszechswiat" as never }) === null,
);
sprawdz(
  "zakres zgodny z rolą nie zostaje zapisany",
  oczyscUprawnienia("agent", { zakres: "wlasne" }) === null,
);

// Po zmianie stanowiska odstępstwa liczą się względem nowej roli.
sprawdz(
  "to samo odstępstwo przy innej roli znika",
  oczyscUprawnienia("accountant", { moduly: { faktury: true } }) === null,
);

// Każdy moduł musi być komuś dostępny, inaczej jest w menu martwy.
for (const m of wszystkieModuly as Modul[]) {
  sprawdz(`moduł ${m} jest osiągalny dla jakiejś roli`, ROLE.some((r) => r.moduly.includes(m)));
}

// Żadna rola poza CEO nie może mieć kompletu uprawnień.
for (const r of ROLE.filter((x) => x.id !== "owner")) {
  sprawdz(
    `rola ${r.id} nie ma kompletu uprawnień`,
    r.moduly.length < wszystkieModuly.length,
    `${r.moduly.length}/${wszystkieModuly.length}`,
  );
}

// Nieznana rola nie może przypadkiem dostać szerokich uprawnień.
const nieznana = opisRoli("kosmita" as UserRole);
sprawdz("nieznana rola dostaje najwęższy zestaw", nieznana.moduly.length <= 2, `${nieznana.moduly.length}`);
sprawdz("nieznana rola widzi tylko swoje", nieznana.zakres === "wlasne");

if (bledy) {
  console.error(`\nRole: ${bledy} błędów.`);
  process.exit(1);
}
console.log(`Role w porządku (${ROLE.length} stanowisk, ${MODULY.length} modułów).`);
