/**
 * Wypełnienie konta demo danymi, które wyglądają jak prawdziwe biuro.
 *
 * Po co: pusty system nie sprzedaje się na spotkaniu. Prospekt ma kliknąć
 * i zobaczyć pracujące biuro, a nie puste tabele i analizę cenową, która
 * odmawia policzenia czegokolwiek.
 *
 * Uruchomienie:
 *   node --experimental-strip-types lib/demo/seed.ts <agency_id>
 *   node --experimental-strip-types lib/demo/seed.ts <agency_id> --clean
 *
 * UWAGA: to ma trafiać wyłącznie na osobne konto demo. Skrypt odmawia
 * działania, gdy w biurze jest już sporo danych, żeby nikt przez pomyłkę
 * nie wsypał zmyślonych transakcji do prawdziwej bazy. Wszystko, co tworzy,
 * jest oznaczone (oferty numerem DEMO-xxx, klienci źródłem „demo").
 */

import { readFileSync } from "node:fs";
import { DZIELNICE } from "./dzielnice.ts";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")];
    }),
);

const URL_ = env.SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL_ || !KEY) throw new Error("Brak SUPABASE_URL albo SUPABASE_SERVICE_ROLE_KEY w .env.local");

/** Podgląd: nic nie zapisujemy, tylko pokazujemy, co by powstało. */
let DRY = false;
let dryId = 0;

async function db(path: string, init?: RequestInit): Promise<unknown> {
  if (DRY) {
    if (init?.method === "DELETE") return null;
    if (init?.method === "POST") {
      const rows = JSON.parse(String(init.body)) as Record<string, unknown>[];
      return rows.map((r) => ({ ...r, id: `dry-${++dryId}` }));
    }
    // Odczyty w podglądzie udają puste biuro z jednym użytkownikiem.
    if (path.startsWith("profiles")) return [{ id: "dry-agent", full_name: "Agent Demo" }];
    return [];
  }

  const res = await fetch(`${URL_}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(init?.headers ?? {}),
    },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${path}: ${res.status} ${text.slice(0, 200)}`);
  return text ? JSON.parse(text) : null;
}

/** Powtarzalny generator: ten sam seed daje ten sam zestaw danych. */
let nasiono = 20260929;
function rnd(): number {
  nasiono = (nasiono * 1103515245 + 12345) % 2147483648;
  return nasiono / 2147483648;
}
const pick = <T>(arr: T[]): T => arr[Math.floor(rnd() * arr.length)];
const between = (a: number, b: number): number => a + rnd() * (b - a);
const intBetween = (a: number, b: number): number => Math.floor(between(a, b + 1));

const IMIONA = ["Anna", "Piotr", "Katarzyna", "Marcin", "Magdalena", "Tomasz", "Joanna", "Paweł", "Agnieszka", "Michał", "Ewa", "Krzysztof"];
const NAZWISKA = ["Kowalska", "Nowak", "Wiśniewski", "Wójcik", "Kowalczyk", "Kamiński", "Lewandowska", "Zieliński", "Szymański", "Woźniak", "Dąbrowska", "Mazur"];
const STANY = ["do_wprowadzenia", "do_odswiezenia", "do_remontu"];

function daysAgoIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

async function clean(agencyId: string): Promise<void> {
  console.log("Sprzątam dane demo…");
  await db(`deals?agency_id=eq.${agencyId}&title=like.%5BDEMO%5D*`, { method: "DELETE" });
  await db(`properties?agency_id=eq.${agencyId}&offer_no=like.DEMO-*`, { method: "DELETE" });
  await db(`clients?agency_id=eq.${agencyId}&source=eq.demo`, { method: "DELETE" });
  console.log("Gotowe.");
}

async function seed(agencyId: string, force: boolean): Promise<void> {
  const profile = (await db(
    `profiles?agency_id=eq.${agencyId}&select=id,full_name&limit=5`,
  )) as { id: string; full_name: string | null }[];
  if (profile.length === 0) throw new Error("To biuro nie ma żadnego użytkownika. Najpierw załóż konto.");

  const existing = (await db(
    `properties?agency_id=eq.${agencyId}&select=id,offer_no&limit=100`,
  )) as { id: string; offer_no: string | null }[];
  const prawdziwe = existing.filter((p) => !(p.offer_no ?? "").startsWith("DEMO-")).length;

  if (prawdziwe > 5 && !force) {
    throw new Error(
      `To biuro ma już ${prawdziwe} prawdziwych ofert. Skrypt jest do konta demo. ` +
        "Jeśli naprawdę chcesz go tu uruchomić, dodaj --force.",
    );
  }

  await clean(agencyId);
  const agenci = profile.map((p) => p.id);

  // ── klienci ──
  const klienci: Record<string, unknown>[] = [];
  for (let i = 0; i < 24; i++) {
    const typ = pick(["kupujacy", "sprzedajacy", "kupujacy", "najem"]);
    klienci.push({
      agency_id: agencyId,
      agent_id: pick(agenci),
      name: `${pick(IMIONA)} ${pick(NAZWISKA)}`,
      phone: `5${intBetween(10, 99)} ${intBetween(100, 999)} ${intBetween(100, 999)}`,
      email: `kontakt${i}@przyklad.pl`,
      type: typ,
      status: pick(["nowy", "w_kontakcie", "oglada", "negocjacje", "zamkniety"]),
      budget_pln: typ === "kupujacy" ? intBetween(45, 130) * 10000 : null,
      source: "demo",
      last_contact_at: daysAgoIso(intBetween(0, 40)),
    });
  }
  const zapisaniKlienci = (await db("clients", {
    method: "POST",
    body: JSON.stringify(klienci),
  })) as { id: string }[];
  console.log(`Klienci: ${zapisaniKlienci.length}`);

  // ── oferty ──
  // Rozkład po dzielnicach z realnymi proporcjami cen: bez tego analiza
  // cenowa nie ma czego porównywać i pokaz się sypie.
  const oferty: Record<string, unknown>[] = [];
  for (let i = 0; i < 38; i++) {
    const d = pick(DZIELNICE);
    const area = Math.round(between(28, 96));
    const stan = pick(STANY);
    const korekta = stan === "do_remontu" ? 0.88 : stan === "do_odswiezenia" ? 0.95 : 1;
    // Szum, żeby ceny nie układały się w podejrzanie równą linię.
    const cenaM2 = d.cenaM2 * korekta * between(0.92, 1.08);
    const sprzedane = i < 16;
    // Liczba pokoi musi wynikać z metrażu. Losowana osobno dawała oferty
    // w stylu „4 pokoje, 29 m²", co na pokazie od razu rzuca się w oczy.
    const pokoje = area < 34 ? 1 : area < 50 ? 2 : area < 72 ? 3 : 4;
    const pieterWBudynku = intBetween(3, 8);

    oferty.push({
      agency_id: agencyId,
      agent_id: pick(agenci),
      offer_no: `DEMO-${String(i + 1).padStart(3, "0")}`,
      title: `${pokoje} pok., ${area} m², ${d.nazwa}`,
      deal_kind: "sprzedaz",
      property_type: "mieszkanie",
      status: sprzedane ? "sfinalizowana" : "aktywna",
      city: "Kraków",
      address: `${pick(d.ulice)} ${intBetween(1, 80)}, Kraków`,
      // Rozrzut w obrębie dzielnicy, mniej więcej kilkaset metrów.
      lat: d.lat + between(-0.006, 0.006),
      lng: d.lng + between(-0.008, 0.008),
      price_pln: Math.round((cenaM2 * area) / 1000) * 1000,
      area_m2: area,
      rooms: pokoje,
      floor: intBetween(0, pieterWBudynku),
      floors_total: pieterWBudynku,
      year_built: intBetween(1935, 2023),
      condition_std: stan,
      market: rnd() > 0.85 ? "pierwotny" : "wtorny",
      description: "Oferta demonstracyjna, dane przykładowe.",
      updated_at: daysAgoIso(sprzedane ? intBetween(20, 500) : intBetween(1, 60)),
    });
  }
  const zapisaneOferty = (await db("properties", {
    method: "POST",
    body: JSON.stringify(oferty),
  })) as { id: string; price_pln: number; title: string; agent_id: string; updated_at: string }[];
  console.log(`Oferty: ${zapisaneOferty.length} (w tym 16 sfinalizowanych)`);

  // ── transakcje ──
  // Sfinalizowane oferty dostają kartę transakcji z prowizją. To one
  // niosą prawdziwą cenę końcową, więc są najcenniejsze dla wyceny.
  const transakcje = zapisaneOferty.slice(0, 16).map((o, i) => {
    const prowizja = Math.round((o.price_pln * between(0.018, 0.028)) / 100) * 100;
    return {
      agency_id: agencyId,
      agent_id: o.agent_id,
      client_id: zapisaniKlienci[i % zapisaniKlienci.length].id,
      property_id: o.id,
      title: `[DEMO] ${o.title}`,
      transaction_value_pln: o.price_pln,
      commission_pln: prowizja,
      status: "zamkniety",
      closed_at: o.updated_at,
    };
  });
  const zapisaneTransakcje = (await db("deals", {
    method: "POST",
    body: JSON.stringify(transakcje),
  })) as { id: string }[];
  console.log(`Transakcje: ${zapisaneTransakcje.length}`);

  if (DRY) {
    console.log("\nPodgląd ofert (pierwsze 10):");
    for (const o of oferty.slice(0, 10)) {
      const cena = o.price_pln as number;
      const area = o.area_m2 as number;
      console.log(
        `  ${String(o.offer_no).padEnd(8)} ${String(o.title).padEnd(30)} ` +
          `${String(cena.toLocaleString("pl-PL")).padStart(10)} zł | ` +
          `${String(Math.round(cena / area)).padStart(6)} zł/m² | ${o.status}`,
      );
    }
    const perM2 = oferty.map((o) => (o.price_pln as number) / (o.area_m2 as number));
    console.log(
      `\n  cena/m²: od ${Math.round(Math.min(...perM2)).toLocaleString("pl-PL")} ` +
        `do ${Math.round(Math.max(...perM2)).toLocaleString("pl-PL")} zł`,
    );
    console.log("\nPodgląd. Nic nie zapisano.");
    return;
  }

  console.log("\nGotowe. Konto demo wypełnione.");
  console.log("Analiza cenowa ma teraz z czego liczyć w każdej dzielnicy Krakowa.");
}

/**
 * Pozwalamy podać nazwę biura zamiast identyfikatora. Przepisywanie UUID-a
 * z panelu Supabase to prosta droga do pomyłki, a pomyłka oznacza tu wsypanie
 * zmyślonych transakcji do prawdziwej bazy.
 */
async function rozpoznajBiuro(arg: string): Promise<string> {
  const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (UUID.test(arg)) return arg;

  const trafienia = (await db(
    `agencies?select=id,name&name=ilike.*${encodeURIComponent(arg)}*&limit=5`,
  )) as { id: string; name: string }[];

  if (trafienia.length === 0) {
    const wszystkie = (await db("agencies?select=name&limit=20")) as { name: string }[];
    throw new Error(
      `Nie znalazłem biura o nazwie „${arg}". W bazie są: ${wszystkie.map((a) => a.name).join(", ")}`,
    );
  }
  if (trafienia.length > 1) {
    throw new Error(`Pasuje więcej niż jedno biuro: ${trafienia.map((a) => a.name).join(", ")}. Doprecyzuj nazwę.`);
  }

  console.log(`Biuro: ${trafienia[0].name}`);
  return trafienia[0].id;
}

const [, , arg, ...flags] = process.argv;
if (!arg) {
  console.error('Podaj nazwę albo identyfikator biura, np.: npm run seed:demo -- "Biuro Demo"');
  console.error("Flagi: --dry (podgląd bez zapisu), --clean (sprzątanie), --force (mimo prawdziwych danych)");
  process.exit(1);
}

DRY = flags.includes("--dry");

const agencyId = await rozpoznajBiuro(arg);

if (flags.includes("--clean")) {
  await clean(agencyId);
} else {
  await seed(agencyId, flags.includes("--force"));
}
